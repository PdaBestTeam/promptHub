import { NextResponse } from "next/server";

interface ApiSuccess<T> {
  success: true;
  data: T;
}
interface ApiError {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
}
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, init);
}
export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiError>(
    {
      success: false,
      error: { message, details },
    },
    { status },
  );
}

const response = {
  ok,
  fail,
};
export default response;
