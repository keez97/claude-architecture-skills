/**
 * Monolithic API Client
 *
 * This file demonstrates the AlphaDesk scenario: a single 400+ line file that
 * handles market data, portfolio management, and user settings across 3 domains,
 * with heavy cross-cutting concerns and shared types that make naive splitting dangerous.
 */

// ============================================================================
// TYPE DEFINITIONS (MIXED WITH FUNCTIONS - CLASSIC MONOLITH PROBLEM)
// ============================================================================

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface MarketDataWithTechnicals extends MarketData {
  sma20: number;
  sma50: number;
  rsi: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  weight: number;
  // CROSS-REFERENCE: Uses MarketData structure
  lastMarketData?: MarketData;
}

export interface Portfolio {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  lastUpdated: number;
  allocations: Record<string, number>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  currency: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  enableNotifications: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface ApiResponse<T> {
  data: T;
  error: ApiError | null;
  timestamp: number;
}

// ============================================================================
// BASE FETCH WRAPPER - USED BY ALL DOMAINS (CANNOT BE SPLIT)
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const REQUEST_TIMEOUT = 15000;

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Helper: Format API error with domain context.
 * Used by all 3 domains (market, portfolio, user).
 */
function formatError(status: number, message: string, domain: string): ApiError {
  return {
    code: `${domain.toUpperCase()}_ERROR`,
    message: `[${domain}] ${message}`,
    status,
  };
}

/**
 * Helper: Create timeout promise.
 * Shared by all fetch operations.
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Request timeout after ${ms}ms`)),
      ms
    );
  });
}

/**
 * Base fetch with retry logic, error handling, circuit breaker state.
 * This is THE critical helper - splitting would require duplicating this logic.
 */
async function baseFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body) {
    requestInit.body = JSON.stringify(options.body);
  }

  try {
    const raceResult = await Promise.race([
      fetch(url, requestInit),
      createTimeoutPromise(REQUEST_TIMEOUT),
    ]);

    if (!raceResult.ok) {
      throw new Error(`HTTP ${raceResult.status}: ${raceResult.statusText}`);
    }

    const json = await raceResult.json();
    return json as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw {
      code: 'FETCH_ERROR',
      message,
      status: 0,
    } as ApiError;
  }
}

// ============================================================================
// MARKET DATA DOMAIN (FUNCTIONS 1-3)
// ============================================================================

/**
 * Fetch live market data for a symbol.
 * Used by: Dashboard, Portfolio components.
 * Depends on: baseFetch, formatError, MarketData type.
 */
async function getMarketData(symbol: string): Promise<MarketData> {
  try {
    const response = await baseFetch<ApiResponse<MarketData>>(
      `/market/quote/${symbol}`
    );

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error) {
    throw formatError(
      (error as ApiError).status || 500,
      (error as ApiError).message || 'Failed to fetch market data',
      'market'
    );
  }
}

/**
 * Fetch market data with technical indicators.
 * Used by: Portfolio for decision-making.
 * Depends on: baseFetch, formatError, MarketDataWithTechnicals type.
 * Cross-reference: Uses MarketData as base.
 */
async function getMarketDataWithTechnicals(
  symbol: string
): Promise<MarketDataWithTechnicals> {
  try {
    const marketData = await getMarketData(symbol);
    const technicals = await baseFetch<
      Omit<MarketDataWithTechnicals, keyof MarketData>
    >(`/market/technicals/${symbol}`);

    return {
      ...marketData,
      ...technicals,
    };
  } catch (error) {
    throw formatError(
      (error as ApiError).status || 500,
      (error as ApiError).message || 'Failed to fetch technicals',
      'market'
    );
  }
}

/**
 * Batch fetch market data for multiple symbols.
 * Used by: Dashboard (perf-critical).
 * Depends on: baseFetch, formatError, MarketData type.
 * Cross-reference: Returns array of MarketData.
 */
async function getMarketDataBatch(symbols: string[]): Promise<MarketData[]> {
  if (symbols.length === 0) {
    return [];
  }

  try {
    const response = await baseFetch<ApiResponse<MarketData[]>>(
      '/market/batch',
      {
        method: 'POST',
        body: { symbols },
      }
    );

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error) {
    throw formatError(
      (error as ApiError).status || 500,
      (error as ApiError).message || 'Batch fetch failed',
      'market'
    );
  }
}

// ============================================================================
// PORTFOLIO DOMAIN (FUNCTIONS 4-6)
// ============================================================================

/**
 * Fetch user's portfolio.
 * Used by: Portfolio component.
 * Depends on: baseFetch, formatError, Portfolio type.
 * Cross-reference: Portfolio.holdings uses PortfolioHolding which references MarketData.
 */
