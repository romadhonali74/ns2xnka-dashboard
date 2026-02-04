"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface CacheData {
  [key: string]: {
    data: any;
    timestamp: number;
    expiry: number;
  };
}

interface CacheContextType {
  getCache: (key: string) => any | null;
  setCacheData: (key: string, data: any, expiryMinutes?: number) => void;
  clearCache: (key?: string) => void;
  hasValidCache: (key: string) => boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function CacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<CacheData>({});

  const getCache = (key: string) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.expiry) {
      // Remove expired cache
      const newCache = { ...cache };
      delete newCache[key];
      setCache(newCache);
      return null;
    }
    
    return cached.data;
  };

  const setCacheData = (key: string, data: any, expiryMinutes: number = 5) => {
    const now = Date.now();
    const expiry = now + (expiryMinutes * 60 * 1000);
    
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: now,
        expiry
      }
    }));
  };

  const clearCache = (key?: string) => {
    if (key) {
      const newCache = { ...cache };
      delete newCache[key];
      setCache(newCache);
    } else {
      setCache({});
    }
  };

  const hasValidCache = (key: string) => {
    const cached = cache[key];
    if (!cached) return false;
    return Date.now() <= cached.expiry;
  };

  return (
    <CacheContext.Provider value={{ getCache, setCacheData, clearCache, hasValidCache }}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}