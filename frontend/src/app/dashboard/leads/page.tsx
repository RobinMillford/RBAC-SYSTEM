import { Users2, Construction } from 'lucide-react';

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ background: '#ecfdf5' }}>
          <Users2 style={{ color: '#10b981' }} size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Leads</h1>
          <p className="text-sm text-stone-400">Manage and track your leads pipeline</p>
        </div>
      </div>

      <div
        className="rounded-2xl bg-white flex flex-col items-center justify-center h-72 gap-4"
        style={{ border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        <Construction className="text-stone-300" size={48} />
        <div className="text-center">
          <p className="text-stone-700 font-semibold">Coming Soon</p>
          <p className="text-sm text-stone-400 mt-1">The leads module is under construction.</p>
        </div>
      </div>
    </div>
  );
}
