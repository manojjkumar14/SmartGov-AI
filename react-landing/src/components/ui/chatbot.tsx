"use client";

import React, { useState, useEffect, useRef } from "react";
import { AiPromptInput } from "./ai-prompt-input";
import { 
  Bot, 
  LogOut, 
  User as UserIcon, 
  Copy, 
  Check, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  GraduationCap, 
  HeartPulse, 
  Sparkles,
  ChevronRight,
  Shield,
  Menu,
  X
} from "lucide-react";
import { marked } from "marked";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SmartGovSidebar } from "@/components/ui/smartgov-sidebar";
import { detectLocation } from "@/lib/location";

const parseMessageOptions = (text: string) => {
  const optionsRegex = /\[OPTIONS:\s*([^\]]+)\]/;
  const match = text.match(optionsRegex);
  let cleanText = text;
  let optionsList: string[] = [];
  if (match) {
    cleanText = text.replace(optionsRegex, "").trim();
    optionsList = match[1].split("|").map(opt => opt.trim());
  }
  return { cleanText, optionsList };
};

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  liked?: boolean;
  disliked?: boolean;
}

export default function Chatbot() {
  const [email, setEmail] = useState<string>("user@smartgov.ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [promptValue, setPromptValue] = useState<string>("");
  const [promptStatus, setPromptStatus] = useState<"idle" | "loading" | "success">("idle");
  const [lastQuestion, setLastQuestion] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [headerLocation, setHeaderLocation] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  const loadConversation = async (chatId: string) => {
    setPromptStatus("loading");
    try {
      const response = await fetch(`/api/conversations/${chatId}`);
      if (response.ok) {
        const msgs = await response.json();
        setMessages(msgs);
        setPromptStatus("idle");
      } else {
        handleNewChat();
      }
    } catch (err) {
      console.error(err);
      setPromptStatus("idle");
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    localStorage.setItem(`smartgov_active_chat_id_${email}`, chatId);
    loadConversation(chatId);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    localStorage.removeItem(`smartgov_active_chat_id_${email}`);
    setMessages([]);
    setPromptStatus("idle");
  };

  // Read email session variable on mount
  useEffect(() => {
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
    
    // Parse URL parameter ?chat=<id> or load from localStorage
    const params = new URLSearchParams(window.location.search);
    const urlChatId = params.get("chat");
    const queryParam = params.get("query");
    let activeIdToLoad = null;

    const chatKey = `smartgov_active_chat_id_${sessionEmail}`;

    if (urlChatId) {
      activeIdToLoad = urlChatId;
      setActiveChatId(urlChatId);
      localStorage.setItem(chatKey, urlChatId);
    } else {
      const savedActiveChatId = localStorage.getItem(chatKey);
      if (savedActiveChatId && savedActiveChatId !== "null" && savedActiveChatId !== "undefined") {
        activeIdToLoad = savedActiveChatId;
        setActiveChatId(savedActiveChatId);
      }
    }

    if (activeIdToLoad) {
      loadConversation(activeIdToLoad);
    }

    if (queryParam) {
      const newUrl = window.location.pathname + (urlChatId ? `?chat=${urlChatId}` : "");
      window.history.replaceState({}, document.title, newUrl);
      setTimeout(() => {
        handleQuerySubmit(queryParam);
      }, 300);
    }
  }, []);

  // Scroll to bottom on new messages or loading status
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, promptStatus]);

  // Submit query handler
  const handleQuerySubmit = async (queryText: string) => {
    if (!queryText.trim()) return;

    setLastQuestion(queryText);
    setPromptStatus("loading");

    // Add User Message
    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      text: queryText,
    };
    setMessages((prev) => [...prev, newUserMsg]);

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: queryText,
          conversation_id: activeChatId || ""
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      
      const responseChatId = data.conversation_id;
      if (responseChatId && responseChatId !== activeChatId) {
        setActiveChatId(responseChatId);
        localStorage.setItem(`smartgov_active_chat_id_${email}`, responseChatId);
        fetchConversations();
      }

      // Add Assistant Message
      const botMsgId = (Date.now() + 1).toString();
      const newBotMsg: Message = {
        id: botMsgId,
        role: "assistant",
        text: data.answer || "",
      };
      
      setPromptStatus("success");
      setMessages((prev) => [...prev, newBotMsg]);
      
      setTimeout(() => {
        setPromptStatus("idle");
      }, 800);

    } catch (error) {
      // Add Error Message
      const errorMsgId = (Date.now() + 1).toString();
      const newErrorMsg: Message = {
        id: errorMsgId,
        role: "assistant",
        text: "❌ Unable to connect to server.",
      };
      setPromptStatus("idle");
      setMessages((prev) => [...prev, newErrorMsg]);
    }
  };

  // Quick search button triggers
  const handleQuickSearch = (text: string) => {
    handleQuerySubmit(text);
  };

  // Copy text utility
  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Regenerate last query
  const handleRegenerate = () => {
    if (lastQuestion) {
      handleQuerySubmit(lastQuestion);
    }
  };

  // Like message
  const handleLikeMessage = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? { ...msg, liked: !msg.liked, disliked: false }
          : msg
      )
    );
  };

  // Dislike message
  const handleDislikeMessage = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? { ...msg, disliked: !msg.disliked, liked: false }
          : msg
      )
    );
  };

  // Delete conversation callback
  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/conversations/${chatId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // If deleting the active open conversation, reset workspace
        if (activeChatId === chatId) {
          handleNewChat();
        }
        // Refresh conversations list to update sidebar recent chats
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to safely render markdown output
  const renderMarkdown = (text: string) => {
    const rawHtml = marked.parse(text) as string;
    return { __html: rawHtml };
  };

  return (
    <SidebarProvider className="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-foreground font-sans">
      <SmartGovSidebar 
        activeTab="home" 
        onQuickSearch={handleQuickSearch} 
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        conversations={conversations}
      />
      
      <SidebarInset className="flex-1 min-w-0 flex flex-col h-full bg-[#F8FAFC] overflow-hidden relative">
        
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border/80 bg-white px-4 md:px-6">
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

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto space-y-6">
              <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shadow-sm shadow-primary/5 animate-pulse-slow">
                🤖
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-navy tracking-tight">SmartGov AI</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Discover Indian government schemes, scholarships, farmer benefits, and startups programs powered by Artificial Intelligence.
                </p>
              </div>

              {/* Quick Search Badges */}
              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button 
                  onClick={() => handleQuickSearch("Government scholarship schemes")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3.5 text-xs font-bold text-navy hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all shadow-xs"
                >
                  <span>🎓</span> Scholarships
                </button>
                <button 
                  onClick={() => handleQuickSearch("Government schemes for farmers")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3.5 text-xs font-bold text-navy hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all shadow-xs"
                >
                  <span>👨‍🌾</span> Farmers
                </button>
                <button 
                  onClick={() => handleQuickSearch("Government health schemes")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3.5 text-xs font-bold text-navy hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all shadow-xs"
                >
                  <span>🏥</span> Healthcare
                </button>
                <button 
                  onClick={() => handleQuickSearch("Startup India scheme")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3.5 text-xs font-bold text-navy hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all shadow-xs"
                >
                  <span>💼</span> Startup India
                </button>
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="w-[calc(100%-32px)] mx-4 md:w-[calc(100%-64px)] max-w-[1200px] md:ml-8 md:mr-auto space-y-6 px-4 md:px-0">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`
                    max-w-[85%] rounded-2xl p-4 shadow-sm border
                    ${msg.role === "user" 
                      ? "bg-navy text-white border-navy" 
                      : "bg-white text-foreground border-border/80"
                    }
                  `}>
                    
                    {/* Bot Identifier */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-navy mb-2 select-none">
                        <span>🤖</span> SmartGov AI
                      </div>
                    )}

                    {/* Message Text */}
                    {msg.role === "user" ? (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <>
                        <div 
                          dangerouslySetInnerHTML={renderMarkdown(parseMessageOptions(msg.text).cleanText)}
                          className="text-[15px] leading-relaxed markdown-body space-y-2.5"
                        />
                        {parseMessageOptions(msg.text).optionsList.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border/40">
                            {parseMessageOptions(msg.text).optionsList.map((opt, index) => {
                              const isOther = opt.toLowerCase().includes("other") || opt.toLowerCase().includes("something else") || opt.toLowerCase().includes("type my answer") || opt.toLowerCase().includes("type it");
                              return (
                                <button
                                  key={index}
                                  onClick={() => {
                                    if (isOther) {
                                      const textarea = document.querySelector("textarea");
                                      if (textarea) {
                                        (textarea as HTMLElement).focus();
                                      }
                                    } else {
                                      handleQuerySubmit(opt);
                                    }
                                  }}
                                  className="px-3 py-2 text-xs font-bold text-[#168A5A] bg-[#E8F5EF] border border-[#168A5A]/20 hover:bg-[#E8F5EF]/80 rounded-xl transition-all shadow-xs"
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {/* Bot Actions */}
                    {msg.role === "assistant" && msg.text !== "❌ Unable to connect to server." && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/60">
                        
                        {/* Copy Button */}
                        <button 
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/80 text-[10px] font-bold text-navy px-2 py-1 transition-all"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="size-3 text-green-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3 text-navy/70" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Regenerate Button */}
                        <button 
                          onClick={handleRegenerate}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/80 text-[10px] font-bold text-navy px-2 py-1 transition-all"
                        >
                          <RotateCcw className="size-3 text-navy/70" />
                          <span>Regenerate</span>
                        </button>

                        {/* Like Button */}
                        <button 
                          onClick={() => handleLikeMessage(msg.id)}
                          className={`
                            inline-flex size-6 items-center justify-center rounded-lg border border-border text-[10px] transition-all
                            ${msg.liked 
                              ? "bg-green-600 border-green-600 text-white shadow-sm" 
                              : "bg-muted/20 hover:bg-muted/80 text-navy"
                            }
                          `}
                        >
                          <ThumbsUp className="size-3" />
                        </button>

                        {/* Dislike Button */}
                        <button 
                          onClick={() => handleDislikeMessage(msg.id)}
                          className={`
                            inline-flex size-6 items-center justify-center rounded-lg border border-border text-[10px] transition-all
                            ${msg.disliked 
                              ? "bg-destructive border-destructive text-white shadow-sm" 
                              : "bg-muted/20 hover:bg-muted/80 text-navy"
                            }
                          `}
                        >
                          <ThumbsDown className="size-3" />
                        </button>

                      </div>
                    )}

                  </div>
                </div>
              ))}

              {/* Bot Typing Indicator */}
              {promptStatus === "loading" && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl p-4 shadow-sm border bg-white border-border/80">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-navy mb-2 select-none">
                      <span>🤖</span> SmartGov AI
                    </div>
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="size-2 rounded-full bg-navy/40 animate-bounce-slow" />
                      <span className="size-2 rounded-full bg-navy/40 animate-bounce-slow delay-150" />
                      <span className="size-2 rounded-full bg-navy/40 animate-bounce-slow delay-300" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/80 bg-white p-4">
          <div className="w-[calc(100%-32px)] mx-4 md:w-[calc(100%-64px)] max-w-[1200px] md:ml-8 md:mr-auto px-4 md:px-0 flex flex-col">
            
            <AiPromptInput 
              value={promptValue}
              onChange={setPromptValue}
              onSubmit={handleQuerySubmit}
              status={promptStatus === "loading" ? "loading" : "idle"}
              disabled={promptStatus === "loading"}
            />
          </div>
        </div>

      </SidebarInset>
    </SidebarProvider>
  );
}
