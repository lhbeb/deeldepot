"use client";

import Image from 'next/image';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Plus,
  Upload,
  LogOut,
  ChevronLeft,
  Home,
  Menu,
  X,
  Zap,
  LayoutDashboard,
  Terminal,
  BarChart2,
  Mail,
  TrendingDown,
  User,
  AlertTriangle,
  CreditCard,
  ChevronDown,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { lockScroll, unlockScroll } from '@/utils/scrollUtils';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

// This will be populated dynamically with orders count
const getMainNavItems = (ordersCount: number): NavItem[] => [
  { name: 'Products', path: '/admin/products', icon: Package, description: 'Manage inventory' },
  { name: 'Sellers', path: '/admin/sellers', icon: User, description: 'Manage sellers profiles' },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, description: 'View all orders', badge: ordersCount > 0 ? ordersCount : undefined },
  { name: 'Payouts', path: '/admin/payouts', icon: Send, description: 'Send seller payouts' },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart2, description: 'Traffic & visitors' },
  { name: 'Mail Project', path: '/admin/mail-project', icon: Mail, description: 'Send & manage emails' },
  { name: 'Price Monitor', path: '/admin/price-monitor', icon: TrendingDown, description: 'Track product prices' },
];

// Items bundled under the "More" dropdown
const moreNavItems: NavItem[] = [
  { name: 'Payment Settings', path: '/admin/payment-settings', icon: CreditCard, description: 'Manage Stripe keys' },
  { name: 'Scripts', path: '/admin/scripts', icon: Terminal, description: 'Run DB scripts' },
  { name: 'Error Log', path: '/admin/errors', icon: AlertTriangle, description: 'View client crashes' },
];

