// Tipos compartidos de Dimarclub

export type ModuleId =
  | 'marketplace'
  | 'dashboard'
  | 'affiliates'
  | 'suppliers'
  | 'partners'
  | 'logistics'
  | 'crm'
  | 'email'
  | 'ads'
  | 'applications'
  | 'benefits'
  | 'social'
  | 'social-studio'
  | 'social-bio'
  | 'social-automation'
  | 'impulse'
  | 'impulse-wizard'
  | 'web-express'
  | 'publibags'
  | 'bag-plan'
  | 'planes'
  | 'directorio'
  | 'fuerza'
  | 'automatizacion'
  | 'courier-app'
  | 'site-admin'
  | 'zones'
  | 'grid'
  | 'cooperativa'
  | 'supplier-backoffice'
  | 'affiliate-backoffice'
  | 'partner-backoffice'
  | 'alertas'
  | 'finanzas'

export type UserRole = 'CLIENT' | 'AFFILIATE' | 'SUPPLIER' | 'COURIER' | 'PARTNER' | 'ADMIN'

export interface DemoUser {
  id: string
  name: string
  email: string
  role: UserRole
  city?: string
  phone?: string
  affiliateCode?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  color?: string | null
  parentId?: string | null
  children?: Category[]
}

export interface Supplier {
  id: string
  companyName: string
  taxId?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  category?: string | null
  verified: boolean
  rating: number
  userId: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  longDescription?: string | null
  price: number
  compareAtPrice?: number | null
  stock: number
  sku?: string | null
  imageUrl?: string | null
  tags?: string | null
  categoryId: string
  supplierId: string
  rating: number
  reviewCount: number
  featured: boolean
  status: string
  category?: Category
  supplier?: Supplier
}

export interface CartLine {
  productId: string
  name: string
  price: number
  imageUrl?: string | null
  quantity: number
  supplierId: string
}

export interface Advertisement {
  id: string
  title: string
  imageUrl: string
  targetUrl?: string | null
  placement: string
  supplierId?: string | null
  startDate: string
  endDate: string
  status: string
  clicks: number
  impressions: number
  price: number
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  subtotal: number
  commission: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  shippingAddress?: string | null
  city?: string | null
  createdAt: string
  items?: OrderItem[]
  user?: { name: string; email: string }
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product?: { name: string; imageUrl?: string | null }
}

export interface AffiliateNode {
  id: string
  name: string
  email: string
  role: string
  city?: string | null
  affiliateCode?: string | null
  level: number
  joinedAt: string
  children: AffiliateNode[]
  stats?: { sales: number; commissions: number; referrals: number }
}

export interface Commission {
  id: string
  userId: string
  orderId?: string | null
  amount: number
  level: number
  rate: number
  status: string
  createdAt: string
  sourceUser?: { name: string } | null
}

export interface Courier {
  id: string
  userId: string
  vehicleType: string
  vehicleModel?: string | null
  licensePlate?: string | null
  available: boolean
  rating: number
  zone?: string | null
  user: { name: string; email: string; phone?: string | null }
}

export interface Delivery {
  id: string
  orderId: string
  courierId?: string | null
  status: string
  pickupAddress?: string | null
  deliveryAddress?: string | null
  distance?: number | null
  estimatedMinutes?: number | null
  createdAt: string
  order?: { orderNumber: string; city?: string | null; user?: { name: string } | null }
  courier?: { user: { name: string }; vehicleType: string } | null
}

export interface Partner {
  id: string
  userId: string
  totalContribution: number
  totalReturns: number
  status: string
  user: { name: string; email: string; phone?: string | null }
  contributions?: PartnerContribution[]
}

export interface PartnerContribution {
  id: string
  amount: number
  returnRate: number
  monthlyReturn: number
  status: string
  date: string
}

export interface CrmContact {
  id: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  stage: string
  value: number
  source?: string | null
  notes?: string | null
  createdAt: string
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  template?: string | null
  audience: string
  status: string
  scheduledAt?: string | null
  sentAt?: string | null
  recipientCount: number
  openCount: number
  clickCount: number
  createdAt: string
}

export interface Application {
  id: string
  type: string
  name: string
  email: string
  phone?: string | null
  details?: string | null
  status: string
  createdAt: string
}

// Helpers
export const VEHICLE_LABELS: Record<string, string> = {
  MOTORCYCLE: 'Moto',
  BICYCLE: 'Bicicleta',
  PICKUP: 'Camioneta',
  TRUCK: 'Camión',
  TRACTOR_TRUCK: 'Tracto Camión',
  TAXI: 'Taxi',
}

export const VEHICLE_ICONS: Record<string, string> = {
  MOTORCYCLE: 'Bike',
  BICYCLE: 'Bike',
  PICKUP: 'Truck',
  TRUCK: 'Truck',
  TRACTOR_TRUCK: 'Truck',
  TAXI: 'Car',
}

export const STAGE_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
}

