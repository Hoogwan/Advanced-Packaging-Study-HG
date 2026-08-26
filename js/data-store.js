// Data store: replaces localStorage reads/writes with Supabase calls.
// Exposes window.dataStore = { listPapers, addPaper, deletePaper, getNotes, setNotes, onChange }
(function () {
  'use strict';

  function getClient() {
    // auth.js creates and shares the Supabase client instance.
    return window.supabaseClient;
  }

  const changeListeners = [];
  function notifyChange(payload) {
    changeListeners.forEach(fn => {
      try { fn(payload); } catch (e) { console.error('[dataStore] onChange listener error', e); }
    });
  }

  window.dataStore = {
    // ---------- Papers ----------
    async listPapers(packageId, elementId) {
      const client = getClient();
      const { data, error } = await client
        .from('papers')
        .select('*')
        .eq('package_id', packageId)
        .eq('element_id', elementId)
        .order('created_at', { ascending: true });
      if (error) { console.error('[dataStore] listPapers error', error); return []; }
      return (data || []).map(row => ({
        id: row.id,
        title: row.title,
        url: row.url || '',
        notes: row.notes || '',
        added: row.created_at
      }));
    },

    async addPaper(packageId, elementId, { title, url, notes }) {
      const client = getClient();
      const { data, error } = await client
        .from('papers')
        .insert({ package_id: packageId, element_id: elementId, title, url: url || null, notes: notes || null })
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, title: data.title, url: data.url || '', notes: data.notes || '', added: data.created_at };
    },

    async deletePaper(id) {
      const client = getClient();
      const { error } = await client.from('papers').delete().eq('id', id);
      if (error) throw error;
    },

    // ---------- Notes ----------
    async getNotes(packageId, elementId) {
      const client = getClient();
      const { data, error } = await client
        .from('notes')
        .select('body')
        .eq('package_id', packageId)
        .eq('element_id', elementId)
        .maybeSingle();
      if (error) { console.error('[dataStore] getNotes error', error); return ''; }
      return data ? (data.body || '') : '';
    },

    async setNotes(packageId, elementId, body) {
      const client = getClient();
      const { error } = await client
        .from('notes')
        .upsert({ package_id: packageId, element_id: elementId, body }, { onConflict: 'package_id,element_id' });
      if (error) throw error;
    },

    // ---------- Realtime (optional multi-tab sync) ----------
    onChange(cb) {
      changeListeners.push(cb);
      return () => {
        const i = changeListeners.indexOf(cb);
        if (i >= 0) changeListeners.splice(i, 1);
      };
    },

    _initRealtime() {
      const client = getClient();
      if (!client) return;
      client
        .channel('public:papers-notes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'papers' }, (payload) => notifyChange({ table: 'papers', payload }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => notifyChange({ table: 'notes', payload }))
        .subscribe();
    }
  };

  // Realtime subscription needs the client from auth.js; init after DOM ready
  // and a short delay to ensure auth.js has created window.supabaseClient.
  function tryInitRealtime() {
    if (window.supabaseClient) {
      window.dataStore._initRealtime();
    } else {
      setTimeout(tryInitRealtime, 200);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitRealtime);
  } else {
    tryInitRealtime();
  }
})();
