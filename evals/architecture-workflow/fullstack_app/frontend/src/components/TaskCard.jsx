import React from 'react';
import moment from 'moment'; // imported even when only formatting one date — bundle bloat anti-pattern
import _ from 'lodash';      // same — full lodash import for one helper

// Inline styles everywhere — no CSS module, no Tailwind, no design system
const cardStyle = {
  border: '1px solid #ccc',
  padding: '12px',
  margin: '8px 0',
  borderRadius: '4px',
  background: '#fff',
};

const priorityColors = {
  low: '#888',
  medium: '#3a7',
  high: '#e80',
  urgent: '#e33',
};

export function TaskCard({ task }) {
  if (!task) return null;
  // Re-fetches token on every render
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleStatusChange = async (newStatus) => {
    // Inline fetch in component — no service layer, no error handling
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{task.title}</strong>
        <span style={{ color: priorityColors[task.priority] || '#000' }}>
          {_.upperFirst(task.priority || 'medium')}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#666' }}>
        {task.assignee || 'Unassigned'} ·{' '}
        {task.created_at ? moment(task.created_at).fromNow() : 'just now'}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => handleStatusChange('in_progress')}>Start</button>
        <button onClick={() => handleStatusChange('done')}>Done</button>
      </div>
    </div>
  );
}

export default TaskCard;
