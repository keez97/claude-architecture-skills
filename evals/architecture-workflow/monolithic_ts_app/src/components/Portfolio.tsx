import React, { useState, useEffect } from 'react';
import api, { Portfolio, PortfolioHolding } from '../lib/api';

interface PortfolioProps {
  portfolioId: string;
  onError?: (error: string) => void;
}

/**
 * Portfolio component demonstrating:
 * - Heavy use of shared api.ts functions
 * - Cross-domain API calls (market data + portfolio updates)
 * - State management with mixed concerns
 * - Prop drilling from parent
 * - Unsafe styling (inline, hardcoded colors)
 * - Direct dependency on monolithic api.ts
 */
export const Portfolio: React.FC<PortfolioProps> = ({ portfolioId, onError }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editShares, setEditShares] = useState<number>(0);
  const [editCostBasis, setEditCostBasis] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, [portfolioId]);

  async function loadPortfolio() {
    setLoading(true);

    try {
      // Fetch portfolio - this internally calls getMarketDataBatch
      const portfolioData = await api.portfolio.get(portfolioId);
      setPortfolio(portfolioData);

      // Calculate allocations - this also calls getMarketDataBatch
      const allocs = await api.portfolio.calculateAllocation(portfolioData);
      setAllocations(allocs);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load portfolio';
      if (onError) onError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditHolding(holding: PortfolioHolding) {
    setEditingSymbol(holding.symbol);
    setEditShares(holding.shares);
    setEditCostBasis(holding.costBasis);
  }

  async function handleSaveHolding() {
    if (!editingSymbol) return;

    setSaving(true);

    try {
      // Update holding - internally calls getMarketData for price refresh
      const updated = await api.portfolio.updateHolding(
        portfolioId,
        editingSymbol,
        editShares,
        editCostBasis
      );

      // Reload portfolio to reflect changes
      await loadPortfolio();
      setEditingSymbol(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save holding';
      if (onError) onError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditingSymbol(null);
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial' }}>
        Loading portfolio...
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div style={{ padding: '20px', color: 'red', fontFamily: 'Arial' }}>
        Portfolio not found
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>{portfolio.name}</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
            Total Value
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            ${portfolio.totalValue.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
            Cost Basis
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            ${portfolio.totalCostBasis.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: portfolio.totalGainLoss >= 0 ? '#e8f5e9' : '#ffebee',
            padding: '15px',
            borderRadius: '8px',
            border: `1px solid ${portfolio.totalGainLoss >= 0 ? '#4caf50' : '#f44336'}`,
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
            Total Gain/Loss
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: portfolio.totalGainLoss >= 0 ? '#4caf50' : '#f44336',
            }}
          >
            {portfolio.totalGainLoss >= 0 ? '+' : ''}
            ${portfolio.totalGainLoss.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            {portfolio.totalGainLossPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Allocations Pie Chart (Simplified) */}
      {Object.keys(allocations).length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Portfolio Allocation</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
            }}
          >
            {Object.entries(allocations).map(([symbol, percent]) => (
              <div
                key={symbol}
                style={{
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '6px',
                  textAlign: 'center',
                  border: '1px solid #eee',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {symbol}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
                  {percent.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div>
        <h3>Holdings</h3>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #ddd',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Symbol</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>Shares</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>Cost Basis</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>Current Price</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>Market Value</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>Gain/Loss</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.holdings.map((holding) => {
              const isEditing = editingSymbol === holding.symbol;

              if (isEditing) {
                return (
                  <tr key={holding.symbol} style={{ backgroundColor: '#fff3e0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {holding.symbol}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px' }}>
                      <input
                        type="number"
                        value={editShares}
                        onChange={(e) => setEditShares(Number(e.target.value))}
                        style={{ width: '80px', padding: '4px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px' }}>
                      <input
                        type="number"
                        value={editCostBasis}
                        onChange={(e) => setEditCostBasis(Number(e.target.value))}
                        step="0.01"
                        style={{ width: '80px', padding: '4px' }}
                      />
                    </td>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '12px' }}>
                      <button
                        onClick={handleSaveHolding}
                        disabled={saving}
                        style={{
                          marginRight: '10px',
                          padding: '6px 12px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={holding.symbol}
                  style={{ borderBottom: '1px solid #eee' }}
                >
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>
                    {holding.symbol}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px' }}>
                    {holding.shares}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px' }}>
                    ${holding.costBasis.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px' }}>
                    ${holding.currentPrice.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px' }}>
                    ${holding.marketValue.toFixed(2)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      color: holding.gainLoss >= 0 ? '#4caf50' : '#f44336',
                      fontWeight: 'bold',
                    }}
                  >
                    {holding.gainLoss >= 0 ? '+' : ''}
                    ${holding.gainLoss.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <button
                      onClick={() => handleEditHolding(holding)}
                      disabled={saving}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Last Updated */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
        Last updated: {new Date(portfolio.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default Portfolio;
