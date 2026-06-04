export default function DashboardStats({ stats }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3 mb-8">
      {[
        { label: 'Total Komunitas', value: stats?.totalCommunities || 0, accent: 'bg-blue-500/20 text-blue-300' },
        { label: 'Total Program Kerja', value: stats?.totalProjects || 0, accent: 'bg-purple-500/20 text-purple-400' },
        { label: 'Total Anggota', value: stats?.totalMembers || 0, accent: 'bg-green-500/20 text-green-400' }
      ].map((item) => (
        <div key={item.label} className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
          <div className={`inline-flex items-center gap-3 rounded-full px-3 py-2 ${item.accent}`}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-200">{item.label}</p>
          </div>
          <p className="mt-7 text-4xl font-semibold text-white">{item.value}</p>
          <p className="mt-2 text-sm text-slate-400">Data dari database</p>
        </div>
      ))}
    </section>
  )
}
