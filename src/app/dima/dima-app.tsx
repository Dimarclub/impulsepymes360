'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import {
  Mic, MicOff, Search, MapPin, Phone, MessageCircle, Star, X, Loader2,
  Sparkles, TrendingUp, Wallet, Users, Award, Download, ChevronRight,
  ChevronDown, Building2, Package, ShoppingBag, Store, Navigation,
  Zap, Bot, ArrowRight, Volume2, CheckCircle2, Copy, QrCode, Share2,
  User as UserIcon, LogIn, Home, Briefcase, Send, Quote, UserPlus,
} from 'lucide-react'

// ---------- Paleta oscura (mismo sistema que PubliBags / Presentación) ----------
const C = {
  bg: '#0B1120',
  card: '#15203A',
  card2: '#1A2647',
  border: '#243352',
  borderLight: '#2F3F66',
  emerald: '#00D4AA',
  emeraldDark: '#00A886',
  gold: '#F5A623',
  text: '#E8EDF5',
  textDim: '#A0AEC8',
  muted: '#6B7FA0',
  success: '#22C55E',
  rose: '#F43F5E',
  amber: '#F59E0B',
}

// ---------- Tipos ----------
type ResultType = 'SUPPLIER' | 'PRODUCT' | 'CATEGORY'
interface SearchResult {
  type: ResultType
  id: string
  supplierId?: string | null  // Supplier.id → usado para /proveedor/[id]
  storeUrl?: string | null    // URL pública del storefront del proveedor
  name: string
  description?: string | null
  city?: string | null
  sector?: string | null
  address?: string | null
  phone?: string | null
  whatsapp?: string | null
  rating: number
  imageUrl?: string | null
  matchedPhrases: string[]
  branch?: { name: string; address: string; city: string } | null
  isPremium: boolean
}

interface AiContext {
  intention: string
  city: string | null
  sector: string | null
  category: string | null
}

// ---------- Sugerencias rápidas ----------
const QUICK_SUGGESTIONS = [
  'Restaurantes cerca de mí',
  'Lugares turísticos',
  'Mayoristas de bazar',
  'Cosméticos y cuidado personal',
  'Importadoras',
  'Juguetes',
]

// ---------- Helpers ----------
const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtRating = (r: number) => (r ? `★ ${r.toFixed(1)}` : 'Sin calificación')

// Devuelve "Hace 5 min" / "Hace 2 h" / "Ayer" / "12 oct"
function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffH < 24) return `Hace ${diffH} h`
  if (diffD === 1) return 'Ayer'
  if (diffD < 7) return `Hace ${diffD} días`
  try {
    return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

// Iniciales para avatar
function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Componente de estrellas (display o interactivo)
function StarsBar({
  rating,
  interactive,
  onChange,
  size = 24,
}: {
  rating: number
  interactive?: boolean
  onChange?: (n: number) => void
  size?: number
}) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating)
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(n)}
            aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              padding: 0,
              color: filled ? C.gold : C.borderLight,
              display: 'inline-flex',
              lineHeight: 0,
            }}
          >
            <Star size={size} fill={filled ? C.gold : 'none'} strokeWidth={filled ? 0 : 2} />
          </button>
        )
      })}
    </div>
  )
}

