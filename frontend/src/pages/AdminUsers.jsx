import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getUsers } from '../services/api';
import { Users, Search, Shield, User, Mail, Briefcase } from 'lucide-react';

const demoUsers = [
  { id: 1, prenom: 'Nabila', nom: '', email: 'admin@gestinc.ma', role: 'admin', departement: 'Informatique', poste: 'Administratrice', date_creation: '2026-01-01T00:00:00Z' },
  { id: 2, prenom: 'Ahmed', nom: 'Benali', email: 'ahmed.benali@gestinc.ma', role: 'technicien', departement: 'Support IT', poste: 'Technicien senior', date_creation: '2026-02-15T00:00:00Z' },
  { id: 3, prenom: 'Yasmine', nom: 'Alaoui', email: 'yasmine.alaoui@gestinc.ma', role: 'technicien', departement: 'Support IT', poste: 'Technicienne réseau', date_creation: '2026-02-20T00:00:00Z' },
  { id: 4, prenom: 'Salma', nom: '', email: 'user@gestinc.ma', role: 'user', departement: 'Finance', poste: 'Utilisatrice', date_creation: '2026-03-01T00:00:00Z' },
  { id: 5, prenom: 'Sara', nom: 'Idrissi', email: 'sara.idrissi@gestinc.ma', role: 'user', departement: 'RH', poste: 'Chargée RH', date_creation: '2026-03-10T00:00:00Z' },
  { id: 6, prenom: 'Karim', nom: 'Moussaoui', email: 'karim.moussaoui@gestinc.ma', role: 'technicien', departement: 'Support IT', poste: 'Technicien helpdesk', date_creation: '2026-03-15T00:00:00Z' },
  { id: 7, prenom: 'Fatima', nom: 'Chraibi', email: 'fatima.chraibi@gestinc.ma', role: 'user', departement: 'Marketing', poste: 'Chef de projet', date_creation: '2026-04-01T00:00:00Z' },
];

const roleMap = {
  admin:      { label: 'Administrateur', badge: 'badge-red',   icon: <Shield size={12} /> },
  technicien: { label: 'Technicien',     badge: 'badge-blue',  icon: <Briefcase size={12} /> },
  user:       { label: 'Utilisateur',    badge: 'badge-green', icon: <User size={12} /> },
};

export default function AdminUsers() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    getUsers()
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers(demoUsers))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const name = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (!filterRole || u.role === filterRole);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, padding: '32px' }}>

          <div className="page-header animate-fade">
            <div>
              <h1 className="page-title">Gestion des utilisateurs</h1>
              <p className="page-subtitle">{users.length} utilisateurs enregistrés</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '28px' }} className="animate-fade">
            {[
              { label: 'Total', value: users.length, color: '#0066CC', bg: '#DBEAFE' },
              { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: '#EF4444', bg: '#FEE2E2' },
              { label: 'Techniciens', value: users.filter((u) => u.role === 'technicien').length, color: '#0284C7', bg: '#BAE6FD' },
              { label: 'Utilisateurs', value: users.filter((u) => u.role === 'user').length, color: '#10B981', bg: '#D1FAE5' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="stat-icon" style={{ background: bg }}>
                  <Users size={20} color={color} />
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
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="form-control" style={{ paddingLeft: '36px' }} placeholder="Rechercher un utilisateur…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: '180px' }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="technicien">Technicien</option>
              <option value="user">Utilisateur</option>
            </select>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
          ) : (
            <div className="table-container animate-fade">
              <table className="table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Département</th>
                    <th>Poste</th>
                    <th>Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const role = roleMap[u.role] || roleMap.user;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: `linear-gradient(135deg, #0066CC, #38BDF8)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0,
                            }}>
                              {u.prenom?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
                                {u.prenom} {u.nom}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                            <Mail size={13} color="#94A3B8" /> {u.email}
                          </div>
                        </td>
                        <td><span className={`badge ${role.badge}`}>{role.icon} {role.label}</span></td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>{u.departement || '—'}</td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>{u.poste || '—'}</td>
                        <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                          {new Date(u.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
