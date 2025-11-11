import React, { useState, useEffect } from "react";

interface FooterNavProps {
  onHome: () => void;
  onBack?: () => void;
  onAdminModeChange?: () => void; // 관리자 모드 변경 시 콜백
}

const FooterNav: React.FC<FooterNavProps> = ({ onHome, onBack, onAdminModeChange }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 권한 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      const authorized = localStorage.getItem('isAuthorized') === 'true';
      setIsAuthorized(authorized);
    };
    checkAuth();
    // localStorage 변경 감지
    const interval = setInterval(checkAuth, 100);
    return () => clearInterval(interval);
  }, []);

  // 비밀번호 확인
  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (password === '8282') {
      localStorage.setItem('isAuthorized', 'true');
      setIsAuthorized(true);
      setPasswordError('');
      setShowPasswordModal(false);
      setPassword('');
      if (onAdminModeChange) {
        onAdminModeChange();
      }
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  // 관리자 모드 해제
  const handleLogout = () => {
    localStorage.removeItem('isAuthorized');
    setIsAuthorized(false);
    if (onAdminModeChange) {
      onAdminModeChange();
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100%',
        background: '#f1f5f9',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '18px 20px',
        zIndex: 100,
        gap: 16
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
        <div style={{
          position: 'absolute',
          right: 20
        }}>
          {isAuthorized ? (
            <button
              onClick={handleLogout}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer'
              }}
            >
              🔓 관리자 모드 해제
            </button>
          ) : (
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer'
              }}
            >
              🔒 관리자 모드
            </button>
          )}
        </div>
      </div>

      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              marginBottom: '12px',
              color: '#1e293b',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              🔒 관리자 인증
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '0.95rem',
              marginBottom: '24px',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              관리자 모드를 활성화하려면<br />
              비밀번호를 입력해주세요.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="비밀번호 입력"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  border: passwordError ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  marginBottom: passwordError ? '8px' : '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              {passwordError && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {passwordError}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FooterNav; 