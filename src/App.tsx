import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Users, 
  GitBranch, 
  TrendingUp, 
  Zap, 
  Database,
  Shield,
  Bell,
  Search,
  Menu,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown,
  Eye
} from 'lucide-react';

// 模拟实时数据
const useMockData = () => {
  const [metrics, setMetrics] = useState({
    activeContributors: 12847,
    aiScore: 94.7,
    systemHealth: 98.5,
    githubRate: 127,
    blockchainRate: 89,
    socialRate: 156
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        activeContributors: prev.activeContributors + Math.floor(Math.random() * 10 - 5),
        aiScore: Math.max(90, Math.min(99, prev.aiScore + (Math.random() - 0.5) * 2)),
        systemHealth: Math.max(95, Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 0.5)),
        githubRate: prev.githubRate + Math.floor(Math.random() * 20 - 10),
        blockchainRate: prev.blockchainRate + Math.floor(Math.random() * 15 - 7),
        socialRate: prev.socialRate + Math.floor(Math.random() * 25 - 12)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

// Matrix雨效果组件
const MatrixRain: React.FC = () => {
  const [chars, setChars] = useState<Array<{id: number, char: string, x: number, delay: number}>>([]);

  useEffect(() => {
    const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const newChars = [];
    
    for (let i = 0; i < 50; i++) {
      newChars.push({
        id: i,
        char: characters[Math.floor(Math.random() * characters.length)],
        x: Math.random() * 100,
        delay: Math.random() * 3
      });
    }
    
    setChars(newChars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
      {chars.map((char) => (
        <div
          key={char.id}
          className="matrix-char text-xs"
          style={{
            left: `${char.x}%`,
            animationDelay: `${char.delay}s`
          }}
        >
          {char.char}
        </div>
      ))}
    </div>
  );
};

// 数据流效果组件
const DataStream: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="data-stream"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

// 统计卡片组件
const StatsCard: React.FC<{
  title: string;
  value: number;
  format?: 'number' | 'score';
  color?: string;
  icon: React.ReactNode;
  showTrending?: boolean;
}> = ({ title, value, format = 'number', color = 'var(--cyber-primary)', icon, showTrending = false }) => {
  const formatValue = (val: number) => {
    if (format === 'score') return `${val.toFixed(1)}%`;
    return val.toLocaleString();
  };

  return (
    <motion.div
      className="cyber-card"
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div style={{ color }}>{icon}</div>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold" style={{ color }}>
            {formatValue(value)}
          </div>
          {showTrending && (
            <TrendingUp className="w-4 h-4 text-green-400" />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{title}</div>
        <button className="p-1 text-gray-500 hover:text-white">
          <Eye className="w-4 h-4" />
        </button>
      </div>
      <div className="cyber-progress mt-3">
        <div 
          className="cyber-progress-bar" 
          style={{ 
            width: format === 'score' ? `${value}%` : '70%',
            background: `linear-gradient(90deg, ${color}, ${color}80)`
          }}
        />
      </div>
    </motion.div>
  );
};

// 功能模态框组件
const FeatureModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        className="cyber-card max-w-2xl w-full mx-4 max-h-96 overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

// 移动端菜单组件
const MobileMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-40 md:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="fixed right-0 top-0 h-full w-64 bg-gray-800 p-6"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold gradient-text">Menu</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="p-3 border border-gray-700 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <button className="w-full text-left p-2 text-gray-300 hover:text-white">Dashboard</button>
            <button className="w-full text-left p-2 text-gray-300 hover:text-white">Analytics</button>
            <button className="w-full text-left p-2 text-gray-300 hover:text-white">Settings</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 下拉菜单组件
const DropdownMenu: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ children, isOpen, onToggle }) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 p-2 text-gray-400 hover:text-white"
      >
        <span>Options</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
};

// 主应用组件
const App: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeStreams, setActiveStreams] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [isLiveAnalysisOpen, setIsLiveAnalysisOpen] = useState(false);
  const [isGithubAnalysisOpen, setIsGithubAnalysisOpen] = useState(false);
  const [isBlockchainScanOpen, setIsBlockchainScanOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const metrics = useMockData();

  const handleStartStream = (streamType: string) => {
    setActiveStreams(prev => new Set(prev).add(streamType));
    
    // 根据流类型打开相应的模态框
    if (streamType === 'demo') {
      setIsLiveAnalysisOpen(true);
    } else if (streamType === 'github') {
      setIsGithubAnalysisOpen(true);
    } else if (streamType === 'blockchain') {
      setIsBlockchainScanOpen(true);
    }
    
    setTimeout(() => {
      setActiveStreams(prev => {
        const next = new Set(prev);
        next.delete(streamType);
        return next;
      });
    }, 5000);
  };

  const stats = [
    {
      title: 'Active Contributors',
      value: metrics.activeContributors,
      format: 'number' as const,
      color: 'var(--cyber-primary)',
      icon: <Users className="w-6 h-6" />,
      showTrending: true
    },
    {
      title: 'AI Processing Score',
      value: metrics.aiScore,
      format: 'score' as const,
      color: 'var(--cyber-secondary)',
      icon: <Zap className="w-6 h-6" />,
      showTrending: true
    },
    {
      title: 'System Health',
      value: metrics.systemHealth,
      format: 'score' as const,
      color: 'var(--cyber-success)',
      icon: <Shield className="w-6 h-6" />,
      showTrending: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-x-hidden" style={{ width: '100%', margin: '0 auto' }}>
      {/* 背景效果 */}
      <MatrixRain />
      <DataStream />

      {/* 导航栏 */}
      <motion.header 
        className="sticky top-0 z-50 bg-gray-800/90 backdrop-blur-md border-b border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl font-bold gradient-text">
                CONTRI-AI
              </div>
              <div className="px-2 py-1 text-xs border border-blue-400 text-blue-400 font-mono">
                Neural v2.0
              </div>
              <div className="flex items-center gap-1">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-xs font-mono text-gray-400 hidden sm:inline">
                  {connectionStatus}
                </span>
              </div>
            </motion.div>

            {/* 右侧控制 */}
            <div className="flex items-center gap-2">
              <div className="hidden lg:block relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                  style={{ pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <DropdownMenu isOpen={isDropdownOpen} onToggle={() => setIsDropdownOpen(!isDropdownOpen)}>
                <button className="w-full text-left p-2 text-gray-300 hover:text-white hover:bg-gray-700">
                  Settings
                </button>
                <button className="w-full text-left p-2 text-gray-300 hover:text-white hover:bg-gray-700">
                  Export Data
                </button>
                <button className="w-full text-left p-2 text-gray-300 hover:text-white hover:bg-gray-700">
                  Help
                </button>
              </DropdownMenu>

              <button className="relative p-2 text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
                {activeStreams.size > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full pulse-glow" />
                )}
              </button>

              <button
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 移动端菜单 */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* 主内容 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero区域 */}
        <motion.section
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl lg:text-6xl font-bold gradient-text mb-4">
            Web3 Neural Analytics
          </h1>
          <h2 className="text-2xl lg:text-4xl font-bold gradient-text-secondary mb-6">
            Real-time Intelligence
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            AI-powered real-time analysis of decentralized contributions with live data streams
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button 
              className="cyber-button w-full sm:w-auto"
              onClick={() => handleStartStream('demo')}
            >
              <Zap className="w-5 h-5 inline mr-2" />
              Start Live Analysis
            </button>
            <button 
              className="cyber-button w-full sm:w-auto"
              onClick={() => handleStartStream('github')}
            >
              <GitBranch className="w-5 h-5 inline mr-2" />
              Analyze GitHub
            </button>
            <button 
              className="cyber-button w-full sm:w-auto"
              onClick={() => handleStartStream('blockchain')}
            >
              <Database className="w-5 h-5 inline mr-2" />
              Scan Blockchain
            </button>
          </div>

          {/* 活跃流指示器 */}
          {activeStreams.size > 0 && (
            <motion.div
              className="flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {Array.from(activeStreams).map((streamId) => (
                <div key={streamId} className="px-3 py-1 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm font-mono">
                  <Activity className="w-3 h-3 inline mr-1" />
                  {streamId} active
                </div>
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* 实时统计 */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">
              {'>> Live System Metrics'}
            </h3>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-sm font-mono text-gray-400">
                Auto-refresh: 3s
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        </motion.section>

        {/* 实时数据流 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            {'>> Neural Data Streams'}
          </h3>
          
          <div className="cyber-card relative overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full pulse-glow ${
                    activeStreams.has('github') ? 'bg-green-400' : 'bg-gray-600'
                  }`} />
                  <span className="text-xs font-mono text-gray-400">GITHUB</span>
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {metrics.githubRate} evt/min
                </div>
                <div className="cyber-progress mt-2">
                  <div 
                    className="cyber-progress-bar" 
                    style={{ width: `${Math.min(100, (metrics.githubRate / 200) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full pulse-glow ${
                    activeStreams.has('blockchain') ? 'bg-green-400' : 'bg-gray-600'
                  }`} />
                  <span className="text-xs font-mono text-gray-400">BLOCKCHAIN</span>
                </div>
                <div className="text-xl font-bold text-pink-400">
                  {metrics.blockchainRate} evt/min
                </div>
                <div className="cyber-progress mt-2">
                  <div 
                    className="cyber-progress-bar" 
                    style={{ 
                      width: `${Math.min(100, (metrics.blockchainRate / 200) * 100)}%`,
                      background: 'linear-gradient(90deg, var(--cyber-secondary), var(--cyber-secondary)80)'
                    }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full pulse-glow" />
                  <span className="text-xs font-mono text-gray-400">SOCIAL</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {metrics.socialRate} evt/min
                </div>
                <div className="cyber-progress mt-2">
                  <div 
                    className="cyber-progress-bar" 
                    style={{ 
                      width: `${Math.min(100, (metrics.socialRate / 200) * 100)}%`,
                      background: 'linear-gradient(90deg, var(--cyber-success), var(--cyber-success)80)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* 功能模态框 */}
      <FeatureModal
        isOpen={isLiveAnalysisOpen}
        onClose={() => setIsLiveAnalysisOpen(false)}
        title="Live Analysis Dashboard"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-700/50 rounded">
              <h4 className="text-sm font-bold text-blue-400 mb-2">Real-time Events</h4>
              <div className="text-2xl font-bold text-white">{metrics.githubRate + metrics.blockchainRate}</div>
            </div>
            <div className="p-4 bg-gray-700/50 rounded">
              <h4 className="text-sm font-bold text-green-400 mb-2">Active Users</h4>
              <div className="text-2xl font-bold text-white">{metrics.activeContributors}</div>
            </div>
          </div>
          <div className="p-4 bg-gray-700/30 rounded">
            <p className="text-gray-300 text-sm">
              Live analysis is monitoring {activeStreams.size || 3} data streams with AI-powered insights...
            </p>
          </div>
        </div>
      </FeatureModal>

      <FeatureModal
        isOpen={isGithubAnalysisOpen}
        onClose={() => setIsGithubAnalysisOpen(false)}
        title="GitHub Analysis Console"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-green-400">Analyzing repositories...</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Commits processed:</span>
              <span className="text-white font-mono">{Math.floor(metrics.githubRate * 1.5)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Contributors found:</span>
              <span className="text-white font-mono">{Math.floor(metrics.activeContributors * 0.3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">AI Score:</span>
              <span className="text-white font-mono">{metrics.aiScore.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </FeatureModal>

      <FeatureModal
        isOpen={isBlockchainScanOpen}
        onClose={() => setIsBlockchainScanOpen(false)}
        title="Blockchain Scanner"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-pink-400" />
            <span className="font-mono text-green-400">Scanning blockchain...</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Blocks scanned:</span>
              <span className="text-white font-mono">{metrics.blockchainRate * 10}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Transactions found:</span>
              <span className="text-white font-mono">{metrics.blockchainRate * 25}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network health:</span>
              <span className="text-white font-mono">{metrics.systemHealth.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </FeatureModal>
    </div>
  );
};

export default App;