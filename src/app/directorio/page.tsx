import { redirect } from 'next/navigation'

// Redirige a la home con el módulo activo
// Ej: dimarclub.com/tienda → dimarclub.com/?module=marketplace
export default function DirectorioRedirect() {
  redirect('/?module=directorio')
}
