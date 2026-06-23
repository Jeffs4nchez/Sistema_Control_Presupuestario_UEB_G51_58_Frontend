import React from 'react';

export const SkeletonText = ({ width = '100%', height = '1rem', count = 1, _className = '' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width,
            height,
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonCircle = ({ width = '40px', height = '40px' }) => {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: '50%',
      }}
    />
  );
};

export const SkeletonCard = ({ count = 3 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <SkeletonText width="60%" height="1.25rem" />
          <div style={{ marginTop: '1rem' }}>
            <SkeletonText width="100%" height="0.875rem" count={3} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonTableRow = ({ columns = 5, rows = 5 }) => {
  return (
    <div
      style={{
        borderCollapse: 'collapse',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem',
          gap: '1rem',
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={i} width="100%" height="0.875rem" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            padding: '1rem',
            gap: '1rem',
            borderBottom: rowIdx !== rows - 1 ? '1px solid var(--border-color)' : 'none',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonText key={colIdx} width="100%" height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonUserCard = ({ count = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <SkeletonCircle width="50px" height="50px" />
          <div style={{ flex: 1 }}>
            <SkeletonText width="40%" height="1rem" />
            <div style={{ marginTop: '0.5rem' }}>
              <SkeletonText width="60%" height="0.875rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonStatCard = ({ count = 3 }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <SkeletonText width="60%" height="0.875rem" />
          <div style={{ marginTop: '1rem' }}>
            <SkeletonText width="40%" height="2rem" />
          </div>
        </div>
      ))}
    </div>
  );
};
