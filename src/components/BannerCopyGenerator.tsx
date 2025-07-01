import React, { useState, useRef, DragEvent } from "react";
// @ts-ignore
import ColorThief from "color-thief-browser";
import FooterNav from './FooterNav';

// --- Helper Functions ---
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function getLuminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function getContrast(rgb1: number[], rgb2: number[]) {
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}
function colorDistance(a: number[], b: number[]) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}
function filterSimilarColors(palette: number[][], threshold = 40) {
  const result: number[][] = [];
  palette.forEach(color => {
    if (!result.some(existing => colorDistance(existing, color) < threshold)) {
      result.push(color);
    }
  });
  return result;
}
function rgbToSimpleColor([r, g, b]: number[]): string {
  if (r > 200 && g < 100 && b < 100) return "red";
  if (r > 200 && g > 120 && b < 80) return "orange";
  if (r > 200 && g > 200 && b < 100) return "yellow";
  if (g > 150 && r < 120 && b < 120) return "green";
  if (b > 180 && r < 120 && g < 180) return "blue";
  if (r > 150 && b > 150 && g < 120) return "purple";
  if (r > 200 && g < 150 && b > 180) return "pink";
  if (r > 100 && g > 70 && b < 50) return "brown";
  if (r < 60 && g < 60 && b < 60) return "black";
  if (r > 200 && g > 200 && b > 200) return "white";
  if (r > 150 && g > 150 && b > 150) return "gray";
  return "gray";
}
const getRandomUnique = <T,>(arr: T[], n: number) => {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

const styles = ['미니멀', '프렌치', '걸리시', '베이직', '스트릿', '페미닌', '모던', '클래식', '매니시한', '유니크한', '도회적인', '보이시한', '젠더리스'];
const fits = styles;
const moods: string[] = [
  '고요한', '무심한', '따뜻한', '쿨한', '말랑한', '깔끔한', '세련된', '청순한', '활기찬', '차분한', '성숙한', '경쾌한', '우아한', '담백한', '정돈된', '간결한', '절제된', '엣지있는', '자유로운', '시크한', '스포티한', '개성있는', '매트한', '글로시한', '코지한', '탄탄한', '여리여리한', '소장가치 있는', '감도높은', '청키한', '정제된', '기품있는', '정갈한', '클린한', '퓨어한', '보이시한', '중성적인'
];
const situations: string[] = ['출근', '데일리', '여행', '데이트', '주말', '소풍', '약속', '휴가', '파티', '캠퍼스', '하객룩', '홈웨어'];
const seasons = ['여름', '간절기', '올시즌', '한여름', '봄', '가을', '겨울'];
const nouns = ['실루엣', '텍스처', '컬러감', '포인트', '디테일', '라인', '핏', '무드', '스타일'];

interface BannerCopyGeneratorProps {
  onHome: () => void;
  onBack?: () => void;
  onNavigate?: (guide: string) => void;
  version?: 'v1' | 'v2';
}

const BannerCopyGenerator: React.FC<BannerCopyGeneratorProps> = ({ onHome, onBack, onNavigate, version = 'v1' }) => {
  // ... (여기에 이전에 사용하던 useState, useRef, 핸들러, generate 함수, UI 등 전체 코드가 들어갑니다. 실제 복구 시 전체 컴포넌트 코드를 붙여넣으세요) ...
  return (
    <div>
      {/* 상단 네비게이션 영역 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        {onBack && (
          <button onClick={onBack} style={{ background: '#e0e7ef', color: '#2563eb', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginRight: 8 }}>
            ← 뒤로가기
          </button>
        )}
        <button onClick={onHome} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
          <span role="img" aria-label="home">🏠</span> 홈
        </button>
        <h2 style={{ marginLeft: '16px', fontSize: '1.5rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }} onClick={onHome}>
          🖼️ 배너 이미지 문구 추천
        </h2>
      </div>
    </div>
  );
};

export default BannerCopyGenerator;
export {};
