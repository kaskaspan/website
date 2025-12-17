// filename: components/BookMode.tsx
import React, { useState, useMemo, useEffect } from "react";
import "../styles/book-mode.css";
import { getDiaryEntry } from "./diary";
/**
 * BookMode renders reading UI like Apple Books.
 * It hides Typing Mode controls via CSS when the wrapper has class "book-mode".
 */
export function BookMode({
  title = "Kasper Wonder Diary — Entry",
  text = "",
  layout = "scroll", // "scroll" | "snap"
}: {
  title?: string;
  text: string;
  layout?: "scroll" | "snap";
}) {
  const [theme, setTheme] = useState<"book--light" | "book--sepia" | "book--night">("book--sepia");
  const [size, setSize] = useState<number>(18);
  const [line, setLine] = useState<number>(1.6);
  const [diary, setDiary] = useState<{ title: string; text: string } | null>(null);
  
  // Load diary entry on mount if not provided via props
  useEffect(() => {
    if (!title && !text) {
      getDiaryEntry()
        .then((data) => setDiary(data))
        .catch((err) => console.error("Failed to load diary:", err));
    }
  }, []);
  // Save the current book content to Supabase via PUT API
  const handleSave = async () => {
    try {
      const response = await fetch('/api/book', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: text,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('Save failed:', result);
      } else {
        console.log('Save successful');
      }
    } catch (err) {
      console.error('Error saving book:', err);
    }
  };

  const displayTitle = title ?? diary?.title ?? "Kasper Wonder Diary — Entry";
  const displayText = text ?? diary?.text ?? "";
  const paragraphs = useMemo(() => displayText.split(/\r?\n/), [displayText]);
  const chunks = useMemo(() => chunkText(displayText, 3), [displayText]);

  // CSS custom properties – no `any` needed
  const bookStyle = {
    "--book-font-size": `${size}px`,
    "--book-line-height": line,
  } as React.CSSProperties;

  return (
    <div
      className={`book-shell book-mode ${theme}`}
      style={bookStyle}
    >
      <div className="book-topbar" role="toolbar" aria-label="Reading controls">
        <div className="book-title" aria-live="polite">{displayTitle}</div>
        <div className="book-controls">
          <button className="book-btn" aria-pressed={theme === "book--light"} onClick={() => setTheme("book--light")}>Light</button>
          <button className="book-btn" aria-pressed={theme === "book--sepia"} onClick={() => setTheme("book--sepia")}>Sepia</button>
          <button className="book-btn" aria-pressed={theme === "book--night"} onClick={() => setTheme("book--night")}>Night</button>

          <button className="book-btn" onClick={() => setSize(s => Math.max(14, s - 2))} aria-label="Decrease font size">A−</button>
          <button className="book-btn" onClick={() => setSize(s => Math.min(28, s + 2))} aria-label="Increase font size">A+</button>

          <button className="book-btn" aria-pressed={line === 1.4} onClick={() => setLine(1.4)}>Compact</button>
          <button className="book-btn" aria-pressed={line === 1.6} onClick={() => setLine(1.6)}>Comfort</button>
          <button className="book-btn" aria-pressed={line === 1.8} onClick={() => setLine(1.8)}>Relaxed</button>
          <div className="h-8 w-px mx-1" />
          <button
            onClick={handleSave}
            className="book-btn text-[#5f4b32] hover:bg-[#f3efe6]"
            title="Save Book"
          >
            Save
          </button>

        </div>
      </div>

      {layout === "scroll" ? (
        <div className="book-page">
          <article className="book-content" role="document">
            {paragraphs.map((para, i) => <p key={i}>{para || "\u00A0"}</p>)}
          </article>
        </div>
      ) : (
        <div className="book-snap">
          {chunks.map((chunk, i) => (
            <section key={i} aria-label={`Page ${i + 1}`}>
              <article className="book-content" role="document">
                {chunk.split("\n").map((p, j) => <p key={j}>{p || "\u00A0"}</p>)}
              </article>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function chunkText(t: string, n: number): string[] {
  const words = t.trim().split(/\s+/);
  if (words.length === 0) return [""];
  const size = Math.ceil(words.length / Math.max(1, n));
  const out: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    out.push(words.slice(i, i + size).join(" "));
  }
  return out;
}
