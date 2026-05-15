import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHome = location.pathname === '/';

  return (
    <nav style={{
      background: isHome
        ? 'transparent'
        : 'linear-gradient(135deg, #004C99 0%, #0066CC 60%, #0284C7 100%)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: isHome ? 'absolute' : 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      boxShadow: isHome ? 'none' : '0 2px 12px rgba(0,0,102,0.15)',
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '4px' }}
          >
            <Menu size={22} />
          </button>
        )}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
          <span style={{
            color: 'white',
            fontWeight: 800,
            fontSize: '18px',
            letterSpacing: '-0.3px',
            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}>
            GestInc
          </span>
        </Link>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user ? (
          <>
            <button style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}>
              <Bell size={18} />
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '8px', height: '8px',
                background: '#38BDF8',
                borderRadius: '50%',
                border: '2px solid white',
              }} />
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: 'white',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <div style={{
                  width: '30px', height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38BDF8, #0066CC)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: 'white',
                }}>
                  {user.prenom?.[0]?.toUpperCase() || user.nom?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hide-mobile">{user.prenom || user.nom}</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0,
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  padding: '8px 0',
                  zIndex: 200,
                  border: '1px solid #E2E8F0',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>
                      {user.prenom} {user.nom}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{user.email}</div>
                    <span className={`badge ${user.role === 'admin' ? 'badge-blue' : 'badge-sky'}`} style={{ marginTop: '4px' }}>
                      {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </span>
                  </div>
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/client'}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', color: '#475569',
                      textDecoration: 'none', fontSize: '14px',
                    }}
                  >
                    <User size={16} /> Mon espace
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                      padding: '10px 16px', color: '#EF4444',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '14px', fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn btn-white btn-sm">Connexion</Link>
            <Link to="/register" className="btn btn-sky btn-sm">S'inscrire</Link>
          </div>
        )}
      </div>

      {dropdownOpen && (
        <div
          onClick={() => setDropdownOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
        />
      )}
    </nav>
  );
}