export const STAGE_COLORS: Record<string, string> = {
  LEAD: 'bg-muted text-muted-foreground',
  QUALIFIED: 'bg-sky-100 text-sky-700',
  PROPOSAL: 'bg-amber-100 text-amber-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-red-100 text-red-700',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export const PLACEMENT_LABELS: Record<string, string> = {
  HEADER: 'Superior (Header)',
  SIDEBAR_LEFT: 'Lateral Izquierdo',
  SIDEBAR_RIGHT: 'Lateral Derecho',
  IN_GRID: 'Dentro del grid',
  FOOTER: 'Pie de página',
  HERO: 'Hero principal',
}

// ---------- Tipos Social ----------

export interface SocialAccount {
  id: string
  userId: string
  platform: string
  handle: string
  displayName?: string | null
  avatarUrl?: string | null
  followerCount: number
  connected: boolean
  createdAt: string
}

export interface SocialPost {
  id: string
  userId: string
  caption: string
  mediaUrls?: string | null
  mediaType: string
  productId?: string | null
  affiliateCode?: string | null
  status: string
  scheduledAt?: string | null
  publishedAt?: string | null
  likes: number
  comments: number
  shares: number
  reach: number
  clicks: number
  attributedOrders: number
  attributedRevenue: number
  createdAt: string
  product?: { name: string; price: number; imageUrl?: string | null } | null
  accounts?: { id: string; status: string; permalink?: string | null; account: SocialAccount }[] | null
}

export interface MediaAsset {
  id: string
  userId: string
  name: string
  url: string
  type: string
  size: number
  folderId?: string | null
  folder?: { id: string; name: string; color: string } | null
  tags?: string | null
  createdAt: string
}

export interface MediaFolder {
  id: string
  userId: string
  name: string
  color: string
  _count?: { assets: number }
  createdAt: string
}

export interface BioPage {
  id: string
  userId: string
  slug: string
  title: string
  subtitle?: string | null
  avatarUrl?: string | null
  theme: string
  affiliateCode?: string | null
  links?: string | null
  views: number
  clicks: number
  published: boolean
  createdAt: string
}

export interface AutomationRule {
  id: string
  userId: string
  name: string
  type: string
  config: string
  status: string
  lastRunAt?: string | null
  postsCreated: number
  createdAt: string
}

export interface GeneratedContent {
  caption: string
  hashtags: string[]
  variations: string[]
}

export const SOCIAL_PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'Music2',
  X: 'Twitter',
  WHATSAPP: 'MessageCircle',
  LINKEDIN: 'Linkedin',
  YOUTUBE: 'Youtube',
  TELEGRAM: 'Send',
  PINTEREST: 'Image',
  THREADS: 'AtSign',
}

export const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  X: 'X (Twitter)',
  WHATSAPP: 'WhatsApp',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube Shorts',
  TELEGRAM: 'Telegram',
  PINTEREST: 'Pinterest',
  THREADS: 'Threads',
}

export const POST_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programado',
  PUBLISHED: 'Publicado',
  FAILED: 'Fallido',
}

export const POST_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SCHEDULED: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
}

// ---------- Tipos ImpulsePymes360 ----------

export interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  description: string
  maxProducts: number
  maxAdSpaces: number
  maxShipments: number
  maxAffiliateRate: number
  hasWebExpress: boolean
  hasDirectorio: boolean
  hasLogistica: boolean
  hasSocial: boolean
  featured: boolean
}

export interface Provider {
  id: string
  userId: string
  companyName: string
  taxId?: string | null
  phone?: string | null
  mobile?: string | null
  address?: string | null
  city?: string | null
  category?: string | null
  description?: string | null
  logoUrl?: string | null
  coverUrl?: string | null
  websiteSlug: string
  affiliateRate: number
  status: string
  verified: boolean
  subscription?: { plan: Plan; status: string; amount: number; nextBillingDate?: string | null } | null
  website?: WebsiteExpress | null
  qrCodes?: QRCodeInfo[]
  adSpaces?: AdSpaceInfo[]
}

export interface WebsiteExpress {
  id: string
  providerId: string
  slug: string
  template: string
  primaryColor: string
  accentColor: string
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroImageUrl?: string | null
  aboutText?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactWhatsapp?: string | null
  contactAddress?: string | null
  businessHours?: string | null
  socialLinks?: string | null
  published: boolean
  views: number
}

export interface QRCodeInfo {
  id: string
  code: string
  targetUrl: string
  type: string
  scans: number
  uniqueScans: number
  lastScanAt?: string | null
}

export interface AdEdition {
  id: string
  name: string
  slug: string
  city: string
  totalSpaces: number
  bagSize: string
  printQuantity: number
  startDate: string
  endDate: string
  status: string
  availableSpaces: number
  adSpaces?: AdSpaceInfo[]
}

export interface AdSpaceInfo {
  id: string
  position: number
  type: string
  status: string
  price: number
  providerId?: string | null
  provider?: { companyName: string; logoUrl?: string | null } | null
  imageUrl?: string | null
}

export const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  CRECIMIENTO: 'Crecimiento',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
}
