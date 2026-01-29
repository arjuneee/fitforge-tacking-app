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
    <div className="min-h-dvh bg-black pb-20 md:pb-0">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10 safe-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-white font-semibold text-base">{title}</h1>
            </div>
            {rightAction && <div>{rightAction}</div>}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="px-4 py-4">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
}
