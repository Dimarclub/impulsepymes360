import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    client: [
      { icon: 'Truck', title: 'Entrega a domicilio gratis', desc: 'En todas tus compras del marketplace, sin mínimo.' },
      { icon: 'CarFront', title: 'Lavado de autos gratis', desc: 'Un lavado gratuito mensual en establecimientos aliados.' },
      { icon: 'Stethoscope', title: 'Atención médica odontológica', desc: 'Para el titular: consultas y limpiezas sin costo.' },
      { icon: 'Wrench', title: 'Servicio de grúa y asistencia mecánica', desc: 'Asistencia vehicular 24/7 en todo el país.' },
      { icon: 'Ambulance', title: 'Servicio de ambulancia 24/7', desc: 'Cobertura de emergencias médicas para el titular.' },
    ],
    partner: [
      { icon: 'TrendingUp', title: '3% de utilidad sobre tu aporte', desc: 'Rendimiento mensual sobre el capital aportado.' },
      { icon: 'Rocket', title: 'Acceso a capital semilla', desc: 'Para emprendimientos que presentes a la comunidad.' },
      { icon: 'Briefcase', title: 'Oportunidades laborales', desc: 'Acceso a cargos según tu experiencia y conocimientos.' },
      { icon: 'PiggyBank', title: 'Aporte desde $300', desc: 'Flexible, puedes incrementar tu capital cuando quieras.' },
    ],
    affiliate: [
      { level: 'N0', rate: '3%', desc: 'Por ventas propias o autoconsumo' },
      { level: 'Nivel 1', rate: '2%', desc: 'Por ventas de tus referidos directos' },
      { level: 'Nivel 2', rate: '2%', desc: 'Por ventas de los referidos de tus referidos' },
      { level: 'Nivel 3', rate: '2%', desc: 'Tercer nivel de tu red de afiliados' },
    ],
  })
}
