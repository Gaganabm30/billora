// client/src/layouts/DashboardLayout.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, apiRequest } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useToastStore } from '../store/toastStore';
import { 
  LayoutDashboard, CreditCard, Receipt, Wallet, BarChart3, Users, 
  Activity, Bell, LifeBuoy, Settings, LogOut, ChevronDown, 
  Menu, X, Search, Terminal, Sun, Moon, ArrowRight, ShieldCheck
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, activeOrg, role, logout, switchOrg, notifications, fetchNotifications, markNotificationRead, markAllNotificationsRead } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Command Palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  
  // User's organizations list
  const [myOrgs, setMyOrgs] = useState([]);

  useEffect(() => {
    // Fetch user organizations
    const loadUserOrgs = async () => {
      try {
        const orgs = await apiRequest('/api/auth/organizations');
        setMyOrgs(orgs);
      } catch (err) {
        console.error(err);
      }
    };

    loadUserOrgs();
    fetchNotifications();

    // Setup poll for notifications
    const interval = setInterval(fetchNotifications, 15000);

    // Keyboard shortcut for command palette (Ctrl + K)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const handleOrgSwitch = async (orgId) => {
    try {
      await switchOrg(orgId);
      setOrgDropdownOpen(false);
      addToast('Switched organization context', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const sidebarLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Subscriptions', icon: CreditCard, path: '/dashboard/subscriptions' },
    { name: 'Billing & Cards', icon: Wallet, path: '/dashboard/billing' },
    { name: 'Invoices', icon: Receipt, path: '/dashboard/invoices' },
    { name: 'Payments History', icon: CreditCard, path: '/dashboard/payments' },
    { name: 'Analytics Trends', icon: BarChart3, path: '/dashboard/analytics' },
    { name: 'Team & Roles', icon: Users, path: '/dashboard/team' },
    { name: 'Usage Meters', icon: Activity, path: '/dashboard/usage' },
    { name: 'Support Tickets', icon: LifeBuoy, path: '/dashboard/support' },
    { name: 'Audit Compliance', icon: Terminal, path: '/dashboard/audit' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  // Commands for command palette
  const allCommands = [
    { name: 'Go to Dashboard', action: () => navigate('/dashboard') },
    { name: 'Manage Subscriptions & Upgrade Plan', action: () => navigate('/dashboard/subscriptions') },
    { name: 'View Billing Cards', action: () => navigate('/dashboard/billing') },
    { name: 'Search Invoices', action: () => navigate('/dashboard/invoices') },
    { name: 'Payment Records', action: () => navigate('/dashboard/payments') },
    { name: 'Open Support Ticket', action: () => navigate('/dashboard/support') },
    { name: 'View Usage tracking', action: () => navigate('/dashboard/usage') },
    { name: 'Compliance Logs', action: () => navigate('/dashboard/audit') },
    { name: 'Toggle Dark/Light Mode', action: () => toggleTheme() },
    ...myOrgs.map(org => ({
      name: `Switch tenant to: ${org.name}`,
      action: () => handleOrgSwitch(org.id)
    }))
  ];

  const filteredCommands = allCommands.filter(cmd => 
    cmd.name.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex bg-brand-slate-50 dark:bg-brand-navy-950 transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-brand-slate-200/50 dark:border-brand-slate-800/30 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header/Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-brand-slate-200/50 dark:border-brand-slate-800/20">
          <Link to="/dashboard" className="flex items-center gap-2 font-outfit text-xl font-bold text-gradient-teal-cyan">
            <CreditCard className="w-5 h-5 text-brand-teal-500" />
            <span>Billora</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-grow py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          {user?.isSuperAdmin && (
            <Link
              to="/dashboard/super-admin"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl border border-brand-teal-500/20 bg-brand-teal-500/5 text-brand-teal-500 dark:text-brand-teal-400 mb-4 hover:bg-brand-teal-500/10 transition-colors ${
                location.pathname === '/dashboard/super-admin' ? 'border-brand-teal-500/40 bg-brand-teal-500/10' : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-brand-teal-500" />
              <span>Super Admin Suite</span>
            </Link>
          )}

          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-teal-500/10 to-brand-cyan-500/5 text-brand-teal-600 dark:text-brand-teal-400 border border-brand-teal-500/10' 
                    : 'text-brand-slate-600 dark:text-brand-slate-400 hover:text-brand-slate-900 dark:hover:text-brand-slate-200 hover:bg-brand-slate-200/30 dark:hover:bg-brand-slate-800/20 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-teal-500' : 'opacity-70'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Organization Context */}
        <div className="p-4 border-t border-brand-slate-200/50 dark:border-brand-slate-800/20">
          <div className="flex items-center gap-3 p-2 bg-brand-slate-100/50 dark:bg-brand-slate-900/30 border border-brand-slate-200/40 dark:border-brand-slate-800/10 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-teal-500 to-brand-cyan-500 text-white flex items-center justify-center font-bold text-xs">
              {activeOrg ? activeOrg.name.slice(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="text-xs font-semibold truncate text-brand-slate-800 dark:text-brand-slate-200">
                {activeOrg ? activeOrg.name : 'Super Administrator'}
              </p>
              <p className="text-[10px] text-brand-slate-500 uppercase tracking-wider">
                {role ? role.replace('_', ' ') : 'GLOBAL'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow md:pl-64 flex flex-col min-h-screen">
        
        {/* Top Navbar */}
        <header className="h-16 sticky top-0 z-30 w-full glass-panel border-b border-brand-slate-200/50 dark:border-brand-slate-800/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40">
              <Menu className="w-5 h-5" />
            </button>

            {/* Command Trigger Search Bar */}
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-slate-300/60 dark:border-brand-slate-800 bg-white/50 dark:bg-brand-navy-950/40 text-xs text-brand-slate-400 hover:border-brand-teal-500/50 transition-colors w-64 text-left"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search platform...</span>
              <kbd className="ml-auto bg-brand-slate-200 dark:bg-brand-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono">Ctrl K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Org Switcher Dropdown (Only show if user has org memberships or is SuperAdmin) */}
            {!user?.isSuperAdmin && myOrgs.length > 1 && (
              <div className="relative">
                <button 
                  onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-slate-200/50 dark:bg-brand-slate-800/40 hover:bg-brand-slate-200 dark:hover:bg-brand-slate-800 transition-colors"
                >
                  <span>Context: {activeOrg?.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
                {orgDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-panel border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl shadow-lg p-1.5">
                    <p className="text-[10px] text-brand-slate-400 font-bold px-2 py-1 uppercase">Switch tenant workspace</p>
                    {myOrgs.map(org => (
                      <button
                        key={org.id}
                        onClick={() => handleOrgSwitch(org.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-teal-500/10 hover:text-brand-teal-500 transition-colors ${
                          org.id === activeOrg?.id ? 'text-brand-teal-500 bg-brand-teal-500/5 font-semibold' : ''
                        }`}
                      >
                        {org.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Theme Switch */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-brand-teal-400" /> : <Moon className="w-4 h-4 text-brand-navy-900" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40 transition-colors relative"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-brand-teal-500 border border-brand-slate-50 dark:border-brand-navy-950 rounded-full flex items-center justify-center text-[7px] text-white font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-panel border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl shadow-lg p-2 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-brand-slate-200/50 dark:border-brand-slate-800/20 pb-2 px-2">
                    <span className="text-xs font-bold font-outfit">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => markAllNotificationsRead()}
                        className="text-[10px] text-brand-teal-500 font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 pt-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-brand-slate-400 py-4">All caught up!</p>
                    ) : (
                      notifications.slice(0, 5).map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            notif.read 
                              ? 'bg-transparent hover:bg-brand-slate-200/30 dark:hover:bg-brand-slate-800/10' 
                              : 'bg-brand-teal-500/5 hover:bg-brand-teal-500/10 border-l-2 border-brand-teal-500'
                          }`}
                        >
                          <p className="text-xs font-bold">{notif.title}</p>
                          <p className="text-[10px] text-brand-slate-500 mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40 transition-colors"
              >
                <img 
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={user?.name}
                  className="w-8 h-8 rounded-full border border-brand-teal-500/30 object-cover"
                />
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-panel border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl shadow-lg p-1">
                  <div className="px-3 py-2 border-b border-brand-slate-200/50 dark:border-brand-slate-800/20">
                    <p className="text-xs font-bold truncate">{user?.name}</p>
                    <p className="text-[10px] text-brand-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => { setUserDropdownOpen(false); navigate('/dashboard/settings'); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-brand-slate-100 dark:hover:bg-brand-slate-850 transition-colors flex items-center gap-2 mt-1"
                  >
                    <Settings className="w-3.5 h-3.5 opacity-60" />
                    <span>Settings</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/5 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-grow p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Command Palette Modal */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate-950/80 backdrop-blur-sm dialog-overlay">
          <div className="glass-panel max-w-lg w-full rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-800/40 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-slate-200/50 dark:border-brand-slate-800/30">
              <Search className="w-4 h-4 text-brand-teal-500" />
              <input
                type="text"
                placeholder="Type a command or search context..."
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                autoFocus
                className="bg-transparent text-sm w-full border-none outline-none focus:ring-0 text-brand-slate-800 dark:text-brand-slate-100"
              />
              <button 
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded bg-brand-slate-200 dark:bg-brand-slate-800 text-[10px] font-semibold text-brand-slate-500"
              >
                ESC
              </button>
            </div>
            
            <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-0.5">
              {filteredCommands.length === 0 ? (
                <p className="text-center text-xs text-brand-slate-400 py-6">No matching actions found.</p>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      cmd.action();
                      setCommandPaletteOpen(false);
                      setCommandSearch('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-brand-teal-500/10 hover:text-brand-teal-500 flex items-center justify-between font-medium group transition-colors"
                  >
                    <span>{cmd.name}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
