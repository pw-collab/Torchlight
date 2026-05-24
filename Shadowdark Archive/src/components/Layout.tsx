import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Backpack, 
  BookOpen, 
  Award, 
  History, 
  Settings,
  Shield,
  Skull,
  Zap,
  Eye,
  Menu
} from 'lucide-react';

type View = 'character' | 'inventory' | 'spells';

interface LayoutProps {
  children: ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const navItems = [
    { id: 'character', label: 'Character', icon: User },
    { id: 'inventory', label: 'Inventory', icon: Backpack },
    { id: 'spells', label: 'Spells', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary/30 selection:text-primary relative">
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stucco.png')] opacity-[0.03] mix-blend-overlay"></div>
      <div className="noise-overlay" />

      {/* Main Content Area */}
      <div className="flex min-h-screen pt-4 lg:pt-0">
        {/* Main Viewport */}
        <main className="flex-1 lg:pl-80 pb-32">
          {children}
        </main>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 lg:left-80 right-0 z-50">
        <nav className="bg-surface-container-high flex w-full shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-t border-outline-variant/20">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id as View)}
                whileHover={{ backgroundColor: isActive ? '' : 'rgba(0,0,0,0.05)' }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-1 flex flex-col items-center justify-center py-3 md:py-4 px-2 transition-colors duration-300 group z-10 border-r border-outline-variant/10 last:border-r-0 ${
                  isActive 
                    ? 'bg-on-surface text-surface' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <item.icon size={20} className="mb-1" />
                <span className="font-label text-[10px] md:text-xs uppercase tracking-widest transition-all">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute inset-0 bg-on-surface/50 blur-sm -z-10"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
