import { CheckSquare, Construction } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ background: '#eff6ff' }}>
          <CheckSquare style={{ color: '#3b82f6' }} size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Tasks</h1>
          <p className="text-sm text-stone-400">Assign and track team tasks</p>
        </div>
      </div>

      <div
        className="rounded-2xl bg-white flex flex-col items-center justify-center h-72 gap-4"
        style={{ border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        <Construction className="text-stone-300" size={48} />
        <div className="text-center">
          <p className="text-stone-700 font-semibold">Coming Soon</p>
          <p className="text-sm text-stone-400 mt-1">The tasks module is under construction.</p>
        </div>
      </div>
    </div>
  );
}
