import React, { useState } from 'react';

interface PhraseGuideProps {
  onBack: () => void;
  onHome: () => void;
}

const defaultAdjectives = [
  '따뜻한','세련된','편안한','정돈된','포근한','자연스러운','부드러운','날렵한','감각적인','부담 없는','여유 있는','단정한','화사한','깔끔한','고급스러운','중독성 있는','실용적인','완성도 높은','추천받는','신선한'
];
const defaultSituations = [
  '출근길에','약속 있을 때','하루 종일','아침마다','퇴근 후','주말마다','첫 데이트에','여행갈 때','급할 때','입기 귀찮을 때','갑자기 추워진 날','비 오는 날','손이 자주 가는','이유 있는 선택으로','고민될 때'
];
const defaultProducts = [
  '니트','원피스','셔츠','팬츠','아우터','코트','가디건','블라우스','점퍼','슬랙스','립밤','블러셔','데일리템','이너웨어','데님'
];

function generatePhrases({
  adjectives,
  situations,
  products,
  sentenceCount = 2,
  maxLength = 18,
  outputCount = 3
}: {
  adjectives: string[],
  situations: string[],
  products: string[],
  sentenceCount: number,
  maxLength: number,
  outputCount: number
}) {
  const phrases: string[] = [];
  for (let i = 0; i < outputCount; i++) {
    let phrase = '';
    for (let j = 0; j < sentenceCount; j++) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const sit = situations[Math.floor(Math.random() * situations.length)];
      const prod = products[Math.floor(Math.random() * products.length)];
      let line = `${adj} ${sit} ${prod}`;
      if (line.length > maxLength) {
        line = line.slice(0, maxLength - 1) + '…';
      }
      phrase += (j > 0 ? '\n' : '') + line;
    }
    phrases.push(phrase);
  }
  return phrases;
}

const conceptAdjectiveMap: { [concept: string]: string[] } = {
  '데일리': ['편안한', '부드러운', '여유 있는', '자연스러운', '실용적인', '중독성 있는'],
  '오피스': ['세련된', '단정한', '깔끔한', '고급스러운', '정돈된', '완성도 높은'],
  '러블리': ['화사한', '포근한', '따뜻한', '감각적인', '부드러운', '여유 있는'],
  '캐주얼': ['편안한', '자연스러운', '실용적인', '중독성 있는', '여유 있는', '깔끔한'],
  '모던': ['세련된', '깔끔한', '고급스러운', '감각적인', '정돈된', '단정한'],
  '고급': ['고급스러운', '완성도 높은', '세련된', '감각적인', '추천받는', '단정한'],
  '스포티': ['활동적인', '경쾌한', '에너지 넘치는', '편안한', '실용적인', '중독성 있는'],
  '미니멀': ['깔끔한', '단정한', '정돈된', '여유 있는', '실용적인', '세련된'],
  '빈티지': ['감성적인', '따뜻한', '자연스러운', '포근한', '중독성 있는', '추천받는'],
  '페미닌': ['부드러운', '화사한', '따뜻한', '여유 있는', '감각적인', '고급스러운'],
};
const conceptList = Object.keys(conceptAdjectiveMap);

