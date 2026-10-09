"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  User as UserIcon, 
  LogOut,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  DollarSign,
  MapPin,
  Briefcase,
  FileText,
  Sparkles,
  ArrowLeft,
  XCircle,
  SearchCheck,
  Send,
  Bot,
  Shield
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SmartGovSidebar } from "@/components/ui/smartgov-sidebar";
import { detectLocation } from "@/lib/location";
import { marked } from "marked";

const OCCUPATIONS = [
  "Student",
  "Farmer",
  "Self-employed",
  "Business Owner",
  "Salaried Employee",
  "Government Employee",
  "Unemployed",
  "Homemaker",
  "Senior Citizen",
  "Worker",
  "Entrepreneur",
  "Person with Disability",
  "Other"
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const CATEGORIES = [
  "All",
  "Scholarships",
  "Subsidies",
  "Loans",
  "Pensions",
  "Healthcare",
  "Education",
  "Agriculture",
  "Women",
  "Startup",
  "Employment",
  "Housing",
  "Other"
];

export default function RecommendPage() {
  const [email, setEmail] = useState<string>("user@smartgov.ai");
  const [conversations, setConversations] = useState<any[]>([]);
  
  // Form profile state
  const [occupation, setOccupation] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [incomeValue, setIncomeValue] = useState<number | "">("");
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [headerLocation, setHeaderLocation] = useState<string | null>(null);
  
  // Workspace UI states
  const [view, setView] = useState<"form" | "results">("form");
  const [results, setResults] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form refs for focusing missing inputs
  const occupationRef = useRef<HTMLSelectElement | null>(null);
  const ageRef = useRef<HTMLInputElement | null>(null);
  const incomeRef = useRef<HTMLInputElement | null>(null);

  // Selected scheme modal states
  const [selectedScheme, setSelectedScheme] = useState<any | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"details" | "ai">("details");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string>("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState<boolean>(false);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch conversations (for sidebar list)
  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch saved user profile to prefill the fields
  const fetchUserProfile = async (currentUserEmail: string) => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        let loadedOcc = "";
        let loadedAge = "";
        let loadedIncome: number | "" = "";

        if (data.occupation) loadedOcc = data.occupation;
        if (data.age) loadedAge = data.age.toString();
        if (data.annual_income) loadedIncome = data.annual_income;
        
        setOccupation(loadedOcc);
        setAge(loadedAge);
        setIncomeValue(loadedIncome);
        
        // Priority 1: Fresh Geolocation
        const detected = await detectLocation(currentUserEmail, false);
        if (detected) {
          setHeaderLocation(detected);
          setDetectedState(detected);
        } else {
          // Priority 2: Fall back to backend save-location coordinates
          try {
            const locRes = await fetch("/api/user/location");
            if (locRes.ok) {
              const locData = await locRes.json();
              if (locData.success && locData.state) {
                setHeaderLocation(locData.state);
                setDetectedState(locData.state);
              } else {
                // Priority 3: Fall back to legacy profile state
                const legacyState = data.state || data.detected_state || null;
                setHeaderLocation(legacyState);
                setDetectedState(legacyState);
              }
            } else {
              const legacyState = data.state || data.detected_state || null;
              setHeaderLocation(legacyState);
              setDetectedState(legacyState);
            }
          } catch (locErr) {
            console.error("Error fetching coordinate fallback:", locErr);
            const legacyState = data.state || data.detected_state || null;
            setHeaderLocation(legacyState);
            setDetectedState(legacyState);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLocationRefresh = async () => {
    const sessionEl = document.getElementById("user-session");
    const sessionEmail = sessionEl?.getAttribute("data-email") || email || "user@smartgov.ai";
    
    const detected = await detectLocation(sessionEmail, true);
    if (detected) {
      setHeaderLocation(detected);
      setDetectedState(detected);
    } else {
      try {
        const locRes = await fetch("/api/user/location");
        if (locRes.ok) {
          const locData = await locRes.json();
          if (locData.success && locData.state) {
            setHeaderLocation(locData.state);
            setDetectedState(locData.state);
          } else {
            setHeaderLocation(null);
            setDetectedState(null);
          }
        }
      } catch (locErr) {
        console.error("Error refreshing fallback coordinates:", locErr);
        setHeaderLocation(null);
        setDetectedState(null);
      }
    }
  };

  useEffect(() => {
    // Read session email
    const sessionEl = document.getElementById("user-session");
    let sessionEmail = "user@smartgov.ai";
    if (sessionEl) {
      const emailAttr = sessionEl.getAttribute("data-email");
      if (emailAttr) {
        setEmail(emailAttr);
        sessionEmail = emailAttr;
      }
    }
    fetchConversations();
    fetchUserProfile(sessionEmail);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, followUpLoading]);

  // Format display string for currency
  const formatDisplayIncome = () => {
    if (incomeValue === "") return "";
    return `₹ ${incomeValue.toLocaleString("en-IN")}`;
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (rawVal === "") {
      setIncomeValue("");
      return;
    }
    const num = parseInt(rawVal, 10);
    if (num >= 0) {
      setIncomeValue(num);
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setAge("");
      return;
    }
    const num = parseInt(val, 10);
    if (num >= 0 && num <= 120) {
      setAge(num.toString());
    }
  };

  const handleSelectChat = (chatId: string) => {
    localStorage.setItem(`smartgov_active_chat_id_${email}`, chatId);
    window.location.href = `/chatbot?chat=${chatId}`;
  };

  const handleNewChat = () => {
    localStorage.removeItem(`smartgov_active_chat_id_${email}`);
    window.location.href = "/chatbot";
  };

  // Focus missing inputs when cards ask to add info
  const handleAddMissingField = (fieldName: "occupation" | "age" | "income") => {
    setView("form");
    setErrorMsg(null);
    setTimeout(() => {
      if (fieldName === "occupation" && occupationRef.current) {
        occupationRef.current.focus();
      } else if (fieldName === "age" && ageRef.current) {
        ageRef.current.focus();
      } else if (fieldName === "income" && incomeRef.current) {
        incomeRef.current.focus();
      }
    }, 150);
  };

  const handleSearch = async (overrideParams?: {
    occupation: string;
    age: string;
    annual_income: number | "";
    detected_state: string | null;
  }) => {
    const occ = overrideParams ? overrideParams.occupation : occupation;
    const ag = overrideParams ? overrideParams.age : age;
    const inc = overrideParams ? overrideParams.annual_income : incomeValue;
    const detSt = overrideParams ? overrideParams.detected_state : detectedState;

    // Check if at least one field is filled
    if (!occ && !ag && inc === "" && !detSt) {
      setErrorMsg("Please provide at least one detail so we can personalize your recommendations.");
      return;
    }

    // Input bounds validation
    if (ag) {
      const numAge = parseInt(ag, 10);
      if (isNaN(numAge) || numAge < 0 || numAge > 120) {
        setErrorMsg("Please enter a valid age between 0 and 120.");
        return;
      }
    }
    if (inc !== "") {
      const numInc = typeof inc === "string" ? parseInt(inc, 10) : inc;
      if (isNaN(numInc) || numInc < 0) {
        setErrorMsg("Please enter a valid non-negative income.");
        return;
      }
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch("/api/schemes/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          occupation: occ || null,
          age: ag ? parseInt(ag, 10) : null,
          annual_income: inc !== "" ? inc : null,
          state: null,
          detected_state: detSt || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          setResults(data.results);
          setView("results");
          
          // Update header state display
          setHeaderLocation(detSt || null);
        } else {
          setErrorMsg("Failed to retrieve recommendations.");
        }
      } else {
        setErrorMsg("Failed to connect to recommendation server.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error communicating with recommendation server.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (scheme: any) => {
    setSelectedScheme(scheme);
    setActiveModalTab("details");
    setAiExplanation(null);
    setAiMessages([]);
    setAiLoading(true);
    setFollowUpQuestion("");

    try {
      const response = await fetch("/api/schemes/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: scheme.scheme_name,
          description: scheme.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiExplanation(data.explanation);
      } else {
        setAiExplanation("Failed to load AI summary details.");
      }
    } catch (err) {
      console.error(err);
      setAiExplanation("Error communicating with AI server.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || !selectedScheme) return;

    const qText = followUpQuestion.trim();
    setFollowUpQuestion("");
    setAiMessages(prev => [...prev, { role: "user", text: qText }]);
    setFollowUpLoading(true);

    try {
      const response = await fetch("/api/schemes/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: selectedScheme.scheme_name,
          description: selectedScheme.description,
          question: qText
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiMessages(prev => [...prev, { role: "assistant", text: data.explanation }]);
      } else {
        setAiMessages(prev => [...prev, { role: "assistant", text: "Failed to retrieve AI response. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setAiMessages(prev => [...prev, { role: "assistant", text: "Error communicating with AI server." }]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Helper matching filter dynamic logic
  const matchCategory = (schemeCategory: string, filter: string) => {
    const sc = (schemeCategory || "").toLowerCase();
    const f = filter.toLowerCase();
    if (f === "all") return true;
    if (f === "scholarships" && (sc === "education" || sc === "scholarship")) return true;
    if (f === "education" && (sc === "education" || sc === "scholarship")) return true;
    if (f === "agriculture" && sc === "agriculture") return true;
    if (f === "women" && sc === "women") return true;
    if (f === "startup" && sc === "startup") return true;
    if (f === "healthcare" && sc === "healthcare") return true;
    if (f === "pensions" && (sc === "pension" || sc === "pensions")) return true;
    if (f === "loans" && sc.includes("loan")) return true;
    return sc.includes(f);
  };

  const getCategoryEmoji = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("educat") || cat.includes("scholar")) return "🎓";
    if (cat.includes("farm") || cat.includes("agri")) return "🌾";
    if (cat.includes("women") || cat.includes("girl")) return "👩";
    if (cat.includes("health")) return "🏥";
    if (cat.includes("start") || cat.includes("business")) return "🚀";
    if (cat.includes("pension")) return "👵";
    if (cat.includes("loan")) return "💰";
    if (cat.includes("hous")) return "🏠";
    return "🎯";
  };

  // Count filter-matching schemes (excluding "not_eligible" from recommended matches banner)
  const filteredResults = results.filter((scheme) => 
    matchCategory(scheme.category, filterCategory)
  );

  const matchedCount = filteredResults.filter(
    (r) => r.match_status !== "not_eligible"
  ).length;

  return (
    <SidebarProvider className="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-foreground font-sans">
      <SmartGovSidebar 
        activeTab="recommend" 
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        conversations={conversations}
        onQuickSearch={(query) => window.location.href = `/chatbot?query=${encodeURIComponent(query)}`}
      />
      
      <SidebarInset className="flex-1 min-w-0 flex flex-col h-full bg-[#F8FAFC] overflow-hidden relative">
        
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border/80 bg-white px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-9 w-9 text-navy hover:bg-muted transition-colors rounded-xl shrink-0" />
          </div>

          <div className="flex items-center gap-4">
            <span 
              onClick={handleLocationRefresh}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8F5EF] border border-[#168A5A]/20 px-2.5 py-1.5 text-xs font-bold text-[#168A5A] shadow-xs cursor-pointer hover:bg-[#E8F5EF]/80 transition-all"
              title="Click to refresh location"
            >
              <span>📍</span>
              <span>{headerLocation || "Location unavailable"}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground border border-border/40">
              <UserIcon className="size-3.5 text-navy" />
              <span>{email}</span>
            </span>
            <a 
              href="/logout"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-navy hover:bg-muted hover:text-primary transition-all shadow-xs"
            >
              <LogOut className="size-3.5" />
              <span>Logout</span>
            </a>
          </div>
        </header>

        {/* Workspace panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="w-[calc(100%-32px)] mx-4 md:w-[calc(100%-64px)] max-w-[1200px] md:ml-8 md:mr-auto space-y-8">
            
            {/* Title block */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl" role="img" aria-label="target">🎯</span>
                <h1 className="text-2xl font-black text-navy tracking-tight">
                  {view === "form" ? "Find Government Schemes For You" : "Recommended Schemes"}
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                {view === "form" 
                  ? "Tell us a little about yourself and we'll find schemes that may match your eligibility."
                  : `We found ${matchedCount} scheme${matchedCount === 1 ? "" : "s"} that may match your profile.`
                }
              </p>
            </div>

            {/* ERROR ALERT DISPLAY */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 text-sm text-red-700 font-semibold max-w-2xl shadow-xs">
                <AlertCircle className="size-5 shrink-0 text-red-500 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* ================= VIEW: FORM ENTRY ================= */}
            {view === "form" && (
              <div className="bg-white border border-border rounded-3xl p-6 md:p-8 max-w-2xl shadow-xs">
                <div className="mb-6 p-4 rounded-2xl bg-[#E8F5EF]/30 border border-[#168A5A]/10 flex gap-3 text-xs text-[#168A5A] font-semibold">
                  <HelpCircle className="size-4 text-[#168A5A] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    All fields are optional. Providing more details helps us give you more accurate recommendations.
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-6">
                  
                  {/* Occupation */}
                  <div className="space-y-2">
                    <label htmlFor="occupation" className="text-xs font-bold uppercase tracking-wider text-navy">
                      Occupation <span className="text-[10px] text-muted-foreground font-normal lowercase">(optional)</span>
                    </label>
                    <select
                      id="occupation"
                      ref={occupationRef}
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary text-navy"
                    >
                      <option value="">Select Occupation</option>
                      {OCCUPATIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <label htmlFor="age" className="text-xs font-bold uppercase tracking-wider text-navy">
                      Age <span className="text-[10px] text-muted-foreground font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="age"
                      ref={ageRef}
                      type="number"
                      min="0"
                      max="120"
                      placeholder="Enter age (e.g. 21)"
                      value={age}
                      onChange={handleAgeChange}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary text-navy placeholder:text-slate-400"
                    />
                  </div>

                  {/* Income */}
                  <div className="space-y-2">
                    <label htmlFor="income" className="text-xs font-bold uppercase tracking-wider text-navy">
                      Annual Family Income <span className="text-[10px] text-muted-foreground font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="income"
                      ref={incomeRef}
                      type="text"
                      placeholder="Enter income (e.g. ₹ 90,000)"
                      value={formatDisplayIncome()}
                      onChange={handleIncomeChange}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary text-navy placeholder:text-slate-400"
                    />
                  </div>



                  {/* Find Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4.5 animate-spin" />
                        <span>Finding schemes for you...</span>
                      </>
                    ) : (
                      <span>Find Matching Schemes</span>
                    )}
                  </button>

                </form>
              </div>
            )}

            {/* ================= VIEW: RESULTS DISPLAY ================= */}
            {view === "results" && (
              <div className="space-y-6">
                
                {/* Search Profile Summary Header */}
                <div className="p-4 md:p-6 bg-white border border-border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Active Search Profile</span>
                    <div className="flex flex-wrap gap-2 text-sm text-navy font-semibold items-center">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs">
                        💼 {occupation || "Not Specified"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs">
                        🎂 {age ? `${age} Years` : "Not Specified"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs">
                        💵 {incomeValue !== "" ? `₹ ${incomeValue.toLocaleString("en-IN")}` : "Not Specified"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs">
                        📍 {detectedState || "Not Specified"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setView("form")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-muted hover:text-primary transition-all shadow-xs cursor-pointer shrink-0 self-start md:self-auto"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Modify Details</span>
                  </button>
                </div>

                {/* Categories filtering bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {CATEGORIES.map((cat) => {
                    const isActive = filterCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap cursor-pointer
                          ${isActive 
                            ? "bg-primary text-white border-primary shadow-xs" 
                            : "bg-white text-navy border-border hover:bg-muted"
                          }
                        `}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Schemes Cards Grid */}
                {filteredResults.length === 0 ? (
                  <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
                    <span className="text-4xl">🔍</span>
                    <h3 className="text-lg font-bold text-navy">No matching schemes found</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      We couldn't find schemes matching the information provided. Try broadening your criteria by clearing some fields.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                      <button
                        onClick={() => setView("form")}
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition-all shadow-xs cursor-pointer"
                      >
                        Modify Details
                      </button>
                      <button
                        onClick={() => { setFilterCategory("All"); setResults([]); setView("form"); }}
                        className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-muted transition-all shadow-xs cursor-pointer"
                      >
                        Browse All Schemes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredResults.map((scheme) => {
                      const emoji = getCategoryEmoji(scheme.category);
                      const isHigh = scheme.match_status === "high_match";
                      const isPotential = scheme.match_status === "potential_match" || scheme.match_status === "possible_match";
                      const isNeedsVerification = scheme.match_status === "needs_verification";
                      const isLowMatch = scheme.match_status === "low_match";
                      const isNotEligible = scheme.match_status === "not_eligible";

                      return (
                        <div 
                          key={scheme.scheme_id} 
                          className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-md
                            ${isNotEligible ? "border-red-100 bg-red-50/5 opacity-80" : "border-border"}
                          `}
                        >
                          <div className="space-y-4">
                            
                            {/* Card title and classification */}
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <h3 className="font-bold text-navy text-base leading-snug flex items-center gap-2">
                                  <span>{emoji}</span>
                                  <span>{scheme.scheme_name}</span>
                                </h3>
                                <span className="inline-block text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 leading-none">
                                  {scheme.category}
                                </span>
                              </div>

                              {/* Status Badge */}
                              {isHigh && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-[#E8F5EF] border border-[#168A5A]/20 px-2.5 py-1 text-xs font-extrabold text-[#168A5A] whitespace-nowrap shadow-xs">
                                  <CheckCircle className="size-3.5" />
                                  <span>HIGH MATCH</span>
                                </span>
                              )}
                              {isPotential && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-[#FEF3C7] border border-[#D97706]/20 px-2.5 py-1 text-xs font-extrabold text-[#D97706] whitespace-nowrap shadow-xs">
                                  <AlertCircle className="size-3.5" />
                                  <span>POSSIBLE MATCH</span>
                                </span>
                              )}
                              {isNeedsVerification && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-[#EEF2FF] border border-[#6366F1]/20 px-2.5 py-1 text-xs font-extrabold text-[#4F46E5] whitespace-nowrap shadow-xs">
                                  <AlertCircle className="size-3.5" />
                                  <span>NEEDS VERIFICATION</span>
                                </span>
                              )}
                              {isLowMatch && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-extrabold text-slate-600 whitespace-nowrap shadow-xs">
                                  <AlertCircle className="size-3.5" />
                                  <span>LOW MATCH</span>
                                </span>
                              )}
                              {isNotEligible && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-red-100 border border-red-200 px-2.5 py-1 text-xs font-extrabold text-red-600 whitespace-nowrap shadow-xs">
                                  <XCircle className="size-3.5" />
                                  <span>NOT ELIGIBLE</span>
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                              {scheme.description}
                            </p>

                            {/* Matching Checklist Explanation */}
                            <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-100">
                              <span className="text-[10px] font-bold text-navy uppercase tracking-wider">Assessment Checklist</span>
                              <ul className="space-y-1">
                                {scheme.explanation.map((item: string, idx: number) => {
                                  const matchesCheck = item.startsWith("✓");
                                  const matchesX = item.startsWith("✕");
                                  const matchesWarn = item.startsWith("⚠");
                                  
                                  let textColor = "text-muted-foreground";
                                  if (matchesCheck) textColor = "text-emerald-700 font-semibold";
                                  if (matchesX) textColor = "text-red-700 font-semibold";
                                  if (matchesWarn) textColor = "text-amber-700 font-semibold";

                                  return (
                                    <li key={idx} className={`text-xs flex gap-1.5 items-start ${textColor}`}>
                                      <span className="shrink-0 leading-none mt-0.5">
                                        {matchesCheck && "✓"}
                                        {matchesX && "✕"}
                                        {matchesWarn && "⚠"}
                                      </span>
                                      <span>
                                        {item.replace(/^[✓✕⚠]\s*/, "")}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>

                            {/* REDIRECT BANNER FOR MISSING INFO */}
                            {scheme.missing_information && scheme.missing_information.length > 0 && (
                              <div className="p-3 rounded-2xl bg-[#FEF3C7]/20 border border-[#D97706]/10 flex flex-col gap-1 text-xs text-[#D97706] font-semibold">
                                <p className="leading-relaxed">
                                  Eligibility needs verification. Click below to add details:
                                </p>
                                <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                                  {scheme.missing_information.map((field: string) => {
                                    if (field === "state") return null;
                                    const displayLabels: Record<string, string> = {
                                      occupation: "Occupation",
                                      age: "Age",
                                      income: "Income"
                                    };
                                    return (
                                      <button
                                        key={field}
                                        onClick={() => handleAddMissingField(field as any)}
                                        className="underline hover:text-[#B45309] font-bold cursor-pointer inline-flex items-center gap-0.5 text-xxs"
                                      >
                                        + Add {displayLabels[field] || field}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Benefits segment */}
                            <div className="p-3 rounded-2xl bg-[#E8F5EF]/40 border border-[#168A5A]/10 space-y-1">
                              <span className="text-[10px] font-bold text-[#168A5A] uppercase tracking-wider">Benefits</span>
                              <p className="text-navy text-xs font-bold leading-normal">
                                {scheme.benefits}
                              </p>
                            </div>

                          </div>

                          {/* CTA Actions */}
                          <div className="flex gap-3 pt-5 mt-auto">
                            <button
                              onClick={() => handleOpenDetails(scheme)}
                              className="flex-1 rounded-xl border border-border bg-white py-2 text-xs font-bold text-navy hover:bg-muted transition-all shadow-xs cursor-pointer text-center"
                            >
                              View Details
                            </button>
                            {scheme.application_url ? (
                              <a
                                href={scheme.application_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-white hover:bg-primary-dark transition-all shadow-xs cursor-pointer"
                              >
                                <span>Apply</span>
                                <ExternalLink className="size-3" />
                              </a>
                            ) : (
                              <span className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-100 py-2 text-[10px] font-bold text-slate-400 border border-slate-200 select-none">
                                Apply (Link N/A)
                              </span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}
            
          </div>
        </main>

      </SidebarInset>

      {/* ========================================================
          MODAL DIALOG: DETAILED SCHEME VIEW WITH AI ASSISTANT
          ======================================================== */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl flex flex-col h-[90vh] md:h-[80vh] border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-border bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{getCategoryEmoji(selectedScheme.category)}</span>
                <div>
                  <h2 className="font-extrabold text-navy text-base leading-snug">
                    {selectedScheme.scheme_name}
                  </h2>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {selectedScheme.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedScheme(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-muted-foreground hover:text-navy transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Tab Selectors */}
            <div className="flex border-b border-border bg-white px-6">
              <button
                onClick={() => setActiveModalTab("details")}
                className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 cursor-pointer transition-all
                  ${activeModalTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-navy"
                  }
                `}
              >
                <Info className="size-4" />
                <span>Details & Eligibility</span>
              </button>
              <button
                onClick={() => setActiveModalTab("ai")}
                className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 cursor-pointer transition-all
                  ${activeModalTab === "ai"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-navy"
                  }
                `}
              >
                <Sparkles className="size-4" />
                <span>AI Assistant Advisor</span>
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              
              {/* TAB 1: DETAILS & ELIGIBILITY */}
              {activeModalTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left columns: structured description, docs, process */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Overview</h4>
                      <p className="text-navy text-sm leading-relaxed bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                        {selectedScheme.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Benefits</h4>
                      <p className="text-emerald-800 text-sm font-bold leading-normal bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
                        {selectedScheme.benefits}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Required Documents</h4>
                      <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                        {selectedScheme.documents_required ? (
                          <ul className="list-disc pl-5 space-y-1 text-sm text-navy">
                            {selectedScheme.documents_required.split(",").map((doc: string, idx: number) => (
                              <li key={idx}>{doc.trim()}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-navy italic">
                            Required documents should be confirmed with the official department.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Important Dates</h4>
                      <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                        <p className="text-sm text-navy font-bold">
                          {selectedScheme.important_dates || "No fixed application deadline specified."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Application Process</h4>
                      <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                        <p className="text-sm text-navy leading-relaxed whitespace-pre-line">
                          {selectedScheme.application_process || "Please consult the official department or portal for the detailed application steps."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: eligibility requirements info */}
                  <div className="space-y-6">
                    
                    {/* Database Eligibility settings details */}
                    <div className="border border-border rounded-2xl p-4 bg-slate-50 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy border-b pb-2">Scheme Criteria</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="size-4 text-[#168A5A] mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block leading-none">STATE</span>
                            <span className="text-xs font-bold text-navy">
                              {selectedScheme.state ? (selectedScheme.state === "All" ? "All States" : selectedScheme.state) : "State applicability not specified"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <Briefcase className="size-4 text-[#168A5A] mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block leading-none">OCCUPATION</span>
                            <span className="text-xs font-bold text-navy">
                              {selectedScheme.occupation && selectedScheme.occupation !== "All" && selectedScheme.occupation.toLowerCase() !== "no occupation restriction specified"
                                ? selectedScheme.occupation
                                : "No occupation restriction specified"
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <Calendar className="size-4 text-[#168A5A] mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block leading-none">AGE LIMIT</span>
                            <span className="text-xs font-bold text-navy">
                              {(() => {
                                const hasMin = selectedScheme.min_age !== null && selectedScheme.min_age !== undefined && selectedScheme.min_age > 0;
                                const hasMax = selectedScheme.max_age !== null && selectedScheme.max_age !== undefined && selectedScheme.max_age < 120;
                                if (!hasMin && !hasMax) return "No specific age limit stated";
                                if (hasMin && hasMax) return `${selectedScheme.min_age} - ${selectedScheme.max_age} Years`;
                                if (hasMin) return `${selectedScheme.min_age} Years and above`;
                                return `Below ${selectedScheme.max_age} Years`;
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <DollarSign className="size-4 text-[#168A5A] mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block leading-none">INCOME LIMIT</span>
                            <span className="text-xs font-bold text-navy">
                              {(() => {
                                if (selectedScheme.max_income !== null && selectedScheme.max_income !== undefined) {
                                  return `Below ₹ ${selectedScheme.max_income.toLocaleString("en-IN")}`;
                                }
                                if (selectedScheme.income_condition) {
                                  return selectedScheme.income_condition;
                                }
                                return "No specific income limit stated";
                              })()}
                            </span>
                          </div>
                        </div>

                        {selectedScheme.other_eligibility && (
                          <div className="flex items-start gap-2.5 border-t border-dashed border-slate-200 pt-2.5 mt-2.5">
                            <Shield className="size-4 text-[#168A5A] mt-0.5" />
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block leading-none">OTHER CONDITIONS</span>
                              <span className="text-xs font-bold text-navy">
                                {selectedScheme.other_eligibility}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="border border-border rounded-2xl p-4 bg-slate-50 space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block leading-none">SOURCE DEPARTMENT</span>
                        <span className="font-bold text-navy">{selectedScheme.source}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block leading-none">LAST VERIFIED</span>
                        <span className="font-bold text-navy">{selectedScheme.last_verified}</span>
                      </div>
                      
                      {(selectedScheme.official_website || selectedScheme.application_url) && (
                        <div className="space-y-2 pt-2 border-t border-border mt-2">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">OFFICIAL LINKS</span>
                          {selectedScheme.official_website && (
                            <a
                              href={selectedScheme.official_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-primary py-2 font-bold text-primary hover:bg-slate-50 transition-all text-xs"
                            >
                              <span>Official Website</span>
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                          {selectedScheme.application_url && (
                            <a
                              href={selectedScheme.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-primary py-2 font-bold text-white hover:bg-primary-dark transition-all text-xs"
                            >
                              <span>Apply Online</span>
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: AI ASSISTANT ADVISOR */}
              {activeModalTab === "ai" && (
                <div className="space-y-6">
                  
                  {/* Local CSS injection for Markdown parsing */}
                  <style dangerouslySetInnerHTML={{__html: `
                    .markdown-content h1 { font-size: 1.2rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #0F172A; }
                    .markdown-content h2 { font-size: 1.1rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #0F172A; }
                    .markdown-content h3 { font-size: 1rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.25rem; color: #0F172A; }
                    .markdown-content h4 { font-size: 0.95rem; font-weight: 700; margin-top: 0.75rem; margin-bottom: 0.25rem; color: #0F172A; }
                    .markdown-content p { margin-bottom: 0.75rem; line-height: 1.6; }
                    .markdown-content ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
                    .markdown-content ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.75rem; }
                    .markdown-content li { margin-bottom: 0.25rem; }
                    .markdown-content strong { font-weight: 700; color: #0F172A; }
                  `}} />

                  {/* Pinned detailed Gemini AI summary */}
                  <div className="bg-[#E8F5EF]/20 border border-[#168A5A]/10 rounded-2xl p-4 md:p-6 space-y-4">
                    <div className="flex gap-2 items-center text-[#168A5A] font-bold border-b border-[#168A5A]/10 pb-2">
                      <Sparkles className="size-5 shrink-0" />
                      <span className="text-sm">SmartGov AI Scheme Summary</span>
                    </div>

                    {aiLoading && !aiExplanation ? (
                      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
                        <Loader2 className="size-5 animate-spin text-[#168A5A]" />
                        <span>Generating summary explanation...</span>
                      </div>
                    ) : (
                      <div 
                        className="markdown-content text-navy text-sm"
                        dangerouslySetInnerHTML={{ __html: marked.parse(aiExplanation || "Unable to explain this scheme.") }} 
                      />
                    )}
                  </div>

                  {/* Follow-up question chat area */}
                  <div className="border border-border rounded-2xl flex flex-col h-[300px] bg-slate-50/50">
                    
                    {/* Chat Header */}
                    <div className="px-4 py-2 border-b border-border bg-slate-100/50 flex gap-2 items-center">
                      <Bot className="size-4.5 text-navy" />
                      <span className="text-xs font-bold text-navy">Interactive Follow-up Advisor</span>
                    </div>

                    {/* Conversation bubbles log */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {aiMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic text-center px-4">
                          Ask any follow-up questions about this scheme (e.g. "Can I apply if my family has agricultural land?", "Are documents verified offline?")
                        </div>
                      ) : (
                        aiMessages.map((msg, idx) => {
                          const isAI = msg.role === "assistant";
                          return (
                            <div 
                              key={idx} 
                              className={`flex gap-2 max-w-[85%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                            >
                              <div className={`p-3 rounded-2xl text-xs leading-relaxed border
                                ${isAI 
                                  ? "bg-white text-navy border-slate-100 rounded-tl-none markdown-content" 
                                  : "bg-[#E8F5EF] text-emerald-950 border-[#168A5A]/10 rounded-tr-none font-medium"
                                }
                              `}>
                                {isAI ? (
                                  <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} />
                                ) : (
                                  msg.text
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      {followUpLoading && (
                        <div className="flex gap-2 max-w-[80%] mr-auto items-center text-xs text-muted-foreground pl-2">
                          <Loader2 className="size-3.5 animate-spin text-[#168A5A]" />
                          <span>AI is typing...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Question Input form */}
                    <form onSubmit={handleSendFollowUp} className="p-3 border-t border-border bg-white flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask follow-up details about this scheme..."
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        disabled={followUpLoading}
                        className="flex-1 px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary text-navy bg-slate-50 placeholder:text-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={followUpLoading || !followUpQuestion.trim()}
                        className="p-2 bg-primary hover:bg-primary-dark text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                      >
                        <Send className="size-4" />
                      </button>
                    </form>

                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer warning */}
            <div className="border-t border-border bg-slate-50 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold max-w-xl text-center sm:text-left leading-relaxed">
                🚨 Based on the information you provided, this scheme appears to match the available eligibility criteria. Final eligibility is determined by the respective government department/authority.
              </span>
              <button
                onClick={() => setSelectedScheme(null)}
                className="w-full sm:w-auto rounded-xl border border-border bg-white px-5 py-2 text-xs font-bold text-navy hover:bg-muted transition-all shadow-xs cursor-pointer shrink-0"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </SidebarProvider>
  );
}
