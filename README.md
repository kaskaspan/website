This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies and run the development server:

```bash
# install dependencies (choose one)
npm install
yarn
pnpm install

# start dev server
npm run dev
# or: pnpm dev / yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## TypingClub Blueprint Roadmap

| 阶段 | 状态 | 说明 |
| --- | --- | --- |
| 0. 架构准备 | ✅ 已完成 | `docs/typingclub-stage0-*.md`：数据模型、状态规划、目录规范 |
| 1. 核心打字体验 | ✅ MVP 完成 | Redux store、Typing Core 组件、全局 Provider，详见 `docs/stage1-*.md` |
| 2. 课程体系 & 自适应 | 🛠 进行中 | 基础课程数据与 Lesson Selector 已完成，见 `docs/stage2-*.md`，后续将深化适应策略 |
| 3. 高级交互 & 可访问性 | 🛠 进行中 | 虚拟手 + 音效 MVP、设置面板扩展完成，详见 `docs/stage3-*.md` |
| 4. 数据持久化 & 分析 | ⏳ 未开始 | 待确定数据库与同步方案 |
| 5. 教师 / 管理工具 | ⏳ 未开始 | 班级管理、作业布置、报表导出 |
| 6. 高阶优化 | ⏳ 未开始 | WebGL、机器学习推荐、全球部署 |

详情请参考 `docs/stage1-overview.md` 及对应阶段文档。随着迭代推进，本表将持续更新。
