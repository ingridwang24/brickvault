import { NextRequest, NextResponse } from 'next/server'

// Auth disabled for UI preview — re-enable before deploying
export async function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
