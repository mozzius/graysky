import { NextResponse, type NextRequest } from "next/server";

import { getPostById } from "../../utils";

// returns blog info
// need to do this because the OG image is an edge function, so no filesystem APIs
// this can be cached so nbd not being edge

export const GET = async (
  _request: NextRequest,
  context: { params: { slug: string } },
) => {
  const slug = context.params.slug;

  // discard content
  const { content: _, ...data } = await getPostById(slug);

  return NextResponse.json(data);
};
