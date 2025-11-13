// src/app/api/docs-view/[id]/redeem/route.ts
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return json({ message: "Missing id" }, 400);
  return json({
    success: true,
    redeemed: true,
    pointsLeft: 1200, // ví dụ
  });
}
