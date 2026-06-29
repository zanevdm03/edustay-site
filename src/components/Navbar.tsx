import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, GraduationCap, Building2, Users, Mail, Calendar, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/edustay-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/students", label: "Students", icon: GraduationCap },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/owners", label: "Owners", icon: Users },
  { path: "/contact", label: "Contact", icon: Mail },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="EduStay Accommodation logo" className="h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <Button variant="ghost" asChild>
                <Link to="/admin/dashboard" className="gap-1">
                  <Settings className="h-4 w-4" /> CMS
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/admin/calendar" className="gap-1">
                  <Calendar className="h-4 w-4" /> Admin
                </Link>
              </Button>
            </>
          )}
          {user ? (
            <Button variant="outline" className="ml-4" onClick={() => supabase.auth.signOut()}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button variant="outline" className="ml-4" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
          <Button className="hero-gradient text-primary-foreground hover:opacity-90" asChild>
            <Link to="/contact">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t bg-card px-4 pb-4 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
