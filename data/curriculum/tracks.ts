import type { LessonTrack } from "@/types";

export const lessonTracks: LessonTrack[] = [
  {
    id: "typing-jungle",
    name: "Typing Jungle",
    description: "标准盲打课程，从基准键开始逐步扩展到全键盘。",
    skillBranch: "fundamentals",
    difficultyIndex: 20,
    prerequisites: [],
    lessons: [
      {
        id: "tj-001",
        title: "基准键 J · F",
        estimatedMinutes: 5,
        tags: ["home-row", "accuracy"],
        contentRef: "content-tj-001",
        difficulty: {
          speed: 10,
          accuracy: 20,
          complexity: 5,
        },
        skillAttributes: ["home-row", "posture"],
      },
      {
        id: "tj-002",
        title: "延伸键 K · D",
        estimatedMinutes: 6,
        tags: ["home-row", "index-finger"],
        contentRef: "content-tj-002",
        difficulty: {
          speed: 15,
          accuracy: 25,
          complexity: 10,
        },
        skillAttributes: ["home-row", "index-finger"],
      },
      {
        id: "tj-003",
        title: "上排字母",
        estimatedMinutes: 8,
        tags: ["top-row", "dexterity"],
        contentRef: "content-tj-003",
        difficulty: {
          speed: 20,
          accuracy: 30,
          complexity: 20,
        },
        skillAttributes: ["top-row", "reach"],
      },
    ],
  },
  {
    id: "typing-jungle-junior",
    name: "Jungle Junior",
    description: "面向低龄学习者的趣味课程，配合短句与故事。",
    skillBranch: "fundamentals",
    difficultyIndex: 10,
    prerequisites: [],
    lessons: [
      {
        id: "tjj-001",
        title: "动物好朋友",
        estimatedMinutes: 4,
        tags: ["home-row", "story"],
        contentRef: "content-tjj-001",
        difficulty: {
          speed: 8,
          accuracy: 18,
          complexity: 5,
        },
        skillAttributes: ["home-row", "story"],
      },
    ],
  },
];

