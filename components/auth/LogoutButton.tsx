"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

export function LogoutButton() {
  const { logout, user } = useAuth();

  return (
    <div className="flex items-center gap-4 text-white/80 text-sm">
      {user && (
        <span>
          Welcome, <span className="font-semibold text-white">{user.username}</span>
        </span>
      )}
      <Button
        onClick={logout}
        variant="outline"
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        Logout
      </Button>
    </div>
  );
}
