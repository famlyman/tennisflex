import Link from "next/link";
import { Suspense } from "react";

export default function ChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const resolvedParams = Promise.resolve(params)
  const chapterSlug = "foothills" // would be: (await params).chapter
  
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <Link href={`/${chapterSlug}`} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">T</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Tennis-Flex Foothills</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href={`/${chapterSlug}#seasons`} className="hover:text-indigo-600">Seasons</Link>
          <Link href={`/${chapterSlug}#leaderboard`} className="hover:text-indigo-600">Leaderboard</Link>
          <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">
            Login
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Chapter Hero */}
        <section className="px-6 py-16 md:py-24 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="mb-4 text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full">
            Local Chapter
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Tennis-Flex Foothills
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Competitive tennis in the Foothills area. Join a season, find your level, and play matches on your schedule.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/register?type=player"
              className="px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Join This Chapter
            </Link>
            <Link 
              href="#seasons"
              className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-full text-lg font-semibold hover:border-indigo-600 transition-colors"
            >
              View Seasons
            </Link>
          </div>
        </section>

        {/* Active Seasons */}
        <section id="seasons" className="px-6 py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Current & Upcoming Seasons</h2>
            
            {/* Demo season */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">Spring 2026</h3>
                  <p className="text-sm text-slate-500">Men's Singles • Women's Singles • Mixed Doubles</p>
                </div>
                <div className="text-sm">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                    Registration Open
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-500">
                <div>Registration: Mar 1 - Mar 21</div>
                <div>Season: Mar 23 - May 18</div>
                <div>Divisions: 2.5, 3.0, 3.5, 4.0, 4.5</div>
              </div>
            </div>

            {/* Demo - no past seasons message */}
            <p className="text-center text-sm text-slate-500">
              More seasons coming soon. Want to coordinate? <Link href="/register?type=coordinator" className="text-indigo-600 hover:underline">Apply to coordinate</Link>
            </p>
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
            <Link href="/" className="hover:text-indigo-600">All Chapters</Link>
            <Link href="#" className="hover:text-indigo-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}