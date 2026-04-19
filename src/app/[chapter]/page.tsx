import { getOrganizationBySlug, getSeasonsByOrganization } from '@/actions/organizations'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Organization, Season } from '@/types/database'

function SeasonCard({ season }: { season: Season }) {
  const isRegistrationOpen = season.status === 'registration_open'
  const isActive = season.status === 'active'
  
  const statusLabel = {
    upcoming: 'Coming Soon',
    registration_open: 'Registration Open',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }[season.status] || season.status

  const statusClass = {
    upcoming: 'bg-slate-100 text-slate-600',
    registration_open: 'bg-emerald-100 text-emerald-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-500',
    cancelled: 'bg-red-100 text-red-700'
  }[season.status] || 'bg-slate-100 text-slate-600'

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">{season.name}</h3>
          <p className="text-sm text-slate-500">
            {new Date(season.season_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(season.season_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-sm">
          <span className={`px-3 py-1 rounded-full font-medium ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-500">
        <div>Registration: {new Date(season.registration_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(season.registration_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
      {isRegistrationOpen && (
        <div className="mt-4">
          <Link 
            href={`/seasons/${season.id}/register`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Register Now
          </Link>
        </div>
      )}
    </div>
  )
}

export default async function FlexPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: slug } = await params
  
  // Fetch organization by slug
  const organization = await getOrganizationBySlug(slug)
  
  if (!organization) {
    notFound()
  }

  // Fetch seasons for this organization
  const seasons = await getSeasonsByOrganization(organization.id)

  // Separate active/upcoming from completed
  const activeSeasons = seasons.filter(s => ['registration_open', 'active', 'upcoming'].includes(s.status))
  const pastSeasons = seasons.filter(s => s.status === 'completed')

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <Link href={`/${slug}`} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">T</span>
          </div>
          <span className="font-bold text-xl tracking-tight">{organization.name}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href={`/${slug}#seasons`} className="hover:text-indigo-600">Seasons</Link>
          <Link href={`/${slug}#leaderboard`} className="hover:text-indigo-600">Leaderboard</Link>
          <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">
            Login
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Flex Hero */}
        <section className="px-6 py-16 md:py-24 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="mb-4 text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full">
            Tennis-Flex Flex
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {organization.name}
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Competitive tennis in your area. Join a season, find your level, and play matches on your schedule.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/register?type=player"
              className="px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Join This Flex
            </Link>
            <Link 
              href="#seasons"
              className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-full text-lg font-semibold hover:border-indigo-600 transition-colors"
            >
              View Seasons
            </Link>
          </div>
        </section>

        {/* Active/Upcoming Seasons */}
        <section id="seasons" className="px-6 py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">
              {activeSeasons.length > 0 ? 'Current & Upcoming Seasons' : 'Seasons'}
            </h2>
            
            {activeSeasons.length > 0 ? (
              activeSeasons.map((season) => (
                <SeasonCard key={season.id} season={season} />
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-slate-500">No seasons currently available. Check back soon!</p>
              </div>
            )}

            {pastSeasons.length > 0 && (
              <>
                <h3 className="text-xl font-bold mt-12 mb-4 text-center text-slate-600">Past Seasons</h3>
                {pastSeasons.slice(0, 3).map((season) => (
                  <SeasonCard key={season.id} season={season} />
                ))}
              </>
            )}
          </div>
        </section>

        {/* Leaderboard Teaser */}
        <section id="leaderboard" className="px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
            <p className="text-slate-600 mb-8">
              See the top players in each division. Full leaderboard available after registration.
            </p>
            <div className="bg-slate-50 rounded-xl p-8 text-center">
              <p className="text-slate-500">Join a season to appear on the leaderboard!</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Part of Tennis-Flex</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-indigo-600">All Flexes</Link>
            <Link href="#" className="hover:text-indigo-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}