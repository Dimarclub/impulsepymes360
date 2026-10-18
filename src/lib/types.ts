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
