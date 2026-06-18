import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Library, Moon, Sun, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useLocalStorage('vocabvault_sidebar_collapsed', false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      <div className={cn("flex items-center border-b border-border transition-all duration-300", isCollapsed ? "p-4 justify-center" : "p-6")}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shrink-0">
          <Library className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && <span className="text-xl font-bold tracking-tight ml-3 whitespace-nowrap overflow-hidden">VocabVault</span>}
      </div>

      <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto overflow-x-hidden">
        <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Home" isCollapsed={isCollapsed} />
        <NavItem to="/create" icon={<PlusCircle className="w-5 h-5" />} label="Create Deck" isCollapsed={isCollapsed} />
      </div>

      <div className="p-3 border-t border-border mt-auto space-y-2">
        <Tooltip content={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} disabled={!isCollapsed} position="right">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={cn(
              "flex items-center w-full p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              isCollapsed ? "justify-center" : "justify-start"
            )}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!isCollapsed && <span className="font-medium ml-3 whitespace-nowrap">Light Mode</span>}
          </button>
        </Tooltip>

        <div className="hidden md:block">
          <Tooltip content={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} disabled={!isCollapsed} position="right">
            <button
              onClick={toggleCollapse}
              aria-label="Toggle Sidebar"
              className={cn(
                "flex items-center w-full p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
              {!isCollapsed && <span className="font-medium ml-3 whitespace-nowrap">Collapse</span>}
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 z-30 shrink-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar & Overlay */}
      <div className="md:hidden">
        {/* Overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <SidebarContent />
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Library className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">VocabVault</span>
            </div>
          </div>
          <button onClick={toggleTheme} aria-label="Toggle Theme" className="p-2 rounded-full hover:bg-muted">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto w-full pb-10">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}

function NavItem({ to, icon, label, isCollapsed }: { to: string; icon: React.ReactNode; label: string; isCollapsed: boolean }) {
  const content = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center p-3 rounded-xl transition-all duration-200 group",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          isCollapsed ? "justify-center" : "justify-start"
        )
      }
    >
      <div className="shrink-0">{icon}</div>
      {!isCollapsed && <span className="ml-3 whitespace-nowrap">{label}</span>}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
