import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dhbvafamquakyxxtxgoa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYnZhZmFtcXVha3l4eHR4Z29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDcwMzksImV4cCI6MjA5ODIyMzAzOX0.LTz8AG9XJQ2D80IGni7jk6DnLib33bouBho63RuvQtQ";

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── SITES ──────────────────────────────────────────────────
export const sitesApi = {
  getAll: async () => {
    const { data, error } = await db.from('sites').select('*').order('name');
    if (error) throw error;
    return data.map(mapSiteFromDB);
  },
  upsert: async (site) => {
    const { error } = await db.from('sites').upsert(mapSiteToDB(site));
    if (error) throw error;
  },
  delete: async (id) => {
    const { error } = await db.from('sites').delete().eq('id', id);
    if (error) throw error;
  },
  seedIfEmpty: async (initSites) => {
    const { data } = await db.from('sites').select('id').limit(1);
    if (!data || data.length === 0) {
      const rows = initSites.map(mapSiteToDB);
      await db.from('sites').insert(rows);
    }
  }
};

// ── REQUESTS ───────────────────────────────────────────────
export const requestsApi = {
  getAll: async () => {
    const { data, error } = await db.from('requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapRequestFromDB);
  },
  upsert: async (r) => {
    const { error } = await db.from('requests').upsert(mapRequestToDB(r));
    if (error) throw error;
  },
  delete: async (id) => {
    const { error } = await db.from('requests').delete().eq('id', id);
    if (error) throw error;
  }
};

// ── DOCS ───────────────────────────────────────────────────
export const docsApi = {
  getAll: async () => {
    const { data, error } = await db.from('docs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapDocFromDB);
  },
  insert: async (d) => {
    const { error } = await db.from('docs').insert(mapDocToDB(d));
    if (error) throw error;
  },
  delete: async (id) => {
    const { error } = await db.from('docs').delete().eq('id', id);
    if (error) throw error;
  }
};

// ── REPORTS ────────────────────────────────────────────────
export const reportsApi = {
  getAll: async () => {
    const { data, error } = await db.from('reports').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapReportFromDB);
  },
  insert: async (r) => {
    const { error } = await db.from('reports').insert(mapReportToDB(r));
    if (error) throw error;
  },
  update: async (id, updates) => {
    const { error } = await db.from('reports').update(updates).eq('id', id);
    if (error) throw error;
  },
  delete: async (id) => {
    const { error } = await db.from('reports').delete().eq('id', id);
    if (error) throw error;
  }
};

// ── ATTENDANCE ─────────────────────────────────────────────
export const attendanceApi = {
  getAll: async () => {
    const { data, error } = await db.from('attendance').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapAttFromDB);
  },
  insert: async (a) => {
    const { error } = await db.from('attendance').insert(mapAttToDB(a));
    if (error) throw error;
  },
  delete: async (id) => {
    const { error } = await db.from('attendance').delete().eq('id', id);
    if (error) throw error;
  }
};

// ── NOTIFICATIONS ──────────────────────────────────────────
export const notifsApi = {
  getAll: async () => {
    const { data, error } = await db.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data.map(n => ({ id: n.id, text: n.text, role: n.role, read: n.is_read, time: n.time }));
  },
  insert: async (n) => {
    const { error } = await db.from('notifications').insert({ id: n.id, text: n.text, role: n.role, is_read: false, time: n.time });
    if (error) throw error;
  },
  markRead: async (id) => {
    const { error } = await db.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },
  markAllRead: async (role) => {
    const { error } = await db.from('notifications').update({ is_read: true }).eq('role', role);
    if (error) throw error;
  }
};

