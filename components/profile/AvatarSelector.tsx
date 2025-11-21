"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateUserAvatar } from "@/lib/supabase/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { X, Check } from "lucide-react";

const AVATAR_SEEDS = [
  "Felix", "Aneka", "Bob", "Alice", "Jack", "Molly", 
  "Simba", "Nala", "Zoe", "Leo", "Max", "Bella",
  "Charlie", "Luna", "Rocky", "Daisy"
];

export function AvatarSelector({ 
  currentAvatar, 
  onAvatarChange 
}: { 
  currentAvatar?: string, 
  onAvatarChange: (url: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSelect = async (seed: string) => {
    if (!user) return;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    
    setIsLoading(true);
    try {
      const result = await updateUserAvatar(user.id, avatarUrl);
      if (result.success) {
        onAvatarChange(avatarUrl);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
      >
        更换头像
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/20 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">选择头像</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2">
          {AVATAR_SEEDS.map((seed) => {
            const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            const isSelected = currentAvatar === url;
            
            return (
              <button
                key={seed}
                onClick={() => handleSelect(seed)}
                disabled={isLoading}
                className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${
                  isSelected 
                    ? "border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                    : "border-white/10 hover:border-white/50 hover:scale-105"
                }`}
              >
                <img 
                  src={url} 
                  alt={seed} 
                  className="w-full h-full object-cover bg-white/5"
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
