import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserSession {
  id: string;
  username: string;
  email: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  platform: string;
  vmCount: number;
  isActive: boolean;
}

interface SessionContextType {
  sessions: UserSession[];
  addSession: (session: Omit<UserSession, 'id' | 'loginTime' | 'lastActivity'>) => void;
  updateSession: (id: string, updates: Partial<UserSession>) => void;
  removeSession: (id: string) => void;
  terminateSession: (id: string) => void;
  getTotalSessions: () => number;
  getActiveSessions: () => number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within SessionProvider');
  }
  return context;
};

// Генерация фейковых сессий для демонстрации
const generateMockSessions = (): UserSession[] => {
  const usernames = ['ivan_petrov', 'maria_smith', 'alex_dev', 'olga_admin', 'dmitry_tech', 'anna_user', 'sergey_pro'];
  const emails = [
    'ivan@example.com',
    'maria@company.com',
    'alex@dev.io',
    'olga@admin.net',
    'dmitry@tech.com',
    'anna@user.org',
    'sergey@pro.com'
  ];
  const platforms = ['AWS', 'Azure', 'Google Cloud'];
  const ips = ['192.168.1.', '10.0.0.', '172.16.0.'];

  return Array.from({ length: 7 }, (_, i) => {
    const now = new Date();
    const loginTime = new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000); // последние 12 часов
    const lastActivity = new Date(now.getTime() - Math.random() * 60 * 60 * 1000); // последний час

    return {
      id: `session-${i + 1}`,
      username: usernames[i],
      email: emails[i],
      loginTime,
      lastActivity,
      ipAddress: `${ips[Math.floor(Math.random() * ips.length)]}${Math.floor(Math.random() * 255)}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      vmCount: Math.floor(Math.random() * 5) + 1,
      isActive: Math.random() > 0.3 // 70% активных
    };
  });
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<UserSession[]>(() => {
    // Пытаемся загрузить из localStorage
    const stored = localStorage.getItem('userSessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((s: any) => ({
          ...s,
          loginTime: new Date(s.loginTime),
          lastActivity: new Date(s.lastActivity)
        }));
      } catch (e) {
        console.error('Error parsing sessions:', e);
      }
    }
    return generateMockSessions();
  });

  // Сохраняем в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('userSessions', JSON.stringify(sessions));
  }, [sessions]);

  // Обновляем lastActivity для активных сессий каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev => prev.map(session => {
        if (session.isActive && Math.random() > 0.5) {
          return {
            ...session,
            lastActivity: new Date()
          };
        }
        return session;
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const addSession = (sessionData: Omit<UserSession, 'id' | 'loginTime' | 'lastActivity'>) => {
    const newSession: UserSession = {
      ...sessionData,
      id: `session-${Date.now()}`,
      loginTime: new Date(),
      lastActivity: new Date()
    };
    setSessions(prev => [...prev, newSession]);
  };

  const updateSession = (id: string, updates: Partial<UserSession>) => {
    setSessions(prev => prev.map(session =>
      session.id === id ? { ...session, ...updates } : session
    ));
  };

  const removeSession = (id: string) => {
    setSessions(prev => prev.filter(session => session.id !== id));
  };

  const terminateSession = (id: string) => {
    updateSession(id, { isActive: false });
  };

  const getTotalSessions = () => sessions.length;

  const getActiveSessions = () => sessions.filter(s => s.isActive).length;

  return (
    <SessionContext.Provider
      value={{
        sessions,
        addSession,
        updateSession,
        removeSession,
        terminateSession,
        getTotalSessions,
        getActiveSessions
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
