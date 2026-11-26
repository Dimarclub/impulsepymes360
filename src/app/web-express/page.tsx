import { redirect } from 'next/navigation'

// Redirige a la home con el módulo activo
export default function WebExpressRedirect() {
  redirect('/?module=web-express')
}
