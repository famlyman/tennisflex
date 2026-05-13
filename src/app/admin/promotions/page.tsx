import { createAdminClient } from '@/utils/supabase'

export default async function AdminPromotionsPage() {
  const adminClient = createAdminClient()

  // Fetch all promotions
  const { data: promotions, error } = await adminClient
    .from('promotions')
    .select(`
      *,
      organization:organizations(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">
              <span>💰</span> Revenue & Partners
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Promotion Management</h1>
            <p className="text-slate-500 font-medium">Manage global gear recommendations and local direct sponsors.</p>
          </div>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            + New Promotion
          </button>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 mb-8">
            Error loading promotions: {error.message}
          </div>
        )}

        {!promotions || promotions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              ✨
            </div>
            <p className="font-bold text-slate-900">No active promotions</p>
            <p className="text-sm text-slate-500 mt-1">Start by adding a global affiliate gear recommendation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm group">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
                      {promo.type === 'affiliate' ? '🎾' : promo.type === 'direct' ? '🏢' : '🤝'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          promo.type === 'direct' ? 'bg-indigo-100 text-indigo-700' :
                          promo.type === 'affiliate' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {promo.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {promo.organization?.name || 'Global'}
                        </span>
                        {!promo.is_active && (
                          <span className="bg-red-50 text-red-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Inactive</span>
                        )}
                      </div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{promo.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{promo.description}</p>
                      <div className="flex gap-2 mt-3">
                        {(promo.display_locations || []).map((loc: string) => (
                          <span key={loc} className="text-[9px] font-bold text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded uppercase">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                        Edit Details
                      </button>
                      <button className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                        promo.is_active 
                          ? 'border border-red-100 text-red-600 hover:bg-red-50' 
                          : 'border border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                      }`}>
                        {promo.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
