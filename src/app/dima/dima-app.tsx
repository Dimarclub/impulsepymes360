'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  Mic, MicOff, Search, MapPin, Phone, MessageCircle, Star, X, Loader2,
  Sparkles, TrendingUp, Wallet, Users, Award, Download, ChevronRight,
  ChevronDown, Building2, Package, ShoppingBag, Store, Navigation,
  Zap, Bot, ArrowRight, Volume2, CheckCircle2, Copy, QrCode, Share2,
  User as UserIcon, LogIn, Home,
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
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [annualBilling, setAnnualBilling] = useState(false)
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
      alert(`¡Suscripción Dima Plus activa! Invertiste ${fmtUsd(annualBilling ? 200 : 20)} que generan 5% compuesto mensual.`)
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
        onLogout={() => signOut({ callbackUrl: '/dima' })}
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

      <HowItWorks />

      {!subscribed && <DimaPlusCTA onSubscribe={() => doSubscribe} onOpenPlans={() => setSubscribeOpen(true)} />}

      <Footer />

      {detailOpen && selectedResult && (
        <DetailDialog
          result={selectedResult}
          onClose={() => setDetailOpen(false)}
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

      {subscribeOpen && (
        <SubscribeDialog
          annual={annualBilling}
          setAnnual={setAnnualBilling}
          loading={subscribeLoading}
          onClose={() => setSubscribeOpen(false)}
          onConfirm={doSubscribe}
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
  userName, isAuth, installable, onInstall, onLogin, onLogout,
}: {
  userName?: string
  isAuth: boolean
  installable: boolean
  onInstall: () => void
  onLogin: () => void
  onLogout: () => void
}) {
  const goPortal = () => (window.location.href = '/')
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={goPortal} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.text, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', system-ui, sans-serif" }}>
          <span>Dima</span>
          <span style={{ color: C.emerald, fontSize: 28, lineHeight: 1 }}>.</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <button onClick={onLogin} style={{ background: 'transparent', color: C.emerald, border: `1px solid ${C.emerald}`, padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogIn size={14} /> Iniciar sesión
            </button>
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
    advancedSector, setAdvancedSector,
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
function DetailDialog({ result, onClose }: { result: SearchResult; onClose: () => void }) {
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
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <a href="/" onClick={(e) => e.preventDefault()} style={{ flex: 1, background: C.emerald, color: '#0B1120', padding: 12, borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Store size={16} /> Ir a la tienda
            </a>
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
function HowItWorks() {
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
      <div style={{ marginTop: 24, background: `${C.emerald}11`, border: `1px solid ${C.emerald}33`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
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
    { icon: <TrendingUp size={16} />, text: '$20/mes se invierten al 5% compuesto (no es gasto, es inversión)' },
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
            No es un gasto. Es una inversión que crece al 5% compuesto mensual.
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
  const projected = amount * Math.pow(1.05, 12)
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
            <span style={{ color: C.textDim, fontSize: 12 }}>Proyección a 12 meses (5% compuesto)</span>
            <span style={{ color: C.gold, fontSize: 13, fontWeight: 700 }}>{fmtUsd(projected)}</span>
          </div>
        </div>
        <div style={{ background: `${C.emerald}11`, border: `1px solid ${C.emerald}33`, borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 12, color: C.textDim }}>
          <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 4, color: C.emerald }} />
          Este pago se invierte al 5% mensual compuesto. No es un gasto: es capital que crece.
        </div>
        <button onClick={onConfirm} disabled={loading} style={{ width: '100%', background: C.emerald, color: '#0B1120', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <Loader2 size={16} className="dima-spin" /> : <Zap size={16} />}
          Pagar {fmtUsd(amount)} y activar
        </button>
      </div>
    </div>
  )
}
