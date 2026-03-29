import React from 'react';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div>
      <Dashboard portfolioId="port-001" symbols={['AAPL', 'MSFT', 'GOOGL', 'TSLA']} />
    </div>
  );
}
