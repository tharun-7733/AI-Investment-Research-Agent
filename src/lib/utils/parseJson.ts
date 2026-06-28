/**
 * parseJson.ts — Shared LLM JSON parsing utility
 *
 * Handles all common LLM response formats:
 *   - Plain JSON:             { ... }
 *   - Markdown fenced:        ```json\n{ ... }\n```
 *   - Fenced without lang:    ```\n{ ... }\n```
 *   - JSON buried in prose:   "Here is the result:\n{ ... }\nDone."
 */

export interface ParseJsonResult<T = unknown> {
  data: T | null;
  raw: string;
  cleaned: string;
  error: string | null;
}

/**
 * Strip markdown code fences and extract the first JSON object or array
 * from an LLM response string.
 */
export function cleanLlmJson(raw: string): string {
  // 1. Remove opening fence  (```json, ```JSON, ```, etc.)
  let s = raw.replace(/^```[a-zA-Z]*\n?/, "").trim();

  // 2. Remove closing fence
  s = s.replace(/```\s*$/, "").trim();

  // 3. If there is still fenced content embedded (multi-fence responses)
  //    strip all remaining fences
  s = s.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").trim();

  // 4. Extract first JSON object {...} or array [...]
  const objMatch = s.match(/\{[\s\S]*\}/);
  const arrMatch = s.match(/\[[\s\S]*\]/);

  if (objMatch && arrMatch) {
    // Return whichever appears first in the string
    return objMatch.index! <= arrMatch.index! ? objMatch[0] : arrMatch[0];
  }

  return objMatch?.[0] ?? arrMatch?.[0] ?? s;
}

/**
 * Safely parse an LLM response as JSON.
 *
 * @param raw       - Raw LLM response string
 * @param nodeName  - Node/file name for logging (e.g. "FinancialsNode")
 * @returns         ParseJsonResult with .data (null on failure) and .error
 */
export function safeParseLlmJson<T = unknown>(
  raw: string,
  nodeName: string
): ParseJsonResult<T> {
  const cleaned = cleanLlmJson(raw);

  console.debug(`[${nodeName}] Raw LLM response:`, raw.slice(0, 300));
  console.debug(`[${nodeName}] Cleaned JSON:`, cleaned.slice(0, 300));

  try {
    const data = JSON.parse(cleaned) as T;
    return { data, raw, cleaned, error: null };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[${nodeName}] JSON parse error: ${errorMsg}`);
    console.error(`[${nodeName}] Problematic cleaned string:`, cleaned.slice(0, 500));
    return { data: null, raw, cleaned, error: errorMsg };
  }
}

/**
 * Extract the raw text content from a LangChain model response.
 * Works for both string responses and complex content arrays.
 */
export function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content) && content.length > 0) {
    const first = content[0];
    if (first && typeof first === "object" && "text" in first) {
      return String((first as { text: unknown }).text);
    }
  }
  return "";
}
