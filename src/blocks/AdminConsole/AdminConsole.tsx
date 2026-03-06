import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Maximize2, Minimize2, Settings, Monitor, X, ChevronDown, ChevronUp, Cpu, HardDrive, Activity, Flame } from 'lucide-react';
import styles from './AdminConsole.module.scss';
import { apiRequestWithAuth } from '../../lib/api';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { fetchVMMetricsAsync, selectVMMetricsById } from '../../lib/slices/vmMetricsSlice';

interface AdminConsoleProps {
  vmId: number;
  vmName?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: (isFullscreen: boolean) => void;
  onSwitchToDesktop?: () => void;
  canSwitchToDesktop?: boolean;
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ 
  vmId, 
  vmName = 'VM',
  isFullscreen: externalFullscreen,
  onToggleFullscreen,
  onSwitchToDesktop,
  canSwitchToDesktop,
  onClose,
  isMinimized = false,
  onToggleMinimize
}) => {
  const dispatch = useAppDispatch();
  const vmMetrics = useAppSelector(selectVMMetricsById(vmId));
  
  console.log('🖥️ [AdminConsole] VM Metrics для vmId', vmId, ':', vmMetrics);
  
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'green' | 'blue' | 'amber'>('green');
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    { type: 'output', text: `Connected to ${vmName} (${vmId})` },
    { type: 'output', text: 'Ubuntu 22.04.1 LTS' },
    { type: 'output', text: '' },
    { type: 'output', text: 'Welcome to Ubuntu. Type "help" for available commands.' },
    { type: 'output', text: '' },
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Загрузить метрики при монтировании и периодически обновлять
  useEffect(() => {
    dispatch(fetchVMMetricsAsync(vmId));
    
    const interval = setInterval(() => {
      dispatch(fetchVMMetricsAsync(vmId));
    }, 10000); // Обновлять каждые 10 секунд
    
    return () => clearInterval(interval);
  }, [vmId, dispatch]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    setHistory(prev => [...prev, { type: 'input', text: `root@${vmName}:~$ ${trimmedCmd}` }]);

    if (!trimmedCmd) return;

    // Локальная команда clear
    if (trimmedCmd.toLowerCase() === 'clear') {
      setHistory([{ type: 'output', text: '' }]);
      return;
    }

    // Локальная команда help
    if (trimmedCmd.toLowerCase() === 'help') {
      const helpText = [
        'Available commands:',
        '',
        '  clear      - Clear the terminal screen',
        '  help       - Show this help message',
        '  ls         - List directory contents',
        '  pwd        - Print working directory',
        '  cd         - Change directory',
        '  cat        - Display file contents',
        '  echo       - Display a line of text',
        '  mkdir      - Create directory',
        '  rm         - Remove files or directories',
        '  cp         - Copy files',
        '  mv         - Move/rename files',
        '  touch      - Create empty file',
        '  grep       - Search text patterns',
        '  find       - Search for files',
        '  ps         - Show running processes',
        '  top        - Display system resources',
        '  df         - Show disk space usage',
        '  free       - Display memory usage',
        '  uname      - Print system information',
        '',
        'Note: Most standard Linux commands are available.',
        ''
      ];
      helpText.forEach(line => {
        setHistory(prev => [...prev, { type: 'output', text: line }]);
      });
      return;
    }

    try {
      const response = await apiRequestWithAuth<{ stdout: string; stderr: string; exit_code: number }>(
        'POST',
        `/v1/resources/${vmId}/exec/`,
        { cmd: trimmedCmd }
      );

      const output = response.stderr || response.stdout || '';
      setHistory(prev => [...prev, { type: 'output', text: output }, { type: 'output', text: '' }]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Command execution failed';
      setHistory(prev => [...prev, { type: 'output', text: `Error: ${errorMsg}` }, { type: 'output', text: '' }]);
    }
  };

  const toggleFullscreen = () => {
    // Если окно минимизировано, сначала развернуть
    if (isMinimized && onToggleMinimize) {
      onToggleMinimize();
      // Подождать немного, чтобы анимация развертывания завершилась
      setTimeout(() => {
        enterFullscreen();
      }, 100);
      return;
    }
    
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    onToggleFullscreen?.(newFullscreen);
    
    if (newFullscreen) {
      document.documentElement.requestFullscreen().catch(err => 
        console.error('Error attempting to enable fullscreen:', err)
      );
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };
  
  const enterFullscreen = () => {
    setIsFullscreen(true);
    onToggleFullscreen?.(true);
    document.documentElement.requestFullscreen().catch(err => 
      console.error('Error attempting to enable fullscreen:', err)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommand(input);
    setInput('');
  };

  const emulateHighLoad = () => {
    setInput('yes > /dev/null');
  };

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''} ${isMinimized ? styles.minimized : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {onClose && (
            <button onClick={onClose} className={styles.closeButton} title="Close">
              <X className="w-5 h-5" />
            </button>
          )}
          <Terminal className={`${styles.terminalIcon} ${styles[theme]}`} />
          <span className={styles.title}>Console - {vmName}</span>
          <span className={styles.vmId}>{vmId}</span>
        </div>
        <div className={styles.headerRight}>
          {canSwitchToDesktop && (
            <button onClick={onSwitchToDesktop} className={styles.switchButton} title="Switch to Desktop">
              <Monitor className="w-4 h-4" />
              <span>Desktop</span>
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSettings(!showSettings)} className={styles.settingsButton} title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className={styles.settingsPanel}>
                <h3>Console Settings</h3>
                
                <div className={styles.settingsGroup}>
                  <label>Font Size</label>
                  <div className={styles.fontSizeControls}>
                    <button onClick={() => setFontSize(Math.max(10, fontSize - 2))}>-</button>
                    <span>{fontSize}px</span>
                    <button onClick={() => setFontSize(Math.min(24, fontSize + 2))}>+</button>
                  </div>
                </div>

                <div className={styles.settingsGroup}>
                  <label>Theme</label>
                  <div className={styles.themeButtons}>
                    <button 
                      onClick={() => setTheme('green')} 
                      className={`${styles.green} ${theme === 'green' ? styles.active : ''}`}
                    >
                      Green
                    </button>
                    <button 
                      onClick={() => setTheme('blue')} 
                      className={`${styles.blue} ${theme === 'blue' ? styles.active : ''}`}
                    >
                      Blue
                    </button>
                    <button 
                      onClick={() => setTheme('amber')} 
                      className={`${styles.amber} ${theme === 'amber' ? styles.active : ''}`}
                    >
                      Amber
                    </button>
                  </div>
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
          {onToggleMinimize && (
            <button onClick={onToggleMinimize} className={styles.minimizeButton} title={isMinimized ? "Expand" : "Minimize"}>
              {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {vmMetrics && (
            <div className={styles.metricsBar}>
              <div className={styles.metric}>
                <Cpu className="w-4 h-4" />
                <span className={styles.metricLabel}>CPU:</span>
                <span className={styles.metricValue}>{(vmMetrics.cpu_percent ?? 0).toFixed(2)}%</span>
              </div>
              <div className={styles.metric}>
                <Activity className="w-4 h-4" />
                <span className={styles.metricLabel}>RAM:</span>
                <span className={styles.metricValue}>
                  {vmMetrics.memory_used_mb ?? 0} / {vmMetrics.memory_limit_mb ?? vmMetrics.ram_mb} MB
                  {vmMetrics.memory_limit_mb && vmMetrics.memory_limit_mb > 0 && (
                    <span className={styles.metricPercent}>
                      ({(((vmMetrics.memory_used_mb ?? 0) / vmMetrics.memory_limit_mb) * 100).toFixed(2)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.metric}>
                <HardDrive className="w-4 h-4" />
                <span className={styles.metricLabel}>Disk:</span>
                <span className={styles.metricValue}>
                  {vmMetrics.disk_used_mb ?? 0} MB / {vmMetrics.disk_limit_bytes ? (vmMetrics.disk_limit_bytes / (1024 * 1024 * 1024)).toFixed(1) : vmMetrics.storage} GB
                  {vmMetrics.disk_limit_bytes && vmMetrics.disk_limit_bytes > 0 && (
                    <span className={styles.metricPercent}>
                      ({((((vmMetrics.disk_used_mb ?? 0) * 1024 * 1024) / vmMetrics.disk_limit_bytes) * 100).toFixed(2)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className={`${styles.metric} ${styles.status}`}>
                <span className={`${styles.statusDot} ${vmMetrics.online ? styles.online : styles.offline}`}></span>
                <span className={styles.metricLabel}>{vmMetrics.online ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          )}
          
          <div ref={terminalRef} className={styles.terminal} style={{ fontSize: `${fontSize}px` }}>
            {history.map((line, idx) => (
              <div 
                key={idx} 
                className={`${styles.terminalLine} ${line.type === 'input' ? styles.input : `${styles.output} ${styles[theme]}`}`}
              >
                {line.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <span className={`${styles.inputPrompt} ${styles[theme]}`}>root@{vmName}:~$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.commandInput}
              placeholder="Type a command..."
              autoFocus
            />
            <button 
              onClick={emulateHighLoad}
              className={styles.highLoadButton}
              title="Эмулировать адскую нагрузку (yes > /dev/null)"
              type="button"
            >
              <Flame className={styles.flameIcon} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
