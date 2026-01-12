import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '60px 20px', 
      color: '#888',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '8px',
      border: '1px dashed #444',
      width: '100%'
    }}>
      <div style={{ marginBottom: '16px', opacity: 0.5, color: '#ccc' }}>
        {React.cloneElement(icon as React.ReactElement, { size: 48 })}
      </div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#eee' }}>{title}</h3>
      {description && (
        <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: '8px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
