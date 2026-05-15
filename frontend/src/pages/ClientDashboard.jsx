import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getMyIncidents } from '../services/api';
import {
  AlertCircle, Plus, Clock, CheckCircle, Search,
  Filter, Eye, BarChart2, Loader,
} from 'lucide-react';

const statusMap = {
  nouveau:    { label: 'Nouveau',    badge: 'badge-blue',   icon: '🔵' },
  assigne:    { label: 'Assigné',    badge: 'badge-sky',    icon: '🔷' },
  en_cours:   { label: 'En cours',   badge: 'badge-yellow', icon: '🟡' },
  resolu:     { label: 'Résolu',     badge: 'badge-green',  icon: '🟢' },
  ferme:      { label: 'Fermé',      badge: 'badge-gray',   icon: '⚫' },
};

const priorityMap = {
  faible:   { label: 'Faible',   badge: 'badge-green' },
  moyenne:  { label: 'Moyenne',  badge: 'badge-yellow' },
  haute:    { label: 'Haute',    badge: 'badge-orange' },
  critique: { label: 'Critique', badge: 'badge-red' },
};

// Demo data when API is not available
const demoIncidents = [
  { id: 1, titre: 'Imprimante ne répond plus', statut: 'resolu', priorite: 'moyenne', categorie: 'Matériel', date_creation: '2026-05-10T09:00:00Z', description: "L'imprimante du bureau 3 ne fonctionne plus depuis ce matin." },
  { id: 2, titre: 'Problème de connexion VPN', statut: 'en_cours', priorite: 'haute', categorie: 'Réseau', date_creation: '2026-05-13T14:30:00Z', description: "Impossible de me connecter au VPN depuis 2 jours." },
  { id: 3, titre: 'Application RH plantée', statut: 'nouveau', priorite: 'critique', categorie: 'Logiciel', date_creation: '2026-05-15T08:15:00Z', description: "L'application de gestion des congés affiche une erreur 500." },
  { id: 4, titre: 'Écran noir au démarrage', statut: 'assigne', priorite: 'haute', categorie: 'Matériel', date_creation: '2026-05-14T11:00:00Z', description: "Mon ordinateur portable affiche un écran noir au démarrage." },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    getMyIncidents()
      .then(({ data }) => setIncidents(data))
      .catch(() => setIncidents(demoIncidents))
      .finally(() => setLoading(false));
  }, []);

  const filtered = incidents.filter((inc) => {
    const matchSearch = inc.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || inc.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: incidents.length,
    nouveau: incidents.filter((i) => i.statut === 'nouveau').length,
    en_cours: incidents.filter((i) => i.statut === 'en_cours' || i.statut === 'assigne').length,
    resolu: incidents.filter((i) => i.statut === 'resolu' || i.statut === 'ferme').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

          {/* Header */}
          <div className="page-header animate-fade">
            <div>
              <h1 className="page-title">Mes Incidents</h1>
              <p className="page-subtitle">Bonjour {user?.prenom}, voici l'état de vos incidents</p>
            </div>
            <Link to="/client/nouveau" className="btn btn-primary">
              <Plus size={16} /> Nouvel incident
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }} className="animate-fade">
            {[
              { label: 'Total', value: stats.total, color: '#0066CC', bg: '#DBEAFE', icon: BarChart2 },
              { label: 'Nouveaux', value: stats.nouveau, color: '#0284C7', bg: '#BAE6FD', icon: AlertCircle },
              { label: 'En cours', value: stats.en_cours, color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
              { label: 'Résolus', value: stats.resolu, color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="stat-icon" style={{ background: bg }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }} className="animate-fade">
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Rechercher un incident…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                className="form-control"
                style={{ paddingLeft: '36px', paddingRight: '36px', minWidth: '160px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                {Object.entries(statusMap).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Incidents list */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <AlertCircle size={48} />
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#475569' }}>
                {incidents.length === 0 ? 'Aucun incident pour le moment' : 'Aucun résultat trouvé'}
              </p>
              {incidents.length === 0 && (
                <Link to="/client/nouveau" className="btn btn-primary">
                  <Plus size={16} /> Créer mon premier incident
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade">
              {filtered.map((inc) => {
                const st = statusMap[inc.statut] || statusMap.nouveau;
                const pr = priorityMap[inc.priorite] || priorityMap.moyenne;
                return (
                  <div key={inc.id} className="card card-hover" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{inc.titre}</h3>
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>#{inc.id}</span>
                        </div>
                        {inc.description && (
                          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px', lineHeight: 1.5 }}>
                            {inc.description.slice(0, 100)}{inc.description.length > 100 ? '…' : ''}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className={`badge ${st.badge}`}>{st.icon} {st.label}</span>
                          <span className={`badge ${pr.badge}`}>⚡ {pr.label}</span>
                          {inc.categorie && <span className="badge badge-gray">🏷 {inc.categorie}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                          {new Date(inc.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <Link to={`/client/incidents/${inc.id}`} className="btn btn-outline btn-sm">
                          <Eye size={14} /> Voir
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
