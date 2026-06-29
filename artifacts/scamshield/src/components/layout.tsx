import React from "react";
import { Link, useLocation } from "wouter";
import { Shield, Home, History, LayoutDashboard } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { name: "Analyze", path: "/", icon: Home },
    { name: "History", path: "/history", icon: History },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col md:flex-row relative">
      {/* Ambient purple glow top-right */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[400px] rounded-full opacity-10 blur-[120px] bg-[hsl(263_75%_62%)] z-0" />
      {/* Ambient purple glow bottom-left */}
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[300px] rounded-full opacity-8 blur-[100px] bg-[hsl(285_60%_55%)] z-0" />

      {/* Sidebar */}
      <aside className="relative z-10 w-full md:w-60 bg-sidebar border-b md:border-b-0 md:border-r border-sidebar-border flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary glow-primary-sm text-primary-foreground flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-widest uppercase text-foreground">ScamShield</span>
            <span className="block text-[10px] text-muted-foreground tracking-wider font-mono">AI SECURITY</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-x-auto md:overflow-visible flex md:flex-col gap-1 whitespace-nowrap">
          {navItems.map((item) => {
            const isActive = location === item.path || (location.startsWith("/results") && item.path === "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/25 glow-primary-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer badge */}
        <div className="hidden md:block px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">SYSTEM ONLINE</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
