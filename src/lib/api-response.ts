import { NextResponse } from "next/server"

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ data, error: null }, init)
}

export function apiError(
  code: string,
  message: string,
  status = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json<ApiResponse<never>>(
    { data: null, error: { code, message } },
    { status }
  )
}
