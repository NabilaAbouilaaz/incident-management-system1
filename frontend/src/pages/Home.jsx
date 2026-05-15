import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  AlertCircle, CheckCircle, Clock, Users, Shield,
  ArrowRight, Zap, BarChart2, MessageSquare, Bot, Star,
} from 'lucide-react';

const features = [
  {
    icon: AlertCircle,
    color: '#0066CC',
    bg: '#DBEAFE',
    title: 'Gestion des incidents',
    desc: 'Créez, suivez et résolvez vos incidents informatiques en temps réel avec un workflow complet.',
  },
  {
    icon: Bot,
    color: '#0284C7',
    bg: '#BAE6FD',
    title: 'Assistant IA intégré',
    desc: "Notre chatbot intelligent recherche des solutions existantes avant de créer un nouveau ticket.",
  },
  {
    icon: BarChart2,
    color: '#10B981',
    bg: '#D1FAE5',
    title: 'Tableau de bord analytique',
    desc: 'Visualisez les statistiques en temps réel et prenez des décisions basées sur les données.',
  },
  {
    icon: Shield,
    color: '#7C3AED',
    bg: '#EDE9FE',
    title: 'Sécurité renforcée',
    desc: "Authentification sécurisée avec gestion des rôles et des droits d'accès granulaires.",
  },
  {
    icon: MessageSquare,
    color: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Commentaires et échanges',
    desc: 'Communiquez directement sur chaque incident avec un historique complet des échanges.',
  },
  {
    icon: Zap,
    color: '#EF4444',
    bg: '#FEE2E2',
    title: 'Notifications en temps réel',
    desc: "Recevez des alertes instantanées sur l'évolution du statut de vos incidents.",
  },
];

const stats = [
  { value: '99.9%', label: 'Disponibilité', icon: CheckCircle, color: '#10B981' },
  { value: '< 2h', label: 'Temps de réponse', icon: Clock, color: '#0066CC' },
  { value: '500+', label: 'Utilisateurs actifs', icon: Users, color: '#0284C7' },
  { value: '98%', label: 'Taux de satisfaction', icon: Star, color: '#F59E0B' },
];

const steps = [
  { num: '01', title: 'Signalez votre incident', desc: "Décrivez votre problème via le formulaire ou l'assistant IA en quelques clics." },
  { num: '02', title: 'Assignation automatique', desc: "Le système assigne automatiquement l'incident au technicien le plus disponible." },
  { num: '03', title: 'Suivi en temps réel', desc: "Suivez l'avancement de la résolution à chaque étape du workflow." },
  { num: '04', title: 'Résolution confirmée', desc: 'Recevez une notification dès que votre incident est résolu et validé.' },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #003380 0%, #0066CC 50%, #0284C7 80%, #38BDF8 100%)',
      }}>
        {/* Background image overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/pic_acceuil.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          opacity: 0.18,
        }} />

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px',
          background: 'rgba(56,189,248,0.15)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-120px', left: '-80px',
          width: '400px', height: '400px',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: '1200px', margin: '0 auto',
          padding: '100px 40px 60px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          width: '100%',
        }}>
          {/* Left content */}
          <div className="animate-fade">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '13px', color: 'white', fontWeight: 500,
              marginBottom: '24px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38BDF8', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Plateforme de gestion d'incidents v2.0
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.15,
              marginBottom: '24px',
              letterSpacing: '-1px',
            }}>
              Gérez vos incidents
              <br />
              <span style={{ color: '#38BDF8' }}>intelligemment</span> et
              <br />
              efficacement
            </h1>

            <p style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7,
              marginBottom: '40px',
              maxWidth: '480px',
            }}>
              Une solution complète pour signaler, suivre et résoudre vos incidents informatiques avec l'aide de l'intelligence artificielle.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-white btn-lg">
                Commencer gratuitement <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-lg" style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.35)',
                backdropFilter: 'blur(10px)',
              }}>
                Se connecter
              </Link>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'flex', gap: '32px', marginTop: '48px', flexWrap: 'wrap' }}>
              {[{ v: '500+', l: 'Utilisateurs' }, { v: '2 000+', l: 'Incidents résolus' }, { v: '99.9%', l: 'Disponibilité' }].map((s) => (
                <div key={s.l}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'white' }}>{s.v}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: image card */}
          <div className="animate-fade hide-mobile" style={{ animationDelay: '0.2s' }}>
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
            }}>
              <img
                src="/pic_acceuil.png"
                alt="Gestion des incidents"
                style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.3)' }} />
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Système opérationnel</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Ouverts', value: '12', color: '#38BDF8' },
                    { label: 'En cours', value: '5', color: '#F59E0B' },
                    { label: 'Résolus', value: '87', color: '#10B981' },
                  ].map((item) => (
                    <div key={item.label} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 40px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {stats.map(({ value, label, icon: Icon, color }) => (
              <div key={label} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,102,204,0.08)',
                border: '1px solid #E2E8F0',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,102,204,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,102,204,0.08)'; }}
              >
                <Icon size={36} color={color} style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 40px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block',
              background: '#DBEAFE', color: '#1D4ED8',
              padding: '6px 16px', borderRadius: '9999px',
              fontSize: '13px', fontWeight: 600, marginBottom: '16px',
            }}>
              Fonctionnalités
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
              Tout ce dont vous avez besoin
            </h2>
            <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              Une plateforme complète pour gérer efficacement tous vos incidents informatiques.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="card card-hover" style={{ padding: '28px' }}>
                <div style={{
                  width: '52px', height: '52px',
                  borderRadius: '12px',
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 40px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block',
              background: '#BAE6FD', color: '#0284C7',
              padding: '6px 16px', borderRadius: '9999px',
              fontSize: '13px', fontWeight: 600, marginBottom: '16px',
            }}>
              Comment ça marche
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
              Simple et efficace en 4 étapes
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {steps.map(({ num, title, desc }, i) => (
              <div key={num} style={{ textAlign: 'center', position: 'relative' }}>
                {i < steps.length - 1 && (
                  <div className="hide-mobile" style={{
                    position: 'absolute', top: '28px', left: '60%', right: '-40%',
                    height: '2px',
                    background: 'linear-gradient(90deg, #0066CC, #38BDF8)',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: '56px', height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0066CC, #38BDF8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '18px', fontWeight: 800, color: 'white',
                  position: 'relative', zIndex: 1,
                  boxShadow: '0 4px 16px rgba(0,102,204,0.3)',
                }}>
                  {num}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 40px',
        background: 'linear-gradient(135deg, #003380 0%, #0066CC 60%, #0284C7 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
            Prêt à commencer ?
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.8)', marginBottom: '40px', lineHeight: 1.7 }}>
            Rejoignez des centaines d'équipes IT qui font confiance à GestInc pour gérer leurs incidents.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-white btn-lg">
              Créer un compte <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.35)',
            }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0F172A',
        color: 'rgba(255,255,255,0.6)',
        padding: '40px',
        textAlign: 'center',
        fontSize: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '32px', opacity: 0.85 }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>GestInc</span>
        </div>
        <p>© 2026 GestInc — Système de Gestion des Incidents. Tous droits réservés.</p>
        <p style={{ marginTop: '6px', fontSize: '12px' }}>
          ENSA BM · Architecture Microservices · Pr. BE ELBAGHAZAOUI
        </p>
      </footer>
    </div>
  );
}
