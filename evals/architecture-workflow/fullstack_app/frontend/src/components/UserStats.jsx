import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Side-effect registration in module scope — runs on import even when component never renders
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function UserStats({ users }) {
  if (!users || users.length === 0) {
    return <div style={{ padding: 16 }}>No user stats yet</div>;
  }

  // Recomputes chart data on every render — no memoization
  const data = {
    labels: users.map((u) => u.name),
    datasets: [
      {
        label: 'Total tasks',
        data: users.map((u) => u.total),
        backgroundColor: '#3a7',
      },
      {
        label: 'Done',
        data: users.map((u) => u.done),
        backgroundColor: '#08f',
      },
    ],
  };

  return (
    <div style={{ padding: 16, border: '1px solid #ddd' }}>
      <h3>User stats</h3>
      <Bar data={data} />
    </div>
  );
}

export default UserStats;
