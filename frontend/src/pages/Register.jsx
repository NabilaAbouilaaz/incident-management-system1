import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../services/api';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const departments = [
  'Informatique', 'Ressources Humaines', 'Finance', 'Marketing',
  'Commercial', 'Direction', 'Support Technique', 'Autre',
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', password: '', confirmPassword: '',
    departement: '', poste: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { level: 1, label: 'Faible', color: '#EF4444' };
    if (p.length < 10) return { level: 2, label: 'Moyen', color: '#F59E0B' };
    return { level: 3, label: 'Fort', color: '#10B981' };
  };
  const strength = passwordStrength();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiRegister(form);
      login(data.user, data.token);
      navigate('/client');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #003380 0%, #0066CC 50%, #38BDF8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-150px', left: '-150px',
        width: '500px', height: '500px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="animate-fade" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '44px 40px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/logo.png" alt="Logo GestInc" style={{ height: '52px', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>Créer un compte</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
            Rejoignez la plateforme GestInc
          </p>
        </div>

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

        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prénom *</label>
              <input className="form-control" name="prenom" placeholder="Mohamed" value={form.prenom} onChange={handle} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nom *</label>
              <input className="form-control" name="nom" placeholder="Alaoui" value={form.nom} onChange={handle} required />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Adresse e-mail *</label>
            <input className="form-control" type="email" name="email" placeholder="exemple@domaine.ma" value={form.email} onChange={handle} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Département</label>
              <select className="form-control" name="departement" value={form.departement} onChange={handle}>
                <option value="">Sélectionner</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Poste</label>
              <input className="form-control" name="poste" placeholder="Développeur" value={form.poste} onChange={handle} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Mot de passe *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Minimum 6 caractères"
                value={form.password}
                onChange={handle}
                required
                style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex',
              }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {strength && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: n <= strength.level ? strength.color : '#E2E8F0',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: strength.color, fontWeight: 500 }}>
                  Force : {strength.label}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Répétez le mot de passe"
                value={form.confirmPassword}
                onChange={handle}
                required
                style={{ paddingRight: '44px', borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#EF4444' : undefined }}
              />
              {form.confirmPassword && form.confirmPassword === form.password && (
                <CheckCircle size={18} color="#10B981" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ padding: '13px', fontSize: '15px', borderRadius: '10px' }}
          >
            {loading ? (
              <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Inscription…</>
            ) : (
              <><UserPlus size={18} /> Créer mon compte</>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748B' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: '#0066CC', fontWeight: 600, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px', marginTop: '12px',
          fontSize: '13px', color: '#94A3B8', textDecoration: 'none',
        }}>
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
