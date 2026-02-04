import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 本番環境でのみベーシック認証を適用
  // ローカル開発時はスキップ
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  // 認証情報が設定されていない場合はスキップ
  const username = process.env.BASIC_AUTH_USER
  const password = process.env.BASIC_AUTH_PASS
  if (!username || !password) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  const [scheme, encoded] = authHeader.split(' ')

  if (scheme !== 'Basic' || !encoded) {
    return new NextResponse('Invalid authentication', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  const decoded = atob(encoded)
  const [user, pass] = decoded.split(':')

  if (user !== username || pass !== password) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  // 全ルートに適用（静的ファイルは除外）
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
