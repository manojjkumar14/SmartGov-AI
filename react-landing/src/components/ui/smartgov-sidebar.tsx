"use client";

import * as React from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  useSidebar 
} from "@/components/ui/sidebar";
import { 
  ShieldCheck, 
  Home, 
  Clock, 
  GraduationCap, 
  Sprout, 
  Users, 
  HeartPulse, 
  Rocket, 
  ChevronRight,
  SquarePen,
  Trash2,
  SearchCheck
} from "lucide-react";

interface SmartGovSidebarProps {
  activeTab?: "home" | "history" | "recommend";
  onQuickSearch?: (query: string) => void;
  activeChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (chatId: string) => void;
  conversations?: { id: string; title: string; created_at: string }[];
}

export function SmartGovSidebar({ 
  activeTab = "home", 
  onQuickSearch,
  activeChatId = null,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  conversations = []
}: SmartGovSidebarProps) {
  const [deletingChatId, setDeletingChatId] = React.useState<string | null>(null);

  const handleConfirmDelete = (chatId: string) => {
    setDeletingChatId(null);
    if (onDeleteChat) {
      onDeleteChat(chatId);
    }
  };
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleQuickSearchClick = (query: string) => {
    if (onQuickSearch) {
      onQuickSearch(query);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border bg-white text-[#0F172A] shadow-md">
      {/* ================= HEADER ================= */}
      <SidebarHeader className="border-b border-sidebar-border p-4 bg-white">
        <div className="flex items-center gap-3 overflow-hidden transition-all">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5EF] border border-[#168A5A]/20 text-[#168A5A] shadow-xs">
            <ShieldCheck className="size-5.5 fill-current" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="text-sm font-bold tracking-tight text-[#0F172A] truncate">SmartGov AI</span>
              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest leading-none">AI Government Assistant</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ================= CONTENT ================= */}
      <SidebarContent className="p-3 space-y-4 bg-white">
        {/* Main Navigation */}
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={activeTab === "home"} 
                tooltip="Home"
                className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm transition-all duration-150 text-[#0F172A] border border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A] data-[active=true]:bg-[#E8F5EF] data-[active=true]:text-[#168A5A] data-[active=true]:border-[#168A5A]/10"
              >
                <a href="/chatbot">
                  <Home className="size-4.5" />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={onNewChat}
                tooltip="New Chat"
                className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm transition-all duration-150 text-[#0F172A] border border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <SquarePen className="size-4.5 text-[#64748B]" />
                <span>New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={activeTab === "history"} 
                tooltip="Chat History"
                className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm transition-all duration-150 text-[#0F172A] border border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A] data-[active=true]:bg-[#E8F5EF] data-[active=true]:text-[#168A5A] data-[active=true]:border-[#168A5A]/10"
              >
                <a href="/history">
                  <Clock className="size-4.5" />
                  <span>Chat History</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={activeTab === "recommend"} 
                tooltip="Find Schemes"
                className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm transition-all duration-150 text-[#0F172A] border border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A] data-[active=true]:bg-[#E8F5EF] data-[active=true]:text-[#168A5A] data-[active=true]:border-[#168A5A]/10"
              >
                <a href="/recommend">
                  <SearchCheck className="size-4.5" />
                  <span>Find Schemes</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Recent Conversations List */}
          {!isCollapsed && (
            <div className="mt-2.5 pl-3 space-y-1 max-h-[30vh] overflow-y-auto border-l border-slate-100 ml-5">
              <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest px-2.5 py-1 select-none">
                Recent Chats
              </div>
              {conversations && conversations.length > 0 ? (
                conversations.map((chat) => (
                  <div key={chat.id} className="relative group w-full">
                    {deletingChatId === chat.id ? (
                      <div className="flex items-center justify-between rounded-xl px-2 py-1.5 text-[11px] font-semibold bg-red-50/50 border border-red-100 ml-1">
                        <span className="text-red-700 truncate">Delete?</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingChatId(null); }}
                            className="text-[#64748B] hover:text-[#0F172A] px-1 py-0.5 rounded hover:bg-slate-100/50 transition-colors"
                          >
                            No
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConfirmDelete(chat.id); }}
                            className="text-red-600 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectChat && onSelectChat(chat.id)}
                          className={`w-full text-left rounded-xl pl-2.5 pr-8 py-2 text-xs font-semibold truncate transition-all duration-150 block border border-transparent
                            ${activeChatId === chat.id 
                              ? "bg-[#E8F5EF] text-[#168A5A] border-[#168A5A]/10 shadow-xs" 
                              : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                            }
                          `}
                        >
                          💬 {chat.title}
                        </button>
                        <button
                          type="button"
                          aria-label="Delete chat"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingChatId(chat.id);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center size-5 text-[#64748B] hover:text-red-600 rounded hover:bg-slate-200/50 transition-colors focus-visible:outline-none focus:flex"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-[#94A3B8] italic px-2.5 py-1 select-none">
                  No recent chats
                </div>
              )}
            </div>
          )}
        </SidebarGroup>

        {/* Quick Search Section */}
        <SidebarGroup className="p-0 space-y-1.5">
          <SidebarGroupLabel className="text-[10px] tracking-widest font-bold text-[#94A3B8] uppercase px-3 select-none">
            Quick Search
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Students */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Students Search"
                  onClick={() => handleQuickSearchClick("Government scholarship schemes for students")}
                  className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                >
                  <GraduationCap className="size-4.5 shrink-0 text-[#64748B]" />
                  <span className="flex-1 truncate text-[#0F172A]">Students</span>
                  <ChevronRight className="size-3.5 opacity-40 ml-auto group-data-[state=collapsed]:hidden text-[#64748B]" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Farmers */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Farmers Search"
                  onClick={() => handleQuickSearchClick("Government schemes for farmers")}
                  className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                >
                  <Sprout className="size-4.5 shrink-0 text-[#64748B]" />
                  <span className="flex-1 truncate text-[#0F172A]">Farmers</span>
                  <ChevronRight className="size-3.5 opacity-40 ml-auto group-data-[state=collapsed]:hidden text-[#64748B]" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Women */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Women Search"
                  onClick={() => handleQuickSearchClick("Government schemes for women")}
                  className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                >
                  <Users className="size-4.5 shrink-0 text-[#64748B]" />
                  <span className="flex-1 truncate text-[#0F172A]">Women</span>
                  <ChevronRight className="size-3.5 opacity-40 ml-auto group-data-[state=collapsed]:hidden text-[#64748B]" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Health */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Health Search"
                  onClick={() => handleQuickSearchClick("Government health schemes")}
                  className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                >
                  <HeartPulse className="size-4.5 shrink-0 text-[#64748B]" />
                  <span className="flex-1 truncate text-[#0F172A]">Health</span>
                  <ChevronRight className="size-3.5 opacity-40 ml-auto group-data-[state=collapsed]:hidden text-[#64748B]" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Startup */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Startup Search"
                  onClick={() => handleQuickSearchClick("Startup India scheme")}
                  className="w-full rounded-xl px-3.5 py-5.5 font-semibold text-sm text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
                >
                  <Rocket className="size-4.5 shrink-0 text-[#64748B]" />
                  <span className="flex-1 truncate text-[#0F172A]">Startup</span>
                  <ChevronRight className="size-3.5 opacity-40 ml-auto group-data-[state=collapsed]:hidden text-[#64748B]" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ================= FOOTER ================= */}
      <SidebarFooter className="border-t border-sidebar-border p-4 flex items-center justify-center bg-white">
        {!isCollapsed ? (
          <span className="text-[10px] text-[#94A3B8] font-semibold tracking-wider uppercase select-none transition-opacity duration-200">
            Digital India Initiative © 2026
          </span>
        ) : (
          <span className="text-[10px] text-primary font-bold select-none">
            🇮🇳
          </span>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