// ── FORMAL REQUESTS ────────────────────────────────────────
export const formalApi = {
  getAll: async () => {
    const { data, error } = await db.from('formal_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(r => ({ id: r.id, siteId: r.site_id, siteName: r.site_name, type: r.type, subject: r.subject, details: r.details, status: r.status, createdBy: r.created_by, date: r.date }));
  },
  upsert: async (r) => {
    const { error } = await db.from('formal_requests').upsert({ id: r.id, site_id: r.siteId, site_name: r.siteName, type: r.type, subject: r.subject, details: r.details, status: r.status, created_by: r.createdBy, date: r.date });
    if (error) throw error;
  },
  delete: async (id) => {
    const { error } = await db.from('formal_requests').delete().eq('id', id);
    if (error) throw error;
  }
};

// ── DAMAC ISSUES ───────────────────────────────────────────
export const damacApi = {
  getAll: async () => {
    const { data, error } = await db.from('damac_issues').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(i => ({ id: i.id, siteId: i.site_id, siteName: i.site_name, type: i.type, title: i.title, details: i.details, priority: i.priority, status: i.status, createdBy: i.created_by, date: i.date }));
  },
  upsert: async (i) => {
    const { error } = await db.from('damac_issues').upsert({ id: i.id, site_id: i.siteId, site_name: i.siteName, type: i.type, title: i.title, details: i.details, priority: i.priority, status: i.status, created_by: i.createdBy, date: i.date });
    if (error) throw error;
  },
  delete: async (id) => {
    const { error } = await db.from('damac_issues').delete().eq('id', id);
    if (error) throw error;
  }
};

// ── MAPPERS ────────────────────────────────────────────────
const mapSiteToDB = s => ({ id: s.id, name: s.name, plot: s.plot, engineer: s.engineer, progress: s.progress||0, status: s.status, phase: s.phase||'هيكل', license_no: s.licenseNo||'', start_date: s.startDate||'', initial_delivery: s.initialDelivery||'', final_delivery: s.finalDelivery||'', extended_delivery: s.extendedDelivery||'', extension_period: s.extensionPeriod||'', stop_period: s.stopPeriod||'', stop_reason: s.stopReason||'', created_at: s.createdAt||'' });
const mapSiteFromDB = s => ({ id: s.id, name: s.name, plot: s.plot, engineer: s.engineer, progress: s.progress||0, status: s.status, phase: s.phase, licenseNo: s.license_no||'', startDate: s.start_date||'', initialDelivery: s.initial_delivery||'', finalDelivery: s.final_delivery||'', extendedDelivery: s.extended_delivery||'', extensionPeriod: s.extension_period||'', stopPeriod: s.stop_period||'', stopReason: s.stop_reason||'', createdAt: s.created_at||'' });
const mapRequestToDB = r => ({ id: r.id, site_id: r.siteId, site: r.site, material: r.material, qty: r.qty, unit: r.unit, requested_by: r.requestedBy, date: r.date, phase: r.phase, notes: r.notes||'', rejected_reason: r.rejectedReason||'' });
const mapRequestFromDB = r => ({ id: r.id, siteId: r.site_id, site: r.site, material: r.material, qty: r.qty, unit: r.unit, requestedBy: r.requested_by, date: r.date, phase: r.phase, notes: r.notes||'', rejectedReason: r.rejected_reason||'' });
const mapDocToDB = d => ({ id: d.id, site_id: d.siteId, site: d.site, title: d.title, category: d.category||'', type: d.type, ref_num: d.refNum||'', notes: d.notes||'', by_user: d.by, date: d.date, file_name: d.fileName||'', file_data: d.fileData||'' });
const mapDocFromDB = d => ({ id: d.id, siteId: d.site_id, site: d.site, title: d.title, category: d.category||'', type: d.type, refNum: d.ref_num||'', notes: d.notes||'', by: d.by_user, date: d.date, fileName: d.file_name||'', fileData: d.file_data||'' });
const mapReportToDB = r => ({ id: r.id, site_id: r.siteId, site_name: r.siteName, engineer: r.engineer, date: r.date, works: r.works||'', sub_contractors: r.subContractors||'', issues: r.issues||'', notes: r.notes||'', photos: r.photos||[], created_by: r.createdBy });
const mapReportFromDB = r => ({ id: r.id, siteId: r.site_id, siteName: r.site_name, engineer: r.engineer, date: r.date, works: r.works||'', subContractors: r.sub_contractors||'', issues: r.issues||'', notes: r.notes||'', photos: r.photos||[], createdBy: r.created_by });
const mapAttToDB = a => ({ id: a.id, site_id: a.siteId, site_name: a.siteName, engineer: a.engineer, date: a.date, engineer_present: a.engineerPresent, total_workers: a.totalWorkers||0, absent_workers: a.absentWorkers||0, absent_names: a.absentNames||'', notes: a.notes||'' });
const mapAttFromDB = a => ({ id: a.id, siteId: a.site_id, siteName: a.site_name, engineer: a.engineer, date: a.date, engineerPresent: a.engineer_present, totalWorkers: a.total_workers||0, absentWorkers: a.absent_workers||0, absentNames: a.absent_names||'', notes: a.notes||'' });
