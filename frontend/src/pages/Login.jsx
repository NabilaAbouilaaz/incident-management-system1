import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiLogin(form);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/client');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
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
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '-150px', right: '-150px',
        width: '500px', height: '500px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px',
        width: '400px', height: '400px',
        background: 'rgba(56,189,248,0.1)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="animate-fade" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Logo GestInc" style={{ height: '56px', marginBottom: '12px' }} />
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A' }}>Bienvenue</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
            Connectez-vous à votre espace GestInc
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Adresse e-mail</label>
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="exemple@domaine.ma"
              value={form.email}
              onChange={handle}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mot de passe</span>
              <Link to="#" style={{ fontSize: '12px', color: '#0066CC', textDecoration: 'none' }}>
                Mot de passe oublié ?
              </Link>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Votre mot de passe"
                value={form.password}
                onChange={handle}
                required
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                  display: 'flex',
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '8px', padding: '13px', fontSize: '15px', borderRadius: '10px' }}
          >
            {loading ? (
              <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Connexion…</>
            ) : (
              <><LogIn size={18} /> Se connecter</>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: '#0066CC', fontWeight: 600, textDecoration: 'none' }}>
            S'inscrire
          </Link>
        </p>

        <Link to="/" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px', marginTop: '16px',
          fontSize: '13px', color: '#94A3B8', textDecoration: 'none',
        }}>
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
