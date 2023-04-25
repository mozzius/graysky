import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { email } = z.object({ email: z.string().email() }).parse(body);

  const post = await fetch(process.env.CONN_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, timestamp: new Date().toLocaleString() }),
  });

  if (!post.ok) {
    return new NextResponse("Something went wrong", { status: 500 });
  }

  return new NextResponse(`You have been added to the waitlist, ${email}`, {
    status: 200,
  });
};
