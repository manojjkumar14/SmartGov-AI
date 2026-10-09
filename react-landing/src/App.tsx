import React, { useState, useEffect } from 'react'
import { HeroSection } from './components/blocks/hero-section-1'
import { AnimatedGroup } from './components/ui/animated-group'
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Menu, 
  X, 
  GraduationCap, 
  Sprout, 
  UserCheck, 
  Activity, 
  Briefcase, 
  Calendar, 
  Search, 
  ShieldCheck, 
  Zap, 
  Database,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Categories', href: '#categories' },
    { name: 'How It Works', href: '#how-it-works' },
]

export default function App() {
    const [menuState, setMenuState] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
            {/* Header / Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
                <nav className="w-full px-4 py-3">
                    <div 
                        className={cn(
                            'mx-auto max-w-6xl px-6 py-2 transition-all duration-300 rounded-full border border-transparent',
                            isScrolled 
                                ? 'bg-white/80 dark:bg-navy/80 backdrop-blur-md border-border shadow-lg shadow-navy/5 max-w-4xl px-6' 
                                : 'bg-transparent'
                        )}
                    >
                        <div className="relative flex items-center justify-between">
                            {/* Logo */}
                            <a href="/" className="flex items-center gap-2 group">
                                <span className="text-2xl">🇮🇳</span>
                                <span className="font-extrabold text-xl tracking-tight text-navy group-hover:text-primary transition-colors">
                                    SmartGov <span className="text-primary font-bold">AI</span>
                                </span>
                            </a>

                            {/* Desktop Nav Links */}
                            <div className="hidden md:flex items-center gap-8">
                                <ul className="flex gap-6 text-sm font-medium text-muted-foreground">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <a
                                                href={item.href}
                                                className="hover:text-primary transition-colors duration-150">
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Authentication & CTA */}
                            <div className="hidden sm:flex items-center gap-3">
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-navy hover:text-primary font-semibold text-sm">
                                    <a href="/login">Login</a>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-primary hover:bg-primary-dark text-white rounded-full font-semibold text-sm shadow-sm transition-all px-4">
                                    <a href="/signup">Sign Up</a>
                                </Button>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                                className="block p-1.5 text-navy hover:text-primary md:hidden transition-colors">
                                {menuState ? <X className="size-6 animate-fade-in" /> : <Menu className="size-6 animate-fade-in" />}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Mobile Dropdown Panel */}
                <div 
                    className={cn(
                        'fixed inset-x-4 top-20 z-40 rounded-2xl border border-border bg-white p-6 shadow-xl transition-all duration-300 md:hidden flex flex-col gap-6 origin-top',
                        menuState ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                    )}
                >
                    <ul className="flex flex-col gap-4 text-base font-semibold text-navy">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <a
                                    href={item.href}
                                    onClick={() => setMenuState(false)}
                                    className="hover:text-primary block transition-colors">
                                    {item.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <hr className="border-border" />
                    <div className="flex flex-col gap-3">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full rounded-xl justify-center font-bold text-navy">
                            <a href="/login">Login</a>
                        </Button>
                        <Button
                            asChild
                            className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl justify-center font-bold">
                            <a href="/signup">Sign Up</a>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow">
                {/* Hero Section */}
                <HeroSection />

                {/* Trust & Metrics Banner */}
                <section className="bg-white border-y border-border py-12 md:py-16">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div className="flex flex-col justify-center">
                                <span className="text-3xl md:text-4xl font-extrabold text-primary">500+</span>
                                <span className="text-xs md:text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider">Government Schemes</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-3xl md:text-4xl font-extrabold text-primary">25+</span>
                                <span className="text-xs md:text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider">States Covered</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-3xl md:text-4xl font-extrabold text-primary">1L+</span>
                                <span className="text-xs md:text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider">Satisfied Users</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-3xl md:text-4xl font-extrabold text-primary">95%</span>
                                <span className="text-xs md:text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider">AI Accuracy Rate</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Popular Categories Grid */}
                <section id="categories" className="py-20 bg-background scroll-mt-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">
                                Explore Benefits
                            </span>
                            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-navy">
                                Popular Categories
                            </h2>
                            <p className="mt-4 text-muted-foreground text-base">
                                Select a category to match with schemes specifically targeted to your background and requirements.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Card 1 */}
                            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group duration-300">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    🎓
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-navy">Students</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    Access higher education scholarships, study-abroad grants, research fellowships, and laptop distribution schemes.
                                </p>
                            </div>
                            
                            {/* Card 2 */}
                            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group duration-300">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    👨‍🌾
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-navy">Farmers</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    Discover PM-KISAN payouts, tractor and machinery subsidies, crop insurance schemes, and low-interest agriculture credit.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group duration-300">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    👩
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-navy">Women</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    Explore maternity benefits, entrepreneurship development loans, self-help group funding, and safety schemes.
                                </p>
                            </div>

                            {/* Card 4 */}
                            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group duration-300">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    🏥
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-navy">Health & Wellness</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    Find free treatment coverage via Ayushman Bharat, medical support, child immunization grants, and regional health insurance.
                                </p>
                            </div>

                            {/* Card 5 */}
                            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group duration-300">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    💼
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-navy">Startups & MSMEs</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    Access Startup India recognition benefits, Mudra loans, technology upgrade grants, and collateral-free business capital.
                                </p>
                            </div>

                            {/* Card 6 */}
                            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group duration-300">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    👴
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-navy">Senior Citizens</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    Discover monthly old-age pensions, travel subsidies, savings schemes, and senior-focused healthcare facilities.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How SmartGov AI Works */}
                <section id="how-it-works" className="py-20 bg-slate-50 border-y border-border/80 scroll-mt-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">
                                Workflow
                            </span>
                            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-navy">
                                How SmartGov AI Works
                            </h2>
                            <p className="mt-4 text-muted-foreground text-base">
                                Find public schemes in 3 simple steps, powered by advanced semantic AI search.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Connector line for desktop */}
                            <div className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 -translate-y-12 -z-10" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="size-16 rounded-full bg-white border-2 border-primary/50 flex items-center justify-center text-xl font-bold text-primary shadow-md mb-6 relative">
                                        1
                                        <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping pointer-events-none" />
                                    </div>
                                    <h3 className="text-lg font-bold text-navy">Describe Profile</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                                        Chat with the AI. Tell it about your state, age, student status, occupation, or income. No complex government codes required.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="size-16 rounded-full bg-white border-2 border-primary/50 flex items-center justify-center text-xl font-bold text-primary shadow-md mb-6">
                                        2
                                    </div>
                                    <h3 className="text-lg font-bold text-navy">AI Personalized Search</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                                        Our AI engine parses your details and cross-references them against 500+ active central and state welfare databases.
                                    </p>
                                </div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="size-16 rounded-full bg-white border-2 border-primary/50 flex items-center justify-center text-xl font-bold text-primary shadow-md mb-6">
                                        3
                                    </div>
                                    <h3 className="text-lg font-bold text-navy">Match & Apply</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                                        Receive a structured list of matching schemes. Read simple summaries, understand eligibility rules, and get direct links to apply.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-20 bg-white scroll-mt-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">
                                Core Capabilities
                            </span>
                            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-navy">
                                Why Use SmartGov AI?
                            </h2>
                            <p className="mt-4 text-muted-foreground text-base">
                                Traditional portals are confusing and hard to navigate. SmartGov AI simplifies the process with intuitive features.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Feature 1 */}
                            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-slate-50 hover:bg-slate-50/50 transition-colors">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Sparkles className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-navy">Gemini 3.5 AI Engine</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Ask questions in conversational language. The AI parses complex eligibility parameters from unstructured text instantly.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-slate-50 hover:bg-slate-50/50 transition-colors">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Database className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-navy">500+ Central & State Schemes</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Covers schemes across states like Gujarat, Maharashtra, Rajasthan, Karnataka, and Union government initiatives.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-slate-50 hover:bg-slate-50/50 transition-colors">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Zap className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-navy">Lightning Fast Recommendations</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Get matched schemes in seconds rather than spending hours filtering search tables on legacy government portals.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 4 */}
                            <div className="flex gap-4 p-6 rounded-2xl border border-border bg-slate-50 hover:bg-slate-50/50 transition-colors">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-navy">Secure & Private</h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Your details are processed securely to verify eligibility. Your chat logs are kept private and secure under your login account.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final Call to Action Section */}
                <section className="py-12 md:py-20 bg-background">
                    <div className="mx-auto max-w-4xl px-6">
                        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-dark to-primary p-8 md:p-12 text-center shadow-xl text-white">
                            <div className="absolute -top-24 -left-24 size-48 rounded-full bg-white/5 blur-2xl" />
                            <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-white/5 blur-2xl" />
                            
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                Ready to find government benefits?
                            </h2>
                            <p className="mx-auto mt-4 max-w-md text-base text-white/95 leading-relaxed">
                                Create an account or log in to query our AI Assistant in real time and discover what you're eligible for.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl px-8 shadow-md">
                                    <a href="/chatbot" className="flex items-center gap-2">
                                        <span>Start AI Chat</span>
                                        <ArrowRight className="size-4" />
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl px-8 transition-colors">
                                    <a href="/signup">
                                        Create Free Account
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-navy text-white/90 border-t border-navy-dark pt-16 pb-8">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/10">
                        {/* Column 1: Info */}
                        <div className="md:col-span-6 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🇮🇳</span>
                                <span className="font-extrabold text-xl tracking-tight text-white">
                                    SmartGov <span className="text-primary font-bold">AI</span>
                                </span>
                            </div>
                            <p className="text-sm text-white/70 max-w-sm leading-relaxed">
                                AI-Powered Government Scheme Discovery Platform. Helping citizens navigate public schemes, scholarships, loans, and benefits with ease.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-3">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Navigation</h4>
                            <ul className="flex flex-col gap-2.5 text-sm text-white/75">
                                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#categories" className="hover:text-primary transition-colors">Popular Categories</a></li>
                                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                            </ul>
                        </div>

                        {/* Column 3: Platform Links */}
                        <div className="md:col-span-3">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">SmartGov AI App</h4>
                            <ul className="flex flex-col gap-2.5 text-sm text-white/75">
                                <li><a href="/login" className="hover:text-primary transition-colors">Login</a></li>
                                <li><a href="/signup" className="hover:text-primary transition-colors">Sign Up</a></li>
                                <li><a href="/chatbot" className="hover:text-primary transition-colors text-primary font-semibold flex items-center gap-1">
                                    Chatbot <ArrowUpRight className="size-3" />
                                </a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50">
                        <p>© 2026 SmartGov AI. Built with ❤️ using Flask & AI. All rights reserved.</p>
                        <p className="mt-2 sm:mt-0 flex gap-4">
                            <span>Citizen Welfare Initiative</span>
                            <span>|</span>
                            <span>Privacy Policy</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
