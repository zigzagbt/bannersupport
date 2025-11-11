import React, { useState, useEffect } from 'react';
import FooterNav from './FooterNav';
import { getAllStats, resetStats, ToolType, getAverageSessionTime, getAverageGradientOpacity, getMostUsedGradientOpacity } from '../utils/usageStats';

interface UsageStatsProps {
  onHome: () => void;
  onBack: () => void;
}

const UsageStats: React.FC<UsageStatsProps> = ({ onHome, onBack }) => {
  const [stats, setStats] = useState(getAllStats());
  const [showResetConfirm, setShowResetConfirm] = useState<ToolType | null>(null);

  // 통계 새로고침
  const refreshStats = () => {
    setStats(getAllStats());
  };

  // 통계 초기화
  const handleReset = (toolType: ToolType) => {
    resetStats(toolType);
    refreshStats();
    setShowResetConfirm(null);
  };

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <div className="card text-center mb-8">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
          📊 사용 통계
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          스플래시와 메인배너 도우미 사용 현황을 확인하세요
        </p>
      </div>

      <div className="grid">
        {/* 스플래시 통계 */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: 600 }}>
              📱 스플래시 도우미
            </h3>
            <button
              onClick={() => setShowResetConfirm(showResetConfirm === 'splash' ? null : 'splash')}
              style={{
                padding: '6px 12px',
                background: showResetConfirm === 'splash' ? '#ef4444' : '#f1f5f9',
                color: showResetConfirm === 'splash' ? '#fff' : '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {showResetConfirm === 'splash' ? '취소' : '초기화'}
            </button>
          </div>

          {showResetConfirm === 'splash' && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#991b1b', fontSize: '13px' }}>
                정말 초기화하시겠습니까?
              </span>
              <button
                onClick={() => handleReset('splash')}
                style={{
                  padding: '4px 12px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                확인
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                사용 횟수
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                {stats.splash.usageCount}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                Export 횟수
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>
                {stats.splash.exportCount}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                평균 사용 시간
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                {getAverageSessionTime('splash')}분
              </span>
            </div>

            <div style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>마지막 사용</span>
                <div style={{ color: '#1e293b', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                  {formatDate(stats.splash.lastUsed)}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>마지막 Export</span>
                <div style={{ color: '#1e293b', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                  {formatDate(stats.splash.lastExported)}
                </div>
              </div>
            </div>

            {/* 그라데이션 투명도 통계 */}
            <div style={{
              padding: '12px 16px',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#0369a1', fontSize: '13px', fontWeight: 600 }}>
                  그라데이션 투명도 통계
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>평균 투명도</span>
                  <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>
                    {getAverageGradientOpacity().toFixed(2)}
                  </span>
                </div>
                {getMostUsedGradientOpacity() !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>가장 많이 사용</span>
                    <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>
                      {getMostUsedGradientOpacity()!.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 메인배너 통계 */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: 600 }}>
              🎯 메인배너 도우미
            </h3>
            <button
              onClick={() => setShowResetConfirm(showResetConfirm === 'main-banner' ? null : 'main-banner')}
              style={{
                padding: '6px 12px',
                background: showResetConfirm === 'main-banner' ? '#ef4444' : '#f1f5f9',
                color: showResetConfirm === 'main-banner' ? '#fff' : '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {showResetConfirm === 'main-banner' ? '취소' : '초기화'}
            </button>
          </div>

          {showResetConfirm === 'main-banner' && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#991b1b', fontSize: '13px' }}>
                정말 초기화하시겠습니까?
              </span>
              <button
                onClick={() => handleReset('main-banner')}
                style={{
                  padding: '4px 12px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                확인
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                사용 횟수
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                {stats['main-banner'].usageCount}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                Export 횟수
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>
                {stats['main-banner'].exportCount}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                평균 사용 시간
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                {getAverageSessionTime('main-banner')}분
              </span>
            </div>

            <div style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>마지막 사용</span>
                <div style={{ color: '#1e293b', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                  {formatDate(stats['main-banner'].lastUsed)}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>마지막 Export</span>
                <div style={{ color: '#1e293b', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                  {formatDate(stats['main-banner'].lastExported)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 새로고침 버튼 */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={refreshStats}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          🔄 통계 새로고침
        </button>
      </div>

      <FooterNav onHome={onHome} onBack={onBack} />
    </div>
  );
};

export default UsageStats;


