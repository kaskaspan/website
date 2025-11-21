import React from "react";
import styles from "@/components/ui/typing-game.module.css";

interface Props {
  progress: number; // 0 - 100
}

export default function TypingProgress({ progress }: Props) {
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
    </div>
  );
}
