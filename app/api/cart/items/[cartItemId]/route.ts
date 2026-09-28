// PATCH  /api/cart/items/{cartItemId}
// DELETE /api/cart/items/{cartItemId}
import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cartItemId: string }> },
) {
  const { cartItemId } = await params;
  return proxyToBackend(req, `/api/cart/items/${cartItemId}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cartItemId: string }> },
) {
  const { cartItemId } = await params;
  return proxyToBackend(req, `/api/cart/items/${cartItemId}`);
}
