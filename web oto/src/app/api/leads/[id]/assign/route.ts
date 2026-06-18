import { NextResponse } from "next/server";
import { assignLeadSalesAction } from "@/lib/actions/leadActions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { assigned_staff_id } = await request.json();

    const result = await assignLeadSalesAction(id, assigned_staff_id);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid request body" }, { status: 400 });
  }
}
