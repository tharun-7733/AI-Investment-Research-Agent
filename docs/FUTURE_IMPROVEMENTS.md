# Future Improvements Roadmap

While Meridian is fully functional, the current architecture leaves room for several high-impact expansions. 

## Phase 1: Data Depth & Export

### 1. SEC EDGAR Integration (10-K / 10-Q)
Currently, financial data relies on the Alpha Vantage OVERVIEW endpoint which provides static TTM (Trailing Twelve Months) summaries. 
- **Improvement:** Integrate a node that fetches raw 10-K and 10-Q filings from the SEC EDGAR database.
- **Value:** Allows the `FinancialsNode` to analyze management commentary, specific debt maturity schedules, and granular margin breakdowns.

### 2. PDF Export Generation
Users want to share reports with stakeholders who do not have access to the platform.
- **Improvement:** Add a backend route utilizing `puppeteer` or `html2pdf.js` to render the `IntelligenceReport.tsx` component to a stylized PDF.
- **Value:** Increases platform utility for professional analysts pitching ideas to portfolio managers.

## Phase 2: Active Monitoring

### 3. Portfolio / Watchlist Price Tracking
The current Watchlist only tracks the AI's verdict and score over time.
- **Improvement:** Integrate a WebSocket or cron-based polling system to track the live stock price of `INVEST` verdicts against a benchmark (e.g., S&P 500).
- **Value:** Proves (or disproves) the efficacy of the AI's scoring model with empirical market data.

### 4. Alerting System
- **Improvement:** Run a lightweight version of the `WebSearchNode` on a nightly cron job for all companies in a user's Watchlist. If sentiment shifts by >20% or major news breaks, trigger an email alert via Resend/SendGrid.
- **Value:** Shifts the platform from passive research to active portfolio defense.

## Phase 3: Platform Capabilities

### 5. Custom Scoring Weights
Currently, the `SynthesisNode` uses hardcoded weights (Growth 25%, Financials 25%, Moat 20%, Sentiment 15%, Valuation 15%).
- **Improvement:** Allow users to set their own weights in a `/settings` page. Value investors could increase Valuation to 40%, while venture investors could increase Growth and Moat.
- **Implementation:** Pass the user's weight profile from Supabase into the `GraphState` so the `SynthesisNode` can dynamically adjust its calculation prompt.

### 6. Multi-Company Comparison (Head-to-Head)
- **Improvement:** Create a new graph entry point that takes two tickers (e.g. `AMD vs NVDA`). Run the standard DAG for both simultaneously, then fan-in to a `CompareNode` that writes a detailed head-to-head investment thesis.
