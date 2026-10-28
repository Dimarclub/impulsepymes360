'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AppSessionProvider } from '@/components/dimar/auth/auth-provider'
import { GlobalErrorBoundary } from '@/components/dimar/error-boundary'
import { TopNav } from '@/components/dimar/topnav'
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
import { SocialModule } from '@/components/dimar/modules/social'
import { SocialStudioModule } from '@/components/dimar/modules/social-studio'
import { SocialBioModule } from '@/components/dimar/modules/social-bio'
import { SocialAutomationModule } from '@/components/dimar/modules/social-automation'
import { ImpulseModule } from '@/components/dimar/modules/impulse'
import { ImpulseWizardModule } from '@/components/dimar/modules/impulse-wizard'
import { WebExpressModule } from '@/components/dimar/modules/web-express'
import { SiteAdminModule } from '@/components/dimar/modules/site-admin'
import { ZonesModule } from '@/components/dimar/modules/zones'
import { GridModule } from '@/components/dimar/modules/grid'
import { BagPlanModule } from '@/components/dimar/modules/bag-plan'
import { PlanesModule } from '@/components/dimar/modules/planes'
import { FuerzaDeltaModule } from '@/components/dimar/modules/fuerza-delta'
import { DimarClubModule } from '@/components/dimar/modules/dimarclub'
import { CourierAppModule } from '@/components/dimar/modules/courier-app'
import { PubliBagsModule } from '@/components/dimar/modules/publibags'
import { ImpulsePymes360Module } from '@/components/dimar/modules/impulsepymes360'
import { CooperativaModule } from '@/components/dimar/modules/cooperativa'
import { SupplierBackofficeModule } from '@/components/dimar/modules/supplier-backoffice'
import { AffiliateBackofficeModule } from '@/components/dimar/modules/affiliate-backoffice'
import { PartnerBackofficeModule } from '@/components/dimar/modules/partner-backoffice'
import { AlertasCenterModule } from '@/components/dimar/modules/alertas-center'
import { FinanzasModule } from '@/components/dimar/modules/finanzas'
import { DirectorioModule } from '@/components/dimar/modules/directorio'
import { OfertasModule } from '@/components/dimar/modules/ofertas'
import { OfertasAdminModule } from '@/components/dimar/modules/ofertas-admin'
import { CpaTasksModule } from '@/components/dimar/modules/cpa-tasks'
import { CpaAdminModule } from '@/components/dimar/modules/cpa-admin'
import { Footer } from '@/components/dimar/footer'
import { canAccessModule, defaultModuleForRole } from '@/lib/permissions'

export default function Home() {
  return (
    <GlobalErrorBoundary>
      <AppSessionProvider>
        <HomeContent />
      </AppSessionProvider>
    </GlobalErrorBoundary>
  )
}

function HomeContent() {
  const activeModule = useAppStore((s) => s.activeModule)
  const setModule = useAppStore((s) => s.setModule)
  const currentUser = useAppStore((s) => s.currentUser)
  const role = currentUser?.role

  // Escuchar toasts
  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, type } = (e as CustomEvent).detail
      import('sonner').then((s) => {
        if (type === 'error') s.toast.error(msg)
        else if (type === 'info') s.toast.info(msg)
        else if (type === 'warning') s.toast.warning(msg)
        else s.toast.success(msg)
      })
    }
    window.addEventListener('dimar-toast', handler)
    return () => window.removeEventListener('dimar-toast', handler)
  }, [])

  // Redirigir si no tiene acceso
  useEffect(() => {
    if (!canAccessModule(role, activeModule)) {
      setModule(role ? defaultModuleForRole(role) : 'marketplace')
    }
  }, [role, activeModule, setModule])

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
      case 'social': return <SocialModule />
      case 'social-studio': return <SocialStudioModule />
      case 'social-bio': return <SocialBioModule />
      case 'social-automation': return <SocialAutomationModule />
      case 'impulse': return <ImpulseModule />
      case 'impulse-wizard': return <ImpulseWizardModule />
      case 'web-express': return <WebExpressModule />
      case 'site-admin': return <SiteAdminModule />
      case 'zones': return <ZonesModule />
      case 'grid': return <GridModule />
      case 'bag-plan': return <BagPlanModule />
      case 'planes': return <PlanesModule />
      case 'fuerza-delta': return <FuerzaDeltaModule />
      case 'dimarclub': return <DimarClubModule />
      case 'courier-app': return <CourierAppModule />
      case 'publibags': return <PubliBagsModule />
      case 'impulsepymes360': return <ImpulsePymes360Module />
      case 'cooperativa': return <CooperativaModule />
      case 'supplier-backoffice': return <SupplierBackofficeModule />
      case 'affiliate-backoffice': return <AffiliateBackofficeModule />
      case 'partner-backoffice': return <PartnerBackofficeModule />
      case 'alertas': return <AlertasCenterModule />
      case 'finanzas': return <FinanzasModule />
      case 'directorio': return <DirectorioModule />
      case 'ofertas': return <OfertasModule />
      case 'ofertas-admin': return <OfertasAdminModule />
      case 'cpa-tasks': return <CpaTasksModule />
      case 'cpa-admin': return <CpaAdminModule />
      default: return <MarketplaceModule />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background bg-pattern">
      <TopNav />
      <main className="flex-1 w-full">
        {renderModule()}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
