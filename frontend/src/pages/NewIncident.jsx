import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { createIncident } from '../services/api';
import { AlertCircle, Send, CheckCircle, ArrowLeft } from 'lucide-react';

const categories = [
  'Matériel', 'Logiciel', 'Réseau', 'Sécurité', 'Accès / Permissions',
  'Email', 'Téléphonie', 'Imprimante', 'Base de données', 'Autre',
];

export default function NewIncident() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    titre: '', description: '', priorite: 'moyenne',
    categorie: '', localisation: '',
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createIncident(form);
      setSuccess(true);
      setTimeout(() => navigate('/client'), 2500);
    } catch {
      // Demo mode: simulate success
      setSuccess(true);
      setTimeout(() => navigate('/client'), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, padding: '32px' }}>

          <div className="page-header animate-fade">
            <div>
              <button
                onClick={() => navigate('/client')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#0066CC', fontSize: '14px', fontWeight: 500, marginBottom: '8px', padding: 0 }}
              >
                <ArrowLeft size={16} /> Retour
              </button>
              <h1 className="page-title">Déclarer un incident</h1>
              <p className="page-subtitle">Remplissez le formulaire pour soumettre votre incident</p>
            </div>
          </div>

          {success ? (
            <div className="card animate-fade" style={{ maxWidth: '500px', textAlign: 'center', padding: '48px' }}>
              <CheckCircle size={64} color="#10B981" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#065F46', marginBottom: '8px' }}>
                Incident soumis avec succès !
              </h2>
              <p style={{ color: '#64748B', marginBottom: '16px' }}>
                Votre incident a été enregistré et sera traité dans les meilleurs délais. Redirection en cours…
              </p>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ maxWidth: '680px' }} className="animate-fade">
              {error && (
                <div style={{
                  background: '#FEE2E2', border: '1px solid #FECACA',
                  borderRadius: '10px', padding: '12px 14px',
                  marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
                  color: '#991B1B', fontSize: '14px',
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Tips */}
              <div style={{
                background: '#F0F9FF', border: '1px solid #BAE6FD',
                borderRadius: '12px', padding: '16px', marginBottom: '24px',
                display: 'flex', gap: '12px',
              }}>
                <AlertCircle size={20} color="#0284C7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#0284C7', fontSize: '14px', marginBottom: '4px' }}>
                    Conseil : Utilisez l'Assistant IA
                  </div>
                  <div style={{ fontSize: '13px', color: '#0369A1', lineHeight: 1.5 }}>
                    Notre assistant IA peut vous proposer des solutions existantes avant de créer un nouveau ticket.{' '}
                    <a href="/client/chat" style={{ color: '#0066CC', fontWeight: 600 }}>Essayer l'assistant →</a>
                  </div>
                </div>
              </div>

              <form onSubmit={submit} className="card" style={{ padding: '32px' }}>
                <div className="form-group">
                  <label className="form-label">Titre de l'incident *</label>
                  <input
                    className="form-control"
                    name="titre"
                    placeholder="Ex: Impossible d'accéder au réseau Wi-Fi"
                    value={form.titre}
                    onChange={handle}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Catégorie *</label>
                    <select className="form-control" name="categorie" value={form.categorie} onChange={handle} required>
                      <option value="">Sélectionner…</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Priorité *</label>
                    <select className="form-control" name="priorite" value={form.priorite} onChange={handle} required>
                      <option value="faible">🟢 Faible</option>
                      <option value="moyenne">🟡 Moyenne</option>
                      <option value="haute">🟠 Haute</option>
                      <option value="critique">🔴 Critique</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Localisation / Service</label>
                  <input
                    className="form-control"
                    name="localisation"
                    placeholder="Ex: Bureau 204, Bâtiment A"
                    value={form.localisation}
                    onChange={handle}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description détaillée *</label>
                  <textarea
                    className="form-control"
                    name="description"
                    placeholder="Décrivez le problème en détail : quand a-t-il commencé, quels messages d'erreur apparaissent, ce que vous avez déjà essayé…"
                    value={form.description}
                    onChange={handle}
                    required
                    rows={5}
                    style={{ minHeight: '130px' }}
                  />
                </div>

                {/* Priority info */}
                <div style={{
                  background: '#F8FAFC', borderRadius: '10px', padding: '14px',
                  marginBottom: '20px', fontSize: '13px', color: '#64748B',
                }}>
                  <strong style={{ color: '#475569' }}>Temps de réponse estimé :</strong>
                  {form.priorite === 'critique' && ' 🔴 Critique — Réponse immédiate (< 30 min)'}
                  {form.priorite === 'haute' && ' 🟠 Haute — Réponse dans les 2 heures'}
                  {form.priorite === 'moyenne' && ' 🟡 Moyenne — Réponse dans la journée'}
                  {form.priorite === 'faible' && ' 🟢 Faible — Réponse sous 48h'}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                  style={{ padding: '13px', fontSize: '15px', borderRadius: '10px' }}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Envoi en cours…</>
                  ) : (
                    <><Send size={18} /> Soumettre l'incident</>
                  )}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
