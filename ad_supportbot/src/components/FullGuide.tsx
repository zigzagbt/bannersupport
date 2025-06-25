import React from 'react';

interface FullGuideProps {
  onBack: () => void;
  onHome: () => void;
}

const FullGuide: React.FC<FullGuideProps> = ({ onBack, onHome }) => {
  const guideSections = [
    {
      title: '🎨 배경 고르는 법',
      content: [
        '• 제품 이미지에서 자연스러운 색상 추출하기',
        '• 톤온톤 vs 톤인톤 스타일 이해하기',
        '• 추천 컬러 팔레트 활용하기',
        '• 브랜드 아이덴티티와 일치하는 색상 선택'
      ]
    },
    {
      title: '📝 폰트 & 대비 기준',
      content: [
        '• 텍스트 가독성을 위한 대비 비율 계산',
        '• 배경 대비 2.15 기준점 이해하기',
        '• 폰트 크기와 두께 조절 방법',
        '• 모바일에서의 가독성 확인'
      ]
    },
    {
      title: '📦 PNG 저장법',
      content: [
        '• 포토샵에서 투명 배경 PNG 저장하기',
        '• PNG-24 vs PNG-8 차이점 이해',
        '• 웹용 저장 단축키 활용하기',
        '• 파일 크기 최적화 방법'
      ]
    },
    {
      title: '💬 문구 추천',
      content: [
        '• 할인/이벤트 강조 문구',
        '• 후기 기반 신뢰 유도 문구',
        '• FOMO 클릭 유도 문구',
        '• 마이페이지 맞춤 문구'
      ]
    },
    {
      title: '📱 모바일 최적화',
      content: [
        '• 모바일 화면 크기에 맞는 비율',
        '• 터치 친화적인 버튼 크기',
        '• 빠른 로딩을 위한 파일 최적화',
        '• 다양한 기기 호환성 확인'
      ]
    },
    {
      title: '⚡ 작업 효율성',
      content: [
        '• PSD 템플릿 활용하기',
        '• 레이어 구조화로 빠른 편집',
        '• 자주 사용하는 요소 저장하기',
        '• 일관된 디자인 시스템 구축'
      ]
    }
  ];

  const faqItems = [
    {
      question: '배너 크기는 어떻게 정하나요?',
      answer: 'ZIGZAG에서는 일반적으로 1200x400px (3:1 비율)을 권장합니다. 모바일 최적화를 위해 세로 비율도 고려해보세요.'
    },
    {
      question: '어떤 폰트를 사용해야 하나요?',
      answer: '가독성이 좋은 산세리프 폰트를 추천합니다. Noto Sans KR, 나눔고딕, 프리텐다드 등이 인기가 있습니다.'
    },
    {
      question: '파일 크기는 얼마나 작게 해야 하나요?',
      answer: '웹 배너는 500KB 이하를 권장합니다. PNG-24 사용 시 파일 크기가 클 수 있으니 필요에 따라 JPG도 고려해보세요.'
    },
    {
      question: '투명 배경이 필요한가요?',
      answer: '배너가 다양한 배경에 배치될 예정이라면 투명 배경 PNG를 사용하는 것이 좋습니다.'
    }
  ];

  return (
    <div>
      <div className="card">
        <div className="flex" style={{ alignItems: 'center', marginBottom: '20px' }}>
          <button className="btn btn-secondary" onClick={onBack}>
            ← 뒤로가기
          </button>
          <button className="btn-home" onClick={onHome}>
            🏠 홈
          </button>
          <h2 style={{ marginLeft: '20px', fontSize: '1.6rem', color: '#1e293b' }}>
            📚 전체 가이드 한눈에 보기
          </h2>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            배너 제작에 필요한 모든 정보를 한 번에 보고 싶으시다면:
          </h3>
          
          <div className="card" style={{ 
            background: '#3b82f6',
            color: 'white',
            textAlign: 'center',
            padding: '30px'
          }}>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b', fontWeight: '600' }}>
              완벽한 배너 제작 가이드
            </h4>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              셀러를 위한 모든 배너 제작 노하우를 한 곳에서 확인하세요
            </p>
          </div>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            ✅ 포함 내용
          </h3>
          
          <div className="grid">
            {guideSections.map((section, index) => (
              <div key={index} className="card" style={{ padding: '20px' }}>
                <h4 style={{ 
                  fontSize: '1.2rem', 
                  marginBottom: '15px', 
                  color: '#1e293b',
                  fontWeight: '600'
                }}>
                  {section.title}
                </h4>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0,
                  margin: 0
                }}>
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} style={{ 
                      color: '#64748b', 
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      marginBottom: '8px',
                      paddingLeft: '0'
                    }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            ❓ 자주 묻는 질문 (FAQ)
          </h3>
          
          <div className="card">
            {faqItems.map((faq, index) => (
              <div key={index} style={{ 
                borderBottom: index < faqItems.length - 1 ? '1px solid #e9ecef' : 'none',
                padding: '20px 0'
              }}>
                <h4 style={{ 
                  fontSize: '1.1rem', 
                  marginBottom: '10px', 
                  color: '#1e293b',
                  fontWeight: '600'
                }}>
                  Q. {faq.question}
                </h4>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  paddingLeft: '20px'
                }}>
                  A. {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            🎯 체크리스트
          </h3>
          
          <div className="card">
            <div className="grid">
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#1e293b' }}>
                  📐 디자인 체크
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 적절한 여백 확보</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 텍스트 가독성 확인</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 색상 대비 검토</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 브랜드 일관성 유지</li>
                </ul>
              </div>
              
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#1e293b' }}>
                  📱 기술 체크
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 파일 크기 최적화</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 모바일 호환성 확인</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 투명 배경 적용</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 로딩 속도 테스트</li>
                </ul>
              </div>
              
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#1e293b' }}>
                  📝 콘텐츠 체크
                </h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 문구 오타 확인</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 링크 정상 작동</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ CTA 버튼 명확성</li>
                  <li style={{ marginBottom: '8px', color: '#64748b' }}>☐ 법적 고지사항 포함</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="tip">
          <strong>💡 추가 도움이 필요하시다면:</strong><br/>
          • 각 섹션별 상세 가이드를 확인해보세요<br/>
          • PSD 템플릿을 활용하여 빠르게 제작하세요<br/>
          • 실시간 컬러 테스트로 완벽한 조합을 찾아보세요
        </div>
      </div>
    </div>
  );
};

export default FullGuide; 