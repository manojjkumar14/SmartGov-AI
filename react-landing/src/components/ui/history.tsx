"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Trash2, 
  Search as SearchIcon, 
  Plus, 
  User as UserIcon, 
  LogOut,
  AlertCircle
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SmartGovSidebar } from "@/components/ui/smartgov-sidebar";
import { Skeleton } from "./skeleton";
import { detectLocation } from "@/lib/location";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function HistoryPage() {
  const [email, setEmail] = useState<string>("user@smartgov.ai");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [headerLocation, setHeaderLocation] = useState<string | null>(null);

  // Fetch all conversations from backend
  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        setError("Unable to load your conversations.");
      }
    } catch (err) {
      setError("Unable to load your conversations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileAndMaybeLocate = async (currentUserEmail: string) => {
    try {
      const response = await fetch("/api/user/profile");
      const data = response.ok ? await response.json() : {};
      
      // Priority 1: Fresh Geolocation
      const detected = await detectLocation(currentUserEmail, false);
      if (detected) {
        setHeaderLocation(detected);
      } else {
        // Priority 2: Fall back to backend save-location coordinates
        try {
          const locRes = await fetch("/api/user/location");
          if (locRes.ok) {
            const locData = await locRes.json();
            if (locData.success && locData.state) {
              setHeaderLocation(locData.state);
            } else {
              // Priority 3: Fall back to legacy profile state
              const legacyState = data.state || data.detected_state || null;
              setHeaderLocation(legacyState);
            }
          } else {
            const legacyState = data.state || data.detected_state || null;
            setHeaderLocation(legacyState);
          }
        } catch (locErr) {
          console.error("Error fetching coordinate fallback:", locErr);
          const legacyState = data.state || data.detected_state || null;
          setHeaderLocation(legacyState);
        }
      }
    } catch (err) {
      console.error("Error loading location details:", err);
    }
  };

  const handleLocationRefresh = async () => {
    const sessionEl = document.getElementById("user-session");
    const sessionEmail = sessionEl?.getAttribute("data-email") || email || "user@smartgov.ai";
    
    const detected = await detectLocation(sessionEmail, true);
    if (detected) {
      setHeaderLocation(detected);
    } else {
      try {
        const locRes = await fetch("/api/user/location");
        if (locRes.ok) {
          const locData = await locRes.json();
          if (locData.success && locData.state) {
            setHeaderLocation(locData.state);
          } else {
            setHeaderLocation(null);
          }
        }
      } catch (locErr) {
        console.error("Error refreshing fallback coordinates:", locErr);
        setHeaderLocation(null);
      }
    }
  };

  // Mount effects
  useEffect(() => {
    // Read session email from DOM element
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
    fetchProfileAndMaybeLocate(sessionEmail);
  }, []);

  // Handle opening an existing conversation
  const handleSelectChat = (chatId: string) => {
    localStorage.setItem(`smartgov_active_chat_id_${email}`, chatId);
    window.location.href = `/chatbot?chat=${chatId}`;
  };

  // Handle starting a new chat
  const handleNewChat = () => {
    localStorage.removeItem(`smartgov_active_chat_id_${email}`);
    window.location.href = "/chatbot";
  };

  // Handle conversation deletion
  const handleDelete = async (chatId: string) => {
    setConfirmDeleteId(null);
    try {
      const response = await fetch(`/api/conversations/${chatId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Clear active conversation if deleted
        const activeId = localStorage.getItem(`smartgov_active_chat_id_${email}`);
        if (activeId === chatId) {
          localStorage.removeItem(`smartgov_active_chat_id_${email}`);
        }
        // Reload list
        fetchConversations();
      } else {
        alert("Failed to delete chat record.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete chat record.");
    }
  };

  // Helper: Date Grouping
  const getDateGroup = (dateStr: string): string => {
    try {
      const date = new Date(dateStr.replace(/-/g, "/"));
      const now = new Date();
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (compareDate.getTime() === today.getTime()) {
        return "Today";
      } else if (compareDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
      } else if (compareDate.getTime() >= sevenDaysAgo.getTime()) {
        return "Previous 7 Days";
      } else {
        return "Older";
      }
    } catch (err) {
      return "Older";
    }
  };

  // Local filter search query
  const filteredConversations = conversations.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by calculated date
  const groups: { [key: string]: Conversation[] } = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older": [],
  };

  filteredConversations.forEach((chat) => {
    const grp = getDateGroup(chat.created_at);
    if (groups[grp]) {
      groups[grp].push(chat);
    } else {
      groups["Older"].push(chat);
    }
  });

  return (
    <SidebarProvider className="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-foreground font-sans">
      <SmartGovSidebar 
        activeTab="history" 
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDelete}
        conversations={conversations}
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

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* Aligned Container Wrapper */}
          <div className="w-[calc(100%-32px)] mx-4 md:w-[calc(100%-64px)] max-w-[1200px] md:ml-8 md:mr-auto space-y-8">
            
            {/* Title Block */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl" role="img" aria-label="history-scroll">📜</span>
                <h1 className="text-2xl font-black text-navy tracking-tight">Chat History</h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Your previous SmartGov AI conversations and queries.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-xs text-navy"
              />
            </div>

            {/* Content Lists */}
            {loading ? (
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-4 w-24 rounded-lg bg-slate-200" />
                    <Skeleton className="h-16 w-full rounded-2xl bg-white border border-border" />
                    <Skeleton className="h-16 w-full rounded-2xl bg-white border border-border" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white border border-border rounded-2xl text-center space-y-4 max-w-md">
                <AlertCircle className="size-10 text-red-500" />
                <div className="space-y-1.5">
                  <h3 className="font-bold text-navy">{error}</h3>
                  <p className="text-xs text-muted-foreground">Check your connection and try again.</p>
                </div>
                <button
                  onClick={fetchConversations}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-xs"
                >
                  Try Again
                </button>
              </div>
            ) : conversations.length === 0 ? (
              /* Completely Empty State */
              <div className="flex flex-col items-center justify-center py-16 bg-white border border-border rounded-3xl text-center space-y-5 max-w-lg">
                <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shadow-inner select-none">
                  💬
                </div>
                <div className="space-y-1.5 px-6">
                  <h3 className="text-lg font-black text-navy tracking-tight">No conversations yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Start a new conversation with SmartGov AI to discover public benefits.
                  </p>
                </div>
                <button
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4.5 py-2.5 text-xs font-bold text-white hover:bg-primary-dark transition-all shadow-xs"
                >
                  <Plus className="size-4" />
                  <span>New Chat</span>
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              /* Search Empty State */
              <div className="py-12 text-center text-muted-foreground text-sm italic select-none">
                No matching conversations found.
              </div>
            ) : (
              /* Grouped List Views */
              <div className="space-y-8">
                {Object.keys(groups).map((grpTitle) => {
                  const grpChats = groups[grpTitle];
                  if (grpChats.length === 0) return null;

                  return (
                    <div key={grpTitle} className="space-y-3">
                      <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest select-none">
                        {grpTitle}
                      </div>

                      <div className="space-y-3">
                        {grpChats.map((chat) => (
                          <div key={chat.id} className="relative w-full">
                            {confirmDeleteId === chat.id ? (
                              <div className="flex items-center justify-between w-full bg-red-50/50 border border-red-100 rounded-2xl p-4">
                                <span className="text-red-700 font-semibold text-xs md:text-sm">Delete this conversation permanently?</span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                    className="px-3 py-1.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-xl transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(chat.id); }}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => handleSelectChat(chat.id)}
                                className="group w-full border border-border bg-white p-4 hover:shadow-md hover:bg-slate-50/50 cursor-pointer rounded-2xl flex items-center justify-between transition-all duration-150"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                                  <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-[#E8F5EF] group-hover:text-[#168A5A] transition-colors">
                                    <MessageSquare className="size-4.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-navy truncate group-hover:text-[#168A5A] transition-colors">
                                      {chat.title}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      Saved · {new Date(chat.created_at.replace(/-/g, "/")).toLocaleDateString(undefined, { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  aria-label="Delete chat history"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(chat.id);
                                  }}
                                  className="size-7 flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200/50 transition-colors focus-visible:outline-none shrink-0"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
