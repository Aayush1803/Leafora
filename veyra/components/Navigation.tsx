"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Analyze" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "var(--color-background)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div className="container-main">
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "56px",
          }}
          aria-label="Main navigation"
        >
          {/* Wordmark */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
            }}
            aria-label="VEYRA home"
          >
            <VeyraLogo />
            <span
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "1.0625rem",
                fontWeight: "700",
                letterSpacing: "0.18em",
                color: "var(--color-text-primary)",
              }}
            >
              VEYRA
            </span>
          </Link>

          {/* Desktop nav */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "2rem" }}
            className="hidden-mobile"
          >
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <NavLink key={link.href} href={link.href} active={active}>
                  {link.label}
                </NavLink>
              );
            })}
          </div>

          {/* Engine badge + mobile menu */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              className="t-label hidden-mobile"
              style={{
                padding: "3px 8px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              MODEL 01
            </span>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="show-mobile"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                color: "var(--color-text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "block",
                  width: "22px",
                  height: "1.5px",
                  backgroundColor: "currentColor",
                  transformOrigin: "center",
                }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: "block",
                  width: "22px",
                  height: "1.5px",
                  backgroundColor: "currentColor",
                }}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "block",
                  width: "22px",
                  height: "1.5px",
                  backgroundColor: "currentColor",
                  transformOrigin: "center",
                }}
              />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              overflow: "hidden",
              borderTop: "1px solid var(--color-border-subtle)",
              backgroundColor: "var(--color-background)",
            }}
          >
            <div className="container-main" style={{ paddingTop: "1.25rem", paddingBottom: "1.5rem" }}>
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.22 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "0.75rem 0",
                        fontSize: "1.0625rem",
                        fontWeight: active ? "600" : "400",
                        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                        textDecoration: "none",
                        borderBottom: "1px solid var(--color-border-subtle)",
                        transition: "color 200ms",
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
              <div style={{ paddingTop: "1rem" }}>
                <span className="t-label" style={{ color: "var(--color-text-muted)" }}>
                  MODEL 01 — PlantVillage CNN
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 640px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 639px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", position: "relative" }}>
      <motion.span
        whileHover="hover"
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: active ? "600" : "400",
          letterSpacing: "0.01em",
          color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
          transition: "color 200ms",
          paddingBottom: "2px",
        }}
      >
        {children}
        {active && (
          <motion.span
            layoutId="nav-indicator"
            style={{
              position: "absolute",
              bottom: "-2px",
              left: 0,
              right: 0,
              height: "1.5px",
              backgroundColor: "var(--color-accent)",
              borderRadius: "1px",
            }}
          />
        )}
      </motion.span>
    </Link>
  );
}

function VeyraLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      {/* Abstract geometric mark — concentric arc segments suggesting a cross-section */}
      <circle
        cx="11"
        cy="11"
        r="9.5"
        stroke="var(--color-accent)"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 11 3 L 11 11 L 18 11"
        stroke="var(--color-accent)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="11" cy="11" r="2" fill="var(--color-accent)" />
    </svg>
  );
}
