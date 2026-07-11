import { NextRequest } from "next/server";
import { buildResearchGraph } from "@/lib/agent/graph";

export const runtime = "nodejs";
export const maxDuration = 60;

const STEP_LABELS: Record<string, string> = {
  identify: "Resolving company & ticker",
  webResearch: "Scanning recent news & coverage",
  fundamentalsStep: "Pulling financial fundamentals",
  sentimentStep: "Analyzing sentiment & narrative",
  riskStep: "Assessing risk profile",
  decision: "Synthesizing investment verdict",
};

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const { company } = await req.json();

  if (!company || typeof company !== "string" || !company.trim()) {
    return new Response(JSON.stringify({ error: "Missing 'company' in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const graph = buildResearchGraph();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const push = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      try {
        // LangGraph's .stream() yields the state delta after each node
        // finishes. We turn that into a friendly SSE trace event per node,
        // then emit the final verdict once the "decision" node completes.
        const eventStream = await graph.stream(
          { input: company.trim() },
          { streamMode: "updates" }
        );

        for await (const chunk of eventStream) {
          for (const [nodeName, patch] of Object.entries(chunk)) {
            push(
              sse("trace", {
                step: nodeName,
                label: STEP_LABELS[nodeName] || nodeName,
                status: "done",
                timestamp: Date.now(),
              })
            );

            if (nodeName === "decision" && (patch as any)?.verdict) {
              push(sse("verdict", (patch as any).verdict));
            }
            if ((patch as any)?.companyId) {
              push(sse("companyId", (patch as any).companyId));
            }
            if ((patch as any)?.fundamentals) {
              push(sse("fundamentals", (patch as any).fundamentals));
            }
            if ((patch as any)?.sentiment) {
              push(sse("sentiment", (patch as any).sentiment));
            }
            if ((patch as any)?.risk) {
              push(sse("risk", (patch as any).risk));
            }
            if ((patch as any)?.news) {
              push(sse("news", (patch as any).news));
            }
          }
        }

        push(sse("done", { ok: true }));
      } catch (err: any) {
        push(sse("error", { message: err?.message || "Unknown error running the research graph" }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
