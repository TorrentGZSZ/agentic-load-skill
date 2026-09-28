# 本地开发

当前维护范围：Windows PowerShell 与 Codex。实验脚本属于本地研究材料，不在日常 CLI 验收范围内。

## 结构

- src/cli.ts：CLI 入口和命令分发。
- src/hosts/codex.ts：Codex skill 路径与会话来源。
- src/scan.ts、src/usage.ts：skill 枚举与使用记录。
- src/commands/：列出、检索、路由、禁用、恢复、状态和初始化命令。
- src/state.ts：禁用记录与恢复状态。
- skills/agentic-load-skill/：安装到 Codex 的工作流说明。
- scripts/build.mjs：把 TypeScript 构建为无运行依赖的 ESM CLI。
- scripts/install-codex.mjs：Codex 插件安装脚本。

禁用 skill 时，SKILL.md 会改名为 SKILL.md.agentic-load-skill-disabled；恢复时改回。状态文件位于 ~/.agentic-load-skill/。

## 验证

~~~powershell
npm ci
npm run typecheck
npm test
npm run build
npm run check:pack
npm run test:e2e:offline
~~~

可选的联网测试与旧实验脚本不属于当前维护范围。

详细状态修复流程见 [docs/troubleshooting.zh-CN.md](docs/troubleshooting.zh-CN.md)。
