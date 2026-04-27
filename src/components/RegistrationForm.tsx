'use client'

import { useState, useEffect } from 'react'

interface Division {
  id: string
  type: string
  name: string
  category: string
  rating: number
  skillLevelName: string | null
  skill_level_id: string | null
}

interface ExistingRegistration {
  division_id: string
  division_name: string
  skill_level: string
  partner_name?: string
  partner_status?: string
}

export default function RegistrationForm({ 
  divisions, 
  organizationId, 
  seasonId,
  existingRegistrations = []
}: { 
  divisions: Division[]
  organizationId: string
  seasonId: string
  existingRegistrations?: ExistingRegistration[]
}) {
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Partner selection state
  const [doublesPartners, setDoublesPartners] = useState<Record<string, { type: 'existing' | 'invite', playerId?: string, email?: string }>>({})
  const [availablePartners, setAvailablePartners] = useState<{ id: string; name: string }[]>([])
  const [partnerSearch, setPartnerSearch] = useState<Record<string, string>>({})
  const [showPartnerDropdown, setShowPartnerDropdown] = useState<Record<string, boolean>>({})

  const isDoubles = (type: string) => type.includes('doubles')

  // Load available partners (other players in the org)
  useEffect(() => {
    async function loadPlayers() {
      const res = await fetch(`/api/organizations/${organizationId}/players`)
      const data = await res.json()
      setAvailablePartners(data.players || [])
    }
    loadPlayers()
  }, [organizationId])

  const handleCheckboxChange = (divisionId: string, checked: boolean, divisionType: string) => {
    if (checked) {
      setSelectedDivisions(prev => [...prev, divisionId])
      // Initialize partner selection for doubles
      if (isDoubles(divisionType)) {
        setDoublesPartners(prev => ({
          ...prev,
          [divisionId]: { type: 'invite' }
        }))
      }
    } else {
      setSelectedDivisions(prev => prev.filter(id => id !== divisionId))
      // Clean up partner selection
      const newPartners = { ...doublesPartners }
      delete newPartners[divisionId]
      setDoublesPartners(newPartners)
      const newSearch = { ...partnerSearch }
      delete newSearch[divisionId]
      setPartnerSearch(newSearch)
    }
  }

  const handlePartnerTypeChange = (divisionId: string, type: 'existing' | 'invite') => {
    setDoublesPartners(prev => ({
      ...prev,
      [divisionId]: { type }
    }))
  }

  const handlePartnerSelect = (divisionId: string, playerId: string, playerName: string) => {
    setDoublesPartners(prev => ({
      ...prev,
      [divisionId]: { type: 'existing', playerId }
    }))
    setPartnerSearch(prev => ({ ...prev, [divisionId]: playerName }))
    setShowPartnerDropdown(prev => ({ ...prev, [divisionId]: false }))
  }

  const handlePartnerEmailChange = (divisionId: string, email: string) => {
    setDoublesPartners(prev => ({
      ...prev,
      [divisionId]: { type: 'invite', email }
    }))
  }

  const filteredPartners = (divisionId: string) => {
    const search = partnerSearch[divisionId]?.toLowerCase() || ''
    return availablePartners.filter(p => 
      p.name.toLowerCase().includes(search)
    ).slice(0, 5)
  }

  const getDivisionLabel = (type: string): string => {
    switch (type) {
      case 'mens_singles': return "Men's Singles"
      case 'womens_singles': return "Women's Singles"
      case 'mens_doubles': return "Men's Doubles"
      case 'womens_doubles': return "Women's Doubles"
      case 'mixed_doubles': return "Mixed Doubles"
      default: return type
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedDivisions.length === 0) {
      setError('Please select at least one division to register for.')
      return
    }

    // Validate doubles partners
    for (const divId of selectedDivisions) {
      const division = divisions.find(d => d.id === divId)
      if (division && isDoubles(division.type)) {
        const partner = doublesPartners[divId]
        if (!partner || (!partner.playerId && !partner.email)) {
          setError(`Please select or invite a partner for ${getDivisionLabel(division.type)}`)
          return
        }
      }
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/seasons/${seasonId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          division_ids: selectedDivisions,
          partners: doublesPartners
        })
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="organization_id" value={organizationId} />
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Already registered divisions */}
      {existingRegistrations.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-emerald-800 mb-4">You&apos;re Registered!</h2>
          <div className="space-y-2">
            {existingRegistrations.map((reg, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-emerald-700">{reg.division_name}</span>
                <span className="font-medium text-emerald-800">{reg.skill_level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Select the divisions you want to play:
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Check the boxes for each division you&apos;d like to register for. ({selectedDivisions.length} selected)
        </p>
        
        {divisions.length > 0 ? (
          <div className="space-y-4">
            {divisions.map((division) => {
              const isSelected = selectedDivisions.includes(division.id)
              const isDoublesDivision = isDoubles(division.type)
              const partner = doublesPartners[division.id]
              
              return (
                <div key={division.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <label className={`flex items-center justify-between p-4 ${isSelected ? 'bg-indigo-50' : 'bg-slate-50 hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        value={division.id}
                        checked={isSelected}
                        onChange={(e) => handleCheckboxChange(division.id, e.target.checked, division.type)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{getDivisionLabel(division.type)}</p>
                        <p className="text-sm text-slate-500">
                          Using your {division.category} rating: {division.rating}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {division.skillLevelName}
                    </span>
                  </label>
                  
                  {/* Partner selection for doubles */}
                  {isSelected && isDoublesDivision && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-3">Partner Selection</p>
                      
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`partner_type_${division.id}`}
                            checked={partner?.type !== 'invite'}
                            onChange={() => handlePartnerTypeChange(division.id, 'existing')}
                            className="text-indigo-600"
                          />
                          <span className="text-sm text-slate-600">Select existing player</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`partner_type_${division.id}`}
                            checked={partner?.type === 'invite'}
                            onChange={() => handlePartnerTypeChange(division.id, 'invite')}
                            className="text-indigo-600"
                          />
                          <span className="text-sm text-slate-600">Invite by email</span>
                        </label>
                      </div>
                      
                      {partner?.type === 'existing' ? (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search for a partner..."
                            value={partnerSearch[division.id] || ''}
                            onChange={(e) => {
                              setPartnerSearch(prev => ({ ...prev, [division.id]: e.target.value }))
                              setShowPartnerDropdown(prev => ({ ...prev, [division.id]: true }))
                            }}
                            onFocus={() => setShowPartnerDropdown(prev => ({ ...prev, [division.id]: true }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          {showPartnerDropdown[division.id] && filteredPartners(division.id).length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                              {filteredPartners(division.id).map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handlePartnerSelect(division.id, p.id, p.name)}
                                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm"
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {partner?.playerId && (
                            <p className="text-xs text-emerald-600 mt-1">Selected: {partnerSearch[division.id]}</p>
                          )}
                        </div>
                      ) : (
                        <input
                          type="email"
                          placeholder="Partner's email address"
                          value={partner?.email || ''}
                          onChange={(e) => handlePartnerEmailChange(division.id, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-500">
            No matching divisions found for your ratings. Set up your ratings in your profile first.
          </p>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Commitment:</strong> Registering commits you to play all season matches in the divisions you select.
        </p>
      </div>

      {divisions.length > 0 && (
        <button 
          type="submit" 
          disabled={loading}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register for Selected Divisions'}
        </button>
      )}
    </form>
  )
}