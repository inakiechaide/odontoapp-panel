import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/_next', '/favicon.ico', '/api']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas — pasar directo
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // El token vive en memoria del cliente (no en cookies httpOnly todavía)
  // La protección real la hace el layout — acá solo redirigimos la raíz
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
