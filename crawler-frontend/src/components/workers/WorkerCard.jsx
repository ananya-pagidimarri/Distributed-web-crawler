import { emitCrawlerAction } from '../../services/socket';
import { toast } from 'react-hot-toast';

function WorkerCard({ worker }) {
  const statusClasses = {
    running: 'bg-cyan-500/15 text-cyan-300',
    idle: 'bg-slate-700 text-slate-300',
    offline: 'bg-rose-500/15 text-rose-300',
    robots_check: 'bg-amber-500/15 text-amber-300',
  };

  return (
    <div className='card p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-sm uppercase tracking-[0.2em] text-slate-500'>Worker Node</p>
          <h2 className='mt-2 text-xl font-semibold text-slate-100'>{worker.name}</h2>
          <p className='mt-1 text-sm text-slate-400'>{worker.ip}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[worker.status] || 'bg-slate-700 text-slate-300'}`}>{worker.status.replace('_', ' ')}</span>
      </div>
      <div className='mt-6 space-y-4'>
        <div>
          <div className='mb-2 flex items-center justify-between text-sm text-slate-400'>
            <span>CPU Usage</span>
            <span>{worker.cpu}%</span>
          </div>
          <div className='h-2 rounded-full bg-slate-800'>
            <div className='h-2 rounded-full bg-cyan-400' style={{ width: `${worker.cpu}%` }} />
          </div>
        </div>
        <div>
          <div className='mb-2 flex items-center justify-between text-sm text-slate-400'>
            <span>Memory</span>
            <span>{worker.memory}%</span>
          </div>
          <div className='h-2 rounded-full bg-slate-800'>
            <div className='h-2 rounded-full bg-sky-500' style={{ width: `${worker.memory}%` }} />
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4 text-sm text-slate-300'>
          <div className='rounded-3xl bg-slate-900/80 p-3'>
            <p className='text-slate-400'>Crawl Rate</p>
            <p className='mt-2 text-lg font-semibold'>{worker.crawlRate}/s</p>
          </div>
          <div className='rounded-3xl bg-slate-900/80 p-3'>
            <p className='text-slate-400'>Processed</p>
            <p className='mt-2 text-lg font-semibold'>{worker.processedCount.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className='mt-6 flex flex-wrap gap-3'>
        {worker.status === 'running' && (
          <button
            onClick={() => {
              emitCrawlerAction('pause_worker', { workerId: worker.id });
              toast.success(`Pausing ${worker.name}`);
            }}
            className='rounded-3xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20'
          >
            Pause
          </button>
        )}
        {(worker.status === 'idle' || worker.status === 'robots_check') && (
          <button
            onClick={() => {
              emitCrawlerAction('resume_worker', { workerId: worker.id });
              toast.success(`Resuming ${worker.name}`);
            }}
            className='rounded-3xl bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20'
          >
            Resume
          </button>
        )}
        {worker.status === 'offline' && (
          <button
            onClick={() => {
              emitCrawlerAction('toggle_worker_power', { workerId: worker.id, power: true });
              toast.success(`Activating ${worker.name}`);
            }}
            className='rounded-3xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20'
          >
            Activate Node
          </button>
        )}
      </div>
    </div>
  );
}

export default WorkerCard;