import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Menu, X, Layers } from "lucide-react";

const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/marketplace", label: "Marketplace" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "glass-nav border-b border-border/60 shadow-lg" : "bg-transparent"
    }`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-[68px] items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-500/20" />
              <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
              <Layers className="relative h-4.5 w-4.5 text-primary z-10" size={18} />
            </div>
            <span className="font-display text-[1.1rem] font-700 tracking-tight">
              <span className="text-foreground">Card</span>
              <span className="text-gradient-primary">Proof</span>
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1 rounded-xl border border-border/50 bg-muted/30 p-1 backdrop-blur-sm">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(link.to)
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
              >
                {isActive(link.to) && (
                  <span className="absolute inset-0 rounded-lg ring-1 ring-primary/30" />
                )}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <WalletMultiButton />
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border/40 mt-1 pt-3 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(link.to)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2 sm:hidden">
              <WalletMultiButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
