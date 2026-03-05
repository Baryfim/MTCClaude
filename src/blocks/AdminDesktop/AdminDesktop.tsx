import React, { useState, useEffect } from 'react';
import { Monitor, Maximize2, Minimize2, Settings, Terminal, X } from 'lucide-react';
import styles from './AdminDesktop.module.scss';
import { apiRequestWithAuth } from '../../lib/api';

interface AdminDesktopProps {
  vmId: number;
  vmName?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: (isFullscreen: boolean) => void;
  onSwitchToConsole?: () => void;
  canSwitchToConsole?: boolean;
  onClose?: () => void;
}

export const AdminDesktop: React.FC<AdminDesktopProps> = ({ 
  vmId, 
  vmName = 'VM',
  isFullscreen: externalFullscreen,
  onToggleFullscreen,
  onSwitchToConsole,
  canSwitchToConsole,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [showStats, setShowStats] = useState(true);
  const [guiUrl, setGuiUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuiUrl = async () => {
      try {
        const response = await apiRequestWithAuth<{ url: string }>('GET', `/v1/resources/${vmId}/console/gui/`);
        setGuiUrl(response.url);
      } catch (error) {
        console.error('Ошибка получения GUI URL:', error);
      }
    };
    fetchGuiUrl();
  }, [vmId]);

  const toggleFullscreen = () => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    onToggleFullscreen?.(newFullscreen);
    
    if (newFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {onClose && (
            <button onClick={onClose} className={styles.closeButton} title="Close">
              <X className="w-5 h-5" />
            </button>
          )}
          <Monitor className={styles.monitorIcon} />
          <span className={styles.title}>Remote Desktop - {vmName}</span>
          <span className={styles.vmId}>{vmId}</span>
        </div>
        <div className={styles.toolbarRight}>
          {canSwitchToConsole && (
            <button onClick={onSwitchToConsole} className={styles.switchButton} title="Switch to Console">
              <Terminal className="w-4 h-4" />
              <span>Console</span>
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSettings(!showSettings)} className={styles.settingsButton} title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className={styles.settingsPanel}>
                <h3>Desktop Settings</h3>
                
                <div className={styles.settingsGroup}>
                  <label>Video Quality</label>
                  <div className={styles.qualityButtons}>
                    <button 
                      onClick={() => setQuality('low')}
                      className={quality === 'low' ? styles.active : ''}
                    >
                      Low
                    </button>
                    <button 
                      onClick={() => setQuality('medium')}
                      className={quality === 'medium' ? styles.active : ''}
                    >
                      Medium
                    </button>
                    <button 
                      onClick={() => setQuality('high')}
                      className={quality === 'high' ? styles.active : ''}
                    >
                      High
                    </button>
                  </div>
                </div>

                <div className={styles.settingsGroup}>
                  <label>Display Options</label>
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className={`${styles.toggleButton} ${showStats ? styles.active : ''}`}
                  >
                    {showStats ? 'Hide' : 'Show'} Performance Stats
                  </button>
                </div>

                <button onClick={() => setShowSettings(false)} className={styles.closeSettingsButton}>
                  Close Settings
                </button>
              </div>
            )}
          </div>
          <button onClick={toggleFullscreen} className={styles.fullscreenButton} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className={styles.desktopView}>
        {guiUrl ? (
          <iframe 
            src={guiUrl} 
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              display: 'block'
            }}
            title="Remote Desktop"
          />
        ) : (
          <div className={styles.desktopContent}>
            <div className={styles.desktopCenter}>
              <div className={styles.iconBox}>
                <Monitor className="w-16 h-16 text-blue-400" />
              </div>
              <h2 className={styles.desktopTitle}>Загрузка...</h2>
              <p className={styles.desktopSubtitle}>Подключение к удаленному рабочему столу</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
