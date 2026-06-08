import { NextResponse } from "next/server";
import { createContactRequestAction, getLeadsAction } from "@/lib/actions/leadActions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createContactRequestAction(body);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message, leadId: result.leadId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid request body" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const stage = searchParams.get("stage") || undefined;
    const assignedStaffId = searchParams.get("assignedStaffId") || undefined;

    const result = await getLeadsAction({ search, stage, assignedStaffId });
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }
    return NextResponse.json({ success: true, leads: result.leads });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