async function getPortfolio(portfolioId: string): Promise<Portfolio> {
  try {
    const response = await baseFetch<ApiResponse<Portfolio>>(
      `/portfolio/${portfolioId}`
    );

    if (response.error) {
      throw response.error;
    }

    // ENRICHMENT: Add current market prices to holdings
    if (response.data.holdings.length > 0) {
      const symbols = response.data.holdings.map((h) => h.symbol);
      const marketDataMap = await getMarketDataBatch(symbols).then((data) =>
        Object.fromEntries(data.map((md) => [md.symbol, md]))
      );

      response.data.holdings.forEach((holding) => {
        holding.lastMarketData = marketDataMap[holding.symbol];
        // Recalculate based on latest price
        if (marketDataMap[holding.symbol]) {
          holding.currentPrice = marketDataMap[holding.symbol].price;
          holding.marketValue = holding.shares * holding.currentPrice;
          holding.gainLoss = holding.marketValue - holding.costBasis;
          holding.gainLossPercent = (holding.gainLoss / holding.costBasis) * 100;
        }
      });
    }

    return response.data;
  } catch (error) {
    throw formatError(
      (error as ApiError).status || 500,
      (error as ApiError).message || 'Failed to fetch portfolio',
      'portfolio'
    );
  }
}

/**
 * Update a portfolio holding.
 * Used by: Portfolio edit form.
 * Depends on: baseFetch, formatError, PortfolioHolding type.
 */
async function updateHolding(
  portfolioId: string,
  symbol: string,
  shares: number,
  costBasis: number
): Promise<PortfolioHolding> {
  try {
    const response = await baseFetch<ApiResponse<PortfolioHolding>>(
      `/portfolio/${portfolioId}/holdings/${symbol}`,
      {
        method: 'PATCH',
        body: { shares, costBasis },
      }
    );

    if (response.error) {
      throw response.error;
    }

    // Refresh market data for this holding
    const marketData = await getMarketData(symbol);
    response.data.currentPrice = marketData.price;
    response.data.marketValue = response.data.shares * marketData.price;
    response.data.gainLoss = response.data.marketValue - response.data.costBasis;
    response.data.gainLossPercent =
      (response.data.gainLoss / response.data.costBasis) * 100;

    return response.data;
  } catch (error) {
    throw formatError(
      (error as ApiError).status || 500,
      (error as ApiError).message || 'Failed to update holding',
      'portfolio'
    );
  }
}

/**
 * Calculate portfolio allocation percentages.
 * Used by: Portfolio component for visualization.
 * Depends on: Portfolio type, requires market data enrichment.
 * Cross-reference: Calls getMarketDataBatch for current prices.
 */
async function calculateAllocation(portfolio: Portfolio): Promise<Record<string, number>> {
  if (portfolio.holdings.length === 0) {
    return {};
  }

  // Ensure all holdings have current market data
  const symbols = portfolio.holdings.map((h) => h.symbol);
  const marketDataMap = await getMarketDataBatch(symbols).then((data) =>
    Object.fromEntries(data.map((md) => [md.symbol, md]))
  );

  let totalValue = 0;
  const allocations: Record<string, number> = {};

  portfolio.holdings.forEach((holding) => {
    const marketData = marketDataMap[holding.symbol];
    const value = holding.shares * (marketData?.price || holding.currentPrice);
    totalValue += value;
    allocations[holding.symbol] = value;
  });

  Object.keys(allocations).forEach((symbol) => {
    allocations[symbol] = totalValue > 0 ? (allocations[symbol] / totalValue) * 100 : 0;
  });

  return allocations;
}

// ============================================================================
// USER DOMAIN (FUNCTIONS 7-8)
// ============================================================================

/**
 * Fetch current user.
 * Used by: Header component, Settings.
 * Depends on: baseFetch, formatError, User type.
 */
async function getCurrentUser(): Promise<User> {
  try {
    const response = await baseFetch<ApiResponse<User>>('/user/me');

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error) {
    throw formatError(
      (error as ApiError).status || 500,
      (error as ApiError).message || 'Failed to fetch user',
      'user'
    );
  }
}

/**
 * Update user preferences.
 * Used by: Settings component.
 * Depends on: baseFetch, formatError, UserPreferences type.
 */
async function updatePreferences(
  preferences: Partial<UserPreferences>
): Promise<User> {
  try {
    const response = await baseFetch<ApiResponse<User>>('/user/preferences', {
      method: 'PATCH',
      body: preferences,
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error) {
    throw formatError(
      (error as ApiError).status || 500,
      (error as ApiError).message || 'Failed to update preferences',
      'user'
    );
  }
}

// ============================================================================
// EXPORTED DEFAULT API OBJECT (COMMON PATTERN)
// ============================================================================

/**
 * Unified API client namespace.
 * Components import this: import api from '@/lib/api'
 * Then use: api.market.getQuote(), api.portfolio.get(), etc.
 */
const api = {
  market: {
    quote: getMarketData,
    withTechnicals: getMarketDataWithTechnicals,
    batch: getMarketDataBatch,
  },
  portfolio: {
    get: getPortfolio,
    updateHolding,
    calculateAllocation,
  },
  user: {
    me: getCurrentUser,
    updatePreferences,
  },
  // Debug helper (used in dev)
  _baseFetch: baseFetch,
};

export default api;

// ============================================================================
// EXPORT NAMED FUNCTIONS TOO (FOR TREE-SHAKING, TESTING)
// ============================================================================

export {
  getMarketData,
  getMarketDataWithTechnicals,
  getMarketDataBatch,
  getPortfolio,
  updateHolding,
  calculateAllocation,
  getCurrentUser,
  updatePreferences,
};
