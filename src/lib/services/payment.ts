// Servicio de pagos abstraído.
// Modo "test" (default): simula el pago exitoso.
// Modo "stripe": requiere STRIPE_SECRET_KEY y usa la API de Stripe.
// Para producción, configura las variables de entorno y cambia PAYMENT_PROVIDER=stripe.

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'succeeded' | 'failed'
  clientSecret?: string
}

export interface PaymentResult {
  success: boolean
  transactionId: string
  provider: string
  raw?: unknown
}

interface PaymentProvider {
  createIntent(amount: number, currency?: string, metadata?: Record<string, string>): Promise<PaymentIntent>
  confirm(paymentIntentId: string, paymentMethod?: string): Promise<PaymentResult>
}

// ---------- Test Provider (simulación) ----------
const TestProvider: PaymentProvider = {
  async createIntent(amount, currency = 'usd') {
    return {
      id: 'pi_test_' + Math.random().toString(36).slice(2, 12),
      amount,
      currency,
      status: 'requires_payment_method',
      clientSecret: 'pi_test_secret_' + Math.random().toString(36).slice(2, 12),
    }
  },
  async confirm(paymentIntentId) {
    // Simula latencia y éxito (95% éxito)
    await new Promise((r) => setTimeout(r, 800))
    const success = Math.random() > 0.05
    return {
      success,
      transactionId: paymentIntentId,
      provider: 'test',
    }
  },
}

// ---------- Stripe Provider (real, requiere STRIPE_SECRET_KEY) ----------
// Carga `stripe` dinámicamente en runtime para no romper el build si el
// paquete no está instalado (es una dependencia opcional).
async function loadStripeSdk(): Promise<any | null> {
  try {
    // `eval('require')` evita que Turbopack/Webpack resuelvan el módulo
    // estáticamente, permitiendo que la app compile sin `stripe` instalado.
    const runtimeRequire = eval('require') as NodeRequire
    return runtimeRequire('stripe')
  } catch {
    return null
  }
}

const StripeProvider: PaymentProvider = {
  async createIntent(amount, currency = 'usd', metadata) {
    const Stripe = await loadStripeSdk()
    if (!Stripe) throw new Error('Stripe SDK no disponible. Instala "stripe" y configura STRIPE_SECRET_KEY.')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as never })
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    })
    return {
      id: intent.id,
      amount,
      currency,
      status: intent.status as PaymentIntent['status'],
      clientSecret: intent.client_secret ?? undefined,
    }
  },
  async confirm(paymentIntentId) {
    const Stripe = await loadStripeSdk()
    if (!Stripe) throw new Error('Stripe SDK no disponible.')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as never })
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      success: intent.status === 'succeeded',
      transactionId: intent.id,
      provider: 'stripe',
      raw: intent,
    }
  },
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'test'
  if (provider === 'stripe' && process.env.STRIPE_SECRET_KEY) {
    return StripeProvider
  }
  return TestProvider
}

export const PAYMENT_PROVIDER_NAME = process.env.PAYMENT_PROVIDER === 'stripe' ? 'stripe' : 'test'
