"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Organization } from "@/types/database";
import PromoCard from "@/components/PromoCard";

function TennisBall({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[#ccff00] relative overflow-hidden shadow-lg shadow-[#ccff00]/30">
        <div className="absolute inset-0 border-2 border-black/20 rounded-full" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-80">
          <path d="M20,30 Q35,20 50,30 Q65,40 80,30" stroke="#000" strokeWidth="3" fill="none" opacity="0.6" />
          <path d="M20,50 Q35,40 50,50 Q65,60 80,50" stroke="#000" strokeWidth="3" fill="none" opacity="0.6" />
          <path d="M20,70 Q35,60 50,70 Q65,80 80,70" stroke="#000" strokeWidth="3" fill="none" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      {children}
    </div>
  );
}

function FloatingElement({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const y = Math.sin((offset + delay) * 0.02) * 10;

  return (
    <div className={className} style={{ transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
}

function ChapterCard({ 
  name, 
  slug,
  region,
  status = "active" 
}: { 
  name: string
  slug?: string
  region?: string
  status?: "active" | "coming" 
}) {
  const isActive = status === "active" && slug;
  const href = isActive ? `/${slug}` : "/register?type=request";

  return (
    <Link href={href}>
      <AnimatedSection>
        <div className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
          isActive 
            ? "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10" 
            : "bg-slate-50 border-dashed border-slate-300 opacity-70"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
              isActive 
                ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25" 
                : "bg-slate-200 text-slate-400"
            }`}>
              {isActive ? "TF" : "?"}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                {name}
              </h3>
              <p className={`text-sm ${isActive ? "text-slate-500" : "text-slate-400"}`}>
                {isActive ? region || "Active Flex" : "Coming soon"}
              </p>
            </div>
          </div>
          {isActive && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Available Now</span>
            </div>
          )}
        </div>
      </AnimatedSection>
    </Link>
  );
}

interface HomeClientProps {
  organizations: Organization[]
}

export default function HomeClient({ organizations }: HomeClientProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const activeOrgs = organizations || [];
  
  const filteredOrgs = activeOrgs.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.region && org.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasOrganizations = activeOrgs.length > 0;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="noise-overlay" />

      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative glass rounded-full px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
                <Image 
                  src="/logo-192.png" 
                  alt="Tennis-Flex" 
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-graphite-900">Tennis-Flex</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="#flexes" className="text-graphite-600 hover:text-indigo-600 transition-colors">Find Your Flex</Link>
              <Link href="#features" className="text-graphite-600 hover:text-indigo-600 transition-colors">How It Works</Link>
              <Link href="#ratings" className="text-graphite-600 hover:text-indigo-600 transition-colors">TFR System</Link>
              <Link 
                href="/login" 
                className="px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-indigo-600 transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-28">
        <section className="relative px-6 py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <AnimatedSection>
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-50 rounded-full text-indigo-700 text-sm font-medium mb-6">
                    <span className="w-4 h-4 bg-indigo-500 rounded-full" />
                    Fresh balls, fair calls, flexible schedule
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={100}>
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                    Flex Your Game, <br />
                    <span className="gradient-text">Own Your Time</span>
                  </h1>
                </AnimatedSection>

                <AnimatedSection delay={200}>
                  <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
                    The league designed for the everyday player who loves the game but hates the rigid calendar. 
                    No forfeited matches or stressful coordination—just pure tennis on your terms. 
                    Weekend warrior or weeknight post-work hitter, come Flex your game.
                  </p>
                </AnimatedSection>

                {/* <AnimatedSection delay={300}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link 
                      href="/register?type=player" 
                      className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                    >
                      Your Game, Your Time
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                    <Link 
                      href="/register?type=request" 
                      className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-full text-lg font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-all"
                    >
                      Real Play, Real Easy
                    </Link>
                  </div>
                </AnimatedSection> */}

                <AnimatedSection delay={400}>
                  <div className="flex items-center gap-6 mt-10 text-sm text-slate-500">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white" />
                      ))}
                    </div>
                    <span>Join the growing Flex community</span>
                  </div>
                </AnimatedSection>
              </div>

              <div className="relative hidden lg:block">
                <FloatingElement delay={0} className="absolute top-0 right-10">
                  <TennisBall />
                </FloatingElement>
                <FloatingElement delay={60} className="absolute top-40 left-0">
                  <TennisBall className="scale-75 opacity-70" />
                </FloatingElement>
                <FloatingElement delay={120} className="absolute bottom-20 right-20">
                  <TennisBall className="scale-50 opacity-50" />
                </FloatingElement>
              </div>
            </div>
            </div>
          </section>

        <section id="features" className="px-6 py-24 bg-[#fafafa]">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
                  How It Works
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Registration opens for a given season, you register within the division you wish to play. Once registration closes, matchups are made and you have until the close of the season to complete your matches.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-2xl mx-auto">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-indigo-600">1</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">Register for the Season</h3>
                      <p className="text-slate-600">Choose the division that fits your level and sign up when registration opens.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-indigo-600">2</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">Matchups Are Made</h3>
                      <p className="text-slate-600">Once registration closes, you'll be paired with opponents based on your rating.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-indigo-600">3</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">Play at Your Pace</h3>
                      <p className="text-slate-600">Complete your matches by season's end. All incomplete matches will not be counted and no points or rating adjustments will be made.</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section id="ratings" className="px-6 py-24 bg-white">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
                  Tennis-Flex Rating
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Fair matchups powered by our dynamic rating system.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={50}>
              <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 max-w-md mx-auto mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🎾</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Match Complete!</div>
                    <div className="text-sm text-slate-500">You won 6-4, 6-3</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">TFR-S Rating</div>
                    <div className="text-2xl font-bold text-indigo-600">43 <span className="text-sm font-normal text-slate-500">→ +1</span></div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Upgraded
                  </div>
                </div>
              </div>
            </AnimatedSection>
            
            <div className="grid md:grid-cols-2 gap-8">
              <AnimatedSection delay={100}>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-3xl border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🎾</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">TFR-S</h3>
                      <p className="text-slate-500">Singles Rating</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600">Your Rating</span>
                      <span className="text-2xl font-bold text-indigo-600">43</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600">Confidence</span>
                      <span className="text-sm font-medium text-green-600">★ Established (10+ matches)</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-600">Rating Range</span>
                      <span className="text-slate-500">10 - 80</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-3xl border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">👥</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">TFR-D</h3>
                      <p className="text-slate-500">Doubles Rating</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600">Your Rating</span>
                      <span className="text-2xl font-bold text-orange-600">38</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600">Confidence</span>
                      <span className="text-sm font-medium text-yellow-600">● Developing (5-9 matches)</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-600">Rating Range</span>
                      <span className="text-slate-500">10 - 80</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            <AnimatedSection delay={300}>
              <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">How ratings work</h4>
                    <p className="text-slate-600 text-sm">
                      Win against higher-rated opponents for bigger gains. Close losses lose little, 
                      blowouts lose more. Play 10+ matches to earn an Established badge.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section id="flexes" className="px-6 py-24 bg-white">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
                  Choose Your Flex
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
                  Local tennis communities across the country. Find one near you.
                </p>
                
                <div className="max-w-md mx-auto relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="text"
                    placeholder="Search by city, state, or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-16 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(async (position) => {
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                            const data = await res.json();
                            const city = data.address.city || data.address.town || data.address.village || data.address.county;
                            if (city) setSearchQuery(city);
                          } catch (err) {
                            console.error("Location detection failed", err);
                          }
                        });
                      }
                    }}
                    className="absolute inset-y-2 right-2 px-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all"
                    title="Find my location"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </AnimatedSection>

            {hasOrganizations ? (
              filteredOrgs.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredOrgs.map((org) => (
                    <ChapterCard 
                      key={org.id}
                      name={org.name}
                      slug={org.slug}
                      region={org.region}
                      status="active"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 mb-4 font-medium">No Flexes found in this area yet.</p>
                  <Link href="/register?type=request" className="text-indigo-600 font-bold hover:underline">
                    Request a Flex for your city →
                  </Link>
                </div>
              )
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <ChapterCard 
                  name="Your Area?"
                  status="coming"
                />
              </div>
            )}

            <AnimatedSection delay={200}>
              <p className="text-center mt-8 text-slate-500">
                Don&apos;t see your area?{" "}
                <Link href="/register?type=request" className="text-indigo-600 font-medium hover:underline">
                  Request Your Flex
                </Link>
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="px-6 py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Ready to Play?
              </h2>
              <p className="text-xl text-slate-300 mb-10">
                Grab your racquet and let's get moving. The Flexible League awaits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register?type=player" 
                  className="px-8 py-4 bg-[#ccff00] text-slate-900 rounded-full text-lg font-semibold hover:bg-[#b3e600] transition-colors"
                >
                  Tennis Flex: The Flexible League
                </Link>
                <Link 
                  href="/login" 
                  className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full text-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
        <section className="px-6 py-24 bg-[#fafafa]">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
                  Flex Gear & Partners
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Equip yourself for the season and support the local businesses that make Tennis-Flex possible.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8">
              <AnimatedSection delay={100}>
                <PromoCard 
                  type="affiliate"
                  title="Penn Championship Balls"
                  description="The #1 choice for league play. Stock up on a case of 24 cans before your first match."
                  cta="Shop on Amazon"
                  link="#"
                  icon="🎾"
                />
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <PromoCard 
                  type="affiliate"
                  title="Wilson Overgrips"
                  description="Keep your racquet fresh and your grip firm. The most trusted overgrips on the tour."
                  cta="View Gear"
                  link="#"
                  icon="🏸"
                />
              </AnimatedSection>
              <AnimatedSection delay={300}>
                <PromoCard 
                  type="placeholder"
                  title="Sponsor a Flex"
                  description="Reach hundreds of active tennis players in your city. Partner with us today."
                  cta="Get in Touch"
                  link="/register?type=request"
                  icon="🤝"
                />
              </AnimatedSection>
            </div>
          </div>
        </section>

      </main>

      <footer className="px-6 py-12 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
              <Image 
                src="/logo-192.png" 
                alt="Tennis-Flex" 
                fill
                className="object-cover"
              />
            </div>
            <span className="font-bold text-slate-900">Tennis-Flex</span>
          </Link>
          <p className="text-sm text-slate-500">
            © 2026 Tennis-Flex. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="/register?type=request" className="hover:text-indigo-600 transition-colors">Request Flex</Link>
            <Link href="#" className="hover:text-indigo-600 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-indigo-600 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}