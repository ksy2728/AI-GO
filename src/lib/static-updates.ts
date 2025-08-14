// 정적 호스팅용 실시간 업데이트 대체 방안

import React from 'react';

export interface StaticUpdateConfig {
  interval: number; // 업데이트 간격 (초)
  endpoint?: string; // 외부 API 엔드포인트 (선택사항)
}

/**
 * 정적 사이트용 주기적 데이터 업데이트
 * Socket.IO 대신 polling 방식 사용
 */
export class StaticUpdater {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * 주기적 업데이트 시작
   */
  startPolling(
    key: string,
    callback: () => void | Promise<void>,
    config: StaticUpdateConfig
  ) {
    // 기존 interval 정리
    this.stopPolling(key);

    // 새로운 interval 시작
    const interval = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Update failed for ${key}:`, error);
      }
    }, config.interval * 1000);

    this.intervals.set(key, interval);
  }

  /**
   * 특정 업데이트 중지
   */
  stopPolling(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  /**
   * 모든 업데이트 중지
   */
  stopAll() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

// 전역 인스턴스
export const staticUpdater = new StaticUpdater();

/**
 * React Hook: 정적 호스팅용 실시간 업데이트
 */
export function useStaticUpdates(
  key: string,
  updateFunction: () => void | Promise<void>,
  interval: number = 30 // 기본 30초
) {
  React.useEffect(() => {
    staticUpdater.startPolling(key, updateFunction, { interval });
    
    return () => {
      staticUpdater.stopPolling(key);
    };
  }, [key, updateFunction, interval]);
}

/**
 * 외부 API를 통한 데이터 페칭 (정적 호스팅용)
 */
export async function fetchExternalData(url: string) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // CORS 처리
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('External API fetch failed:', error);
    return null;
  }
}

/**
 * GitHub Pages, Netlify 등 정적 호스팅 플랫폼별 최적화
 */
export const staticHostingConfig = {
  // GitHub Pages 설정
  githubPages: {
    basePath: process.env.NODE_ENV === 'production' ? '/ai-go' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/ai-go' : '',
  },
  
  // Netlify 설정
  netlify: {
    redirects: [
      {
        from: '/api/*',
        to: '/404',
        status: 404,
      },
    ],
  },
  
  // Vercel 정적 배포 설정
  vercel: {
    output: 'export',
    trailingSlash: true,
  },
};