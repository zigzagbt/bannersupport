import React from "react";

interface FooterNavProps {
  onHome: () => void;
  onBack?: () => void;
}

const FooterNav: React.FC<FooterNavProps> = ({ onHome, onBack }) => (
  <div style={{
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100%',
    background: '#f1f5f9',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    padding: '18px 0',
    zIndex: 100
  }}>
    <button
      onClick={onBack}
      disabled={!onBack}
      style={{
        background: '#e0e7ef',
        color: '#2563eb',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        fontWeight: 600,
        fontSize: 15,
        cursor: onBack ? 'pointer' : 'not-allowed',
        opacity: onBack ? 1 : 0.5
      }}
    >
      ← 뒤로가기
    </button>
    <button onClick={onHome} style={{
      background: '#22c55e',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 16px',
      fontWeight: 600,
      fontSize: 15,
      cursor: 'pointer'
    }}>
      🏠 홈
    </button>
  </div>
);

export default FooterNav; 