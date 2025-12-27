import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TeachingMode, 
  TeachingAction, 
  EngagementLevel, 
  LogEntry, 
  SessionData 
} from './types';
import { 
  SUBJECTS, 
  StartIcon, 
  StopIcon, 
  KlimtCircle 
} from './constants';

const App: React.FC = () => {
  // Session State
  const [isActive, setIsActive] = useState(false);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [systemTime, setSystemTime] = useState(new Date());
  
  // Tracking State
  const [activeMode, setActiveMode] = useState<TeachingMode | null>(null);
  const [modeDurations, setModeDurations] = useState<Record<string, number>>({
    [TeachingMode.LECTURE]: 0,
    [TeachingMode.DISCUSSION]: 0,
    [TeachingMode.PRACTICE]: 0,
    [TeachingMode.DIGITAL]: 0,
  });
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({
    [TeachingAction.ENCOURAGE]: 0,
    [TeachingAction.CORRECT]: 0,
    [TeachingAction.OPEN_Q]: 0,
    [TeachingAction.CLOSED_Q]: 0,
    [TeachingAction.PATROL]: 0,
  });
  
  // Logs and Metadata
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [engagement, setEngagement] = useState<EngagementLevel>('mid');
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showSummary, setShowSummary] = useState(false);
  const [warningFlash, setWarningFlash] = useState(false);

  // Refs for timers
  // Fix: Use any to avoid NodeJS namespace error in browser environment
  const timerRef = useRef<any>(null);
  const inactivityRef = useRef<any>(null);

  // System Clock
  useEffect(() => {
    const clock = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Mode Timer & Inactivity Logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (activeMode) {
          setModeDurations(prev => ({
            ...prev,
            [activeMode]: prev[activeMode] + 1
          }));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, activeMode]);

  // Engagement Warning System (5 minutes)
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const now = Date.now();
      if (isActive && (now - lastInteraction > 300000)) { // 5 minutes
        setWarningFlash(true);
      } else {
        setWarningFlash(false);
      }
    }, 10000);
    return () => clearInterval(checkInactivity);
  }, [isActive, lastInteraction]);

  const addLog = useCallback((type: LogEntry['type'], label: string, detail?: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      type,
      label,
      detail
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    setLastInteraction(Date.now());
    setWarningFlash(false);
  }, []);

  const handleToggleSession = () => {
    if (!isActive) {
      setIsActive(true);
      setStartTime(new Date());
      setLogs([]);
      setModeDurations({
        [TeachingMode.LECTURE]: 0,
        [TeachingMode.DISCUSSION]: 0,
        [TeachingMode.PRACTICE]: 0,
        [TeachingMode.DIGITAL]: 0,
      });
      setActionCounts({
        [TeachingAction.ENCOURAGE]: 0,
        [TeachingAction.CORRECT]: 0,
        [TeachingAction.OPEN_Q]: 0,
        [TeachingAction.CLOSED_Q]: 0,
        [TeachingAction.PATROL]: 0,
      });
      addLog('note', '觀課開始', `科目：${subject}`);
    } else {
      setIsActive(false);
      setActiveMode(null);
      addLog('note', '觀課結束');
      setShowSummary(true);
    }
  };

  const handleModeClick = (mode: TeachingMode) => {
    if (!isActive) return;
    if (activeMode === mode) {
      setActiveMode(null);
      addLog('mode', '停止模式', mode);
    } else {
      setActiveMode(mode);
      addLog('mode', '切換模式', mode);
    }
  };

  const handleActionClick = (action: TeachingAction) => {
    if (!isActive) return;
    setActionCounts(prev => ({
      ...prev,
      [action]: prev[action] + 1
    }));
    addLog('action', action);
  };

  const handleSendNote = () => {
    if (!currentNote.trim()) return;
    addLog('note', '質性筆記', currentNote);
    setCurrentNote('');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const generateReport = () => {
    let report = `Chronos 觀課紀錄報告\n`;
    report += `========================\n`;
    report += `科目：${subject}\n`;
    report += `開始時間：${startTime?.toLocaleString('zh-TW')}\n`;
    report += `結束時間：${new Date().toLocaleString('zh-TW')}\n\n`;
    
    report += `[教學模式統計]\n`;
    // Fix: Cast sec to number as Object.entries value can be inferred as unknown
    Object.entries(modeDurations).forEach(([mode, sec]) => {
      report += `- ${mode}: ${formatTime(sec as number)}\n`;
    });
    
    report += `\n[教學行為次數]\n`;
    Object.entries(actionCounts).forEach(([action, count]) => {
      report += `- ${action}: ${count} 次\n`;
    });
    
    report += `\n[詳細紀錄流]\n`;
    logs.slice().reverse().forEach(log => {
      report += `[${log.timestamp}] ${log.label}${log.detail ? ': ' + log.detail : ''}\n`;
    });
    
    return report;
  };

  const downloadReport = () => {
    const content = generateReport();
    const blob = new Blob(["\ufeff" + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `觀課紀錄_${subject}_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generateReport());
    alert('已複製到剪貼簿');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Klimt Background Elements */}
      <KlimtCircle className="w-64 h-64 -top-20 -left-20" />
      <KlimtCircle className="w-96 h-96 -bottom-40 -right-40" />
      <div className="absolute top-1/4 right-10 w-4 h-4 bg-amber-500/20 rotate-45" />
      <div className="absolute bottom-1/4 left-10 w-6 h-6 border border-amber-500/30 rounded-sm" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel h-20 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold tracking-tighter klimt-text flex items-center gap-2">
            <span className="text-amber-500">CHRONOS</span>
            <span className="text-xs font-light text-slate-400 border-l border-slate-700 pl-2 uppercase tracking-widest hidden sm:inline">Dashboard</span>
          </h1>
          <select 
            disabled={isActive}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 transition-all"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4 sm:gap-10">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-slate-500 font-mono">SYSTEM TIME</span>
            <span className="text-xl font-mono text-amber-500/80">
              {systemTime.toLocaleTimeString('zh-TW', { hour12: false })}
            </span>
          </div>

          <button 
            onClick={handleToggleSession}
            className="group relative flex items-center justify-center transition-transform active:scale-95"
          >
            {isActive ? <StopIcon /> : <StartIcon />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left: Teaching Modes */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            教學模式 (States)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {Object.values(TeachingMode).map(mode => (
              <button
                key={mode}
                onClick={() => handleModeClick(mode)}
                className={`p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group relative overflow-hidden ${
                  activeMode === mode 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col items-start z-10">
                  <span className={`text-sm font-medium ${activeMode === mode ? 'text-amber-400' : 'text-slate-300'}`}>
                    {mode}
                  </span>
                  <span className="text-2xl font-mono font-bold">
                    {formatTime(modeDurations[mode])}
                  </span>
                </div>
                {activeMode === mode && (
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
                )}
                {/* Geometric accents */}
                <div className="absolute top-0 right-0 w-8 h-8 opacity-5">
                   <svg viewBox="0 0 40 40"><path d="M0 0 L40 40 M40 0 L0 40" stroke="currentColor" fill="none" /></svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right: Actions and Log */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-red-800 rounded-full" />
              教學行為 (Actions)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {Object.values(TeachingAction).map(action => (
                <button
                  key={action}
                  onClick={() => handleActionClick(action)}
                  className="bg-slate-900/40 border border-slate-800 hover:bg-slate-800/60 hover:border-slate-600 p-4 rounded-xl transition-all flex flex-col items-center gap-2 group active:scale-95"
                >
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{action}</span>
                  <span className="text-3xl font-mono font-bold text-red-700 group-hover:text-red-500 transition-colors">
                    {actionCounts[action]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              即時紀錄流 (Log Stream)
            </h2>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl h-64 overflow-y-auto p-4 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">
                  等待紀錄中...
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-4 items-start border-l-2 border-slate-800 pl-4 py-1 hover:border-amber-500/50 transition-colors">
                      <span className="text-[10px] font-mono text-slate-500 mt-1">{log.timestamp}</span>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          log.type === 'action' ? 'text-red-400' : 
                          log.type === 'mode' ? 'text-amber-400' : 'text-slate-200'
                        }`}>
                          {log.label}
                        </span>
                        {log.detail && <span className="text-xs text-slate-500 italic">{log.detail}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className={`sticky bottom-0 z-40 glass-panel border-t transition-all duration-500 ${
        warningFlash ? 'border-amber-500 animate-pulse bg-amber-500/10' : 'border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Engagement Slider */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">學生專注度 (Engagement)</span>
              {warningFlash && <span className="text-[10px] font-bold text-amber-500 animate-bounce">請更新現況!</span>}
            </div>
            <div className="flex gap-1">
              {(['low', 'mid', 'high'] as const).map(level => {
                const colors = { low: 'bg-red-500/20 text-red-500 border-red-500/30', mid: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', high: 'bg-green-500/20 text-green-500 border-green-500/30' };
                const activeColors = { low: 'bg-red-500 text-white border-red-500', mid: 'bg-yellow-500 text-white border-yellow-500', high: 'bg-green-500 text-white border-green-500' };
                return (
                  <button
                    key={level}
                    onClick={() => {
                      setEngagement(level);
                      addLog('engagement', `專注度：${level.toUpperCase()}`);
                    }}
                    className={`flex-1 py-1 text-[10px] rounded border transition-all ${
                      engagement === level ? activeColors[level] : colors[level]
                    }`}
                  >
                    {level === 'low' ? '低' : level === 'mid' ? '中' : '高'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div className="md:col-span-8 flex gap-2">
            <input 
              type="text"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
              placeholder="輸入質性觀察筆記..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
            <button 
              onClick={handleSendNote}
              disabled={!currentNote.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
            >
              發送
            </button>
          </div>
        </div>
      </footer>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowSummary(false)} />
          <div className="relative glass-panel rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-amber-500/30 shadow-2xl">
            <div className="klimt-gradient p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">觀課總結報告</h3>
                <p className="text-xs opacity-80">{subject} | {startTime?.toLocaleDateString('zh-TW')}</p>
              </div>
              <button onClick={() => setShowSummary(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">教學模式分佈</h4>
                  <div className="space-y-2">
                    {/* Fix: Cast sec to number as Object.entries value can be inferred as unknown */}
                    {Object.entries(modeDurations).map(([mode, sec]) => (
                      <div key={mode} className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">{mode}</span>
                        <span className="text-sm font-mono text-amber-500">{formatTime(sec as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">教學行為計數</h4>
                  <div className="space-y-2">
                    {Object.entries(actionCounts).map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">{action}</span>
                        <span className="text-sm font-mono text-red-500">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">原始紀錄預覽</h4>
                <div className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto bg-black/30 p-3 rounded-lg border border-slate-800">
                  {generateReport()}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex gap-3">
              <button 
                onClick={copyReport}
                className="flex-1 border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white font-bold py-3 rounded-xl transition-all"
              >
                複製紀錄
              </button>
              <button 
                onClick={downloadReport}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                下載 TXT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;