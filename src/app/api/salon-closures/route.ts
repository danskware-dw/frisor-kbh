import { NextResponse } from "next/server";
import { listSalonClosures } from "@/lib/booking/salon-closures";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ closures: await listSalonClosures() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[API /salon-closures] Error:", error);
    return NextResponse.json({ error: "Kunne ikke hente lukkedage." }, { status: 500 });
  }
}
