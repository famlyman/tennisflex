'use client'

import { useState, useEffect } from 'react'

interface Promotion {
  id: string
  organization_id: string | null
  type: 'direct' | 'affiliate' | 'placeholder'
  title: string
  description: string | null
  link_url: string | null
  call_to_action: string | null
  is_active: boolean
  display_locations: string[]
  priority: number
  created_at: string
  organization?: { name: string } | null
}

const LOCATIONS = ['landing', 'dashboard', 'match_hub', 'leaderboard']
const typeIcons: Record<string, string> = { affiliate: '🎾', direct: '🏢', placeholder: '🤝' }
const typeColors: Record<string, string> = {
  direct: 'bg-indigo-100 text-indigo-700',
  affiliate: 'bg-emerald-100 text-emerald-700',
  placeholder: 'bg-slate-200 text-slate-600',
}

interface FormState {
  type: 'direct' | 'affiliate' | 'placeholder'
  title: string
  description: string
  link_url: string
  call_to_action: string
  is_active: boolean
  display_locations: string[]
  priority: number
}

const emptyForm: FormState = {
  type: 'affiliate',
  title: '',
  description: '',
  link_url: '',
  call_to_action: 'Learn More',
  is_active: true,
  display_locations: [],
  priority: 0,
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/promotions')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (!cancelled) setPromotions(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function refresh() {
    fetch('/api/admin/promotions')
      .then(res => res.ok ? res.json() : [])
      .then(setPromotions)
      .catch(() => {})
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(promo: Promotion) {
    setEditing(promo)
    setForm({
      type: promo.type,
      title: promo.title,
      description: promo.description || '',
      link_url: promo.link_url || '',
      call_to_action: promo.call_to_action || 'Learn More',
      is_active: promo.is_active,
      display_locations: [...promo.display_locations],
      priority: promo.priority,
    })
    setShowModal(true)
  }

  function toggleLocation(loc: string) {
    setForm(f => ({
      ...f,
      display_locations: f.display_locations.includes(loc)
        ? f.display_locations.filter(l => l !== loc)
        : [...f.display_locations, loc],
    }))
  }

  async function handleSave() {
    if (!form.title) return
    setSaving(true)
    try {
      const url = editing
        ? `/api/admin/promotions/${editing.id}`
        : '/api/admin/promotions'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowModal(false)
        refresh()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleToggleActive(promo: Promotion) {
    try {
      await fetch(`/api/admin/promotions/${promo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !promo.is_active }),
      })
      refresh()
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await fetch(`/api/admin/promotions/${deleteId}`, { method: 'DELETE' })
      setDeleteId(null)
      refresh()
    } catch { /* ignore */ }
  }

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
          <button onClick={openCreate} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            + New Promotion
          </button>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-3xl animate-pulse" />)}
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✨</div>
            <p className="font-bold text-slate-900">No promotions yet</p>
            <p className="text-sm text-slate-500 mt-1">Start by adding a global affiliate gear recommendation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {promotions.map(promo => (
              <div key={promo.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm group">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
                      {typeIcons[promo.type] || '🎾'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${typeColors[promo.type]}`}>
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
                        {(promo.display_locations || []).map(loc => (
                          <span key={loc} className="text-[9px] font-bold text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded uppercase">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                    <div className="flex flex-col gap-2">
                      <button onClick={() => openEdit(promo)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                        Edit Details
                      </button>
                      <button onClick={() => handleToggleActive(promo)} className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                        promo.is_active
                          ? 'border border-red-100 text-red-600 hover:bg-red-50'
                          : 'border border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                      }`}>
                        {promo.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => setDeleteId(promo.id)} className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-600 border border-transparent hover:border-red-100 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">{editing ? 'Edit Promotion' : 'New Promotion'}</h2>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Type</label>
                <div className="flex gap-2">
                  {(['affiliate', 'direct', 'placeholder'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        form.type === t
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {typeIcons[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none" />

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Link URL</label>
                <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">CTA Button</label>
                  <input value={form.call_to_action} onChange={e => setForm(f => ({ ...f, call_to_action: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Priority</label>
                  <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">CTA Button</label>
                  <input value={form.call_to_action} onChange={e => setForm(f => ({ ...f, call_to_action: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Priority</label>
                  <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Display Locations</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map(loc => (
                    <button key={loc} onClick={() => toggleLocation(loc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                        form.display_locations.includes(loc)
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {loc.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-700">Active</span>
              </label>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.title}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 mb-2">Delete Promotion?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
