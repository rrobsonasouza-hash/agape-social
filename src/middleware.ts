import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL(`/central${request.nextUrl.pathname}`, request.url));
}

export const config = { matcher: ["/paroquias", "/paroquias/nova"] };
