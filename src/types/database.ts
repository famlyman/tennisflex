// Tennis-Flex Database Types
// Matches the Supabase schema

// ==================== ENUMS ====================

export type SeasonStatus = 'upcoming' | 'registration_open' | 'active' | 'completed' | 'cancelled'
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'disputed' | 'forfeited'
export type DivisionType = 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles'
export type FlagStatus = 'pending' | 'reviewed' | 'upheld' | 'dismissed'
export type ExtensionStatus = 'pending' | 'approved' | 'denied'

// ==================== TABLES ====================

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  gender: 'male' | 'female' | 'other' | null
  created_at: string
}

export interface Player {
  id: string
  profile_id: string
  organization_id: string
  initial_ntrp_singles: number | null
  initial_ntrp_doubles: number | null
  tfr_singles: number
  tfr_doubles: number
  rating_deviation: number
  match_count_singles: number
  match_count_doubles: number
  flag_count: number
  utr_rating: number | null
  created_at: string
  // Joined fields
  profile?: Profile
}

export interface Coordinator {
  id: string
  profile_id: string
  organization_id: string
  role: 'admin' | 'coordinator'
  created_at: string
  // Joined fields
  profile?: Profile
}

export interface Season {
  id: string
  organization_id: string
  name: string
  status: SeasonStatus
  registration_start: string
  registration_end: string
  season_start: string
  season_end: string
  points_config: {
    win: number
    loss: number
    forfeit: number
    default_win: number
  }
  created_at: string
  // Joined fields
  organization?: Organization
}

export interface Division {
  id: string
  season_id: string
  name: string
  type: DivisionType
  created_at: string
  // Joined fields
  season?: Season
  skill_levels?: SkillLevel[]
}

export interface SkillLevel {
  id: string
  division_id: string
  name: string
  min_rating: number | null
  max_rating: number | null
  created_at: string
  // Joined fields
  division?: Division
  matches?: Match[]
  players?: Player[]
}

export interface Match {
  id: string
  skill_level_id: string
  home_player_id: string | null
  away_player_id: string | null
  status: MatchStatus
  scheduled_at: string | null
  score: string | null
  winner_id: string | null
  verified_by_opponent: boolean
  created_at: string
  // Joined fields
  skill_level?: SkillLevel
  home_player?: Player
  away_player?: Player
  winner?: Player
  messages?: Message[]
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  // Joined fields
  sender?: Profile
}

export interface RatingFlag {
  id: string
  reporter_id: string
  target_player_id: string
  reason: string
  status: FlagStatus
  created_at: string
  // Joined fields
  reporter?: Profile
  target_player?: Player
}

export interface Extension {
  id: string
  match_id: string
  requested_by: string
  reason: string
  status: ExtensionStatus
  created_at: string
  // Joined fields
  match?: Match
  requested_by_profile?: Profile
}

export interface SeasonRegistration {
  id: string
  player_id: string
  season_id: string
  division_id: string | null
  skill_level_id: string | null
  status: 'active' | 'withdrawn' | 'completed'
  registered_at: string
  updated_at: string
  // Joined fields
  player?: Player
  season?: Season
  division?: Division
  skill_level?: SkillLevel
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  link: string | null
  data: Record<string, any>
  read: boolean
  created_at: string
}

// ==================== API RESPONSE TYPES ====================

export interface SeasonWithDetails extends Season {
  organization: Organization
  divisions: (Division & { skill_levels: SkillLevel[] })[]
}

export interface DivisionWithDetails extends Division {
  season: Season
  skill_levels: (SkillLevel & { matches: Match[] })[]
}

export interface SkillLevelWithDetails extends SkillLevel {
  division: Division
  matches: MatchWithPlayers[]
  players: Player[]
}

export interface MatchWithDetails extends Omit<Match, 'home_player' | 'away_player'> {
  skill_level: SkillLevel
  home_player: Player | null
  away_player: Player | null
}

export interface MatchWithPlayers extends Match {
  home_player?: Player
  away_player?: Player
  skill_level?: SkillLevel
}

// ==================== FORM TYPES ====================

export interface CreateSeasonInput {
  organization_id: string
  name: string
  registration_start: string
  registration_end: string
  season_start: string
  season_end: string
  points_config?: {
    win: number
    loss: number
    forfeit: number
    default_win: number
  }
}

export interface CreateDivisionInput {
  season_id: string
  name: string
  type: DivisionType
}

export interface CreateSkillLevelInput {
  division_id: string
  name: string
  min_rating?: number
  max_rating?: number
}

export interface SubmitMatchScoreInput {
  score: string
  winner_id: string
}

export interface CreateRatingFlagInput {
  target_player_id: string
  reason: string
}

export interface CreateExtensionInput {
  match_id: string
  reason: string
}

// ==================== UI TYPES ====================

export interface PlayerWithProfile extends Player {
  profile: Profile
}

export interface SeasonCardProps {
  season: Season
  organization: Organization
}

export interface MatchCardProps {
  match: MatchWithDetails
  currentPlayerId?: string
}

export interface LeaderboardEntry {
  rank: number
  player: PlayerWithProfile
  wins: number
  losses: number
  points: number
  sets_won: number
  sets_lost: number
}