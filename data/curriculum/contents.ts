import type { LessonContent } from "@/types";
import { worldEndBook } from "@/data/books/world-end";

export const lessonContents: LessonContent[] = [
  {
    id: "content-tj-001",
    locale: "zh-CN",
    keyboardLayout: "qwerty",
    modules: [
      {
        type: "drill",
        id: "drill-f-1",
        title: "食指练习 F",
        text: "f f f f",
        repetitions: 2,
      },
      {
        type: "drill",
        id: "drill-j-1",
        title: "食指练习 J",
        text: "j j j j",
        repetitions: 2,
      },
      {
        type: "drill",
        id: "drill-fj-mix",
        title: "基准键混合",
        text: "ff jj fj jf",
        repetitions: 3,
      },
      {
        type: "exercise",
        id: "exercise-jf-phrases",
        title: "进阶组合",
        textBlocks: [["jfj fff jfj jjj", "fjf jjj fjf fff"]],
      },
    ],
    anchorHints: [
      {
        domain: "both",
        description: "食指保持在 J / F 键位，感受凸点位置。",
      },
    ],
  },
  {
    id: "content-tj-002",
    locale: "zh-CN",
    keyboardLayout: "qwerty",
    handMode: "both",
    modules: [
      {
        type: "drill",
        id: "drill-kd-1",
        title: "延伸键练习",
        text: "kd kd kd dk dk",
        repetitions: 4,
      },
      {
        type: "challenge",
        id: "challenge-kd-speed",
        title: "速度挑战",
        targetWPM: 25,
        durationSec: 60,
      },
    ],
    anchorHints: [
      {
        domain: "both",
        description: "输入 K/D 后迅速回到基准键。",
      },
    ],
  },
  {
    id: "content-tj-003",
    locale: "zh-CN",
    keyboardLayout: "qwerty",
    modules: [
      {
        type: "exercise",
        id: "exercise-top-row",
        title: "上排字母组合",
        textBlocks: [["rty uyt ytr", "tyu yru try"]],
      },
      {
        type: "test",
        id: "test-top-row",
        title: "上排测验",
        questionPool: ["type try try", "type you try", "type try true"],
      },
    ],
  },
    // New beginner lessons following TypingClub progression
    {
      id: "content-tj-004",
      locale: "zh-CN",
      keyboardLayout: "qwerty",
      modules: [
        { type: "drill", id: "drill-fj-1", title: "基准键练习", text: "f j f j", repetitions: 3 },
        { type: "drill", id: "drill-kd-1", title: "延伸键练习", text: "k d k d", repetitions: 3 },
        { type: "drill", id: "drill-ls-1", title: "中指练习", text: "l s l s", repetitions: 3 },
        { type: "drill", id: "drill-a;-1", title: "无名指练习", text: "a ; a ;", repetitions: 3 },
        { type: "drill", id: "drill-shift-enter-1", title: "Shift 与 Enter", text: "shift enter", repetitions: 2 },
      ],
    },
    {
      id: "content-tj-005",
      locale: "zh-CN",
      keyboardLayout: "qwerty",
      modules: [
        { type: "exercise", id: "exercise-fj-words", title: "基准键词组", textBlocks: [["fj", "jf", "ffjj", "jjff"]] www},
        { type: "exercise", id: "exercise-kd-words", title: "延伸键词组", textBlocks: [["kd", "dk", "kkdd", "ddkk"]] },
        { type: "exercise", id: "exercise-ls-words", title: "中指词组", textBlocks: [["ls", "sl", "llss", "ssll"]] },
        { type: "exercise", id: "exercise-a;-words", title: "无名指词组", textBlocks: [["a;", ";a", "aa;;", ";;aa"]] },
      ],
    },
    {
      id: "content-tj-006",
      locale: "zh-CN",
      keyboardLayout: "qwerty",
      modules: [
        { type: "challenge", id: "challenge-speed-1", title: "速度挑战", targetWPM: 30, durationSec: 60 },
        { type: "test", id: "test-complete-1", title: "综合测验", questionPool: ["fj kd ls a;", "jf dk sl ;a", "ffjj kkdd lss; aa;;"] },
      ],
    },
    // 速度挑战
    {
      id: "content-speed-001",
      locale: "zh-CN",
      keyboardLayout: "qwerty",
      modules: [
        {
          type: "challenge",
          id: "challenge-speed-basic",
          title: "基础速度挑战",
          targetWPM: 40,
          durationSec: 60,
        },
        {
          type: "drill",
          id: "drill-speed-burst",
          title: "爆发力练习",
          text: "the quick brown fox jumps over the lazy dog",
          repetitions: 5,
        },
      ],
    },
    // 准确度训练
    {
      id: "content-accuracy-001",
      locale: "zh-CN",
      keyboardLayout: "qwerty",
      modules: [
        {
          type: "exercise",
          id: "exercise-accuracy-symbols",
          title: "符号准确度",
          textBlocks: [["!@#$ %^&*", "()_+ {}|:"]],
        },
        {
          type: "drill",
          id: "drill-accuracy-numbers",
          title: "数字准确度",
          text: "1234567890",
          repetitions: 3,
        },
      ],
    },
    // 代码练习
    {
      id: "content-code-001",
      locale: "en-US",
      keyboardLayout: "qwerty",
      modules: [
        {
          type: "exercise",
          id: "exercise-code-js",
          title: "JavaScript 基础",
          textBlocks: [
            ["const greeting = 'Hello World';", "function add(a, b) { return a + b; }"],
          ],
        },
        {
          type: "exercise",
          id: "exercise-code-html",
          title: "HTML 标签",
          textBlocks: [["<div>Content</div>", "<a href='#'>Link</a>"]],
        },
      ],
    },
    // 名言警句
    {
      id: "content-quote-001",
      locale: "en-US",
      keyboardLayout: "qwerty",
      modules: [
        {
          type: "exercise",
          id: "exercise-quote-steve-jobs",
          title: "Steve Jobs",
          textBlocks: [
            ["Stay hungry, stay foolish.", "The only way to do great work is to love what you do."],
          ],
        },
        {
          type: "exercise",
          id: "exercise-quote-einstein",
          title: "Albert Einstein",
          textBlocks: [
            ["Imagination is more important than knowledge.", "Life is like riding a bicycle. To keep your balance, you must keep moving."],
          ],
        },
      ],
    },
    // 小说：世界末日
    {
      id: "content-book-world-end",
      locale: "zh-CN",
      keyboardLayout: "qwerty",
      modules: worldEndBook.map((chapter, index) => ({
        type: "exercise",
        id: `chapter-${index + 1}`,
        title: chapter.title,
        textBlocks: [[chapter.text]],
      })),
    },
];

