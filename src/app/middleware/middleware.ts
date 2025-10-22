// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

      // 2. Verifikasi session benar-benar null
    if (session?.access_token) {
      console.error("Session masih aktif setelah logout!", session);
      // Force sign out ulang
      await supabase.auth.signOut();
      window.location.href = "/login";
      return;
    }

    // 3. Jika benar-benar tidak ada session
    // if (!session) {
    //   setLoading(false);
    //   return;
    // }
  

  // Redirect rules

    if (!session && request.nextUrl.pathname.startsWith("/home")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!session) {
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};