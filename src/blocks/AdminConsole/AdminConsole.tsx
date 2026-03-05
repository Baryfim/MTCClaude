import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Maximize2, Minimize2, Settings, Monitor, X } from 'lucide-react';
import styles from './AdminConsole.module.scss';
import { apiRequestWithAuth } from '../../lib/api';

interface AdminConsoleProps {
  vmId: number;
  vmName?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: (isFullscreen: boolean) => void;
  onSwitchToDesktop?: () => void;
  canSwitchToDesktop?: boolean;
  onClose?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ 
  vmId, 
  vmName = 'VM',
  isFullscreen: externalFullscreen,
  onToggleFullscreen,
  onSwitchToDesktop,
  canSwitchToDesktop,
  onClose
}) => {
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
  const [cliUrl, setCliUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCliUrl = async () => {
      try {
        const response = await apiRequestWithAuth<{ url: string }>('GET', `/v1/resources/${vmId}/console/cli/`);
        setCliUrl(response.url);
      } catch (error) {
        console.error('Ошибка получения CLI URL:', error);
      }
    };
    fetchCliUrl();
  }, [vmId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    setHistory(prev => [...prev, { type: 'input', text: `root@${vmName}:~$ ${trimmedCmd}` }]);

    if (!trimmedCmd) return;

    const commands: Record<string, string> = {
      help: 'Available commands:\n  ls - list files\n  pwd - print working directory\n  date - show current date\n  uptime - show system uptime\n  clear - clear screen\n  help - show this help',
      ls: 'Documents  Downloads  Pictures  Videos  projects',
      pwd: '/root',
      date: new Date().toString(),
      uptime: 'up 2 days, 5 hours, 23 minutes'
    };

    if (trimmedCmd.toLowerCase() === 'clear') {
      setHistory([{ type: 'output', text: '' }]);
      return;
    }

    const output = commands[trimmedCmd.toLowerCase()] || `bash: ${trimmedCmd}: command not found`;
    setHistory(prev => [...prev, { type: 'output', text: output }, { type: 'output', text: '' }]);
  };

  const toggleFullscreen = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommand(input);
    setInput('');
  };

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
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
        </div>
      </div>

      {cliUrl ? (
        <iframe 
          src={cliUrl} 
          style={{ 
            width: '100%', 
            height: 'calc(100% - 60px)',
            border: 'none',
            display: 'block'
          }}
          title="Remote Console"
        />
      ) : (
        <>
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
          </form>
        </>
      )}
    </div>
  );
};
