import { NextRequest } from "next/server";
import { runInvestmentAgent } from "@/lib/graph";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const company = body.company;

    if (!company || typeof company !== "string" || company.trim() === "") {
      return new Response(JSON.stringify({ error: "Company name required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const encode = (text: string) => encoder.encode(text);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const finalState = await runInvestmentAgent(company, (logs) => {
            if (logs && logs.length > 0) {
              const latest = logs[logs.length - 1];
              controller.enqueue(
                encode(
                  `data: ${JSON.stringify({
                    type: "log",
                    message: latest,
                  })}\n\n`
                )
              );
            }
          });

          controller.enqueue(
            encode(
              `data: ${JSON.stringify({
                type: "result",
                data: finalState,
              })}\n\n`
            )
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          controller.enqueue(
            encode(
              `data: ${JSON.stringify({
                type: "error",
                message: errorMessage,
              })}\n\n`
            )
          );
        } finally {
          controller.enqueue(encode(`data: [DONE]\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
