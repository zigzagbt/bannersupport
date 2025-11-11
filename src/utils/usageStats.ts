// 사용 통계 관리 유틸리티

export type ToolType = 'splash' | 'main-banner';

export interface UsageStats {
  usageCount: number; // 사용 횟수 (이미지 업로드)
  exportCount: number; // Export 횟수
  lastUsed?: string; // 마지막 사용 시간 (ISO string)
  lastExported?: string; // 마지막 Export 시간 (ISO string)
  // 세션 정보
  sessionDurations?: number[]; // 세션 길이 배열 (밀리초)
  totalSessions?: number; // 총 세션 수
  // 스플래시 도우미 전용
  gradientOpacities?: number[]; // 그라데이션 투명도 배열 (0-1)
}

const STORAGE_KEY_PREFIX = 'usage_stats_';

// 통계 가져오기
export const getStats = (toolType: ToolType): UsageStats => {
  const key = `${STORAGE_KEY_PREFIX}${toolType}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const stats = JSON.parse(stored);
      // 기존 데이터 호환성을 위해 기본값 설정
      return {
        usageCount: stats.usageCount || 0,
        exportCount: stats.exportCount || 0,
        lastUsed: stats.lastUsed,
        lastExported: stats.lastExported,
        sessionDurations: stats.sessionDurations || [],
        totalSessions: stats.totalSessions || 0,
        gradientOpacities: stats.gradientOpacities || [],
      };
    } catch {
      return { usageCount: 0, exportCount: 0, sessionDurations: [], totalSessions: 0, gradientOpacities: [] };
    }
  }
  return { usageCount: 0, exportCount: 0, sessionDurations: [], totalSessions: 0, gradientOpacities: [] };
};

// 사용 횟수 증가
export const incrementUsage = (toolType: ToolType): void => {
  const stats = getStats(toolType);
  stats.usageCount += 1;
  stats.lastUsed = new Date().toISOString();
  saveStats(toolType, stats);
};

// Export 횟수 증가
export const incrementExport = (toolType: ToolType): void => {
  const stats = getStats(toolType);
  stats.exportCount += 1;
  stats.lastExported = new Date().toISOString();
  saveStats(toolType, stats);
};

// 통계 저장
const saveStats = (toolType: ToolType, stats: UsageStats): void => {
  const key = `${STORAGE_KEY_PREFIX}${toolType}`;
  localStorage.setItem(key, JSON.stringify(stats));
};

// 통계 초기화
export const resetStats = (toolType: ToolType): void => {
  const key = `${STORAGE_KEY_PREFIX}${toolType}`;
  localStorage.removeItem(key);
};

// 모든 통계 가져오기
export const getAllStats = (): Record<ToolType, UsageStats> => {
  return {
    'splash': getStats('splash'),
    'main-banner': getStats('main-banner'),
  };
};

// 세션 시작
export const startSession = (toolType: ToolType): string => {
  const sessionId = `${toolType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionKey = `${STORAGE_KEY_PREFIX}session_${sessionId}`;
  localStorage.setItem(sessionKey, JSON.stringify({
    toolType,
    startTime: new Date().toISOString(),
    startTimestamp: Date.now()
  }));
  return sessionId;
};

// 세션 종료 및 통계 업데이트
export const endSession = (sessionId: string): void => {
  const sessionKey = `${STORAGE_KEY_PREFIX}session_${sessionId}`;
  const sessionData = localStorage.getItem(sessionKey);
  if (!sessionData) return;

  try {
    const session = JSON.parse(sessionData);
    const endTime = Date.now();
    const duration = endTime - session.startTimestamp;
    const toolType = session.toolType as ToolType;

    const stats = getStats(toolType);
    if (!stats.sessionDurations) stats.sessionDurations = [];
    if (!stats.totalSessions) stats.totalSessions = 0;

    stats.sessionDurations.push(duration);
    stats.totalSessions += 1;
    
    // 최근 100개 세션만 유지 (메모리 관리)
    if (stats.sessionDurations.length > 100) {
      stats.sessionDurations = stats.sessionDurations.slice(-100);
    }

    saveStats(toolType, stats);
    localStorage.removeItem(sessionKey);
  } catch (e) {
    console.error('Failed to end session:', e);
  }
};

// 평균 사용 시간 계산 (분 단위)
export const getAverageSessionTime = (toolType: ToolType): number => {
  const stats = getStats(toolType);
  if (!stats.sessionDurations || stats.sessionDurations.length === 0) {
    return 0;
  }
  const totalMs = stats.sessionDurations.reduce((sum, d) => sum + d, 0);
  const averageMs = totalMs / stats.sessionDurations.length;
  return Math.round((averageMs / 1000 / 60) * 10) / 10; // 분 단위, 소수점 1자리
};

// 그라데이션 투명도 기록 (스플래시 전용)
export const recordGradientOpacity = (opacity: number): void => {
  const stats = getStats('splash');
  if (!stats.gradientOpacities) stats.gradientOpacities = [];
  
  stats.gradientOpacities.push(opacity);
  
  // 최근 100개만 유지
  if (stats.gradientOpacities.length > 100) {
    stats.gradientOpacities = stats.gradientOpacities.slice(-100);
  }
  
  saveStats('splash', stats);
};

// 평균 그라데이션 투명도 계산
export const getAverageGradientOpacity = (): number => {
  const stats = getStats('splash');
  if (!stats.gradientOpacities || stats.gradientOpacities.length === 0) {
    return 0;
  }
  const sum = stats.gradientOpacities.reduce((s, o) => s + o, 0);
  return Math.round((sum / stats.gradientOpacities.length) * 100) / 100; // 소수점 2자리
};

// 가장 많이 사용된 그라데이션 투명도 (최빈값)
export const getMostUsedGradientOpacity = (): number | null => {
  const stats = getStats('splash');
  if (!stats.gradientOpacities || stats.gradientOpacities.length === 0) {
    return null;
  }
  
  // 0.05 단위로 반올림하여 그룹화
  const rounded = stats.gradientOpacities.map(o => Math.round(o * 20) / 20);
  const frequency: Record<number, number> = {};
  
  rounded.forEach(o => {
    frequency[o] = (frequency[o] || 0) + 1;
  });
  
  let maxFreq = 0;
  let mostUsed = null;
  Object.entries(frequency).forEach(([opacity, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mostUsed = parseFloat(opacity);
    }
  });
  
  return mostUsed;
};


