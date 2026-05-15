import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getStats, getIncidents, updateIncident } from '../services/api';
import {
  AlertCircle, CheckCircle, Clock, Users,
  Filter, Search, Edit2, Eye, BarChart2,
  Activity, RefreshCw,
} from 'lucide-react';

const statusMap = {
  nouveau:  { label: 'Nouveau',   badge: 'badge-blue',   options: ['assigne', 'en_cours', 'resolu', 'ferme'] },
  assigne:  { label: 'Assigné',   badge: 'badge-sky',    options: ['en_cours', 'resolu', 'ferme'] },
  en_cours: { label: 'En cours',  badge: 'badge-yellow', options: ['resolu', 'ferme'] },
  resolu:   { label: 'Résolu',    badge: 'badge-green',  options: ['ferme', 'en_cours'] },
  ferme:    { label: 'Fermé',     badge: 'badge-gray',   options: [] },
};

const priorityMap = {
  faible:   { label: 'Faible',   badge: 'badge-green' },
  moyenne:  { label: 'Moyenne',  badge: 'badge-yellow' },
  haute:    { label: 'Haute',    badge: 'badge-orange' },
  critique: { label: 'Critique', badge: 'badge-red' },
};

const emptyStats = {
  total: 0, nouveau: 0, en_cours: 0, resolu: 0,
  critique: 0, utilisateurs: 0, resolution_rate: 0,
};

function StatCard({ label, value, icon: Icon, color, bg, sub }) {
  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ background: bg }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{label}</div>
        {sub && <div style={{ fontSize: '12px', color, fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(emptyStats);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const refresh = () => {
    setLoading(true);
    Promise.allSettled([getStats(), getIncidents()])
      .then(([s, i]) => {
        if (s.status === 'fulfilled') setStats(s.value.data);
        if (i.status === 'fulfilled') setIncidents(i.value.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const changeStatus = async (id, status) => {
    try { await updateIncident(id, { statut: status }); } catch { /* ignore */ }
    setIncidents((prev) => prev.map((inc) => inc.id === id ? { ...inc, statut: status } : inc));
    setEditingId(null);
  };

  const filtered = incidents.filter((inc) => {
    const matchSearch = inc.titre.toLowerCase().includes(search.toLowerCase()) ||
      (inc.utilisateur || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || inc.statut === filterStatus;
    const matchPrio = !filterPriority || inc.priorite === filterPriority;
    return matchSearch && matchStatus && matchPrio;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

          {/* Header */}
          <div className="page-header animate-fade">
            <div>
              <h1 className="page-title">Tableau de bord</h1>
              <p className="page-subtitle">Vue d'ensemble de la gestion des incidents</p>
            </div>
            <button onClick={refresh} className={`btn btn-outline btn-sm ${loading ? 'disabled' : ''}`} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualiser
            </button>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }} className="animate-fade">
            <StatCard label="Total incidents" value={stats.total} icon={BarChart2} color="#0066CC" bg="#DBEAFE" />
            <StatCard label="Nouveaux" value={stats.nouveau} icon={AlertCircle} color="#0284C7" bg="#BAE6FD" sub="À traiter" />
            <StatCard label="En cours" value={stats.en_cours} icon={Clock} color="#F59E0B" bg="#FEF3C7" />
            <StatCard label="Résolus" value={stats.resolu} icon={CheckCircle} color="#10B981" bg="#D1FAE5" sub={`Taux : ${stats.resolution_rate}%`} />
            <StatCard label="Critiques" value={stats.critique} icon={Activity} color="#EF4444" bg="#FEE2E2" sub="Priorité max" />
            <StatCard label="Utilisateurs" value={stats.utilisateurs} icon={Users} color="#7C3AED" bg="#EDE9FE" />
          </div>

          {/* Progress bars */}
          {stats.total > 0 && (
            <div className="card animate-fade" style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>
                Répartition par statut
              </h3>
              <div style={{ display: 'flex', gap: '8px', height: '16px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                {[
                  { pct: Math.round(stats.nouveau / stats.total * 100), color: '#3B82F6' },
                  { pct: Math.round(stats.en_cours / stats.total * 100), color: '#F59E0B' },
                  { pct: Math.round(stats.resolu / stats.total * 100), color: '#10B981' },
                ].map((s, i) => (
                  <div key={i} style={{ width: `${s.pct}%`, background: s.color, transition: 'width 0.5s ease' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Nouveaux', pct: Math.round(stats.nouveau / stats.total * 100), color: '#3B82F6' },
                  { label: 'En cours', pct: Math.round(stats.en_cours / stats.total * 100), color: '#F59E0B' },
                  { label: 'Résolus', pct: Math.round(stats.resolu / stats.total * 100), color: '#10B981' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                    {item.label} ({item.pct}%)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incidents Table */}
          <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                Incidents ({filtered.length})
              </h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: '34px', width: '200px' }}
                    placeholder="Rechercher…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select className="form-control" style={{ width: '150px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Tous statuts</option>
                  {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select className="form-control" style={{ width: '150px' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">Toutes priorités</option>
                  {Object.entries(priorityMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  Chargement…
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Titre</th>
                      <th>Catégorie</th>
                      <th>Priorité</th>
                      <th>Statut</th>
                      <th>Déclaré par</th>
                      <th>Assigné à</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                          Aucun incident pour le moment
                        </td>
                      </tr>
                    ) : filtered.map((inc) => {
                      const st = statusMap[inc.statut] || statusMap.nouveau;
                      const pr = priorityMap[inc.priorite] || priorityMap.moyenne;
                      return (
                        <tr key={inc.id}>
                          <td style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>#{inc.id}</td>
                          <td style={{ maxWidth: '220px' }}>
                            <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {inc.titre}
                            </div>
                          </td>
                          <td><span className="badge badge-gray">{inc.categorie || '—'}</span></td>
                          <td><span className={`badge ${pr.badge}`}>{pr.label}</span></td>
                          <td>
                            {editingId === inc.id ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <select
                                  className="form-control"
                                  style={{ padding: '4px 8px', fontSize: '12px', minWidth: '110px' }}
                                  value={newStatus}
                                  onChange={(e) => setNewStatus(e.target.value)}
                                >
                                  <option value="">Choisir…</option>
                                  {Object.entries(statusMap).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                                <button className="btn btn-success btn-sm" style={{ padding: '4px 8px' }} onClick={() => newStatus && changeStatus(inc.id, newStatus)}>✓</button>
                                <button className="btn btn-sm" style={{ padding: '4px 8px', background: '#F1F5F9' }} onClick={() => setEditingId(null)}>✕</button>
                              </div>
                            ) : (
                              <span className={`badge ${st.badge}`}>{st.label}</span>
                            )}
                          </td>
                          <td style={{ fontSize: '13px' }}>{inc.utilisateur || '—'}</td>
                          <td style={{ fontSize: '13px' }}>
                            {inc.assigne_a
                              ? <span style={{ color: '#0066CC', fontWeight: 500 }}>{inc.assigne_a}</span>
                              : <span style={{ color: '#EF4444', fontSize: '12px' }}>Non assigné</span>}
                          </td>
                          <td style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            {new Date(inc.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-sm"
                                style={{ padding: '5px 10px', background: '#EFF6FF', color: '#1D4ED8', border: 'none' }}
                                onClick={() => { setEditingId(inc.id); setNewStatus(inc.statut); }}
                                title="Modifier le statut"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ padding: '5px 10px', background: '#F0FDF4', color: '#15803D', border: 'none' }}
                                title="Voir les détails"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
