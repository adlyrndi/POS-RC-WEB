"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AuthContext, AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import {
  IoHomeOutline,
  IoHome,
  IoBarChartOutline,
  IoBarChart,
  IoCartOutline,
  IoCart,
  IoCubeOutline,
  IoCube,
  IoTicketOutline,
  IoTicket,
  IoReceiptOutline,
  IoReceipt,
  IoLogOutOutline,
} from "react-icons/io5";
import styles from "./dashboard.module.css";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Home",
    icon: IoHomeOutline,
    activeIcon: IoHome,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: IoBarChartOutline,
    activeIcon: IoBarChart,
  },
  {
    href: "/dashboard/pos",
    label: "POS",
    icon: IoCartOutline,
    activeIcon: IoCart,
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: IoCubeOutline,
    activeIcon: IoCube,
  },
  {
    href: "/dashboard/vouchers",
    label: "Vouchers",
    icon: IoTicketOutline,
    activeIcon: IoTicket,
  },
  {
    href: "/dashboard/transactions",
    label: "History",
    icon: IoReceiptOutline,
    activeIcon: IoReceipt,
  },
];

function DashboardShell({ children }) {
  const { token, isLoading, logout, tenantName } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [token, isLoading, router]);

  if (isLoading || !token) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar — Desktop */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <div className={styles.sidebarText}>
            <div className={styles.sidebarBrand}>ROOM COLLECTION</div>
            <div className={styles.sidebarTenant}>{tenantName}</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = active ? item.activeIcon : item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarLink} ${
                  active ? styles.sidebarLinkActive : ""
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <IoLogOutOutline size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>{children}</main>

      {/* Bottom Nav — Mobile */}
      <nav className={styles.bottomNav}>
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          const Icon = active ? item.activeIcon : item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.bottomNavItem} ${
                active ? styles.bottomNavItemActive : ""
              }`}
            >
              <Icon size={22} />
              <span className={styles.bottomNavLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <DashboardShell>{children}</DashboardShell>
      </CartProvider>
    </AuthProvider>
  );
}
