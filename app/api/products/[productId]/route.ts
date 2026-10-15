// GET /api/products/{productId}
import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  return proxyToBackend(req, `/api/products/${productId}`);
}

// よろしく
