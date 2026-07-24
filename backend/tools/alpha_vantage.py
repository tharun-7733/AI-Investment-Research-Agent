"""
alpha_vantage.py — Alpha Vantage Financial Data Fetcher
Port of src/lib/tools/alphaVantage.ts
"""

import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ─── Types ───────────────────────────────────────────────────────────────────

FinancialData = dict  # typed as dict; see field docs below
"""
{
    symbol: str
    marketCap: str | None
    peRatio: str | None
    revenueGrowthYoY: str | None   # always None from OVERVIEW
    grossMargin: str | None
    netMargin: str | None
    debtToEquity: str | None
    weekHigh52: str | None
    weekLow52: str | None
    analystTarget: str | None
    note: str | None
    raw: dict
}
"""

# ─── Helpers ─────────────────────────────────────────────────────────────────


def _clean(value: object) -> Optional[str]:
    """Return value as string if meaningful, else None."""
    if not isinstance(value, str):
        return None
    t = value.strip()
    return t if t and t not in ("None", "-") else None


def _null_result(symbol: str, note: str) -> FinancialData:
    return {
        "symbol": symbol,
        "marketCap": None,
        "peRatio": None,
        "revenueGrowthYoY": None,
        "grossMargin": None,
        "netMargin": None,
        "debtToEquity": None,
        "weekHigh52": None,
        "weekLow52": None,
        "analystTarget": None,
        "note": note,
        "raw": {},
    }


def _derive_gross_margin(data: dict) -> Optional[str]:
    """Derive gross margin % from GrossProfitTTM and RevenueTTM."""
    try:
        gp = float(data.get("GrossProfitTTM", ""))
        rev = float(data.get("RevenueTTM", ""))
        if rev != 0:
            return f"{(gp / rev) * 100:.4f}"
    except (ValueError, TypeError):
        pass
    return None


# ─── get_financial_data ───────────────────────────────────────────────────────


async def get_financial_data(ticker: Optional[str]) -> FinancialData:
    """
    Fetch structured financial metrics via the Alpha Vantage OVERVIEW endpoint.

    Args:
        ticker: Stock symbol (e.g. "AAPL"). Pass None for private companies.

    Returns:
        A FinancialData dict. Never raises — errors surface as None fields + note.
    """
    if not ticker:
        return _null_result("PRIVATE", "Private company — no public financial data")

    symbol = ticker.strip().upper()

    api_key = os.environ.get("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        logger.warning("[AlphaVantage] ALPHA_VANTAGE_API_KEY is not set.")
        return _null_result(symbol, "ALPHA_VANTAGE_API_KEY environment variable is not configured.")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://www.alphavantage.co/query",
                params={"function": "OVERVIEW", "symbol": symbol, "apikey": api_key},
            )
            resp.raise_for_status()
            data: dict = resp.json()

        if not data:
            return _null_result(symbol, "Alpha Vantage returned an empty response — ticker may be invalid.")

        # API encodes rate-limit / error messages inside the JSON body
        api_msg = data.get("Information") or data.get("Note") or data.get("Error Message")
        if api_msg:
            logger.warning("[AlphaVantage] API message for %s: %s", symbol, api_msg)
            return _null_result(symbol, str(api_msg))

        return {
            "symbol": symbol,
            "marketCap": _clean(data.get("MarketCapitalization")),
            "peRatio": _clean(data.get("PERatio")),
            "revenueGrowthYoY": None,   # OVERVIEW has no direct YoY field
            "grossMargin": _derive_gross_margin(data),
            "netMargin": _clean(data.get("ProfitMargin")),
            "debtToEquity": _clean(data.get("DebtToEquityRatio")),
            "weekHigh52": _clean(data.get("52WeekHigh")),
            "weekLow52": _clean(data.get("52WeekLow")),
            "analystTarget": _clean(data.get("AnalystTargetPrice")),
            "note": None,
            "raw": data,
        }

    except httpx.HTTPStatusError as exc:
        msg = f"HTTP {exc.response.status_code}: {exc}"
        logger.error("[AlphaVantage] Request failed for %s: %s", symbol, msg)
        return _null_result(symbol, f"API request failed: {msg}")
    except Exception as exc:
        logger.error("[AlphaVantage] Request failed for %s: %s", symbol, exc)
        return _null_result(symbol, f"API request failed: {exc}")
