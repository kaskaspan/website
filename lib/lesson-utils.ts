import type { LessonContent } from "@/types";

export function extractLessonText(content?: LessonContent) {
  if (!content) return "";
  const segments: string[] = [];
  for (const lessonModule of content.modules) {
    switch (lessonModule.type) {
      case "drill": {
        const repeated = Array(lessonModule.repetitions)
          .fill(lessonModule.text)
          .join(" ");
        segments.push(repeated);
        break;
      }
      case "exercise": {
        const blockText = lessonModule.textBlocks.flat().join(" ");
        segments.push(blockText);
        break;
      }
      case "challenge": {
        segments.push(
          `${lessonModule.title ?? "挑战"}，目标 ${lessonModule.targetWPM} WPM，时长 ${lessonModule.durationSec} 秒`
        );
        break;
      }
      case "test": {
        segments.push(lessonModule.questionPool.join(" "));
        break;
      }
    }
  }
  return segments.join(" ").replace(/\s+/g, " ").trim();
}
