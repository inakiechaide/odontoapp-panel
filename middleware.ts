import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Raíz → dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // /dashboard/pacientes/nuevo ya tiene su propia página en Next.js
  // pero el middleware asegura que nunca llegue al [id] route
  // Redirect /auth/login → si ya tiene token → dashboard (handled by layout)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
