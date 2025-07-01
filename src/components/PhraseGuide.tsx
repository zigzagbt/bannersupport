import React, { useState } from 'react';
import FooterNav from './FooterNav';

interface PhraseGuideProps {
  onBack: () => void;
  onHome: () => void;
}

// 형용사별 자연스러운 꼬리(명사/표현) 사전
const adjTails: Record<string, string[]> = {
  '따뜻한': ['하루', '느낌', '무드', '감성', '스타일', '하루의 시작', '분위기', '계절'],
  '포근한': ['느낌', '하루', '감성', '분위기', '무드', '스타일'],
  '말랑한': ['촉감', '느낌', '감성', '하루', '분위기'],
  '단정한': ['룩', '하루', '분위기', '스타일', '실루엣'],
  '시크한': ['무드', '실루엣', '분위기', '룩', '스타일'],
  '여유로운': ['하루', '분위기', '느낌', '감성', '시간'],
  '부드러운': ['촉감', '느낌', '분위기', '감성', '착용감'],
  '빈티지한': ['감성', '무드', '스타일', '분위기'],
  '감각적인': ['컬러', '하루', '분위기', '감성', '스타일'],
  '차분한': ['느낌', '분위기', '하루', '감성', '무드'],
  '스포티한': ['룩', '무드', '스타일', '감성'],
  '톡톡한': ['포인트', '느낌', '감성', '무드'],
  '유연한': ['실루엣', '느낌', '분위기', '감성'],
  '가벼운': ['착용감', '느낌', '하루', '분위기'],
  '내추럴한': ['무드', '분위기', '감성', '스타일'],
  '도톰한': ['촉감', '느낌', '감성', '분위기'],
  '날렵한': ['실루엣', '분위기', '무드'],
  '세련된': ['실루엣', '분위기', '무드', '룩', '감성', '스타일'],
  '소프트한': ['느낌', '감성', '분위기', '착용감'],
  '모던한': ['무드', '분위기', '스타일', '감성'],
  '트렌디한': ['룩', '감성', '분위기', '스타일'],
  '깔끔한': ['룩', '분위기', '스타일', '감성'],
  '귀여운': ['포인트', '분위기', '감성', '룩'],
  '클래식한': ['무드', '분위기', '스타일', '감성'],
  '로맨틱한': ['무드', '분위기', '감성', '하루'],
  '활동적인': ['하루', '룩', '분위기', '감성'],
  '실용적인': ['룩', '감성', '분위기', '스타일'],
  '사랑스러운': ['분위기', '감성', '하루', '포인트'],
  '힙한': ['무드', '룩', '감성', '분위기'],
  '청량한': ['느낌', '하루', '분위기', '감성'],
  '꾸안꾸': ['감성', '스타일', '분위기', '룩'],
  '데일리필수': ['아이템', '룩', '스타일'],
  '데일리픽': ['아이템', '룩', '스타일'],
};

const adjectives = Object.keys(adjTails);

const situations = [
  '출근길에', '약속 있는 날', '하루 종일', '늦잠 잔 날', '퇴근 후', '주말마다', 
  '비 오는 날', '날씨 애매한 날', '기분 전환할 때', '첫 만남에', '계절 바뀔 때', 
  '사진 찍는 날', '날이 쌀쌀해질 때', '소풍 가는 날', '데이트할 때', 
  '옷 고르기 귀찮을 때', '기본템 찾을 때', '매일 입고 싶을 때', '여행 갈 때', 
  '편하게 입고 싶을 때'
];

