import { NextResponse } from "next/server";
import { getLeadDetailAction, updateLeadStageAction } from "@/lib/actions/leadActions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getLeadDetailAction(id);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }
    return NextResponse.json({ success: true, lead: result.lead, chatSessionId: result.chatSessionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { stage } = await request.json();

    if (!stage) {
      return NextResponse.json({ error: "Trạng thái (stage) không được để trống." }, { status: 400 });
    }

    const result = await updateLeadStageAction(id, stage);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid request body" }, { status: 400 });
  }
}
