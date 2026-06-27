import { NextRequest } from "next/server";
import { graph } from "@/lib/graph";

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();

  if (!companyName) {
    return new Response("Missing company name", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamResponse = await graph.streamEvents(
          { companyInput: companyName },
          { version: "v2" }
        );

        for await (const event of streamResponse) {
          if (event.event === "on_chain_end" || event.event === "on_chat_model_stream") {
            // we can filter specifically for UI updates if needed, 
            // but usually we look for state updates from nodes
          }
          
          if (event.event === "on_node_end") {
            // When a node finishes, we send its state update
            const data = JSON.stringify({
              type: "node_end",
              node: event.name,
              state: event.data.output,
            });
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error: any) {
        console.error("Stream error:", error);
        controller.enqueue(new TextEncoder().encode(`data: {"error": "${error.message}"}\n\n`));
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
}