const quickActions: NavItem[] = [
  { name: 'Add Product', path: '/admin/products/new', icon: Plus },
  { name: 'Quick Add', path: '/admin/products/quick-add', icon: Zap },
  { name: 'Bulk Import', path: '/admin/products/bulk-import', icon: Upload },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-refresh token before expiry
  useAdminAuth();
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // First try the dedicated non-HttpOnly cookie
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find(c => c.trim().startsWith('admin_role='));

    if (roleCookie) {
      const role = roleCookie.split('=')[1]?.trim();
      if (role === 'super-admin') {
        setIsSuperAdmin(true);
      } else if (role === 'admin') {
        setIsAdmin(true);
      }
      return; // Cookie worked, skip JWT
    }

    // Fallback: try parsing the localStorage token
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (payload.role === 'super-admin') {
          setIsSuperAdmin(true);
        } else if (payload.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error("Failed to parse admin token role.");
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch orders count (non-critical - fails silently)
  useEffect(() => {
    let abortController: AbortController | null = null;

    const fetchOrdersCount = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        // Create abort controller for timeout
        abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController?.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch('/api/admin/orders/count', {
            signal: abortController.signal,
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            setOrdersCount(typeof data.count === 'number' ? data.count : 0);
          } else if (response.status === 401) {
            // Not authenticated - silently fail
            return;
          }
          // For other errors, silently fail (non-critical feature)
        } catch (fetchError: any) {
          clearTimeout(timeoutId);

          // Only log if it's not an abort (timeout) or network error
          if (fetchError.name !== 'AbortError' && fetchError.name !== 'TypeError') {
            // Silently fail - this is non-critical
            return;
          }
          // Network errors are expected and can be ignored
        }
      } catch (error) {
        // Silently fail - orders count is non-critical
        // The sidebar will work fine without the badge count
      }
    };

    if (mounted) {
      fetchOrdersCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchOrdersCount, 30000);
      return () => {
        clearInterval(interval);
        abortController?.abort();
      };
    }
  }, [mounted]);

  // Handle scroll locking when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    // Cleanup: always unlock on unmount
    return () => {
      unlockScroll();
    };
  }, [mobileMenuOpen]);


  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Clear localStorage
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  const isActive = useCallback((path: string) => {
    if (path === '/admin/products') {
      return pathname === '/admin/products' || pathname === '/admin';
    }
    return pathname === path || pathname.startsWith(path + '/');
  }, [pathname]);

  // Auto-open "More" if we're on one of its pages
  useEffect(() => {
    if (moreNavItems.some((i) => isActive(i.path))) {
      setMoreOpen(true);
    }
  }, [pathname, isSuperAdmin, isActive]);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5 text-gray-700" />
        ) : (
          <Menu className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-40
          transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          w-64 flex flex-col shadow-xl lg:shadow-none
        `}
      >


        {/* Admin Profile Card */}
        <div className="mx-4 my-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#090A28] to-[#F5970C] rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#262626] text-sm truncate">
                {isSuperAdmin ? 'Super Admin' : (isAdmin ? 'Admin' : 'Administrator')}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <div className="mb-6">
            <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Main Menu
            </p>
            <div className="space-y-1">
              {getMainNavItems(ordersCount).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${active
                        ? 'bg-[#06092a] text-white shadow-lg shadow-[#06092a]/30'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#262626]'
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block">{item.name}</span>
                      {item.description && !active && (
                        <span className="text-[11px] text-gray-400 truncate block">{item.description}</span>
                      )}
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold min-w-[1.5rem] text-center ${active ? 'bg-[#F5970C]/20 text-[#F5970C]' : 'bg-red-500 text-white'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* More — collapsible group */}
              <div>
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${moreNavItems.some((i) => isActive(i.path))
                      ? 'bg-[#06092a] text-white shadow-lg shadow-[#06092a]/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#262626]'
                    }
                  `}
                >
                  <MoreHorizontal
                    className={`h-5 w-5 flex-shrink-0 ${
                      moreNavItems.some((i) => isActive(i.path)) ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                  <span className="flex-1 text-left font-medium text-sm">More</span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                      moreOpen ? 'rotate-180' : ''
                    } ${
                      moreNavItems.some((i) => isActive(i.path)) ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                </button>

                {/* Dropdown items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    moreOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pl-3 space-y-1 border-l-2 border-gray-100 ml-4">
                    {moreNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                            ${active
                              ? 'bg-[#06092a] text-white shadow-lg shadow-[#06092a]/30'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-[#262626]'
                            }
                          `}
                        >
                          <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm block">{item.name}</span>
                            {item.description && !active && (
                              <span className="text-[11px] text-gray-400 truncate block">{item.description}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Links — logo-only, side by side compact */}
          <div className="mt-2 pt-4 border-t border-gray-200 px-2 pb-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Biozy */}
              <a
                href="https://www.biozy.co/admin/login"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                title="Open Biozy admin"
                className="flex-1 flex items-center justify-center px-2 py-2.5 bg-gray-50 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Image
                  src="/biozy.svg"
                  alt="Biozy"
                  width={80}
                  height={24}
                  className="object-contain w-auto h-6"
                  style={{ filter: 'brightness(0) saturate(100%) invert(69%) sepia(3%) saturate(1210%) hue-rotate(185deg) brightness(97%) contrast(92%)' }}
                />
              </a>

              {/* GoLinks */}
              <a
                href="https://go.DeelDepot.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                title="Open GoLinks"
                className="flex-1 flex items-center justify-center px-2 py-2.5 bg-gray-50 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Image
                  src="/golinks.svg"
                  alt="GoLinks"
                  width={90}
                  height={24}
                  className="object-contain w-auto h-6"
                  style={{ filter: 'brightness(0) saturate(100%) invert(69%) sepia(3%) saturate(1210%) hue-rotate(185deg) brightness(97%) contrast(92%)' }}
                />
              </a>

              {/* SMSFuck */}
              <a
                href="https://smsfuck.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                title="Open SMSFuck"
                className="flex-1 flex items-center justify-center px-2 py-2.5 bg-gray-50 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <span className="font-bold text-[11px] tracking-wider uppercase text-gray-500" style={{ filter: 'brightness(0) saturate(100%) invert(69%) sepia(3%) saturate(1210%) hue-rotate(185deg) brightness(97%) contrast(92%)' }}>SMSFuck</span>
              </a>

              {/* Leynk */}
              <a
                href="https://leynk.co/admin"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                title="Open Leynk admin"
                className="flex-1 flex items-center justify-center px-2 py-2.5 bg-gray-50 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Image
                  src="/leynk.svg"
                  alt="Leynk"
                  width={80}
                  height={24}
                  className="object-contain w-auto h-6"
                  style={{ filter: 'brightness(0) saturate(100%) invert(69%) sepia(3%) saturate(1210%) hue-rotate(185deg) brightness(97%) contrast(92%)' }}
                />
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Quick Actions
            </p>
            <div className="space-y-1">
              {quickActions.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                      ${active
                        ? 'bg-[#06092a] text-white shadow-lg shadow-[#06092a]/30'
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-sm">Back to Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

