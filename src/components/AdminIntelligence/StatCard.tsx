import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color = '#60a5fa' }) => {
  return (
    <motion.div
      className="admin-stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      style={{ borderLeftColor: color }}
    >
      <div className="admin-stat-icon" style={{ background: color + '15', color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="admin-stat-info">
        <div className="admin-stat-value" style={{ color }}>{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </motion.div>
  );
};
