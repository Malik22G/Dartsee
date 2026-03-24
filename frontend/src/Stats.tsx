import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { api, GameTypeStats } from './api';

const COLORS = ['#4F46E5', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981'];

function Stats() {
  const [stats, setStats] = useState<GameTypeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getGameTypeStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading statistics...</div>;
  if (error) return <div className="error">{error}</div>;

  const totalGames = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="container">
      <h2>Game Popularity Statistics</h2>
      
      <div className="stats-container">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={stats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [`${value} games`, props.payload.type]}
                contentStyle={{
                  backgroundColor: 'var(--dark-teal)',
                  border: '1px solid var(--dark-cyan)',
                  borderRadius: '8px',
                  color: 'var(--wheat)'
                }}
              />
              <Legend 
                formatter={(value, entry) => `${entry.payload.type}`}
                wrapperStyle={{ color: 'var(--wheat)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-summary">
          <h3>Summary</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Total Games</span>
              <span className="summary-value">{totalGames}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Game Types</span>
              <span className="summary-value">{stats.length}</span>
            </div>
          </div>
          
          <div className="stats-list">
            {stats.map((stat, index) => (
              <div key={stat.type} className="stat-item">
                <div 
                  className="stat-color" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="stat-type">{stat.type}</span>
                <span className="stat-count">{stat.count} games</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;