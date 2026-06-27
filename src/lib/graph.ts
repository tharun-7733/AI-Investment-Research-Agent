import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state";
import { companyIdentifier } from "./nodes/identifier";
import { webSearchNode } from "./nodes/webSearch";
import { financialsNode } from "./nodes/financials";
import { competitiveNode } from "./nodes/competitive";
import { synthesisNode } from "./nodes/synthesis";
import { decisionNode } from "./nodes/decision";
import { reporterNode } from "./nodes/reporter";

const builder = new StateGraph(GraphState)
  .addNode("companyIdentifier", companyIdentifier)
  .addNode("webSearchAgent", webSearchNode)
  .addNode("financialAnalyst", financialsNode)
  .addNode("competitiveIntel", competitiveNode)
  .addNode("synthesisEngine", synthesisNode)
  .addNode("decisionNode", decisionNode)
  .addNode("reportGenerator", reporterNode)

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
