import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Bot, Send, User, Plus, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const INITIAL_MESSAGE = {
  id: 1, from: 'bot',
  text: "👋 Bonjour ! Je suis votre assistant GestInc.\n\nDécrivez votre problème en quelques mots et je rechercherai des solutions existantes dans notre base d'incidents avant de créer un nouveau ticket.",
};

const botReplies = [
  {
    keywords: ['imprimante', 'print', 'imprimer'],
    response: `🔍 J'ai trouvé **2 incidents similaires résolus** :\n\n📄 **Incident #245** (il y a 3 jours)\nProblème : Imprimante HP bloquée\n✅ Solution : Redémarrer le spooler d'impression (services.msc → Print Spooler → Redémarrer)\n→ Solution efficace pour 8 utilisateurs\n\n📄 **Incident #189** (il y a 1 semaine)\nProblème : Imprimante ne répond pas\n✅ Solution : Réinstaller les pilotes depuis le site constructeur\n→ Solution efficace pour 5 utilisateurs\n\nVoulez-vous essayer l'une de ces solutions ? (répondez "oui" ou "non")`,
  },
  {
    keywords: ['vpn', 'réseau', 'connexion', 'internet', 'wifi', 'wi-fi'],
    response: `🔍 J'ai trouvé **1 incident similaire** :\n\n📄 **Incident #312** (il y a 2 jours)\nProblème : VPN instable\n✅ Solution : Vider le cache DNS (ipconfig /flushdns) puis reconnecter\n→ Solution validée pour 12 utilisateurs\n\nVoulez-vous essayer cette solution ?`,
  },
  {
    keywords: ['mot de passe', 'password', 'accès', 'bloqué', 'verrouillé'],
    response: `🔍 J'ai trouvé **3 incidents similaires** :\n\n📄 **Incident #421** - Compte verrouillé après 5 tentatives\n✅ Solution : Contacter le service IT pour déverrouillage\n\nJe vous recommande de contacter directement le support IT. Souhaitez-vous que je crée un ticket prioritaire ?`,
  },
  {
    keywords: ['lent', 'lenteur', 'ralenti', 'performance'],
    response: `🔍 J'ai trouvé des cas similaires de lenteur système :\n\n📄 **Incident #298** - PC lent au démarrage\n✅ Solution : Désactiver les programmes au démarrage (msconfig → Démarrage)\n\n📄 **Incident #267** - Applications lentes\n✅ Solution : Vérifier l'utilisation mémoire (Gestionnaire des tâches)\n\nCes solutions vous semblent-elles pertinentes ?`,
  },
  {
    keywords: ['oui', 'non', 'marche', 'fonctionne', 'résolu', 'merci'],
    response: `🎉 Excellent ! Je marque cette conversation comme résolue.\n\nSi vous rencontrez d'autres problèmes, n'hésitez pas à revenir. Bonne journée ! 😊`,
  },
  {
    keywords: ['non', 'aucune', 'aucun', 'ne fonctionne', 'ne marche'],
    response: `📋 Aucune solution ne correspond. Je vais créer un incident pour vous.\n\nUn technicien vous contactera **dans les 2 heures**.\n\n📋 **Incident #${Math.floor(Math.random() * 100) + 500} créé**\n🔴 Priorité : Haute\n📎 Référence : INC-2026-${Math.floor(Math.random() * 1000)}\n\nBonne journée !`,
  },
];

const DEFAULT_REPLY = `Je recherche des solutions dans notre base d'incidents… 🔍\n\nJe ne trouve pas de cas exactement similaire. Souhaitez-vous :\n1. Reformuler votre problème avec plus de détails\n2. Créer directement un incident pour un technicien\n\nRépondez "créer ticket" pour ouvrir un incident.`;

const CREATE_REPLY = `📋 D'accord, je crée votre incident maintenant.\n\nUn technicien qualifié vous contactera **dans les 2 heures**.\n\n📋 **Incident #${Math.floor(Math.random() * 100) + 500} créé**\n🔵 Priorité : Moyenne\n📎 Référence : INC-2026-${Math.floor(Math.random() * 1000)}\n\nMerci d'utiliser GestInc ! 😊`;

function BotMessage({ text }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #0066CC, #38BDF8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Bot size={18} color="white" />
      </div>
      <div className="chat-bubble chat-bubble-bot" style={{ whiteSpace: 'pre-line' }}>
        {text}
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div className="chat-bubble chat-bubble-user">
        {text}
      </div>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <User size={18} color="#64748B" />
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const getBotResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('créer ticket') || lower.includes('créer un ticket') || lower.includes('nouveau ticket')) {
      return CREATE_REPLY;
    }
    const match = botReplies.find((r) => r.keywords.some((k) => lower.includes(k)));
    return match ? match.response : DEFAULT_REPLY;
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: Date.now(), from: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const botText = getBotResponse(text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'bot', text: botText }]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const quickReplies = ['Mon imprimante ne fonctionne pas', 'Problème de connexion VPN', 'Mot de passe bloqué', 'PC très lent'];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>

          <div className="page-header animate-fade" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px',
                background: 'linear-gradient(135deg, #0066CC, #38BDF8)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={22} color="white" />
              </div>
              <div>
                <h1 className="page-title">Assistant IA</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  <span className="page-subtitle">En ligne · Propulsé par GestInc AI</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setMessages([INITIAL_MESSAGE])}
              className="btn btn-outline btn-sm"
            >
              <Plus size={14} /> Nouvelle conversation
            </button>
          </div>

          {/* Chat container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', minHeight: '400px' }}>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto',
                padding: '24px',
                display: 'flex', flexDirection: 'column', gap: '16px',
              }}>
                {messages.map((msg) =>
                  msg.from === 'bot'
                    ? <BotMessage key={msg.id} text={msg.text} />
                    : <UserMessage key={msg.id} text={msg.text} />
                )}
                {typing && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0066CC, #38BDF8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={18} color="white" />
                    </div>
                    <div style={{
                      background: '#F1F5F9', borderRadius: '16px 16px 16px 4px',
                      padding: '12px 16px', display: 'flex', gap: '4px', alignItems: 'center',
                    }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8',
                          animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              {messages.length === 1 && (
                <div style={{ padding: '12px 24px', borderTop: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px', fontWeight: 500 }}>SUGGESTIONS RAPIDES</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {quickReplies.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setInput(r); }}
                        style={{
                          padding: '6px 14px',
                          background: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: '9999px',
                          fontSize: '13px', color: '#0284C7',
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.target.style.background = '#BAE6FD'; }}
                        onMouseLeave={(e) => { e.target.style.background = '#F0F9FF'; }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex', gap: '12px', alignItems: 'flex-end',
              }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Décrivez votre problème… (Entrée pour envoyer)"
                  rows={1}
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    border: '2px solid #E2E8F0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#F8FAFC',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#0066CC'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || typing}
                  className="btn btn-primary"
                  style={{ padding: '11px 20px', borderRadius: '10px', flexShrink: 0 }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
