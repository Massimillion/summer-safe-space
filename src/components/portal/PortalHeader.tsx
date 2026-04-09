import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface PortalHeaderProps {
  user: User;
  signOut: () => Promise<void>;
}

const PortalHeader = ({ user, signOut }: PortalHeaderProps) => (
  <header className="border-b border-border bg-card">
    <div className="container flex h-16 items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-2xl">🐿️</span>
        <span className="font-display text-xl font-bold">
          Squirrel<span className="text-primary">Box</span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="mr-1 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  </header>
);

export default PortalHeader;
