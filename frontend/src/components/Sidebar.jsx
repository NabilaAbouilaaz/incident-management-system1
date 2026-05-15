import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, AlertCircle, Users, MessageSquare,
  Bot, BarChart2, Settings, ChevronRight, X,
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/admin/incidents', icon: AlertCircle, label: 'Incidents' },
  { to: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { to: '/admin/stats', icon: BarChart2, label: 'Statistiques' },
];

const clientLinks = [
  { to: '/client', icon: LayoutDashboard, label: 'Mes incidents' },
  { to: '/client/nouveau', icon: AlertCircle, label: 'Nouvel incident' },
  { to: '/client/chat', icon: Bot, label: 'Assistant IA' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : clientLinks;

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 149,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <aside style={{
        width: open ? '240px' : '0',
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(180deg, #004C99 0%, #0066CC 100%)',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        boxShadow: open ? '4px 0 20px rgba(0,76,153,0.2)' : 'none',
      }}>
        <div style={{ width: '240px', padding: '20px 0' }}>
          {/* Section label */}
          <div style={{
            padding: '0 20px 12px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            {user?.role === 'admin' ? 'Administration' : 'Mon espace'}
          </div>

          {links.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 20px',
                  color: active ? 'white' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                  background: active
                    ? 'rgba(255,255,255,0.18)'
                    : 'transparent',
                  borderRight: active ? '3px solid #38BDF8' : '3px solid transparent',
                  transition: 'all 0.15s',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} />
                {label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </Link>
            );
          })}

          {/* User info at bottom */}
          <div style={{
            margin: '24px 12px 0',
            padding: '14px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38BDF8, #0066CC)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: 'white',
              marginBottom: '8px',
            }}>
              {user?.prenom?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.prenom} {user?.nom}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
