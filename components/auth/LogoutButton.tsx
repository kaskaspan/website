"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

export function LogoutButton() {
  const { logout, user } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {user && (
        <span className="text-white/80 text-sm">
          Welcome, <span className="font-semibold">{user.username}</span>
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
