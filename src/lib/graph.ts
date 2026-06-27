import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state";
import { companyIdentifier } from "./nodes/identifier";
import { webSearchAgent } from "./nodes/webSearch";
import { financialAnalyst } from "./nodes/financials";
import { competitiveIntel } from "./nodes/competitive";
import { synthesisEngine } from "./nodes/synthesis";
import { decisionNode } from "./nodes/decision";
import { reportGenerator } from "./nodes/reporter";

const builder = new StateGraph(GraphState)
  .addNode("companyIdentifier", companyIdentifier)
  .addNode("webSearchAgent", webSearchAgent)
  .addNode("financialAnalyst", financialAnalyst)
  .addNode("competitiveIntel", competitiveIntel)
  .addNode("synthesisEngine", synthesisEngine)
  .addNode("decisionNode", decisionNode)
  .addNode("reportGenerator", reportGenerator)

  // Define flow
  .addEdge(START, "companyIdentifier")
  
  // Parallel execution of research nodes
  .addEdge("companyIdentifier", "webSearchAgent")
  .addEdge("companyIdentifier", "financialAnalyst")
  .addEdge("companyIdentifier", "competitiveIntel")

  // Wait for all 3 to finish before synthesis
  .addEdge("webSearchAgent", "synthesisEngine")
  .addEdge("financialAnalyst", "synthesisEngine")
  .addEdge("competitiveIntel", "synthesisEngine")

  .addEdge("synthesisEngine", "decisionNode")
  .addEdge("decisionNode", "reportGenerator")
  .addEdge("reportGenerator", END);

export const graph = builder.compile();
