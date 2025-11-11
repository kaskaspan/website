import type { LessonContent } from "@/types";

export const lessonContents: LessonContent[] = [
  {
    id: "content-tj-001",
    locale: "zh-CN",
    keyboardLayout: "qwerty",
    modules: [
      {
        type: "drill",
        id: "drill-jf-1",
        title: "基准键反复练习",
        text: "jf jf jf fj jf jf",
        repetitions: 4,
      },
      {
        type: "exercise",
        id: "exercise-jf-phrases",
        title: "短语练习",
        textBlocks: [["jfj fff jfj", "fff jjj fff"]],
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
];

