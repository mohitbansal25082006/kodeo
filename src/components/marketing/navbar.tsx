// src/components/marketing/navbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight, LayoutGrid } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "For developers", href: "#developers" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { data: session, isPending } = useSession();
  const isLoggedIn = !isPending && !!session?.user;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-bg/90 backdrop-blur-md border-b border-border sm:bg-bg/85 sm:backdrop-blur-xl"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 xs:px-5 sm:h-16 lg:h-[72px] lg:px-8">
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Logo markSize={22} />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary transition-colors hover:text-primary hover:bg-surface"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button
                variant="primary"
                size="sm"
                icon={<LayoutGrid className="h-4 w-4" />}
                iconPosition="left"
              >
                Go to dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowUpRight className="h-4 w-4" />}
                >
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-primary lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {/* Mobile menu panel */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          mobileOpen ? "max-h-[420px] border-b border-border" : "max-h-0"
        )}
      >
        <div className="flex flex-col gap-1 bg-bg px-4 pb-6 pt-2 xs:px-5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-secondary hover:bg-surface hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="w-full">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={<LayoutGrid className="h-4 w-4" />}
                  iconPosition="left"
                >
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="w-full">
                  <Button variant="secondary" size="md" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="primary" size="md" className="w-full">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}