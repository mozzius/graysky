import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const token = await req.json();

  console.log("NOTIFICATIONS", token);

  return new Response(null, { status: 200 });
}
