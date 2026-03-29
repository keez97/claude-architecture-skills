import React, { useState, useEffect } from 'react';
import { TaskCard } from '../components/TaskCard';
import { UserStats } from '../components/UserStats';

// Global state - passed everywhere via props
export default function Dashboard({ user, setUser, projects, setProjects }) {
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: null, priority: null });
  const [sortBy, setSortBy] = useState('created_at');

  // Fetches everything on mount - no caching, no pagination
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [tasksRes, dashRes, projectsRes] = await Promise.all([
          fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/dashboard', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/projects', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        ]);
        setTasks(await tasksRes.json());
        setDashboard(await dashRes.json());
        setProjects(await projectsRes.json());
      } catch (err) {
        console.log(err); // Silent error handling
      }
      setLoading(false);
    };
    fetchAll();
  }, []); // Missing dependency array items - stale closures

  // Re-fetches ALL tasks when any filter changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.priority) params.append('priority', filter.priority);

    fetch(`/api/tasks?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(setTasks);
  }, [filter]);

  // Client-side sorting of all tasks (should be server-side for large datasets)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (loading) return <div>Loading...</div>; // No skeleton, no spinner

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Inline styles everywhere - no design system */}
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Dashboard</h1>

      {/* Stats cards - all hardcoded layout */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f0f0f0', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{dashboard?.total || 0}</div>
          <div style={{ color: '#666' }}>Total Tasks</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{dashboard?.by_status?.done || 0}</div>
          <div style={{ color: '#666' }}>Completed</div>
        </div>
        <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{dashboard?.by_status?.in_progress || 0}</div>
          <div style={{ color: '#666' }}>In Progress</div>
        </div>
        <div style={{ background: '#fce4ec', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{dashboard?.by_priority?.urgent || 0}</div>
          <div style={{ color: '#666' }}>Urgent</div>
        </div>
      </div>

      {/* Filters - no debounce, triggers re-fetch immediately */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <select value={filter.status || ''} onChange={e => setFilter({...filter, status: e.target.value || null})}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filter.priority || ''} onChange={e => setFilter({...filter, priority: e.target.value || null})}>
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="created_at">Newest First</option>
          <option value="priority">By Priority</option>
        </select>
      </div>

      {/* Task list - renders ALL tasks, no virtualization */}
      <div>
        {sortedTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={(id, status) => {
              // Optimistic update? No, just refetch everything
              fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
              }).then(() => {
                // Refetch ALL tasks and dashboard
                fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
                  .then(r => r.json()).then(setTasks);
                fetch('/api/dashboard', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
                  .then(r => r.json()).then(setDashboard);
              });
            }}
          />
        ))}
      </div>

      {/* User stats */}
      <h2 style={{ marginTop: '24px', marginBottom: '12px' }}>Team</h2>
      {dashboard?.users?.map((u, i) => (
        <UserStats key={i} user={u} />
      ))}
    </div>
  );
}
