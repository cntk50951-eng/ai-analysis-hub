import React from 'react';

interface ConfidenceRingProps {
  score: number;
  size?: number;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({ score, size = 64 }) => {
  const percentage = Math.min(Math.max(score, 0), 1);
  const deg = percentage * 360;

  let color = '#ef4444';
  if (percentage >= 0.75) color = '#22c55e';
  else if (percentage >= 0.5) color = '#eab308';

  return (
    <div className="confidence-ring" style={{ width: size, height: size }}>
      <div
        className="confidence-ring-bg"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `conic-gradient(${color} ${deg}deg, rgba(71,85,105,0.2) ${deg}deg)`,
          maskImage: 'radial-gradient(transparent 58%, black 60%)',
          WebkitMaskImage: 'radial-gradient(transparent 58%, black 60%)',
        }}
      />
      <div className="confidence-ring-text">
        <span className="confidence-value" style={{ color, fontSize: size * 0.22 }}>
          {(percentage * 100).toFixed(0)}
        </span>
        <span className="confidence-label" style={{ fontSize: size * 0.1 }}>%</span>
      </div>
    </div>
  );
};
