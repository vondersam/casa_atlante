import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/booking/auth";
import { apiError } from "@/lib/booking/http";
import { BookingError } from "@/lib/booking/policy";
import { reservation } from "@/lib/booking/repository";
import { retainedDocument } from "@/lib/booking/pdf";
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; kind: string }> },
) {
  try {
    await requireOwner();
    const { id, kind } = await ctx.params;
    if (
      !/^[a-f0-9-]{36}$/i.test(id) ||
      !["invoice", "agreement", "credit"].includes(kind)
    )
      throw new BookingError("not_found", 404);
    if (kind !== "invoice" && kind !== "agreement" && kind !== "credit")
      throw new BookingError("not_found", 404);
    const r = await reservation(id);
    const bytes = await retainedDocument(r, kind);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${kind}-${r.invoice_number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
