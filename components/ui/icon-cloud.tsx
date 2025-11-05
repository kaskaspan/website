"use client";

import { cn } from "@/lib/utils";

export function IconCloud({
  images,
  emojis,
  className,
}: {
  images?: string[];
  emojis?: string[];
  className?: string;
}) {
  // Use emojis if provided, otherwise use images
  const displayItems = emojis || images || [];

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        className
      )}
      >
        <div className="relative flex flex-wrap justify-center gap-4">
        {displayItems.slice(0, 12).map((item, i) => {
            return (
            <div key={i} className="relative">
              {emojis ? (
                <div className="text-4xl opacity-80 hover:opacity-100 transition-opacity">
                  {item}
                </div>
              ) : (
                <img
                  src={item}
                  alt={`Icon ${i}`}
                  className="h-8 w-8 opacity-80 hover:opacity-100 transition-opacity"
                  style={{
                    filter: "brightness(1.2)",
                  }}
                />
              )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
