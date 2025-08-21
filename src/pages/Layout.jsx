
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, BarChart2, Shield, User as UserIcon, LogOut, Moon, Trophy, Cog } from "lucide-react";
import { Toaster } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Auth from "./components/utils/auth";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await Auth.me();
        setUser(userData);
      } catch (e) {
        setUser(null);
      }
    };
    
    fetchUser();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await Auth.logout();
      setUser(null);
      window.location.href = createPageUrl('Auth');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = createPageUrl('Auth');
    }
  };

  const getLinkClass = (pageName) => {
    return currentPageName === pageName
      ? "flex items-center gap-3 rounded-lg bg-yellow-500/20 px-3 py-2 text-yellow-400 transition-all hover:text-yellow-300"
      : "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-all hover:text-white";
  };

  const navLinks = [
    { name: "Home", href: createPageUrl("Home"), icon: Home, label: "События" },
    { name: "mybets", href: createPageUrl("mybets"), icon: BarChart2, label: "Мои ставки" },
    { name: "Results", href: createPageUrl("Results"), icon: Trophy, label: "Результаты" },
    { name: "Support", href: createPageUrl("Support"), icon: Shield, label: "Поддержка" },
  ];

  const adminLinks = [
    { name: "Admin", href: createPageUrl("Admin"), icon: Cog, label: "Админ" },
  ];
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toaster position="top-center" richColors />
      <style>{`
        .cosmic-bg {
          background-color: #0F172A;
          background-image: radial-gradient(circle at 10% 10%, rgba(234, 179, 8, 0.1) 0%, transparent 30%),
                            radial-gradient(circle at 80% 90%, rgba(59, 130, 246, 0.1) 0%, transparent 30%);
        }
        .card-glow {
          background-color: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(51, 65, 85, 0.5);
          backdrop-filter: blur(10px);
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.1);
        }
        .sidebar-glow {
          background-color: rgba(15, 23, 42, 0.8);
          border-right: 1px solid rgba(51, 65, 85, 0.5);
          backdrop-filter: blur(10px);
        }
      `}</style>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-slate-900/50 md:block sidebar-glow">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 border-slate-700">
              <Link to={createPageUrl("Home")} className="flex items-center gap-2 font-semibold">
                <Moon className="h-6 w-6 text-yellow-400" />
                <span className="text-white">GoldenMoon</span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
                {navLinks.map(link => (
                  <Link key={link.name} to={link.href} className={getLinkClass(link.name)}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                {user?.role === 'admin' && adminLinks.map(link => (
                  <Link key={link.name} to={link.href} className={getLinkClass(link.name)}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-4">
              {user && (
                 <Card className="bg-transparent border-slate-700">
                    <CardHeader className="p-2 pt-0 md:p-4 flex flex-row items-center gap-4 space-y-0">
                         <div>
                            <div className="font-semibold text-white">{user.full_name || user.username}</div>
                            <p className="text-xs text-slate-400">Баланс: ₽{user.balance?.toFixed(2) || '0.00'}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                        <Button size="sm" variant="outline" className="w-full bg-slate-800/50 border-slate-700" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Выйти
                        </Button>
                    </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 cosmic-bg overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
