// client/src/layouts/PublicLayout.jsx
import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, CreditCard, Menu, X } from 'lucide-react';

export default function PublicLayout() {
  const { token } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  useEffect(() => {
    initTheme();
  }, []);

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-slate-50 dark:bg-brand-navy-950 text-brand-slate-900 dark:text-brand-slate-100 transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-brand-slate-200/50 dark:border-brand-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-outfit text-2xl font-bold text-gradient-teal-cyan">
              <CreditCard className="w-6 h-6 text-brand-teal-500" />
              <span>Billora</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium hover:text-brand-teal-500 dark:hover:text-brand-teal-400 transition-colors ${
                    location.pathname === link.path 
                      ? 'text-brand-teal-500 dark:text-brand-teal-400' 
                      : 'text-brand-slate-600 dark:text-brand-slate-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-brand-teal-400" /> : <Moon className="w-5 h-5 text-brand-navy-800" />}
            </button>

            {/* Auth Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              {token ? (
                <Link
                  to="/dashboard"
                  className="px-4 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-glow-teal"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium hover:text-brand-teal-500 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 h-9 flex items-center justify-center rounded-lg bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-t border-brand-slate-200/50 dark:border-brand-slate-800/30 px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-2 text-brand-slate-600 dark:text-brand-slate-300 hover:text-brand-teal-500"
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-brand-slate-200 dark:border-brand-slate-800 my-1" />
            {token ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-medium text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-10 flex items-center justify-center rounded-lg border border-brand-slate-300 dark:border-brand-slate-700 text-sm font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-10 flex items-center justify-center rounded-lg bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-slate-200 dark:border-brand-slate-900 bg-brand-slate-100/50 dark:bg-brand-navy-950/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <Link to="/" className="flex items-center gap-2 font-outfit text-xl font-bold text-gradient-teal-cyan">
              <CreditCard className="w-5 h-5 text-brand-teal-500" />
              <span>Billora</span>
            </Link>
            <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 leading-relaxed">
              Role-Based SaaS Billing & Subscription Management Platform for high-scale enterprise applications.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 font-outfit">Product</h4>
            <ul className="flex flex-col gap-2 text-xs text-brand-slate-600 dark:text-brand-slate-400">
              <li><Link to="/features" className="hover:text-brand-teal-500 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-brand-teal-500 transition-colors">Pricing Tiers</Link></li>
              <li><a href="#" className="hover:text-brand-teal-500 transition-colors">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 font-outfit">Company</h4>
            <ul className="flex flex-col gap-2 text-xs text-brand-slate-600 dark:text-brand-slate-400">
              <li><Link to="/about" className="hover:text-brand-teal-500 transition-colors">About Us</Link></li>
              <li><a href="#" className="hover:text-brand-teal-500 transition-colors">Security</a></li>
              <li><Link to="/contact" className="hover:text-brand-teal-500 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 font-outfit">Subscribe to updates</h4>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="px-3 py-2 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 flex-grow"
              />
              <button
                type="submit"
                className="px-3 bg-brand-teal-500 hover:bg-brand-teal-600 text-white rounded-lg text-xs font-semibold"
              >
                Join
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-brand-slate-200 dark:border-brand-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-brand-slate-500">
          <span>&copy; 2026 Billora Inc. All rights reserved.</span>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
