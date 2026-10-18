'use client'

import { useAppStore } from '@/lib/store'
import type { ModuleId } from '@/lib/types'

const LINK_GROUPS: { title: string; links: { label: string; module?: ModuleId }[] }[] = [
  {
    title: 'Enlaces',
    links: [
      { label: 'Marketplace', module: 'marketplace' },
      { label: 'Afiliados', module: 'affiliates' },
      { label: 'Socios', module: 'partners' },
      { label: 'Beneficios', module: 'benefits' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y condiciones' },
      { label: 'Política de privacidad' },
      { label: 'Devoluciones' },
      { label: 'Comisiones' },
    ],
  },
  {
    title: 'Contacto',
    links: [
      { label: 'Guayaquil, Ecuador' },
      { label: 'soporte@dimarclub.com' },
      { label: '+593 99 111 111' },
      { label: 'Lun a Sáb · 9h - 18h' },
    ],
  },
]

export function Footer() {
  const setModule = useAppStore((s) => s.setModule)

  return (
    <footer className="mt-auto bg-card border-t">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold leading-none">D</span>
              </div>
              <p className="font-bold">Dimarclub</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Marketplace B2C con red de afiliados de 3 niveles. Compra, recomienda
              y gana con productos de proveedores verificados en todo Ecuador.
            </p>
          </div>

          {/* Link groups */}
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="font-semibold mb-3 text-sm">{group.title}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => link.module && setModule(link.module)}
                      className="text-left hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 Dimarclub. Todos los derechos reservados.</p>
          <p className="md:text-right">
            Sistema de afiliados de 3 niveles · Comisiones N0 (3%) + N1-N3 (2% c/u) ·
            Disponible en todo Ecuador.
          </p>
        </div>
      </div>
    </footer>
  )
}