// ---------- Componente principal ----------
export default function DimaApp() {
  const { data: session, status } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [aiContext, setAiContext] = useState<AiContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedCity, setAdvancedCity] = useState('')
  const [advancedSector, setAdvancedSector] = useState('')
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [userRegisterOpen, setUserRegisterOpen] = useState(false)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [annualBilling, setAnnualBilling] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [installEvent, setInstallEvent] = useState<any>(null)
  const [installable, setInstallable] = useState(false)
  const recognitionRef = useRef<any>(null)

  // ---- Cargar estado de suscripción ----
  const refreshSubscription = useCallback(async () => {
    if (status !== 'authenticated') {
      setSubscribed(false)
      return
    }
    try {
      const r = await fetch('/api/dima/my-subscription')
      if (!r.ok) return
      const d = await r.json()
      setSubscribed(d.subscription?.plan === 'PLUS' && d.subscription?.status === 'ACTIVE')
    } catch {}
  }, [status])

  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  // ---- Voice support detection ----
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  // ---- PWA install prompt ----
  useEffect(() => {
    const onBeforeInstall = (e: any) => {
      e.preventDefault()
      setInstallEvent(e)
      setInstallable(true)
    }
    const onInstalled = () => {
      setInstallable(false)
      setInstallEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // ---- Service worker registration ----
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-dima.js').catch(() => {})
    }
  }, [])

  // ---- Speech recognition ----
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'es-EC'
    rec.interimResults = true
    rec.continuous = false
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e: any) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setQuery(transcript)
    }
    rec.start()
    recognitionRef.current = rec
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop?.()
    setListening(false)
  }, [])

  // ---- Search ----
  const runSearch = useCallback(async () => {
    const q = query.trim()
    if (q.length < 2) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch('/api/dima/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          city: advancedCity || undefined,
          sector: advancedSector || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setResults(data.results || [])
      setAiContext(data.aiContext || null)
    } catch (e: any) {
      setError(e.message || 'Error procesando búsqueda')
    } finally {
      setLoading(false)
    }
  }, [query, advancedCity, advancedSector])

  const onSuggestion = (s: string) => {
    setQuery(s)
    setLoading(true)
    setError(null)
    setResults(null)
    fetch('/api/dima/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: s }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setResults(d.results || [])
          setAiContext(d.aiContext || null)
        } else {
          setError(d.error || 'Error')
        }
      })
      .catch(() => setError('Error de red'))
      .finally(() => setLoading(false))
  }

  const installApp = useCallback(async () => {
    if (!installEvent) return
    installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    setInstallable(false)
  }, [installEvent])

  const doSubscribe = useCallback(async () => {
    if (status !== 'authenticated') {
      setLoginOpen(true)
      return
    }
    setSubscribeLoading(true)
    try {
      const r = await fetch('/api/dima/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PLUS', billingCycle: annualBilling ? 'ANNUAL' : 'MONTHLY' }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error')
      setSubscribeOpen(false)
      setSubscribed(true)
      alert(`¡Suscripción Dima Plus activa! Invertiste ${fmtUsd(annualBilling ? 200 : 20)} que se registran como aporte de capital (rendimiento variable, no garantizado).`)
    } catch (e: any) {
      alert(e.message || 'Error')
    } finally {
      setSubscribeLoading(false)
    }
  }, [status, annualBilling])

  const userName = session?.user?.name as string | undefined

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Navbar
        userName={userName}
        isAuth={status === 'authenticated'}
        installable={installable}
        onInstall={installApp}
        onLogin={() => setLoginOpen(true)}
        onRegister={() => setUserRegisterOpen(true)}
        onLogout={() => signOut({ callbackUrl: '/dima' })}
        onPromote={() => setRegisterOpen(true)}
      />

      <Hero
        query={query}
        setQuery={setQuery}
        onSearch={runSearch}
        loading={loading}
        listening={listening}
        voiceSupported={voiceSupported}
        onMic={listening ? stopListening : startListening}
        onSuggestion={onSuggestion}
        advancedOpen={advancedOpen}
        setAdvancedOpen={setAdvancedOpen}
        advancedCity={advancedCity}
        setAdvancedCity={setAdvancedCity}
        advancedSector={advancedSector}
        setAdvancedSector={setAdvancedSector}
        onPromote={() => setRegisterOpen(true)}
      />

      {error && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ background: 'rgba(244,63,94,0.1)', border: `1px solid ${C.rose}`, color: C.rose, padding: 12, borderRadius: 8, fontSize: 14 }}>
            {error}
          </div>
        </div>
      )}

      {/* AI Context badge */}
      {aiContext && results && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, color: C.textDim }}>
            <span style={{ background: C.card, padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.border}` }}>
              <Sparkles size={12} style={{ verticalAlign: -2, marginRight: 4, color: C.emerald }} />
              {aiContext.intention}
            </span>
            {aiContext.city && (
              <span style={{ background: C.card, padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.border}` }}>
                <MapPin size={12} style={{ verticalAlign: -2, marginRight: 4, color: C.gold }} />
                {aiContext.city}
              </span>
            )}
            {aiContext.sector && (
              <span style={{ background: C.card, padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.border}` }}>
                {aiContext.sector}
              </span>
            )}
            {aiContext.category && (
              <span style={{ background: C.card, padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.border}`, color: C.emerald }}>
                {aiContext.category}
              </span>
            )}
          </div>
        </div>
      )}

      <Results
        loading={loading}
        results={results}
        query={query}
        onOpen={(r) => {
          setSelectedResult(r)
          setDetailOpen(true)
        }}
      />

      <HowItWorks onPromote={() => setRegisterOpen(true)} />

      {!subscribed && <DimaPlusCTA onSubscribe={() => doSubscribe} onOpenPlans={() => setSubscribeOpen(true)} />}

      <Footer />

      {detailOpen && selectedResult && (
        <DetailDialog
          result={selectedResult}
          onClose={() => setDetailOpen(false)}
          onOpenLogin={() => setLoginOpen(true)}
        />
      )}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={() => {
            setLoginOpen(false)
            refreshSubscription()
          }}
        />
      )}

      {userRegisterOpen && (
        <UserRegisterModal
          onClose={() => setUserRegisterOpen(false)}
          onSuccess={() => {
            setUserRegisterOpen(false)
            setLoginOpen(true)
          }}
        />
      )}

      {subscribeOpen && (
        <SubscribeDialog
          annual={annualBilling}
          setAnnual={setAnnualBilling}
          loading={subscribeLoading}
          onClose={() => setSubscribeOpen(false)}
          onConfirm={doSubscribe}
        />
      )}

      {registerOpen && (
        <RegisterSupplierDialogBody
          onClose={() => setRegisterOpen(false)}
          onGoLogin={() => {
            setRegisterOpen(false)
            setLoginOpen(true)
          }}
        />
      )}

      <style jsx global>{`
        @keyframes dima-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes dima-wave {
          0% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes dima-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dima-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ============ NAVBAR ============
function Navbar({
  userName, isAuth, installable, onInstall, onLogin, onRegister, onLogout, onPromote,
}: {
  userName?: string
  isAuth: boolean
  installable: boolean
  onInstall: () => void
  onLogin: () => void
  onRegister: () => void
  onLogout: () => void
  onPromote: () => void
}) {
  const goPortal = () => (window.location.href = '/')
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button onClick={goPortal} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.text, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', system-ui, sans-serif" }}>
          <span>Dima</span>
          <span style={{ color: C.emerald, fontSize: 28, lineHeight: 1 }}>.</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={onPromote}
            style={{
              background: C.emerald, color: '#0B1120', border: 'none',
              padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: `0 4px 14px ${C.emerald}33`,
            }}
          >
            <Store size={14} /> Quiero promocionar mi empresa
          </button>
          {installable && (
            <button onClick={onInstall} style={{ background: C.emerald, color: '#0B1120', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Instalar app
            </button>
          )}
          {isAuth ? (
            <button onClick={onLogout} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserIcon size={14} /> {userName?.split(' ')[0] || 'Yo'}
            </button>
          ) : (
            <>
              <button onClick={onRegister} style={{ background: 'transparent', color: C.emerald, border: `1px solid ${C.emerald}`, padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={14} /> Registrarme
              </button>
              <button onClick={onLogin} style={{ background: C.emerald, color: '#0B1120', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogIn size={14} /> Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ============ HERO ============
function Hero(props: any) {
  const {
    query, setQuery, onSearch, loading, listening, voiceSupported, onMic,
    onSuggestion, advancedOpen, setAdvancedOpen, advancedCity, setAdvancedCity,
    advancedSector, setAdvancedSector, onPromote,
  } = props

  return (
    <section style={{ position: 'relative', padding: '48px 16px 32px', overflow: 'hidden' }}>
      {/* Glow background */}
      <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: `radial-gradient(circle, ${C.emerald}22 0%, transparent 60%)`, pointerEvents: 'none' }} />
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        {/* Robot avatar */}
        <div style={{ width: 96, height: 96, margin: '0 auto 20px', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 24, background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.emeraldDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${C.emerald}55` }}>
            <Bot size={48} color="#0B1120" />
          </div>
          <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%', background: C.gold, boxShadow: `0 0 12px ${C.gold}` }} />
        </div>

        <h1 style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: -1 }}>
          Hola, soy Dima <span style={{ fontSize: '0.85em' }}>🤖</span>
        </h1>
        <p style={{ color: C.textDim, fontSize: 16, margin: '0 0 28px', fontWeight: 500 }}>
          Escanea y habla con Dima
        </p>

        {/* Mic button */}
        <button
          onClick={voiceSupported ? onMic : undefined}
          disabled={!voiceSupported}
          style={{
            width: 120, height: 120, borderRadius: '50%', border: 'none', cursor: voiceSupported ? 'pointer' : 'not-allowed',
            background: listening ? C.gold : C.emerald,
            boxShadow: listening ? `0 0 40px ${C.gold}77` : `0 8px 28px ${C.emerald}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative',
            transition: 'all 0.2s',
          }}
          aria-label={listening ? 'Detener escucha' : 'Hablar con Dima'}
        >
          {listening && (
            <>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${C.gold}`, animation: 'dima-wave 1.4s ease-out infinite' }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${C.gold}`, animation: 'dima-wave 1.4s ease-out 0.5s infinite' }} />
            </>
          )}
          {listening ? <MicOff size={48} color="#0B1120" /> : <Mic size={48} color="#0B1120" />}
        </button>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 24 }}>
          {listening ? 'Escuchando… habla ahora' : voiceSupported ? 'Toca el micrófono y habla' : 'Tu navegador no soporta voz. Escribe tu búsqueda.'}
        </p>

        {/* Search input */}
        <form
          onSubmit={(e) => { e.preventDefault(); onSearch() }}
          style={{ display: 'flex', gap: 8, marginBottom: 12 }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Estoy en el centro de Quito y busco mayoristas de bazar y papelería"
            style={{
              flex: 1, height: 52, padding: '0 16px', borderRadius: 12,
              background: C.card, border: `1px solid ${C.border}`, color: C.text,
              fontSize: 15, outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.emerald)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              height: 52, padding: '0 22px', borderRadius: 12,
              background: C.emerald, color: '#0B1120', border: 'none',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading ? <Loader2 size={18} className="dima-spin" /> : <Search size={18} />}
            <span>Buscar</span>
          </button>
        </form>

        {/* Advanced search toggle */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}
        >
          <ChevronDown size={14} style={{ transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          Búsqueda avanzada
        </button>

        {advancedOpen && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'dima-fade 0.2s' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Ciudad</label>
              <input
                type="text"
                value={advancedCity}
                onChange={(e) => setAdvancedCity(e.target.value)}
                placeholder="Quito, Guayaquil…"
                style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Sector</label>
              <input
                type="text"
                value={advancedSector}
                onChange={(e) => setAdvancedSector(e.target.value)}
                placeholder="Centro, Norte…"
                style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Quick suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              style={{
                background: C.card, color: C.textDim, border: `1px solid ${C.border}`,
                padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.emerald; e.currentTarget.style.color = C.text }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* CTA proveedor */}
        <div style={{
          marginTop: 32, padding: 20, borderRadius: 16,
          background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
          border: `1px solid ${C.border}`,
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.emerald}22`, color: C.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>
                ¿Tienes un negocio?
              </p>
              <p style={{ margin: '4px 0 12px', fontSize: 13, color: C.textDim, lineHeight: 1.45 }}>
                Únete como proveedor y llega a miles de personas que buscan con Dima.
              </p>
              <button
                onClick={onPromote}
                style={{
                  background: C.emerald, color: '#0B1120', border: 'none',
                  padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: `0 6px 16px ${C.emerald}33`,
                }}
              >
                <Store size={16} /> Quiero promocionar mi empresa
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ RESULTS ============
function Results({ loading, results, query, onOpen }: any) {
  if (loading) {
    return (
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: C.emerald, fontSize: 16, fontWeight: 600 }}>
          <Loader2 size={20} className="dima-spin" />
          Dima está buscando…
        </div>
        <div style={{ marginTop: 16, color: C.textDim, fontSize: 13 }}>
          {query ? `Analizando: "${query}"` : 'Buscando proveedores cerca de ti…'}
        </div>
      </section>
    )
  }

  if (!results) return null

  if (results.length === 0) {
    return (
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={32} color={C.muted} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Dima no encontró nada para "{query}".</p>
        <p style={{ color: C.textDim, fontSize: 14 }}>Intenta con otras palabras.</p>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>
      <p style={{ color: C.textDim, fontSize: 13, marginBottom: 12 }}>
        {results.length} resultado{results.length === 1 ? '' : 's'} para "{query}"
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((r: SearchResult, i: number) => (
          <ResultCard key={`${r.type}-${r.id}-${i}`} result={r} onOpen={() => onOpen(r)} />
        ))}
      </div>
    </section>
  )
}

function ResultCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const typeConfig = {
    SUPPLIER: { label: 'PROVEEDOR', color: C.emerald, icon: <Store size={16} /> },
    PRODUCT: { label: 'PRODUCTO', color: C.gold, icon: <Package size={16} /> },
    CATEGORY: { label: 'CATEGORÍA', color: C.amber, icon: <ShoppingBag size={16} /> },
  }[result.type]

  return (
    <div
      onClick={onOpen}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 16, cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.emerald; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none' }}
    >
      {result.isPremium && (
        <div style={{ position: 'absolute', top: 0, right: 12, transform: 'translateY(-50%)', background: C.gold, color: '#0B1120', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
          ★ Premium
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {result.imageUrl ? (
          <img src={result.imageUrl} alt={result.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 10, background: C.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
            {typeConfig.icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ background: `${typeConfig.color}22`, color: typeConfig.color, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {typeConfig.icon}
              {typeConfig.label}
            </span>
            {result.rating > 0 && (
              <span style={{ color: C.gold, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <Star size={12} fill={C.gold} /> {result.rating.toFixed(1)}
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {result.name}
          </h3>
          {result.description && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textDim, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {result.description}
            </p>
          )}
          {(result.city || result.sector) && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textDim, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} />
              {[result.city, result.sector].filter(Boolean).join(' · ')}
            </p>
          )}
          {result.matchedPhrases && result.matchedPhrases.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {result.matchedPhrases.slice(0, 3).map((p, i) => (
                <span key={i} style={{ background: `${C.emerald}18`, color: C.emerald, padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <button onClick={(e) => { e.stopPropagation(); onOpen() }} style={{ flex: 1, background: C.emerald, color: '#0B1120', border: 'none', padding: '8px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Ver detalles
        </button>
        {/* CAMBIO: acceso directo al storefront del proveedor en /proveedor/[id]
            sin necesidad de abrir el modal. */}
        {(() => {
          const storeUrl =
            result.storeUrl ||
            (result.type === 'SUPPLIER' ? `/proveedor/${result.id}` : null) ||
            (result.supplierId ? `/proveedor/${result.supplierId}` : null)
          if (!storeUrl) return null
          return (
            <a
              href={storeUrl}
              onClick={(e) => e.stopPropagation()}
              style={{ background: `${C.emerald}22`, color: C.emerald, border: `1px solid ${C.emerald}55`, padding: '8px 12px', borderRadius: 8, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
            >
              <Store size={14} /> Tienda
            </a>
          )
        })()}
        {result.whatsapp && (
          <a
            href={`https://wa.me/${result.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.card2, color: C.text, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 8, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
        {result.phone && (
          <a
            href={`tel:${result.phone}`}
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.card2, color: C.text, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 8, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Phone size={14} /> Llamar
          </a>
        )}
      </div>
    </div>
  )
}

// ============ DETAIL DIALOG ============
function DetailDialog({
  result,
  onClose,
  onOpenLogin,
}: {
  result: SearchResult
  onClose: () => void
  onOpenLogin: () => void
}) {
  const { status } = useSession()
  const isAuth = status === 'authenticated'
  const supplierId =
    result.supplierId || (result.type === 'SUPPLIER' ? result.id : null)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{result.name}</h3>
          <button onClick={onClose} style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {result.imageUrl && (
            <img src={result.imageUrl} alt={result.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
          )}
          {result.description && <p style={{ color: C.textDim, fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>{result.description}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <Info icon={<MapPin size={14} />} label="Ciudad" value={result.city || '—'} />
            <Info icon={<Navigation size={14} />} label="Sector" value={result.sector || '—'} />
            <Info icon={<Building2 size={14} />} label="Dirección" value={result.address || '—'} />
            <Info icon={<Phone size={14} />} label="Teléfono" value={result.phone || '—'} />
          </div>
          {result.branch && (
            <div style={{ marginTop: 16, padding: 12, background: C.card2, borderRadius: 8, fontSize: 13 }}>
              <p style={{ margin: 0, color: C.emerald, fontWeight: 600, marginBottom: 4, fontSize: 12 }}>
                <Store size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                {result.branch.name}
              </p>
              <p style={{ margin: 0, color: C.textDim }}>{result.branch.address}, {result.branch.city}</p>
            </div>
          )}
          {/* Map placeholder */}
          <div style={{ marginTop: 16, height: 180, borderRadius: 12, background: `linear-gradient(135deg, ${C.card2} 0%, ${C.border} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(0,212,170,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.08) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
            <div style={{ textAlign: 'center', position: 'relative' }}>
              <MapPin size={28} color={C.emerald} style={{ margin: '0 auto' }} />
              <p style={{ margin: '6px 0 0', color: C.textDim, fontSize: 12 }}>Mapa de {result.city || 'ubicación'}</p>
            </div>
          </div>
          {result.matchedPhrases && result.matchedPhrases.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>Frases de posicionamiento</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.matchedPhrases.map((p, i) => (
                  <span key={i} style={{ background: `${C.emerald}18`, color: C.emerald, padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sección Reseñas */}
          {supplierId && (
            <ReviewsSection
              supplierId={supplierId}
              isAuth={isAuth}
              onOpenLogin={onOpenLogin}
            />
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {/* CAMBIO: botón "Ir a la tienda" funcional.
                Antes tenía href="/" + e.preventDefault() → enlace muerto.
                Ahora apunta al storefront público del proveedor en /proveedor/[id]. */}
            {(() => {
              const storeUrl =
                result.storeUrl ||
                (result.type === 'SUPPLIER' ? `/proveedor/${result.id}` : null) ||
                (result.supplierId ? `/proveedor/${result.supplierId}` : null)
              if (!storeUrl) return null
              return (
                <a
                  href={storeUrl}
                  style={{ flex: 1, background: C.emerald, color: '#0B1120', padding: 12, borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Store size={16} /> Ir a la tienda
                </a>
              )
            })()}
            {result.whatsapp && (
              <a href={`https://wa.me/${result.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: C.card2, color: C.text, border: `1px solid ${C.border}`, padding: '12px 16px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ REVIEWS SECTION (dentro del DetailDialog) ============
interface ReviewItem {
  id: string
  rating: number
  title: string | null
  comment: string | null
  customerName: string
  customerEmail: string | null
  response: string | null
  respondedAt: string | null
  source: string
  createdAt: string
  user: { id: string; name: string; avatarUrl: string | null } | null
}

interface ReviewsStats {
  average: number
  total: number
  distribution: Record<number, number>
}

function ReviewsSection({
  supplierId,
  isAuth,
  onOpenLogin,
}: {
  supplierId: string
  isAuth: boolean
  onOpenLogin: () => void
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState<ReviewsStats | null>(null)
  // loading inicializa en true (al montar). En refresh (refreshKey++) NO se
  // resetea a true para evitar setState síncrono en el effect — simplemente
  // se mantiene la data anterior hasta que llegue la nueva.
  const [loading, setLoading] = useState(true)
  const [writeOpen, setWriteOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    fetch(`/api/dima/reviews?supplierId=${encodeURIComponent(supplierId)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d && d.ok) {
          setReviews(d.reviews || [])
          setStats(d.stats || null)
        } else {
          setReviews([])
          setStats(null)
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return
        setReviews([])
        setStats(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [supplierId, refreshKey])

  const onWrite = () => {
    if (!isAuth) {
      toast.info('Inicia sesión para dejar tu reseña', {
        action: { label: 'Iniciar sesión', onClick: onOpenLogin },
      })
      return
    }
    setWriteOpen(true)
  }

  const refresh = () => setRefreshKey((k) => k + 1)

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Star size={16} color={C.gold} fill={C.gold} /> Reseñas
        </h4>
        <button
          onClick={onWrite}
          style={{
            background: C.emerald, color: '#0B1120', border: 'none',
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Send size={14} /> Dejar reseña
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textDim, fontSize: 13, padding: '12px 0' }}>
          <Loader2 size={14} className="dima-spin" /> Cargando reseñas…
        </div>
      ) : stats && stats.total > 0 ? (
        <ReviewsSummary stats={stats} />
      ) : (
        <p style={{ color: C.textDim, fontSize: 13, margin: '0 0 12px' }}>
          Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!
        </p>
      )}

      {/* Lista de las últimas 5 reseñas */}
      {!loading && reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {reviews.slice(0, 5).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {writeOpen && (
        <WriteReviewDialogBody
          supplierId={supplierId}
          onClose={() => setWriteOpen(false)}
          onPublished={() => {
            setWriteOpen(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function ReviewsSummary({ stats }: { stats: ReviewsStats }) {
  const dist = stats.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  const total = stats.total || 0
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', minWidth: 90 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.text, lineHeight: 1 }}>
          {stats.average.toFixed(1)}
        </div>
        <StarsBar rating={stats.average} size={16} />
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
          {total} reseña{total === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = dist[star] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 28, color: C.textDim, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                {star} <Star size={11} color={C.gold} fill={C.gold} />
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 4, background: C.card2, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: C.gold, borderRadius: 4 }} />
              </div>
              <span style={{ width: 32, textAlign: 'right', color: C.muted }}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div style={{ background: C.card2, borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.emeraldDark} 100%)`,
            color: '#0B1120', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden
        >
          {initials(review.customerName || review.user?.name || '?')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {review.customerName || review.user?.name || 'Cliente'}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
            {timeAgo(review.createdAt)}
          </p>
        </div>
        <StarsBar rating={review.rating} size={13} />
      </div>
      {review.title && (
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: C.text }}>
          {review.title}
        </p>
      )}
      {review.comment && (
        <p style={{ margin: 0, fontSize: 13, color: C.textDim, lineHeight: 1.5, display: 'flex', gap: 6 }}>
          <Quote size={14} color={C.muted} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{review.comment}</span>
        </p>
      )}
      {review.response && review.response.trim() !== '' && (
        <div style={{ marginTop: 8, padding: 10, background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <p style={{ margin: 0, fontSize: 11, color: C.emerald, fontWeight: 600, marginBottom: 2 }}>
            <MessageCircle size={11} style={{ verticalAlign: -2, marginRight: 4 }} />
            Respuesta de la empresa
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textDim, lineHeight: 1.45 }}>
            {review.response}
          </p>
        </div>
      )}
    </div>
  )
}

// ============ WRITE REVIEW DIALOG BODY ============
function WriteReviewDialogBody({
  supplierId,
  onClose,
  onPublished,
}: {
  supplierId: string
  onClose: () => void
  onPublished: () => void
}) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Selecciona una calificación de 1 a 5 estrellas')
      return
    }
    if (!comment.trim()) {
      setError('Escribe un comentario para tu reseña')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/dima/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      })
      const d = await res.json()
      if (!res.ok || !d.ok) {
        throw new Error(d?.error || 'Error al enviar la reseña')
      }
      toast.success(d.message || '¡Reseña publicada!')
      onPublished()
    } catch (e: any) {
      setError(e?.message || 'Error al enviar la reseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, maxWidth: 460, width: '100%', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Dejar reseña</h3>
          <button onClick={onClose} style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 8 }}>
            Tu calificación
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <StarsBar rating={rating} interactive onChange={setRating} size={32} />
          </div>
          {rating > 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>
              {['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'][rating]}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>
            Título (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 120))}
            placeholder="Ej: Excelente atención y productos"
            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>
            Tu comentario
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 2000))}
            placeholder="Cuéntale a la comunidad tu experiencia con este proveedor…"
            rows={4}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none', resize: 'vertical' }}
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted, textAlign: 'right' }}>
            {comment.length}/2000
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: `1px solid ${C.rose}`, color: C.rose, padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting || rating < 1}
          style={{
            width: '100%', background: C.emerald, color: '#0B1120', border: 'none',
            padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: submitting || rating < 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: submitting || rating < 1 ? 0.6 : 1,
          }}
        >
          {submitting ? <Loader2 size={16} className="dima-spin" /> : <Send size={16} />}
          Publicar reseña
        </button>
      </div>
    </div>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: C.card2, padding: 10, borderRadius: 8 }}>
      <p style={{ margin: 0, color: C.muted, fontSize: 11, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </p>
      <p style={{ margin: 0, color: C.text, fontSize: 13, fontWeight: 500 }}>{value}</p>
    </div>
  )
}

// ============ HOW IT WORKS ============
function HowItWorks({ onPromote }: { onPromote: () => void }) {
  const steps = [
    { icon: <QrCode size={28} />, title: 'Escanea el QR', text: 'Escanea el QR de cualquier bolso, imán o calendario POP de Dima.' },
    { icon: <Mic size={28} />, title: 'Habla o escribe', text: 'Dime qué buscas. Por voz o texto, en lenguaje natural.' },
    { icon: <Store size={28} />, title: 'Conéctate', text: 'Dima te conecta con proveedores cerca de ti en segundos.' },
  ]
  return (
    <section style={{ maxWidth: 920, margin: '0 auto', padding: '48px 16px' }}>
      <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', system-ui, sans-serif", marginBottom: 8 }}>
        ¿Cómo funciona Dima?
      </h2>
      <p style={{ textAlign: 'center', color: C.textDim, marginBottom: 32 }}>
        Tres pasos. Cero fricción.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -14, left: 16, width: 28, height: 28, borderRadius: '50%', background: C.emerald, color: '#0B1120', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {i + 1}
            </div>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${C.emerald}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.emerald, marginBottom: 14, marginTop: 8 }}>
              {s.icon}
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{s.title}</h3>
            <p style={{ margin: 0, color: C.textDim, fontSize: 13, lineHeight: 1.5 }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* CTA ¿Tienes un negocio? */}
      <div style={{
        marginTop: 24,
        background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 14,
        padding: 20,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: C.emerald, color: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Briefcase size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: 16 }}>
            ¿Tienes un negocio?
          </p>
          <p style={{ margin: '4px 0 0', color: C.textDim, fontSize: 13, lineHeight: 1.5 }}>
            Únete como proveedor y llega a miles de personas que buscan con Dima.
          </p>
        </div>
        <button
          onClick={onPromote}
          style={{
            background: C.emerald, color: '#0B1120', border: 'none',
            padding: '12px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: `0 6px 16px ${C.emerald}33`,
            flexShrink: 0,
          }}
        >
          <Store size={16} /> Quiero promocionar mi empresa
        </button>
      </div>

      <div style={{ marginTop: 16, background: `${C.emerald}11`, border: `1px solid ${C.emerald}33`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: C.emerald, color: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={18} />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: C.text, fontSize: 14 }}>¿Eres proveedor?</p>
          <p style={{ margin: '4px 0 0', color: C.textDim, fontSize: 13 }}>
            Compra frases de posicionamiento para aparecer primero en las búsquedas de Dima. Solo <strong style={{ color: C.emerald }}>$1/mes</strong> cada frase extra.
          </p>
        </div>
      </div>
    </section>
  )
}

// ============ DIMA PLUS CTA ============
function DimaPlusCTA({ onSubscribe, onOpenPlans }: { onSubscribe: () => void; onOpenPlans: () => void }) {
  const benefits = [
    { icon: <Search size={16} />, text: 'Búsquedas ilimitadas' },
    { icon: <TrendingUp size={16} />, text: '$20/mes se registran como aporte de capital; el rendimiento varía según el resultado de la cooperativa' },
    { icon: <Users size={16} />, text: 'Puedes armar tu red de afiliados' },
    { icon: <Wallet size={16} />, text: 'Gana $5 + $2/mes por cada referido que descargue la app' },
    { icon: <Award size={16} />, text: 'Dima Stars: cashback por cada compra' },
  ]
  return (
    <section style={{ maxWidth: 920, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ position: 'relative', borderRadius: 20, padding: 32, background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.gold} 100%)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(11,17,32,0.25)', color: '#0B1120', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
            <Sparkles size={12} /> Dima Plus
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, color: '#0B1120', fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: -1 }}>
            Dima Plus — $20/mes
          </h2>
          <p style={{ margin: '0 0 24px', color: 'rgba(11,17,32,0.85)', fontSize: 16, fontWeight: 500 }}>
            Tu pago se registra como aporte de capital. El rendimiento es variable y no está garantizado.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {benefits.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#0B1120' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: C.emerald, color: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {b.icon}
                  </span>
                  <span style={{ paddingTop: 4 }}>{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button onClick={onOpenPlans} style={{ background: '#0B1120', color: C.emerald, border: 'none', padding: '14px 28px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Suscribirme a Dima Plus
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#0B1120', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" onChange={(e) => { if (e.target.checked) onOpenPlans() }} style={{ width: 18, height: 18 }} />
              Pago anual $200 (ahorra $40)
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px 16px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ marginBottom: 8 }}>
          <strong style={{ color: C.text }}>Dima</strong> — Robot buscador con voz · DimarClub
        </p>
        <p>Escanea y habla con Dima. Conectamos comunidad y proveedores en Ecuador.</p>
        <button onClick={() => (window.location.href = '/')} style={{ marginTop: 12, background: 'none', border: `1px solid ${C.border}`, color: C.textDim, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Home size={12} /> Volver al portal
        </button>
      </div>
    </footer>
  )
}

// ============ LOGIN MODAL ============
function LoginModal({ onClose, onLoginSuccess }: { onClose: () => void; onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!email || !password) { setError('Email y contraseña requeridos'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (!res || res.error) {
        setError('Credenciales inválidas')
        return
      }
      onLoginSuccess()
    } catch {
      setError('Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, maxWidth: 400, width: '100%', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Iniciar sesión</h3>
          <button onClick={onClose} style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 16 }}>
          Inicia sesión para suscribirte a Dima Plus y construir tu red de afiliados.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.com" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
          </div>
          {error && <p style={{ margin: 0, color: C.rose, fontSize: 13 }}>{error}</p>}
          <button onClick={submit} disabled={loading} style={{ background: C.emerald, color: '#0B1120', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading && <Loader2 size={16} className="dima-spin" />}
            Iniciar sesión
          </button>
          <p style={{ textAlign: 'center', color: C.textDim, fontSize: 12, marginTop: 8 }}>
            ¿No tienes cuenta?{' '}
            <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/?register=1' }} style={{ color: C.emerald, textDecoration: 'none' }}>
              Regístrate en el portal →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============ USER REGISTER MODAL ============
function UserRegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [sponsorCode, setSponsorCode] = useState('')
  const [plan, setPlan] = useState<'FREE' | 'PLUS'>('FREE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim()) return setError('Tu nombre es obligatorio')
    if (!email.trim()) return setError('Email es obligatorio')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    setLoading(true)
    setError(null)
    try {
      // 1. Crear cuenta
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'CLIENT',
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          sponsorCode: sponsorCode.trim() || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok || d.error) {
        throw new Error(d?.error || 'Error al crear la cuenta')
      }

      // 2. Si eligió Plus, suscribir automáticamente
      if (plan === 'PLUS') {
        await fetch('/api/dima/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: 'PLUS',
            billingCycle: 'MONTHLY',
            referredBy: sponsorCode.trim() || undefined,
          }),
        }).catch(() => {}) // no bloquear si falla
      }

      toast.success('¡Cuenta creada! Inicia sesión para continuar.')
      onSuccess()
    } catch (e: any) {
      setError(e?.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, maxWidth: 480, width: '100%', padding: 24, margin: 'auto 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} color={C.emerald} /> Crear cuenta
          </h3>
          <button onClick={onClose} style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 16 }}>
          Únete a Dima y empieza a buscar, ahorrar y ganar.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Plan selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 6 }}>Elige tu plan</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPlan('FREE')}
                style={{
                  background: plan === 'FREE' ? C.card2 : 'transparent',
                  border: `1px solid ${plan === 'FREE' ? C.emerald : C.border}`,
                  borderRadius: 8, padding: 12, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Dima Free</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.emerald }}>$0/mes</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Búsquedas libres</div>
              </button>
              <button
                type="button"
                onClick={() => setPlan('PLUS')}
                style={{
                  background: plan === 'PLUS' ? C.card2 : 'transparent',
                  border: `1px solid ${plan === 'PLUS' ? C.emerald : C.border}`,
                  borderRadius: 8, padding: 12, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Dima Plus</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.emerald }}>$20/mes</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>+ Aporte de capital + red de afiliados</div>
              </button>
            </div>
          </div>
          {/* Datos */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Nombre completo *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.com" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Teléfono</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="099 123 4567" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Ciudad</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Quito" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Contraseña *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4 }}>Código de referido (opcional)</label>
            <input value={sponsorCode} onChange={(e) => setSponsorCode(e.target.value)} placeholder="Ej: DIMAR-001" style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' }} />
          </div>
          {error && <p style={{ margin: 0, color: C.rose, fontSize: 13 }}>{error}</p>}
          <button onClick={submit} disabled={loading} style={{ background: C.emerald, color: '#0B1120', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading && <Loader2 size={16} className="dima-spin" />}
            Crear cuenta {plan === 'PLUS' ? '(Dima Plus $20/mes)' : '(Gratis)'}
          </button>
          {plan === 'PLUS' && (
            <p style={{ textAlign: 'center', color: C.emerald, fontSize: 11, marginTop: 4 }}>
              💚 Tu pago mensual de $20 es aporte de capital (rendimiento variable) + accedes a la red de afiliados
            </p>
          )}
          <p style={{ textAlign: 'center', color: C.textDim, fontSize: 12, marginTop: 4 }}>
            ¿Ya tienes cuenta?{' '}
            <a onClick={onClose} style={{ color: C.emerald, textDecoration: 'none', cursor: 'pointer' }}>
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============ SUBSCRIBE DIALOG ============
function SubscribeDialog({
  annual, setAnnual, loading, onClose, onConfirm,
}: {
  annual: boolean
  setAnnual: (v: boolean) => void
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const amount = annual ? 200 : 20
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, maxWidth: 460, width: '100%', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Suscripción Dima Plus</h3>
          <button onClick={onClose} style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ background: C.card2, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: C.textDim, fontSize: 13 }}>Plan</span>
            <span style={{ background: `${C.emerald}22`, color: C.emerald, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Dima Plus</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: C.textDim, fontSize: 13 }}>Ciclo</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setAnnual(false)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${annual ? C.border : C.emerald}`, background: annual ? 'transparent' : C.emerald, color: annual ? C.textDim : '#0B1120', fontWeight: 600 }}>
                Mensual $20
              </button>
              <button onClick={() => setAnnual(true)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${annual ? C.emerald : C.border}`, background: annual ? C.emerald : 'transparent', color: annual ? '#0B1120' : C.textDim, fontWeight: 600 }}>
                Anual $200
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
            <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Total a pagar</span>
            <span style={{ color: C.emerald, fontSize: 18, fontWeight: 800 }}>{fmtUsd(amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.textDim, fontSize: 12 }}>Rendimiento del aporte</span>
            <span style={{ color: C.gold, fontSize: 13, fontWeight: 700 }}>Variable</span>
          </div>
        </div>
        <div style={{ background: `${C.emerald}11`, border: `1px solid ${C.emerald}33`, borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 12, color: C.textDim }}>
          <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 4, color: C.emerald }} />
          Este pago se registra como aporte de capital. El rendimiento depende del resultado publicado de la cooperativa y no está garantizado.
        </div>
        <button onClick={onConfirm} disabled={loading} style={{ width: '100%', background: C.emerald, color: '#0B1120', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <Loader2 size={16} className="dima-spin" /> : <Zap size={16} />}
          Pagar {fmtUsd(amount)} y activar
        </button>
      </div>
    </div>
  )
}

// ============ REGISTER SUPPLIER DIALOG BODY ============
const SUPPLIER_CATEGORIES = [
  'Bazar',
  'Papelería',
  'Cosméticos',
  'Juguetes',
  'Electrónica',
  'Ropa',
  'Comida',
  'Restaurantes',
  'Servicios',
  'Otro',
] as const

function RegisterSupplierDialogBody({
  onClose,
  onGoLogin,
}: {
  onClose: () => void
  onGoLogin: () => void
}) {
  // ---- State del formulario (se inicializa fresco cada vez que se monta) ----
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<string>('Bazar')
  const [branchName, setBranchName] = useState('Matriz')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchPhone, setBranchPhone] = useState('')
  const [phrases, setPhrases] = useState<string[]>(['', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 12px', borderRadius: 8,
    background: C.card2, border: `1px solid ${C.border}`, color: C.text,
    fontSize: 14, outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, color: C.textDim, marginBottom: 4,
  }
  const sectionTitleStyle: React.CSSProperties = {
    margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: C.text,
    display: 'flex', alignItems: 'center', gap: 6,
  }

  const setPhrase = (i: number, v: string) => {
    setPhrases((prev) => prev.map((p, idx) => (idx === i ? v : p)))
  }

  const submit = async () => {
    setError(null)

    if (!name.trim()) return setError('Tu nombre es obligatorio')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Email inválido')
    }
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }
    if (!companyName.trim()) return setError('El nombre de la empresa es obligatorio')
    if (!city.trim()) return setError('La ciudad es obligatoria')

    setSubmitting(true)
    try {
      // Unificado: usa el mismo endpoint que el login-dialog del portal
      // /api/auth/register acepta branches[] como array de objetos
      const branches = []
      const branchNameVal = branchName.trim() || 'Matriz'
      const branchAddressVal = branchAddress.trim() || address.trim()
      const branchPhoneVal = branchPhone.trim() || phone.trim()
      if (branchNameVal || branchAddressVal) {
        branches.push({
          name: branchNameVal || 'Matriz',
          city: city.trim(),
          sector: sector.trim() || null,
          address: branchAddressVal || address.trim() || 'Por completar',
          phone: branchPhoneVal || null,
          isMain: true,
        })
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'SUPPLIER',
          phone: phone.trim() || undefined,
          city: city.trim(),
          companyName: companyName.trim(),
          address: address.trim() || undefined,
          category,
          branches,
          phrases: phrases.map((p) => p.trim()).filter(Boolean),
        }),
      })
      const d = await res.json()
      if (!res.ok || d.error) {
        throw new Error(d?.error || 'Error al registrar la cuenta')
      }
      toast.success('¡Cuenta creada! Inicia sesión para continuar.')
      onClose()
      onGoLogin()
    } catch (e: any) {
      const msg = e?.message || 'Error al registrar la cuenta'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '92vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: C.card, borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.emerald, color: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Deseo ser proveedor</h3>
              <p style={{ margin: 0, fontSize: 12, color: C.textDim }}>Únete a Dima y llega a miles de compradores</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sección: Tus datos */}
          <div>
            <h4 style={sectionTitleStyle}><UserIcon size={14} color={C.emerald} /> Tus datos</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: María Pérez" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Teléfono</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="099 123 4567" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Sección: Datos de tu empresa */}
          <div>
            <h4 style={sectionTitleStyle}><Building2 size={14} color={C.emerald} /> Datos de tu empresa</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nombre de la empresa *</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ej: Importadora Andina" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ciudad *</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Quito, Guayaquil…" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sector</label>
                <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Centro, Norte…" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Dirección</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Amazonas N34-451" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...inputStyle, height: 40, appearance: 'none', cursor: 'pointer' }}
                >
                  {SUPPLIER_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Sucursal principal */}
          <div>
            <h4 style={sectionTitleStyle}><Store size={14} color={C.emerald} /> Sucursal principal</h4>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: C.muted }}>
              Si dejas los campos en blanco, se usarán los datos de tu empresa.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Nombre sucursal</label>
                <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Matriz" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono sucursal</label>
                <input value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} placeholder="(igual al teléfono)" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Dirección sucursal</label>
                <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="(igual a la dirección de la empresa)" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Sección: Frases de posicionamiento */}
          <div>
            <h4 style={sectionTitleStyle}><Search size={14} color={C.emerald} /> Frases de posicionamiento (5 incluidas gratis)</h4>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
              Estas frases harán que tu empresa aparezca cuando alguien busque estos términos en Dima.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {phrases.map((p, i) => (
                <input
                  key={i}
                  value={p}
                  onChange={(e) => setPhrase(i, e.target.value)}
                  placeholder={`Frase ${i + 1} · Ej: importadores mayoristas de bazar y papelería`}
                  style={inputStyle}
                />
              ))}
            </div>
          </div>

          {/* Sección: Plan */}
          <div>
            <h4 style={sectionTitleStyle}><Sparkles size={14} color={C.emerald} /> Tu plan</h4>
            <div style={{ background: `linear-gradient(135deg, ${C.emerald} 0%, ${C.emeraldDark} 100%)`, color: '#0B1120', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>Plan Starter</span>
                <span style={{ background: '#0B1120', color: C.emerald, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>GRATIS</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, fontWeight: 500 }}>
                Tu plan incluye 5 frases de posicionamiento, sitio web básico (10 secciones) y todos los servicios digitales. Sin mensualidad.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(244,63,94,0.1)', border: `1px solid ${C.rose}`, color: C.rose, padding: 10, borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              width: '100%', background: C.emerald, color: '#0B1120', border: 'none',
              padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 6px 18px ${C.emerald}33`,
            }}
          >
            {submitting ? <Loader2 size={18} className="dima-spin" /> : <Send size={18} />}
            Crear cuenta de proveedor
          </button>

          <p style={{ textAlign: 'center', color: C.textDim, fontSize: 12, margin: 0 }}>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => { onClose(); onGoLogin() }}
              style={{ background: 'none', border: 'none', color: C.emerald, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
