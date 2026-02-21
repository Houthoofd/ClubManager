import React from 'react';

interface PasswordStrengthIndicatorProps {
  strength: number;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ strength }) => {
  const getStrengthColor = () => {
    if (strength < 3) return '#dc3545';
    if (strength < 6) return '#ffc107';
    return '#28a745';
  };
  
  const getStrengthText = () => {
    if (strength < 3) return 'Faible';
    if (strength < 6) return 'Moyen';
    return 'Fort';
  };
  
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: '#e9ecef',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(strength / 8) * 100}%`,
          height: '100%',
          backgroundColor: getStrengthColor(),
          transition: 'all 0.3s ease'
        }} />
      </div>
      <small style={{ color: getStrengthColor(), fontWeight: 600 }}>
        Force: {getStrengthText()}
      </small>
    </div>
  );
};
