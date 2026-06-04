import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const sessionCookie = request.cookies.get("custom-auth-session")?.value;
  let user = null;
  if (sessionCookie) {
    try {
      user = JSON.parse(sessionCookie);
    } catch (e) {}
  }

  const isStudentRoute = request.nextUrl.pathname.startsWith('/student')
  const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner')
  
  if (!user && (isStudentRoute || isOwnerRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  return response
}
