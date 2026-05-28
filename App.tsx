
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudyLog, User } from './types';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import InsightsPanel from './components/InsightsPanel';
import HabitResearcher from './components/HabitResearcher';
import PomodoroTimer from './components/PomodoroTimer';
import Auth from './components/Auth';
import { CloudAuth, CloudDB } from './services/cloudService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [view, setView] = useState<'overview' | 'log' | 'ai'>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingLog, setEditingLog] = useState<StudyLog | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | undefined>(undefined);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initApp = async () => {
      const activeUser = await CloudAuth.getCurrentUser();
      if (activeUser) {
        setUser(activeUser);
        setNewDisplayName(activeUser.displayName);
        setNewAvatarUrl(activeUser.avatarUrl);
        const userLogs = await CloudDB.getLogs(activeUser.email);
        setLogs(userLogs);

        const emailKey = activeUser.email.replace(/[.@]/g, '_');
        const savedView = localStorage.getItem(`academia_view_${emailKey}`) as any;
        if (savedView) setView(savedView);
      }

      const savedTheme = localStorage.getItem('academia_theme') as 'light' | 'dark';
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
      setIsRestoring(false);
    };
    initApp();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('academia_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    setIsMenuOpen(false);
  };

  const handleLogin = async (u: User) => {
    setUser(u);
    setNewDisplayName(u.displayName);
    setNewAvatarUrl(u.avatarUrl);
    setIsRestoring(true);
    const userLogs = await CloudDB.getLogs(u.email);
    setLogs(userLogs);
    setIsRestoring(false);
  };

  const handleLogout = async () => {
    await CloudAuth.logout();
    setUser(null);
    setLogs([]);
    setIsMenuOpen(false);
  };

  const handleSetView = (newView: 'overview' | 'log' | 'ai') => {
    setView(newView);
    if (user) {
      const emailKey = user.email.replace(/[.@]/g, '_');
      localStorage.setItem(`academia_view_${emailKey}`, newView);
    }
    setIsMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async () => {
    if (user && newDisplayName.trim()) {
      setIsSyncing(true);
      const updatedUser = await CloudAuth.updateProfile({
        ...user,
        displayName: newDisplayName,
        avatarUrl: newAvatarUrl
      });
      setUser(updatedUser);
      setIsEditingProfile(false);
      setIsMenuOpen(false);
      setIsSyncing(false);
    }
  };

  const saveToCloud = useCallback(async (newLogs: StudyLog[]) => {
    if (!user) return;
    setIsSyncing(true);
    await CloudDB.saveLogs(user.email, newLogs);
    setIsSyncing(false);
  }, [user]);

  const addLog = async (newLog: Omit<StudyLog, 'id'>) => {
    const log: StudyLog = {
      ...newLog,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updatedLogs = [log, ...logs];
    setLogs(updatedLogs);
    await saveToCloud(updatedLogs);
    handleSetView('overview');
  };

  const deleteLog = async (id: string) => {
    const updatedLogs = logs.filter(l => l.id !== id);
    setLogs(updatedLogs);
    await saveToCloud(updatedLogs);
  };

  const updateLog = async (updatedLog: StudyLog) => {
    const updatedLogs = logs.map(l => l.id === updatedLog.id ? updatedLog : l);
    setLogs(updatedLogs);
    await saveToCloud(updatedLogs);
    setEditingLog(null);
  };

  const getAvatarSrc = (u: User) => {
    return u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.avatarSeed}`;
  };

  if (isRestoring) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            <span className="material-icons-round text-2xl animate-pulse">hub</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 antialiased font-sans">
      <nav className="sticky top-0 z-50 glass-nav border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-3 group cursor-pointer" onClick={() => handleSetView('overview')}>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-glow">
                <span className="material-icons-round text-white text-2xl">hub</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">Academia<span className="text-primary">Forge</span></span>
                <span className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">Future of Learning</span>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center flex-1 mx-8">
              <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                <button onClick={() => handleSetView('overview')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${view === 'overview' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                  <span className="material-icons-round text-base">dashboard</span> Dashboard
                </button>
                <button onClick={() => handleSetView('ai')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${view === 'ai' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                  <span className="material-icons-round text-base">smart_toy</span> AI Copilot
                </button>
                <button onClick={() => handleSetView('log')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${view === 'log' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                  <span className="material-icons-round text-base">edit_note</span> Log Entry
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 relative">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{user.displayName}</p>
                  <p className="text-xs text-slate-400 mt-1">Student</p>
                </div>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 p-0.5 shadow-md">
                  <div className="h-full w-full rounded-full bg-white dark:bg-surface-dark overflow-hidden">
                    <img src={getAvatarSrc(user)} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 glass-dropdown rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                      <p className="font-bold truncate text-slate-800 dark:text-white">{user.displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button onClick={toggleTheme} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-sm font-semibold">
                        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                        <span className="material-icons-round text-lg">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
                      </button>
                      <button onClick={() => { setIsEditingProfile(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold flex items-center gap-2">
                        <span className="material-icons-round text-lg">settings</span> Edit Profile
                      </button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                        <span className="material-icons-round text-lg">logout</span> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 md:pb-24">
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-2">
            Welcome, <span className="gradient-text">{user.displayName}</span>
          </h1>
          <p className="text-slate-500 text-lg">Ready to sharpen your skills today?</p>
        </div>

        {view === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Dashboard logs={logs} onDelete={deleteLog} onEdit={setEditingLog} />
            </div>

            <div className="space-y-8">
              <PomodoroTimer onSessionComplete={() => handleSetView('log')} />
              <HabitResearcher logs={logs} />

              <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-primary mb-3 tracking-widest uppercase">Quick Tip</div>
                  <p className="text-sm text-slate-300 italic mb-6 leading-relaxed">
                    {logs.length > 0
                      ? "Taking a 5-minute movement break every 25 minutes sustains focus and prevents ocular fatigue."
                      : "Welcome to AcademiaForge! Start by logging your first custom session."}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden mr-4">
                      <div className="h-full bg-primary rounded-full" style={{ width: logs.length > 0 ? '66%' : '8%' }}></div>
                    </div>
                    <span className="text-[0.65rem] text-slate-500 font-medium tracking-wider uppercase">Consistency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'log' && (
          <div className="max-w-2xl mx-auto animate-in fade-in scale-95 duration-300">
            <LogForm onAdd={addLog} />
          </div>
        )}

        {view === 'ai' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <InsightsPanel logs={logs} />
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-20 text-center animate-fade-in-up">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold tracking-widest uppercase">
          &copy; Vaisakh V Namboothiri • <a href="https://www.linkedin.com/in/vaisakhvn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn</a>
        </p>
      </footer>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm md:hidden z-50">
        <div className="glass-nav rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-2xl flex items-center justify-around p-2.5">
          <button onClick={() => handleSetView('overview')} className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300 ${view === 'overview' ? 'text-primary' : 'text-slate-400'}`}>
            <span className={`material-icons-round ${view === 'overview' ? 'text-2xl' : 'text-xl'}`}>dashboard</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
          </button>
          <button onClick={() => handleSetView('ai')} className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300 ${view === 'ai' ? 'text-primary' : 'text-slate-400'}`}>
            <span className={`material-icons-round ${view === 'ai' ? 'text-2xl' : 'text-xl'}`}>smart_toy</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">AI Help</span>
          </button>
          <button onClick={() => handleSetView('log')} className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300 ${view === 'log' ? 'text-primary' : 'text-slate-400'}`}>
            <span className={`material-icons-round ${view === 'log' ? 'text-2xl' : 'text-xl'}`}>add_circle</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Log</span>
          </button>
        </div>
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-dropdown rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-display font-bold mb-8 text-slate-800 dark:text-white">Profile Settings</h3>
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="h-28 w-28 rounded-[2rem] bg-white dark:bg-slate-800 p-1 shadow-xl border-2 border-primary/20 overflow-hidden">
                    <img src={newAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.avatarSeed}`} alt="Avatar Preview" className="w-full h-full object-cover rounded-[1.8rem]" />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all">
                    <span className="material-icons-round text-lg">photo_camera</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="group space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                  <input type="text" className="block w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-medium" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">Cancel</button>
                  <button onClick={updateProfile} disabled={isSyncing} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">{isSyncing ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <LogForm initialData={editingLog} onAdd={updateLog} onCancel={() => setEditingLog(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
