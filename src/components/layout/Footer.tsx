import { Link } from "react-router-dom";
import squirrelboxLogo from "@/assets/squirrelbox-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src={squirrelboxLogo} alt="SquirrelBox" className="h-8 w-8" />
              <span className="font-display text-lg font-bold text-foreground">
                Squirrel<span className="text-primary">Box</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Valet storage for college students. We pick up, store, and deliver your stuff.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Schools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>CU Boulder</li>
              <li>University of Denver</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Get Started</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/book" className="hover:text-primary transition-colors">Book Now</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Student Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SquirrelBox Storage. All rights reserved.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Website by{" "}
            <a href="https://onwardsandupwards.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Onwards and Upwards LLC
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