const templates = {
  feeling: [
    '{adjTail}',
    '{adjTail} 가득',
    '{adjTail} 연출',
    '{adjTail} 무드',
    '{adjTail} 감성',
    '{adjTail} 분위기',
    '{adjTail} 포인트',
    '{adjTail} 컬러',
    '{adjTail} 조합',
    '{adjTail} 마무리',
    '{adjTail}(으)로 완성하는 하루',
    '{adjTail}(으)로 물드는 계절',
    '{adjTail}(으)로 시작하는 아침',
    '{adjTail}(으)로 마무리되는 하루',
  ],
  situation: [
    '{situation} {adjTail}',
    '{adjTail} {situation}',
    '{situation}엔 {adjTail}',
    '{adjTail} {situation}룩',
    '{adjTail} {situation} 코디',
    '{situation}에 {adjTail} 추천',
    '{situation}에 {adjTail} 감성',
    '{situation}에 {adjTail} 무드',
    '{situation}에 {adjTail} 포인트',
    '{situation}에 어울리는 {adjTail}',
    '{situation}에 딱 맞는 {adjTail}',
    '{situation}을 위한 {adjTail}',
    '{situation}에 완성하는 {adjTail}',
  ],
  benefit: [
    '{adjTail} 활용',
    '{adjTail} 추천템',
    '{adjTail} 스타일링',
    '{adjTail} 완성',
    '{adjTail} 입기 좋은 날',
    '{adjTail} 실용템',
    '{adjTail} 데일리룩',
    '{adjTail}(으)로 핏 완성',
    '{adjTail}(으)로 분위기 업',
    '{adjTail}(으)로 스타일링',
    '{adjTail}(으)로 매일 새롭게',
    '{adjTail}(으)로 계절 준비',
    '{adjTail}(으)로 감각적인 하루',
    '{adjTail}(으)로 스타일 완성',
  ]
};

function makeAdjTailPhrase(adj: string) {
  const tails = adjTails[adj] || [];
  if (tails.length === 0) return '';
  const tail = tails[Math.floor(Math.random() * tails.length)];
  if (adj.endsWith('한') || adj.endsWith('적인')) {
    return `${adj} ${tail}`;
  }
  return `${adj}${tail}`;
}

function generateTypedPhrases(type: 'feeling' | 'situation' | 'benefit', adjectives: string[], situations: string[], count: number): string[] {
  const phrases: string[] = [];
  let tryCount = 0;
  while (phrases.length < count && tryCount < 100) {
    tryCount++;
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const situation = situations[Math.floor(Math.random() * situations.length)];
    const adjTail = makeAdjTailPhrase(adj);
    if (!adjTail) continue;
    const templateArr = templates[type];
    const template = templateArr[Math.floor(Math.random() * templateArr.length)];
    let phrase = template
      .replace('{adjTail}', adjTail)
      .replace('{situation}', situation);
    if (
      phrase.trim().split(' ').length > 1 &&
      !phrases.includes(phrase) &&
      !/([가-힣]+한)\1/.test(phrase) &&
      !phrase.includes('하게하게') &&
      !phrase.includes('적인하게') &&
      !phrase.includes('소프트한 느낌') &&
      !phrase.includes('실용적인하게')
    ) {
      phrases.push(phrase);
    }
  }
  return phrases;
}

