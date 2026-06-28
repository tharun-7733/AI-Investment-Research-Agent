import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state";
import { AgentState } from "./types";

import { identifierNode } from "./nodes/identifier";
import { webSearchNode } from "./nodes/webSearch";
import { financialsNode } from "./nodes/financials";
import { competitiveNode } from "./nodes/competitive";
import { synthesisNode } from "./nodes/synthesis";
import { decisionNode } from "./nodes/decision";
import { reporterNode } from "./nodes/reporter";

const builder = new StateGraph(GraphState)
  .addNode("identifier", identifierNode)
  .addNode("webSearch", webSearchNode)
  .addNode("financials", financialsNode)
  .addNode("competitive", competitiveNode)
  .addNode("synthesisNode", synthesisNode)
  .addNode("decision", decisionNode)
  .addNode("reporter", reporterNode)
  
  .addEdge(START, "identifier")
  
  // webSearch and financials run in parallel after identifier
  .addEdge("identifier", "webSearch")
  .addEdge("identifier", "financials")
  
  // competitive runs after webSearch (it uses webAnalysis context)
  .addEdge("webSearch", "competitive")
  
  // Fan-in: wait for financials + competitive before synthesis
  .addEdge("financials", "synthesisNode")
  .addEdge("competitive", "synthesisNode")
  
  .addEdge("synthesisNode", "decision")
  .addEdge("decision", "reporter")
  .addEdge("reporter", END);

export const investmentGraph = builder.compile();

export const runInvestmentAgent = async (
  companyName: string,
  onStream?: (streamLog: string[]) => void
): Promise<AgentState> => {
  try {
    const stream = await investmentGraph.stream(
      { companyInput: companyName },
      { streamMode: "values" }
    );
    
    let finalState: any = {};
    
    for await (const state of stream) {
      finalState = state;
      if (onStream && state.streamLog) {
        onStream(state.streamLog);
      }
    }
    
    return finalState as AgentState;
  } catch (error) {
    console.error("[Graph] Fatal Execution Error:", error);
    return {
      error: error instanceof Error ? error.message : String(error),
      streamLog: [`❌ Fatal Graph Error: ${String(error)}`]
    } as unknown as AgentState;
  }
};
