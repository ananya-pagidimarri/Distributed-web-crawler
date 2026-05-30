import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  LayoutDashboard, 
  Search, 
  Cpu, 
  ListOrdered, 
  BarChart3, 
  Terminal, 
  LogOut,
  User,
  Home,
  History,
  FolderTree,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ onClose, user, logout }) {
  const navigate = useNavigate();
  const stats = useSelector((state) => state.crawler.stats);
  const globalStatus = useSelector((state) => state.crawler.globalStatus);

  const navigation = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Indexed Pages', to: '/admin/indexed-pages', icon: Search },
    { name: 'Worker Nodes', to: '/admin/workers', icon: Cpu },
    { name: 'Queue Frontier', to: '/admin/queue', icon: ListOrdered },
    { name: 'Crawl History', to: '/admin/history', icon: History },
    { name: 'Graph Analytics', to: '/admin/graph', icon: FolderTree },
    { name: 'Crawl Analytics', to: '/admin/analytics', icon: BarChart3 },
    { name: 'System Logs', to: '/admin/logs', icon: Terminal },
    { name: 'Robots Compliance', to: '/admin/robots', icon: ShieldCheck },
    { name: 'Search Engine Home', to: '/', icon: Home },
  ];

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col h-full w-64 bg-slate-900 border-r border-slate-900 select-none">
      
      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-950/60 bg-slate-900/40">
        <div className="p-2.5 bg-cyan-950/50 border border-cyan-800/40 rounded-xl glow-active">
          <FolderTree className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">CrawlX</h1>
          <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Googlebot Ops</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 border border-cyan-800/20 text-cyan-400 shadow-md shadow-cyan-950/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer: Telemetry + User Profile + Logout */}
      <div className="p-4 border-t border-slate-950/60 bg-slate-900/35 space-y-3">
        
        {/* Telemetry mini widget */}
        <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>INDEXING ENGINE</span>
            <span className="text-cyan-400 glow-active font-bold">LIVE</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Throughput:</span>
            <span className="font-semibold text-slate-200">{stats.crawlRate} pages/s</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-cyan-400 h-full transition-all duration-1000"
              style={{ width: `${globalStatus === 'crawling' ? Math.min(100, (stats.crawlRate / 800) * 100) : 0}%` }}
            ></div>
          </div>
        </div>

        {/* User Profile + Logout */}
        {user && (
          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-cyan-950/50 border border-cyan-800/30 rounded-lg shrink-0">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}