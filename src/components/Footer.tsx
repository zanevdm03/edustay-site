import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/edustay-logo.png";

const quickLinks = [
  { path: "/", label: "Home" },
  { path: "/students", label: "Students" },
  { path: "/properties", label: "Properties" },
  { path: "/owners", label: "Owners" },
  { path: "/contact", label: "Contact" },
];

const Footer = () => (
  <footer className="border-t bg-foreground text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary-foreground p-2">
            <img src={logo} alt="EduStay Accommodation logo" className="h-14 w-auto" />
          </div>
          <p className="text-sm opacity-70">
            Quality student accommodation made simple. Connecting students with their perfect home away from home.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider opacity-70">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="opacity-70 transition-opacity hover:opacity-100">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://www.homeprops.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                At Home
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider opacity-70">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 opacity-70">
              <Mail className="h-4 w-4" /> zane@edustaysa.co.za
            </li>
            <li className="opacity-70 transition-opacity hover:opacity-100">
              <a href="https://wa.me/+27727815922" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +27 72 781 5922
              </a>
            </li>
            <li className="flex items-center gap-2 opacity-70">
              <MapPin className="h-4 w-4" /> Bloemfontein
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider opacity-70">Newsletter</h4>
          <p className="mb-3 text-sm opacity-70">Stay updated with the latest properties and news.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 rounded-lg bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none"
            />
            <button className="rounded-lg hero-gradient px-4 py-2 text-sm font-medium">
              Join
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-primary-foreground/10 pt-8 text-center text-sm opacity-50 space-y-1">
        <p>© {new Date().getFullYear()} EduStay Accommodation. All rights reserved.</p>
        <p>In association with At Home Property Group SA | Registered with the PPRA</p>
      </div>
    </div>
  </footer>
);

export default Footer;
