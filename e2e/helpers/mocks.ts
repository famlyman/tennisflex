import { Page } from '@playwright/test'

const MOCK_USER = {
  id: 'user-123',
  email: 'player@test.com',
  full_name: 'Test Player',
}

const MOCK_PROFILE = {
  id: 'user-123',
  full_name: 'Test Player',
  role: null,
  gender: 'male',
  initial_ntrp_singles: 3.5,
  initial_ntrp_doubles: 3.5,
  created_at: '2026-01-01T00:00:00Z',
}

const MOCK_PLAYER = {
  id: 'player-456',
  profile_id: 'user-123',
  organization_id: 'org-789',
  initial_ntrp_singles: 3.5,
  initial_ntrp_doubles: 3.5,
  tfr_singles: 35,
  tfr_doubles: 35,
  rating_deviation: 4.0,
  match_count_singles: 5,
  match_count_doubles: 2,
  flag_count: 0,
  is_ready_to_play: true,
}

const MOCK_ORGANIZATION = {
  id: 'org-789',
  name: 'Tennis-Flex Seattle',
  slug: 'seattle',
}

const MOCK_SEASON = {
  id: 'season-111',
  organization_id: 'org-789',
  name: 'Spring 2026',
  status: 'registration_open',
  season_start: '2026-04-01',
  season_end: '2026-07-01',
  registration_start: '2026-03-01',
  registration_end: '2026-04-15',
  description: 'Test season',
  created_at: '2026-02-01T00:00:00Z',
  organization: { id: 'org-789', name: 'Tennis-Flex Seattle' },
}

const MOCK_DIVISIONS = [
  { id: 'div-1', season_id: 'season-111', name: 'Men\'s Singles', type: 'mens_singles' },
  { id: 'div-2', season_id: 'season-111', name: 'Women\'s Singles', type: 'womens_singles' },
  { id: 'div-3', season_id: 'season-111', name: 'Men\'s Doubles', type: 'mens_doubles' },
  { id: 'div-4', season_id: 'season-111', name: 'Women\'s Doubles', type: 'womens_doubles' },
  { id: 'div-5', season_id: 'season-111', name: 'Mixed Doubles', type: 'mixed_doubles' },
]

const MOCK_SKILL_LEVELS = [
  { id: 'sl-2.5', division_id: 'div-1', name: '2.5', min_rating: 25, max_rating: 29 },
  { id: 'sl-3.0', division_id: 'div-1', name: '3.0', min_rating: 30, max_rating: 34 },
  { id: 'sl-3.5', division_id: 'div-1', name: '3.5', min_rating: 35, max_rating: 39 },
  { id: 'sl-4.0', division_id: 'div-1', name: '4.0', min_rating: 40, max_rating: 44 },
  { id: 'sl-4.5', division_id: 'div-1', name: '4.5', min_rating: 45, max_rating: 49 },
]

const MOCK_MATCHES = [
  {
    id: 'match-1',
    skill_level_id: 'sl-3.5',
    home_player_id: 'player-456',
    away_player_id: 'player-789',
    status: 'scheduled',
    scheduled_at: '2026-05-20T14:00:00Z',
    score: null,
    winner_id: null,
    verified_by_opponent: false,
    created_at: '2026-04-20T00:00:00Z',
    skill_level: { id: 'sl-3.5', name: '3.5', division: { id: 'div-1', name: 'Men\'s Singles', type: 'mens_singles', season_id: 'season-111' } },
    home_player: { id: 'player-456', profile: { full_name: 'Test Player', location: 'Seattle' } },
    away_player: { id: 'player-789', profile: { full_name: 'Opponent Player', location: 'Bellevue' } },
  },
  {
    id: 'match-2',
    skill_level_id: 'sl-3.5',
    home_player_id: 'player-999',
    away_player_id: 'player-456',
    status: 'completed',
    scheduled_at: '2026-05-10T10:00:00Z',
    score: '6-4 6-3',
    winner_id: 'player-456',
    verified_by_opponent: true,
    created_at: '2026-04-10T00:00:00Z',
    skill_level: { id: 'sl-3.5', name: '3.5', division: { id: 'div-1', name: 'Men\'s Singles', type: 'mens_singles', season_id: 'season-111' } },
    home_player: { id: 'player-999', profile: { full_name: 'Other Player', location: 'Redmond' } },
    away_player: { id: 'player-456', profile: { full_name: 'Test Player', location: 'Seattle' } },
  },
]

export function getMockUser() { return MOCK_USER }
export function getMockProfile() { return MOCK_PROFILE }
export function getMockPlayer() { return MOCK_PLAYER }
export function getMockOrganization() { return MOCK_ORGANIZATION }
export function getMockSeason() { return MOCK_SEASON }
export function getMockDivisions() { return [...MOCK_DIVISIONS] }
export function getMockSkillLevels() { return [...MOCK_SKILL_LEVELS] }
export function getMockMatches() { return JSON.parse(JSON.stringify(MOCK_MATCHES)) }

export async function setupAuthInterception(page: Page) {
  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: MOCK_USER.id,
        aud: 'authenticated',
        email: MOCK_USER.email,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: MOCK_USER.full_name },
        identities: [],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }),
    })
  })

  await page.route('**/auth/v1/user', async route => {
    const body = JSON.stringify({
      id: MOCK_USER.id,
      aud: 'authenticated',
      email: MOCK_USER.email,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: MOCK_USER.full_name },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })
    await route.fulfill({ status: 200, contentType: 'application/json', body })
  })
}

export async function setupApiMocks(page: Page) {
  await page.route('**/api/**', async route => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/api/dashboard') || url.includes('/api/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    }
    if (url.includes('/api/seasons') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ seasons: [MOCK_SEASON] }),
      })
    }
    if (url.includes('/api/leaderboard')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ leaderboard: [] }),
      })
    }
    if (url.includes('/api/matches') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ matches: MOCK_MATCHES }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
}

export async function setupDbInterception(page: Page) {
  const mockResponse = (data: unknown) => ({
    data,
    error: null,
    count: Array.isArray(data) ? data.length : null,
    status: 200,
    statusText: 'OK',
  })

  await page.route('**/rest/v1/**', async route => {
    const url = route.request().url()

    if (url.includes('profiles') && url.includes('user-123')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse([MOCK_PROFILE])),
      })
    }
    if (url.includes('players')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse([MOCK_PLAYER])),
      })
    }
    if (url.includes('seasons') && url.includes('org-789')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse([MOCK_SEASON])),
      })
    }
    if (url.includes('seasons')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse([MOCK_SEASON])),
      })
    }
    if (url.includes('divisions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse(MOCK_DIVISIONS)),
      })
    }
    if (url.includes('skill_levels')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse(MOCK_SKILL_LEVELS)),
      })
    }
    if (url.includes('matches')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse(MOCK_MATCHES)),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse([])),
    })
  })
}

export async function setupAllMocks(page: Page) {
  await setupAuthInterception(page)
  await setupDbInterception(page)
  await setupApiMocks(page)
}
