'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/dimar/sidebar'
import { TopBar } from '@/components/dimar/topbar'
import { MarketplaceModule } from '@/components/dimar/modules/marketplace'
import { CartDrawer } from '@/components/dimar/cart-drawer'
import { DashboardModule } from '@/components/dimar/modules/dashboard'
import { AffiliatesModule } from '@/components/dimar/modules/affiliates'
import { SuppliersModule } from '@/components/dimar/modules/suppliers'
import { PartnersModule } from '@/components/dimar/modules/partners'
import { LogisticsModule } from '@/components/dimar/modules/logistics'
import { CrmModule } from '@/components/dimar/modules/crm'
import { EmailModule } from '@/components/dimar/modules/email'
import { AdsModule } from '@/components/dimar/modules/ads'
import { ApplicationsModule } from '@/components/dimar/modules/applications'
import { BenefitsModule } from '@/components/dimar/modules/benefits'
import { Footer } from '@/components/dimar/footer'

export default function Home() {
  const activeModule = useAppStore((s) => s.activeModule)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Escuchar toasts dispatchados desde el store
  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, type } = (e as CustomEvent).detail
      import('sonner').then((s) => {
        if (type === 'error') s.toast.error(msg)
        else if (type === 'info') s.toast.info(msg)
        else s.toast.success(msg)
      })
    }
    window.addEventListener('dimar-toast', handler)
    return () => window.removeEventListener('dimar-toast', handler)
  }, [])

  const renderModule = () => {
    switch (activeModule) {
      case 'marketplace': return <MarketplaceModule />
      case 'dashboard': return <DashboardModule />
      case 'affiliates': return <AffiliatesModule />
      case 'suppliers': return <SuppliersModule />
      case 'partners': return <PartnersModule />
      case 'logistics': return <LogisticsModule />
      case 'crm': return <CrmModule />
      case 'email': return <EmailModule />
      case 'ads': return <AdsModule />
      case 'applications': return <ApplicationsModule />
      case 'benefits': return <BenefitsModule />
      default: return <MarketplaceModule />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background bg-pattern">
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {renderModule()}
          </main>
        </div>
      </div>
      <Footer />
      <CartDrawer />
    </div>
  )
}
