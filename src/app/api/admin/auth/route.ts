import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authClient, AUTH_COOKIE, requireOwner } from "@/lib/booking/auth";
import {
  apiError,
  rateLimit,
  readJson,
  requireSameOrigin,
} from "@/lib/booking/http";
import { BookingError, record, OWNER_EMAIL } from "@/lib/booking/policy";
import { rpc } from "@/lib/booking/repository";
export async function GET() {
  try {
    await requireOwner();
    return NextResponse.json(
      { authenticated: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    requireSameOrigin(req);
    const body = record(await readJson(req));
    const jar = await cookies();
    if (body.action === "logout") {
      jar.delete(AUTH_COOKIE);
      return NextResponse.json({ ok: true });
    }
    await rateLimit(req, "owner-auth", 8, 300);
    if (body.action === "request") {
      if (
        !(await rpc<boolean>("ca_rate_limit", {
          p_key: "owner-login-email",
          p_limit: 1,
          p_seconds: 60,
        }))
      )
        throw new BookingError("rate_limited", 429);
      const { error } = await authClient().auth.signInWithOtp({
        email: OWNER_EMAIL,
        options: { shouldCreateUser: false },
      });
      if (error) throw new Error("Owner email sign-in failed");
      return NextResponse.json({ ok: true });
    }
    if (
      body.action === "verify" &&
      typeof body.code === "string" &&
      /^\d{6,8}$/.test(body.code)
    ) {
      const { data, error } = await authClient().auth.verifyOtp({
        email: OWNER_EMAIL,
        token: body.code,
        type: "email",
      });
      if (
        error ||
        !data.session ||
        data.user?.email?.toLowerCase() !== OWNER_EMAIL ||
        !data.user.email_confirmed_at
      )
        throw new BookingError("unauthorized", 401);
      jar.set(AUTH_COOKIE, data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: Math.min(data.session.expires_in, 3600),
      });
      return NextResponse.json({ ok: true });
    }
    throw new BookingError("invalid_request");
  } catch (error) {
    return apiError(error);
  }
}
