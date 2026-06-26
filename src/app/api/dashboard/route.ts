import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/store/demo-store";

export async function GET() {
  return NextResponse.json(getDashboardData());
}
