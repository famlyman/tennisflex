export type ConfidenceBadge = 'Projected' | 'Developing' | 'Established'

export function getConfidenceBadge(matchCount: number): ConfidenceBadge {
  if (matchCount <= 4) return 'Projected'
  if (matchCount <= 9) return 'Developing'
  return 'Established'
}

export function getConfidenceDisplay(rating: number, matchCount: number): string {
  const badge = getConfidenceBadge(matchCount)
  const ratingDisplay = Math.round(rating).toString()
  
  switch (badge) {
    case 'Projected':
      return `${ratingDisplay}(P)`
    case 'Developing':
      return ratingDisplay
    case 'Established':
      return `${ratingDisplay}★`
  }
}
