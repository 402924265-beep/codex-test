const STORAGE_KEYS = {
  analyses: "dw-shared-analyses-v2",
  factors: "dw-shared-factors-v2",
  user: "dw-user-name"
};

export function createStore(config = globalThis.window?.DW_SUPABASE_CONFIG) {
  const localApiConfig = globalThis.window?.DW_LOCAL_API_CONFIG;
  const localApi = localApiConfig ? new LocalApiStore(localApiConfig) : null;
  const supabase = !localApi && config?.url && config?.anonKey ? new SupabaseStore(config) : null;
  return {
    mode: localApi ? "lan" : supabase ? "shared" : "local",
    label: localApi ? "局域网共享" : supabase ? "后台共享" : "本机保存",
    async loadAnalyses() {
      return localApi ? localApi.loadAnalyses() : supabase ? supabase.loadAnalyses() : readJson(STORAGE_KEYS.analyses, {});
    },
    async saveAnalysis(record) {
      if (localApi) return localApi.saveAnalysis(record);
      if (supabase) return supabase.saveAnalysis(record);
      const all = readJson(STORAGE_KEYS.analyses, {});
      all[record.key] = record.text;
      writeJson(STORAGE_KEYS.analyses, all);
      return record;
    },
    async loadFactors(defaults = []) {
      if (localApi) {
        const remote = await localApi.loadFactors();
        return remote.length ? remote : defaults;
      }
      if (supabase) {
        const remote = await supabase.loadFactors();
        return remote.length ? remote : defaults;
      }
      return readJson(STORAGE_KEYS.factors, defaults);
    },
    async saveFactors(items) {
      if (localApi) return localApi.saveFactors(items);
      if (supabase) return supabase.saveFactors(items);
      writeJson(STORAGE_KEYS.factors, items);
      return items;
    },
    getUser() {
      return localStorage.getItem(STORAGE_KEYS.user) || "";
    },
    setUser(name) {
      localStorage.setItem(STORAGE_KEYS.user, name || "");
    }
  };
}

export class LocalApiStore {
  constructor({ baseUrl = "" } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async loadAnalyses() {
    return this.request("/api/analyses");
  }

  async saveAnalysis(record) {
    await this.request("/api/analyses", {
      method: "POST",
      body: JSON.stringify(record)
    });
    return record;
  }

  async loadFactors() {
    return this.request("/api/factors");
  }

  async saveFactors(items) {
    await this.request("/api/factors", {
      method: "PUT",
      body: JSON.stringify(items)
    });
    return items;
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`局域网保存失败：${response.status}`);
    return response.json();
  }
}

export class SupabaseStore {
  constructor({ url, anonKey }) {
    this.url = url.replace(/\/$/, "");
    this.anonKey = anonKey;
  }

  async loadAnalyses() {
    const rows = await this.request("/rest/v1/dw_account_analyses?select=month,code,analysis_text");
    return Object.fromEntries(rows.map((row) => [`${row.month}:${row.code}`, row.analysis_text || ""]));
  }

  async saveAnalysis(record) {
    const payload = {
      month: record.month,
      code: record.code,
      analysis_text: record.text || "",
      author: record.author || "",
      updated_at: new Date().toISOString()
    };
    await this.request("/rest/v1/dw_account_analyses", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(payload)
    });
    return record;
  }

  async loadFactors() {
    const rows = await this.request("/rest/v1/dw_factor_projects?select=payload&order=sort_order.asc");
    return rows.map((row) => row.payload).filter(Boolean);
  }

  async saveFactors(items) {
    await this.request("/rest/v1/dw_factor_projects?id=neq.__never__", {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
    const payload = items.map((item, index) => ({
      id: item.id || String(index + 1),
      sort_order: index,
      payload: { ...item, id: item.id || String(index + 1) },
      updated_at: new Date().toISOString()
    }));
    if (!payload.length) return items;
    await this.request("/rest/v1/dw_factor_projects", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(payload)
    });
    return items;
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.url}${path}`, {
      ...options,
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`后台保存失败：${response.status}`);
    if (response.status === 204) return [];
    return response.json();
  }
}

export function supabaseSchemaSql() {
  return `
create table if not exists dw_account_analyses (
  month integer not null,
  code text not null,
  analysis_text text,
  author text,
  updated_at timestamptz default now(),
  primary key (month, code)
);

create table if not exists dw_factor_projects (
  id text primary key,
  sort_order integer not null default 0,
  payload jsonb not null,
  updated_at timestamptz default now()
);
`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
