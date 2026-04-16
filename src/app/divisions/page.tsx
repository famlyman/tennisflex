'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SkillLevel {
  id: string
  name: string
  min_rating: number | null
  max_rating: number | null
}

interface Division {
  id: string
  name: string
  type: string
  skill_levels: SkillLevel[]
}

interface Season {
  id: string
  name: string
  status: string
  season_start: string
  season_end: string
  organization: { id: string; name: string }
  divisions: Division[]
}

const DIVISION_TYPES = [
  { value: 'mens_singles', label: "Men's Singles" },
  { value: 'womens_singles', label: "Women's Singles" },
  { value: 'mens_doubles', label: "Men's Doubles" },
  { value: 'womens_doubles', label: "Women's Doubles" },
  { value: 'mixed_doubles', label: 'Mixed Doubles' },
]

export default function DivisionsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
  const [showAddDivision, setShowAddDivision] = useState<string | null>(null)
  const [showAddSkillLevel, setShowAddSkillLevel] = useState<string | null>(null)

  const [newDivision, setNewDivision] = useState({ name: '', type: 'mens_singles' })
  const [newSkillLevel, setNewSkillLevel] = useState({ name: '', min_rating: '', max_rating: '' })

  useEffect(() => {
    loadSeasons()
  }, [])

  async function loadSeasons() {
    try {
      const response = await fetch('/api/divisions')
      if (response.redirected || response.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load')
      }
      const data = await response.json()
      setSeasons(data)
      if (data.length > 0) {
        setSelectedSeason(data[0].id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDivision(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSeason) return

    try {
      const formData = new FormData()
      formData.append('action', 'create_division')
      formData.append('season_id', selectedSeason)
      formData.append('name', newDivision.name)
      formData.append('type', newDivision.type)

      const response = await fetch('/api/divisions', { method: 'POST', body: formData })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setShowAddDivision(null)
      setNewDivision({ name: '', type: 'mens_singles' })
      loadSeasons()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleAddSkillLevel(e: React.FormEvent, divisionId: string) {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append('action', 'create_skill_level')
      formData.append('division_id', divisionId)
      formData.append('name', newSkillLevel.name)
      if (newSkillLevel.min_rating) formData.append('min_rating', newSkillLevel.min_rating)
      if (newSkillLevel.max_rating) formData.append('max_rating', newSkillLevel.max_rating)

      const response = await fetch('/api/divisions', { method: 'POST', body: formData })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setShowAddSkillLevel(null)
      setNewSkillLevel({ name: '', min_rating: '', max_rating: '' })
      loadSeasons()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleDeleteDivision(divisionId: string) {
    if (!confirm('Delete this division and all its skill levels?')) return

    try {
      const formData = new FormData()
      formData.append('action', 'delete_division')
      formData.append('division_id', divisionId)

      const response = await fetch('/api/divisions', { method: 'POST', body: formData })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      loadSeasons()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleDeleteSkillLevel(skillLevelId: string) {
    if (!confirm('Delete this skill level?')) return

    try {
      const formData = new FormData()
      formData.append('action', 'delete_skill_level')
      formData.append('skill_level_id', skillLevelId)

      const response = await fetch('/api/divisions', { method: 'POST', body: formData })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      loadSeasons()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const currentSeason = seasons.find(s => s.id === selectedSeason)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">T</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Tennis-Flex</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
              Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Manage Divisions</h1>
          <p className="text-slate-600 mt-1">
            Set up divisions and skill levels for your seasons.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {seasons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No seasons found.</p>
            <Link href="/seasons/create" className="text-indigo-600 hover:underline mt-2 inline-block">
              Create a season first
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Season</label>
              <select
                value={selectedSeason || ''}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name} ({season.organization.name})
                  </option>
                ))}
              </select>
            </div>

            {currentSeason && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Divisions</h2>
                  <button
                    onClick={() => setShowAddDivision(selectedSeason)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Add Division
                  </button>
                </div>

                {showAddDivision === selectedSeason && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Add Division</h3>
                    <form onSubmit={handleAddDivision} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={newDivision.name}
                            onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                            placeholder="e.g., 3.0-3.5 Singles"
                            required
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                          <select
                            value={newDivision.type}
                            onChange={(e) => setNewDivision({ ...newDivision, type: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                          >
                            {DIVISION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                        >
                          Add Division
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddDivision(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {currentSeason.divisions.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-500">No divisions yet. Add one to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSeason.divisions.map((division) => (
                      <div key={division.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{division.name}</h3>
                            <p className="text-sm text-slate-500">
                              {DIVISION_TYPES.find(t => t.value === division.type)?.label || division.type}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteDivision(division.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium text-slate-700">Skill Levels</h4>
                            <button
                              onClick={() => setShowAddSkillLevel(division.id)}
                              className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              + Add Skill Level
                            </button>
                          </div>

                          {showAddSkillLevel === division.id && (
                            <form 
                              onSubmit={(e) => handleAddSkillLevel(e, division.id)} 
                              className="bg-slate-50 rounded-lg p-4 mb-3 space-y-3"
                            >
                              <input
                                type="text"
                                value={newSkillLevel.name}
                                onChange={(e) => setNewSkillLevel({ ...newSkillLevel, name: e.target.value })}
                                placeholder="Skill level name (e.g., 3.0)"
                                required
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={newSkillLevel.min_rating}
                                  onChange={(e) => setNewSkillLevel({ ...newSkillLevel, min_rating: e.target.value })}
                                  placeholder="Min rating"
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <input
                                  type="number"
                                  step="0.1"
                                  value={newSkillLevel.max_rating}
                                  onChange={(e) => setNewSkillLevel({ ...newSkillLevel, max_rating: e.target.value })}
                                  placeholder="Max rating"
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAddSkillLevel(null)}
                                  className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          {division.skill_levels.length === 0 ? (
                            <p className="text-sm text-slate-400">No skill levels defined.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {division.skill_levels.map((level) => (
                                <div 
                                  key={level.id}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm"
                                >
                                  <span>{level.name}</span>
                                  {(level.min_rating !== null || level.max_rating !== null) && (
                                    <span className="text-slate-500">
                                      ({level.min_rating || '0'} - {level.max_rating || '∞'})
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteSkillLevel(level.id)}
                                    className="text-slate-400 hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
