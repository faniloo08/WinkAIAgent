import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data: candidates, error } = await supabaseAdmin
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error("[v0] Get candidates error:", error)
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
  }
}
