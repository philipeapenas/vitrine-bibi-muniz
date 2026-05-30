// ═══════════════════════════════════════════════════════
//  admin-client.js — Shim que imita o subconjunto do
//  supabase-js usado pelo app.js, mas roteia TUDO pelos
//  endpoints /api/admin/* autenticados. A service_role key
//  NUNCA chega ao browser (Fase A.5).
//
//  window.createAdminClient(token) -> { from, storage, channel }
//  O token e a senha do admin (= ADMIN_PASSWORD), enviada no
//  header x-admin-token a cada chamada.
// ═══════════════════════════════════════════════════════
(function () {
  const SUPABASE_URL = 'https://mdmjyvxrozxrxwmasnuq.supabase.co';
  const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/site_assets/`;

  function buildQuery(parts) {
    return parts.filter(Boolean).join('&');
  }

  function makeBuilder(table, token) {
    const state = {
      method: 'GET',
      body: null,
      single: false,
      upsert: false,
      count: null,
      select: null,
      filters: [],
      order: null,
      limit: null,
    };

    async function exec() {
      const query = buildQuery([
        state.select != null ? `select=${state.select}` : (state.method === 'GET' ? 'select=*' : ''),
        ...state.filters,
        state.order,
        state.limit != null ? `limit=${state.limit}` : '',
      ]);

      let res;
      try {
        res = await fetch('/api/admin/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          body: JSON.stringify({
            table,
            method: state.method,
            query,
            body: state.body,
            single: state.single,
            upsert: state.upsert,
            count: state.count,
          }),
        });
      } catch (e) {
        return { data: null, error: { message: e.message }, count: null };
      }

      let json;
      try { json = await res.json(); } catch (_) { json = { data: null, error: { message: 'Resposta invalida do servidor' } }; }
      if (!res.ok && !json.error) json.error = { message: 'Falha na requisicao (' + res.status + ')' };
      if (!res.ok && json.error && json.error.status == null) json.error.status = res.status;
      return {
        data: json.data != null ? json.data : null,
        error: json.error != null ? json.error : null,
        count: json.count != null ? json.count : null,
      };
    }

    const builder = {
      select(cols) {
        state.select = cols ? String(cols).replace(/\s+/g, '') : '*';
        return builder;
      },
      update(body, opts) {
        state.method = 'PATCH';
        state.body = body;
        if (opts && opts.count) state.count = opts.count;
        return builder;
      },
      insert(body) {
        state.method = 'POST';
        state.body = body;
        return builder;
      },
      upsert(body, opts) {
        state.method = 'POST';
        state.body = body;
        state.upsert = true;
        if (opts && opts.count) state.count = opts.count;
        return builder;
      },
      delete() {
        state.method = 'DELETE';
        return builder;
      },
      eq(col, val) { state.filters.push(`${col}=eq.${encodeURIComponent(val)}`); return builder; },
      gte(col, val) { state.filters.push(`${col}=gte.${encodeURIComponent(val)}`); return builder; },
      lte(col, val) { state.filters.push(`${col}=lte.${encodeURIComponent(val)}`); return builder; },
      order(col, opts) {
        const asc = !opts || opts.ascending !== false;
        state.order = `order=${col}.${asc ? 'asc' : 'desc'}`;
        return builder;
      },
      limit(n) { state.limit = n; return builder; },
      single() { state.single = true; return builder; },
      // Thenable: torna o builder "awaitable" como no supabase-js.
      then(onFulfilled, onRejected) { return exec().then(onFulfilled, onRejected); },
    };

    return builder;
  }

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function makeStorageBucket(token) {
    return {
      async upload(path, file, opts) {
        try {
          const buf = await file.arrayBuffer();
          const res = await fetch('/api/admin/storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body: JSON.stringify({
              action: 'upload',
              path,
              contentType: file.type || 'application/octet-stream',
              upsert: !!(opts && opts.upsert),
              dataBase64: arrayBufferToBase64(buf),
            }),
          });
          const json = await res.json().catch(() => ({ error: { message: 'Resposta invalida' } }));
          return { data: json.data != null ? json.data : null, error: json.error != null ? json.error : null };
        } catch (e) {
          return { data: null, error: { message: e.message } };
        }
      },
      getPublicUrl(path) {
        return { data: { publicUrl: PUBLIC_BASE + path } };
      },
      async remove(paths) {
        try {
          const res = await fetch('/api/admin/storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body: JSON.stringify({ action: 'remove', paths }),
          });
          const json = await res.json().catch(() => ({ error: { message: 'Resposta invalida' } }));
          return { data: json.data != null ? json.data : null, error: json.error != null ? json.error : null };
        } catch (e) {
          return { data: null, error: { message: e.message } };
        }
      },
    };
  }

  window.createAdminClient = function (token) {
    return {
      from(table) { return makeBuilder(table, token); },
      storage: { from() { return makeStorageBucket(token); } },
      // Realtime nao e proxyavel sem a key no browser. Stub no-op:
      // o painel mantem refresh manual + carga inicial (sem auto-live).
      channel() {
        const c = { on() { return c; }, subscribe() { return c; } };
        return c;
      },
    };
  };
})();
