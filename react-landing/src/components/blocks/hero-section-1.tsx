import React from 'react'
import { ArrowRight, ChevronRight, Menu, X, Sparkles, Check, Send, Search, User, Bot, FileText, LayoutDashboard, History, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { TextEffect } from '@/components/ui/text-effect'
import { cn } from '@/lib/utils'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
} as const

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-background pt-20 pb-12 lg:pt-28 lg:pb-20">
            {/* Background Gradients */}
            <div
                aria-hidden
                className="z-0 absolute inset-0 pointer-events-none isolate opacity-40 contain-strict hidden lg:block">
                <div className="w-[45rem] h-[45rem] absolute -left-48 -top-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(22,138,90,0.15)_0,transparent_70%)]" />
                <div className="w-[40rem] h-[40rem] absolute -right-20 -top-20 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,180,0,0.08)_0,transparent_75%)]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left Column: Heading and CTAs */}
                    <div className="lg:col-span-7 text-left flex flex-col justify-center">
                        <AnimatedGroup variants={transitionVariants}>
                            <a
                                href="/chatbot"
                                className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10">
                                <Sparkles className="size-3.5 text-accent animate-pulse" />
                                <span>AI-POWERED GOVERNMENT BENEFITS</span>
                                <ArrowRight className="size-3" />
                            </a>
                
                            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-navy sm:text-5xl md:text-6xl xl:text-6xl leading-none">
                                Find the government schemes you're eligible for.
                            </h1>
                            
                            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                                Discover relevant government schemes, scholarships, benefits, and opportunities with SmartGov AI. Describe your profile and match instantly.
                            </p>
                        </AnimatedGroup>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 0.5,
                                        },
                                    },
                                },
                                item: {
                                    hidden: {
                                        opacity: 0,
                                        y: 20,
                                    },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: 'spring',
                                            bounce: 0.3,
                                            duration: 2,
                                        },
                                    },
                                },
                            } as any}
                            className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-xl px-8 text-base bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-300">
                                <a href="/chatbot" className="flex items-center justify-center gap-2">
                                    <span>Start Finding Schemes</span>
                                    <ArrowRight className="size-4" />
                                </a>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-xl px-8 text-base border-border bg-white text-navy hover:bg-muted transition-all">
                                <a href="#categories" className="flex items-center justify-center">
                                    <span>Explore Categories</span>
                                </a>
                            </Button>
                        </AnimatedGroup>
                    </div>

                    {/* Right Column: AI Interactive Preview */}
                    <div className="lg:col-span-5 relative">
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 0.8,
                                        },
                                    },
                                },
                                item: {
                                    hidden: { opacity: 0, scale: 0.95, y: 15 },
                                    visible: {
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                        transition: { type: 'spring' as const, duration: 1.2 }
                                    }
                                }
                            }}>
                            <div className="relative mx-auto w-full max-w-md lg:max-w-none rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-navy/10 ring-1 ring-black/5">
                                <div className="absolute -top-3 -right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 z-20">
                                    <Sparkles className="size-3 fill-current" /> Live Demo Mockup
                                </div>
                                
                                {/* Mock App Header */}
                                <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/30 rounded-t-xl">
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-3 rounded-full bg-red-400" />
                                        <span className="size-3 rounded-full bg-yellow-400" />
                                        <span className="size-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="text-xs font-semibold text-muted-foreground">SmartGov AI Assistant</div>
                                    <div className="size-3" />
                                </div>

                                {/* Mock App Body */}
                                <div className="bg-slate-50 p-4 rounded-b-xl flex flex-col gap-4 font-sans text-sm h-[380px] overflow-y-auto">
                                    
                                    {/* System Greeting */}
                                    <div className="flex items-start gap-2.5">
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                            <Bot className="size-4 text-primary" />
                                        </div>
                                        <div className="bg-white border border-border/60 rounded-2xl rounded-tl-none p-3 shadow-sm text-navy max-w-[85%]">
                                            Hello! I am SmartGov AI. What kind of government schemes are you looking for today?
                                        </div>
                                    </div>

                                    {/* User Input Bubble */}
                                    <div className="flex items-start gap-2.5 justify-end">
                                        <div className="bg-primary text-white rounded-2xl rounded-tr-none p-3 shadow-sm max-w-[85%] leading-relaxed">
                                            "I'm a student from Gujarat looking for scholarship opportunities."
                                        </div>
                                        <div className="size-8 rounded-full bg-navy/10 flex items-center justify-center border border-navy/20 shrink-0">
                                            <User className="size-4 text-navy" />
                                        </div>
                                    </div>

                                    {/* AI Analysis Result */}
                                    <div className="flex items-start gap-2.5 animate-pulse-slow">
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                            <Bot className="size-4 text-primary" />
                                        </div>
                                        <div className="bg-white border border-border rounded-2xl rounded-tl-none p-3.5 shadow-md text-navy max-w-[85%] flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                                <Sparkles className="size-3" /> AI ANALYSIS COMPLETE
                                            </div>
                                            <div className="font-semibold text-navy text-sm">
                                                12 potentially relevant schemes found
                                            </div>
                                            
                                            {/* Matches */}
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                <span className="inline-flex items-center gap-1 bg-green-50 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-xxs font-medium">
                                                    <Check className="size-2.5" /> Education
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-green-50 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-xxs font-medium">
                                                    <Check className="size-2.5" /> Student
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-green-50 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-xxs font-medium">
                                                    <Check className="size-2.5" /> Gujarat
                                                </span>
                                            </div>

                                            <div className="text-xs text-muted-foreground border-t border-border/80 pt-2 mt-1">
                                                Matches include Digital Gujarat Scholarship and MYSY Scheme.
                                            </div>
                                            
                                            <a 
                                                href="/chatbot" 
                                                className="mt-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg text-center shadow transition-all flex items-center justify-center gap-1">
                                                <span>View Recommendations</span>
                                                <ArrowRight className="size-3" />
                                            </a>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>

                </div>
            </div>
        </section>
    )
}
