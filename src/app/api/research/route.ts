import { NextRequest } from "next/server";

/**
 * POST /api/research
 *
 * Thin proxy to the Python FastAPI backend.
 * Auth is enforced by middleware.ts (returns 401 before this route runs).
 * This route simply validates the payload, forwards to PYTHON_BACKEND_URL,
 * and pipes the SSE stream back to the browser unchanged.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const company = typeof body.company === "string" ? body.company.trim() : "";

    if (!company) {
      return new Response(JSON.stringify({ error: "Company name required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const backendUrl = process.env.PYTHON_BACKEND_URL;
    if (!backendUrl) {
      return new Response(
        JSON.stringify({ error: "AI backend not configured. Set PYTHON_BACKEND_URL." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const upstream = await fetch(`${backendUrl}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "Unknown backend error");
      return new Response(JSON.stringify({ error: errText }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pipe the SSE stream from Python backend → browser directly
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

