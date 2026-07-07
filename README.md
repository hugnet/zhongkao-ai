# 中考提分 AI 私教 🎯

6 位 AI 专家 · 55 个核心技能 · 专属中考私教

## 技术栈

- Next.js 16 (App Router)
- Tailwind CSS 4
- Supabase (Auth + Database)
- DeepSeek API
- LemonSqueezy (可选)

## 快速开始

1. `npm install`
2. 复制 `./env.local` 并填入配置
3. 在 [Supabase](https://supabase.com) 注册获取配置
4. 在 [DeepSeek](https://platform.deepseek.com) 注册获取 API Key
5. `npm run dev`

## 项目结构

src/
├── app/           # 页面和 API 路由
│   ├── page.tsx       # 首页
│   ├── chat/          # AI 对话
│   ├── pricing/       # 定价页
│   ├── login/         # 登录
│   ├── skills/        # 技能地图
│   ├── diagnosis/     # 学情诊断
│   └── api/           # API 路由
├── components/    # UI 组件
├── lib/           # 核心逻辑
│   ├── constants.ts     # 专家和技能数据
│   ├── skills/          # 技能引擎
│   ├── ai/              # AI 聊天模块
│   └── supabase/        # Supabase 客户端
└── types/         # TypeScript 类型定义

## 部署

推荐 Vercel 一键部署：
1. 推送到 GitHub
2. 在 vercel.com 导入仓库
3. 配置环境变量
4. 部署完成