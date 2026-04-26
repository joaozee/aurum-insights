import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
              Home, 
              BarChart3, 
              GraduationCap, 
              Users, 
              User,
              Crown,
              Menu,
              X,
              Trophy,
              Briefcase,
              FileText,
              BookOpen,
              Sparkles,
              ArrowLeft
            } from "lucide-react";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import NotificationToast from "@/components/notifications/NotificationToast";
import GamificationManager from "@/components/gamification/GamificationManager";
import OnboardingManager from "@/components/onboarding/OnboardingManager";
import FloatingFinancialAssistant from "@/components/ai/FloatingFinancialAssistant";
import ThemeToggle from "@/components/theme/ThemeToggle";
import PortfolioNotificationManager from "@/components/notifications/PortfolioNotificationManager";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import CommunityNotificationHandler from "@/components/notifications/CommunityNotificationHandler";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerNotification, setBannerNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const MAIN_ROUTES = ['/', '/Home', '/Dashboard', '/Portfolio', '/Courses', '/Community'];
  const showBackButton = !MAIN_ROUTES.includes(location.pathname);

  useEffect(() => {
    loadUser();
    // Apply theme from localStorage or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "dark") {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      checkForBannerNotification();
    }
  }, [user]);

  const checkForBannerNotification = async () => {
    try {
      const dismissed = localStorage.getItem('dismissed_banner');
      const notifications = await base44.entities.Notification.filter(
        { 
          user_email: user.email,
          type: 'atualizacao_plataforma',
          severity: 'warning'
        },
        '-created_date',
        1
      );
      
      if (notifications.length > 0 && dismissed !== notifications[0].id) {
        setBannerNotification(notifications[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissBanner = (id) => {
    localStorage.setItem('dismissed_banner', id);
    setBannerNotification(null);
  };

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log(e);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profiles = await base44.entities.UserProfile.filter({
        user_email: user.email
      });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const navItems = [
    { icon: Home, label: "Início", page: "Home" },
    { icon: BarChart3, label: "Finanças", page: "Dashboard" },
    { icon: Briefcase, label: "Carteira", page: "Portfolio" },
    { icon: GraduationCap, label: "Cursos", page: "Courses" },
    { icon: Users, label: "Comunidade", page: "Community" }
  ];

  const mobileNavItems = [
    { icon: Home, label: "Início", page: "Home" },
    { icon: BarChart3, label: "Finanças", page: "Dashboard" },
    { icon: Briefcase, label: "Carteira", page: "Portfolio" },
    { icon: GraduationCap, label: "Cursos", page: "Courses" },
    { icon: Users, label: "Comunidade", page: "Community" }
  ];

  const extraNavItems = [
    { icon: BarChart3, label: "Ações", page: "Company" }
  ];

  const hiddenLayoutPages = ["Terms", "Privacy", "Help", "Support", "ContentDetail", "CourseDetail", "CoursePlayer", "Learn"];
  const showBottomNav = !hiddenLayoutPages.includes(currentPageName);

  return (
    <OnboardingManager userEmail={user?.email}>
              <GamificationManager userEmail={user?.email}>
                <CommunityNotificationHandler userEmail={user?.email} />
                <NotificationToast userEmail={user?.email} />
                <PortfolioNotificationManager userEmail={user?.email} portfolio={null} goals={null} />
                <PushNotificationManager userEmail={user?.email} />
                <FloatingFinancialAssistant />
            <div className="min-h-screen bg-gray-950 dark:bg-gray-950">
      <style>{`
                    :root {
                      --color-primary: #8B5CF6;
                      --color-primary-light: #A78BFA;
                      --color-primary-dark: #7C3AED;
                      --color-accent: #F59E0B;
                    }

                    @keyframes fadeIn {
                      from { opacity: 0; transform: translateY(10px); }
                      to { opacity: 1; transform: translateY(0); }
                    }

                    .animate-fade-in {
                      animation: fadeIn 0.3s ease-out forwards;
                    }

                    /* Custom scrollbar */
                    ::-webkit-scrollbar {
                      width: 6px;
                      height: 6px;
                    }
                    ::-webkit-scrollbar-track {
                      background: #1F2937;
                    }
                    ::-webkit-scrollbar-thumb {
                      background: #4B5563;
                      border-radius: 3px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                      background: #6B7280;
                    }
                  `}</style>

      {/* Banner Notification */}
      {bannerNotification && (
        <NotificationBanner 
          notification={bannerNotification}
          onDismiss={handleDismissBanner}
        />
      )}

      {/* Desktop Header */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg" 
                  alt="Aurum Logo" 
                  className="h-9 w-9 object-contain"
                  style={{ mixBlendMode: 'lighten' }}
                />
                <span className="font-bold text-xl text-white">Aurum</span>
              </Link>

            <nav className="flex items-center gap-1">
              {navItems.slice(0, 7).map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    currentPageName === item.page 
                      ? "bg-amber-500/20 text-amber-400" 
                      : "text-gray-400 hover:bg-gray-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              {extraNavItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    currentPageName === item.page 
                      ? "bg-violet-500/20 text-violet-400" 
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {!user?.is_premium && (
                <Link to={createPageUrl("Premium")}>
                  <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-violet-500/30">
                    <Crown className="h-4 w-4 mr-1" />
                    Premium
                  </Button>
                </Link>
              )}
              <ThemeToggle />
              <NotificationCenter userEmail={user?.email} />
              <Link to={createPageUrl("Profile")}>
                {userProfile?.profile_image_url ? (
                  <img 
                    src={userProfile.profile_image_url} 
                    alt={user?.full_name || 'User'}
                    className={cn(
                      "h-9 w-9 rounded-full object-cover transition-all",
                      user?.is_premium && "ring-2 ring-violet-500/50"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                    user?.is_premium 
                      ? "bg-gradient-to-br from-violet-400 to-purple-500 text-white ring-2 ring-violet-500/50" 
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}>
                    {user?.full_name?.[0] || "U"}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-800"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-14 px-3">
          {/* Left: back button or logo */}
          {showBackButton ? (
            <button
              onClick={() => navigate(-1)}
              className="no-select flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-300 hover:text-white transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg"
                alt="Aurum Logo"
                className="h-8 w-8 object-contain"
                style={{ mixBlendMode: 'lighten' }}
              />
              <span className="font-bold text-lg text-white">Aurum</span>
            </Link>
          )}

          <div className="flex items-center gap-1">
            {!user?.is_premium && (
              <Link to={createPageUrl("Premium")}>
                <Button size="sm" variant="ghost" className="no-select text-violet-400 px-2 min-h-[44px]">
                  <Crown className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <ThemeToggle />
            <NotificationCenter userEmail={user?.email} />
            <Link to={createPageUrl("Profile")} className="no-select flex items-center justify-center min-h-[44px] min-w-[44px]">
              {userProfile?.profile_image_url ? (
                <img
                  src={userProfile.profile_image_url}
                  alt={user?.full_name || 'User'}
                  className={cn(
                    "h-8 w-8 rounded-full object-cover",
                    user?.is_premium && "ring-2 ring-violet-500/50"
                  )}
                />
              ) : (
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm",
                  user?.is_premium
                    ? "bg-gradient-to-br from-violet-400 to-purple-500 text-white ring-2 ring-violet-500/50"
                    : "bg-gray-800 text-gray-300"
                )}>
                  {user?.full_name?.[0] || "U"}
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "pt-safe-mobile",
        showBottomNav ? "pb-safe-nav" : ""
      )}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-900 border-t border-gray-800"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-around h-16 px-1">
            {mobileNavItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "no-select flex flex-col items-center justify-center w-full min-h-[44px] h-full gap-1 transition-all",
                  currentPageName === item.page
                    ? "text-violet-400"
                    : "text-gray-500"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  currentPageName === item.page && "scale-110"
                )} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  </GamificationManager>
</OnboardingManager>
  );
}