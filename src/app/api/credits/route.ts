import { NextRequest, NextResponse } from "next/server";
import { getCredits, getCreditTransactions, grantCredits } from "@/lib/credits";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const balance = await getCredits(userId);
  const transactions = await getCreditTransactions(userId, 20);
  return NextResponse.json({ balance, transactions });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, amount, description } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (action === "grant") {
      await grantCredits(userId, amount || 0, description || "管理员充值");
      const balance = await getCredits(userId);
      return NextResponse.json({ balance });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
