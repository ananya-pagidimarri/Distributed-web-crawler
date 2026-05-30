

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'cyan', // 'cyan', 'emerald', 'amber', 'rose', 'blue'
  subtitle = '',
  trend = '' 
}) {
  const colorMap = {
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/25',
      glow: 'shadow-cyan-950/20 border-l-4 border-l-cyan-500',
      iconColor: 'text-cyan-400'
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/25',
      glow: 'shadow-emerald-950/20 border-l-4 border-l-emerald-500',
      iconColor: 'text-emerald-400'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/25',
      glow: 'shadow-amber-950/20 border-l-4 border-l-amber-500',
      iconColor: 'text-amber-400'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/25',
      glow: 'shadow-rose-950/20 border-l-4 border-l-rose-500',
      iconColor: 'text-rose-400'
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/25',
      glow: 'shadow-blue-950/20 border-l-4 border-l-blue-500',
      iconColor: 'text-blue-400'
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`card-premium p-5 flex items-center justify-between ${scheme.glow}`}>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {trend && (
            <span className={`text-[10px] font-bold ${
              trend.startsWith('+') || trend.includes('UP') ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>

      {Icon && (
        <div className={`p-3 rounded-xl border ${scheme.bg}`}>
          <Icon className={`w-5 h-5 ${scheme.iconColor}`} />
        </div>
      )}
    </div>
  );
}