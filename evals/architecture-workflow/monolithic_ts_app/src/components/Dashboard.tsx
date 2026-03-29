import React, { useState, useEffect } from 'react';
import api, { MarketData, Portfolio } from '../lib/api';

interface DashboardProps {
  portfolioId: string;
  symbols?: string[];
}

/**
 * Dashboard component demonstrating:
 * - Mixed concerns (market data + portfolio data)
 * - Named and default export usage from api.ts
 * - Prop drilling (typical code smell)
 * - Inline styles (another code smell)
 * - Cross-domain dependencies
 */
export const Dashboard: React.FC<DashboardProps> = ({
  portfolioId,
  symbols = ['AAPL', 'MSFT', 'GOOGL'],
}) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [portfolioId]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch market data using named import
      const marketDataResult = await api.market.batch(symbols);
      setMarketData(marketDataResult);

      // Fetch portfolio using default export
      const portfolioResult = await api.portfolio.get(portfolioId);
      setPortfolio(portfolioResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Investment Dashboard</h1>

      {/* Market Data Section */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Market Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {marketData.map((md) => (
            <div
              key={md.symbol}
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: md.change >= 0 ? '#e8f5e9' : '#ffebee',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {md.symbol}
              </div>
              <div style={{ fontSize: '24px', marginTop: '10px' }}>
                ${md.price.toFixed(2)}
              </div>
              <div
                style={{
                  marginTop: '10px',
                  color: md.change >= 0 ? 'green' : 'red',
                }}
              >
                {md.change >= 0 ? '+' : ''}
                {md.change.toFixed(2)} ({md.changePercent.toFixed(2)}%)
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Vol: {(md.volume / 1000000).toFixed(1)}M
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio Section */}
      {portfolio && (
        <section>
          <h2>Portfolio: {portfolio.name}</h2>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>
              Total Value: ${portfolio.totalValue.toFixed(2)}
            </div>
            <div style={{ fontSize: '16px', color: portfolio.totalGainLoss >= 0 ? 'green' : 'red' }}>
              {portfolio.totalGainLoss >= 0 ? '+' : ''}
              ${portfolio.totalGainLoss.toFixed(2)} (
              {portfolio.totalGainLossPercent.toFixed(2)}%)
            </div>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '20px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Symbol</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Shares</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Value</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Gain/Loss</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding) => (
                <tr
                  key={holding.symbol}
                  style={{ borderBottom: '1px solid #ddd' }}
                >
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
                    {holding.symbol}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {holding.shares}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    ${holding.currentPrice.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    ${holding.marketValue.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '10px',
                      textAlign: 'right',
                      color: holding.gainLoss >= 0 ? 'green' : 'red',
                    }}
                  >
                    {holding.gainLoss >= 0 ? '+' : ''}
                    ${holding.gainLoss.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {holding.weight.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={loadData}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Refresh Data
          </button>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