const PhraseGuide: React.FC<PhraseGuideProps> = ({ onBack, onHome }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const [sentenceCount, setSentenceCount] = useState(2);
  const [maxLength, setMaxLength] = useState(18);
  const [outputCount, setOutputCount] = useState(3);
  const [adjectives, setAdjectives] = useState(defaultAdjectives.join(', '));
  const [situations, setSituations] = useState(defaultSituations.join(', '));
  const [products, setProducts] = useState(defaultProducts.join(', '));
  const [generated, setGenerated] = useState<string[]>([]);
  const [selectedConcept, setSelectedConcept] = useState('');

  const phraseCategories = [
    {
      id: 'discount',
      title: '1️⃣ 할인/이벤트 강조',
      phrases: [
        '🔥 오늘만 특가! ~50% 할인',
        '⚡ 플래시 세일 진행중',
        '🎉 신규 고객 20% 할인',
        '💎 VIP 고객 전용 특가',
        '📅 기간 한정 특가',
        '🎁 구매 시 사은품 증정'
      ]
    },
    {
      id: 'review',
      title: '2️⃣ 후기 기반 신뢰 유도',
      phrases: [
        '⭐ 4.8점 고객 만족도',
        '💬 1000+ 후기 보기',
        '👍 베스트 리뷰어 추천',
        '🏆 연속 3년 베스트셀러',
        '💯 만족도 100% 보장',
        '👥 10만 고객이 선택한'
      ]
    },
    {
      id: 'fomo',
      title: '3️⃣ 클릭 유도형 (FOMO)',
      phrases: [
        '⏰ 마감 임박! 재고 소진',
        '🚨 마지막 기회 놓치지 마세요',
        '💥 오늘 하루만! 내일부터 가격 인상',
        '🔥 핫딜 마감 30분 전',
        '⚡ 빠른 구매가 관건!',
        '🎯 한정 수량 선착순'
      ]
    },
    {
      id: 'mypage',
      title: '4️⃣ 마이페이지 배너용',
      phrases: [
        '💝 내가 찜한 그 상품, 오늘 할인 중!',
        '🔥 1년 중 제일 핫해! ~90%',
        '😱 놓치면 후회할 베스트템',
        '📊 이번 달 인기템 TOP5',
        '🎁 나만을 위한 맞춤 추천',
        '⭐ 내 취향 저격 상품 모음'
      ]
    }
  ];

  const allPhrases = phraseCategories.flatMap(category => category.phrases);

  const filteredPhrases = searchQuery
    ? allPhrases.filter(phrase => phrase.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const suggestedKeywords = ['할인', '이벤트', '신상', '후기', '마감임박', '무료배송', '한정수량', '고객'];

  const handleGenerate = () => {
    const adjArr = adjectives.split(',').map(s => s.trim()).filter(Boolean);
    const sitArr = situations.split(',').map(s => s.trim()).filter(Boolean);
    const prodArr = products.split(',').map(s => s.trim()).filter(Boolean);
    setGenerated(
      generatePhrases({
        adjectives: adjArr,
        situations: sitArr,
        products: prodArr,
        sentenceCount,
        maxLength,
        outputCount
      })
    );
  };

  const handleConceptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const concept = e.target.value;
    setSelectedConcept(concept);
    if (conceptAdjectiveMap[concept]) {
      setAdjectives(conceptAdjectiveMap[concept].join(', '));
    }
  };

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
            ✨ 조건에 맞는 광고 문구 생성기
          </h2>
        </div>

        <div className="mb-20" style={{ background: '#f8fafc', borderRadius: '14px', padding: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <label style={{ fontWeight: 600 }}>문장 수</label><br/>
              <input type="number" min={1} max={5} value={sentenceCount} onChange={e => setSentenceCount(Number(e.target.value))} style={{ width: 60, padding: 4, borderRadius: 6, border: '1px solid #e5e7eb' }} /> 줄
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>글자 수 제한</label><br/>
              <input type="number" min={6} max={30} value={maxLength} onChange={e => setMaxLength(Number(e.target.value))} style={{ width: 60, padding: 4, borderRadius: 6, border: '1px solid #e5e7eb' }} /> 자
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>출력 개수</label><br/>
              <input type="number" min={1} max={10} value={outputCount} onChange={e => setOutputCount(Number(e.target.value))} style={{ width: 60, padding: 4, borderRadius: 6, border: '1px solid #e5e7eb' }} /> 개
            </div>
          </div>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 600 }}>상황/컨셉 선택</label><br/>
              <select value={selectedConcept} onChange={handleConceptChange} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: 6, fontSize: '1rem', marginBottom: 8 }}>
                <option value="">직접 입력</option>
                {conceptList.map(concept => (
                  <option key={concept} value={concept}>{concept}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 600 }}>형용사 리스트 (쉼표로 구분)</label><br/>
              <textarea value={adjectives} onChange={e => setAdjectives(e.target.value)} rows={2} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: 6, fontSize: '1rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 600 }}>상황 리스트 (쉼표로 구분)</label><br/>
              <textarea value={situations} onChange={e => setSituations(e.target.value)} rows={2} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: 6, fontSize: '1rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 600 }}>제품 리스트 (쉼표로 구분)</label><br/>
              <textarea value={products} onChange={e => setProducts(e.target.value)} rows={2} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: 6, fontSize: '1rem' }} />
            </div>
          </div>
          <button className="btn" style={{ fontSize: '1.1rem', padding: '12px 32px', background: '#3b82f6', color: 'white', fontWeight: 600, borderRadius: 8 }} onClick={handleGenerate}>
            문구 생성
          </button>
        </div>

        {generated.length > 0 && (
          <div className="mb-20" style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '12px' }}>생성된 문구</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {generated.map((phrase, idx) => (
                <div key={idx} style={{ background: '#fff', borderRadius: '8px', padding: '14px 18px', fontSize: '1.08rem', color: '#1e293b', fontWeight: 500, whiteSpace: 'pre-line', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{phrase}</span>
                  <button className="btn btn-secondary" style={{ marginLeft: '18px', fontSize: '0.9rem', padding: '7px 16px' }} onClick={() => navigator.clipboard.writeText(phrase)}>
                    복사
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            어떤 문구를 찾고 계신가요?
          </h3>
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="예: 할인, 신상, 무료배송"
            style={{ width: '100%', marginBottom: '15px' }}
          />

          <div style={{ marginBottom: '20px' }}>
            <span style={{ marginRight: '10px', color: '#64748b', fontSize: '0.9rem' }}>추천 키워드:</span>
            {suggestedKeywords.map(keyword => (
              <button
                key={keyword}
                className="btn-tag"
                onClick={() => setSearchQuery(keyword)}
              >
                #{keyword}
              </button>
            ))}
          </div>
        </div>

        {searchQuery && (
          <div className="mb-20">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
              🔍 '{searchQuery}' 검색 결과
            </h3>
            
            {filteredPhrases.length > 0 ? (
              <div className="card">
                <div className="grid">
                  {filteredPhrases.map((phrase, index) => (
                    <div key={index} className="card" style={{ padding: '15px' }}>
                      <p style={{ 
                        fontSize: '1rem', 
                        color: '#1e293b', 
                        fontWeight: '500',
                        lineHeight: '1.4'
                      }}>
                        {phrase}
                      </p>
                      <button 
                        className="btn btn-secondary" 
                        style={{ 
                          marginTop: '10px', 
                          fontSize: '0.8rem',
                          padding: '6px 12px'
                        }}
                        onClick={() => navigator.clipboard.writeText(phrase)}
                      >
                        복사하기
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>검색 결과가 없습니다. 다른 키워드로 검색해보세요.</p>
            )}
          </div>
        )}

        {!searchQuery && (
          <div className="tip">
            <strong>💡 이렇게 검색해보세요!</strong><br/>
            '오늘만', '마감', '추천', '고객' 등 상품이나 이벤트와 관련된 다양한 키워드로 검색하여 딱 맞는 문구를 찾아보세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default PhraseGuide; 