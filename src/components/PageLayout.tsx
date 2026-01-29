import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { MobileBottomNav } from "./MobileBottomNav";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
  rightAction?: ReactNode;
  hideBottomNav?: boolean;
}

export function PageLayout({ 
  children, 
  title, 
  showBackButton = false, 
  backPath,
  rightAction,
  hideBottomNav = false
}: PageLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-dvh relative overflow-hidden pb-16 md:pb-0">
      {/* Background */}
      <div className="fixed inset-0 bg-black -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-black to-gold-900/5" />
        <div className="absolute top-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 glass-card border-t-0 border-x-0 rounded-none safe-top">
          <div className="max-w-4xl mx-auto px-3 md:px-4 py-2.5 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg bg-white/5 text-gray-300 active:bg-white/10 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-sm md:text-lg font-bold text-white truncate">{title}</h1>
            </div>
            {rightAction && (
              <div className="flex-shrink-0 ml-2">
                {rightAction}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-6">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
}
