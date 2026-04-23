'use client'

import { useState, useRef } from 'react'

interface Division {
  id: string
  type: string
  category: string
  rating: number
  skillLevelName: string | null
}

export default function RegistrationForm({ 
  divisions, 
  organizationId, 
  seasonId 
}: { 
  divisions: Division[]
  organizationId: string
  seasonId: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleCheckboxChange = (divisionId: string, checked: boolean) => {
    if (checked) {
      setSelectedDivisions(prev => [...prev, divisionId])
    } else {
      setSelectedDivisions(prev => prev.filter(id => id !== divisionId))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (selectedDivisions.length === 0) {
      e.preventDefault()
      setError('Please select at least one division to register for.')
    }
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

  return (
    <form 
      ref={formRef}
      action={`/api/seasons/${seasonId}/register`} 
      method="POST" 
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input type="hidden" name="organization_id" value={organizationId} />
      
      {/* Hidden inputs for selected divisions - updated by checkboxes */}
      <input type="hidden" name="division_ids" value={selectedDivisions.join(',')} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Select the divisions you want to play:
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Check the boxes for each division you'd like to register for.
        </p>
        
        {divisions.length > 0 ? (
          <div className="space-y-3">
            {divisions.map((division) => (
              <label 
                key={division.id} 
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    value={division.id}
                    onChange={(e) => handleCheckboxChange(division.id, e.target.checked)}
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
            ))}
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
        <button type="submit" className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
          Register for Selected Divisions
        </button>
      )}
    </form>
  )
}