const PhraseGuide: React.FC<PhraseGuideProps> = ({ onBack, onHome }) => {
  const [generated, setGenerated] = useState<{
    feeling: string[];
    situation: string[];
    benefit: string[];
  }>({ feeling: [], situation: [], benefit: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyType, setCopyType] = useState<'mypage' | 'ribbon'>('mypage');

  // 글자수 기준 필터
  const filterByLength = (phrases: string[]) => {
    const maxLen = copyType === 'mypage' ? 26 : 18;
    return phrases.filter(p => p.replace(/\n/g, '').length <= maxLen);
  };

  const generatePhrases = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGenerated({
        feeling: filterByLength(generateTypedPhrases('feeling', adjectives, situations, 8)).slice(0, 4),
        situation: filterByLength(generateTypedPhrases('situation', adjectives, situations, 8)).slice(0, 4),
        benefit: filterByLength(generateTypedPhrases('benefit', adjectives, situations, 8)).slice(0, 4),
      });
      setIsGenerating(false);
    }, 800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\n/g, ' '));
    alert('클립보드에 복사되었습니다!');
  };

  return (
    <div>
      <div className="card">
        <div className="flex" style={{ alignItems: 'center', marginBottom: '20px' }}>
          {onBack && (
            <button onClick={onBack} style={{ background: '#e0e7ef', color: '#2563eb', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginRight: 8 }}>
              ← 뒤로가기
            </button>
          )}
          <button className="btn-home" onClick={onHome}>
            🏠 홈
          </button>
          <h2 style={{ marginLeft: '20px', fontSize: '1.6rem', color: '#1e293b' }}>
            문구 추천
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '16px 0', justifyContent: 'center' }}>
          <label style={{ fontWeight: 500, color: '#1e293b' }}>
            <input
              type="radio"
              checked={copyType === "mypage"}
              onChange={() => setCopyType("mypage")}
              style={{ marginRight: 6 }}
            />
            마이페이지 배너 (13자×2줄)
          </label>
          <label style={{ fontWeight: 500, color: '#1e293b' }}>
            <input
              type="radio"
              checked={copyType === "ribbon"}
              onChange={() => setCopyType("ribbon")}
              style={{ marginRight: 6 }}
            />
            띠배너 (18자 1줄)
          </label>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            문구 생성
          </h3>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '15px' }}>
            자연스럽고 감각적인 긴 문구를 한 번에 생성합니다.
          </p>
          <button 
            className="btn" 
            style={{ fontSize: '1.1rem', padding: '12px 32px', background: '#3b82f6', color: 'white', fontWeight: 600, borderRadius: 8 }}
            onClick={generatePhrases}
            disabled={isGenerating}
          >
            {isGenerating ? '생성 중...' : '문구 생성하기'}
          </button>
        </div>

        {(generated.feeling.length > 0 || generated.situation.length > 0 || generated.benefit.length > 0) && (
          <div className="mb-20">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>생성된 문구</h3>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>
              <div>
                <h4 style={{ color: '#3b82f6', fontWeight: 700, marginBottom: 10 }}>느낌 중심</h4>
                {generated.feeling.map((phrase, idx) => (
                  <div key={idx} className="card" style={{ padding: '14px', marginBottom: '10px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: 500, marginBottom: '8px', whiteSpace: 'pre-line' }}>{phrase}</div>
                    <button className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '6px 14px', alignSelf: 'flex-end' }} onClick={() => copyToClipboard(phrase)}>
                      복사
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{ color: '#059669', fontWeight: 700, marginBottom: 10 }}>상황 중심</h4>
                {generated.situation.map((phrase, idx) => (
                  <div key={idx} className="card" style={{ padding: '14px', marginBottom: '10px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: 500, marginBottom: '8px', whiteSpace: 'pre-line' }}>{phrase}</div>
                    <button className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '6px 14px', alignSelf: 'flex-end' }} onClick={() => copyToClipboard(phrase)}>
                      복사
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{ color: '#f59e42', fontWeight: 700, marginBottom: 10 }}>혜택 강조형</h4>
                {generated.benefit.map((phrase, idx) => (
                  <div key={idx} className="card" style={{ padding: '14px', marginBottom: '10px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: 500, marginBottom: '8px', whiteSpace: 'pre-line' }}>{phrase}</div>
                    <button className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '6px 14px', alignSelf: 'flex-end' }} onClick={() => copyToClipboard(phrase)}>
                      복사
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>참고 키워드</h3>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: '#3b82f6' }}>형용사</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {adjectives.map((adj, index) => (
                  <span key={index} style={{ background: '#e0e7ef', color: '#2563eb', borderRadius: '12px', padding: '4px 12px', fontSize: '0.95rem', fontWeight: 500 }}>{adj}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: '#3b82f6' }}>상황</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {situations.map((sit, index) => (
                  <span key={index} style={{ background: '#e0e7ef', color: '#059669', borderRadius: '12px', padding: '4px 12px', fontSize: '0.95rem', fontWeight: 500 }}>{sit}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterNav onHome={onHome} onBack={onBack} />
    </div>
  );
};

export default PhraseGuide;
