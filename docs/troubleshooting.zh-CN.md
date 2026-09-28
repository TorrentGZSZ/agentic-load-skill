# Windows / Codex 故障排查

以下命令在 PowerShell 中运行。

## 命令找不到

先确认 Node.js 版本至少为 20：

~~~powershell
node --version
npm --version
~~~

如果只在源码目录运行过 npm ci，CLI 尚未全局安装。可按照 [README](../README.md) 中的本地打包安装步骤安装，然后打开新的 PowerShell 窗口运行 agentic-load-skill --help。

## Codex 没有发现 skill

在项目目录运行：

~~~powershell
agentic-load-skill init codex project
~~~

确认项目的 .agents\skills\agentic-load-skill\SKILL.md 已创建，再重启 Codex。若该目录已经存在，先检查内容；确定需要覆盖时才加 --force。

## 查看禁用状态

~~~powershell
agentic-load-skill list --json
agentic-load-skill status --json
~~~

状态文件默认位于用户目录的 .agentic-load-skill\state-codex.json。禁用时，SKILL.md 会改名为 SKILL.md.agentic-load-skill-disabled；恢复时可运行：

~~~powershell
agentic-load-skill enable '<skill-id-from-status>'
~~~

如果同一目录里同时有上述两个文件，先检查内容和 status 输出，不要直接删除任一文件。遇到损坏的状态文件或跨目录符号链接，请保留原文件，再根据 status 提示处理。

## 一次性 npx 初始化后路径失效

当前 init 会记录 CLI 的绝对路径。npm 缓存变化后，之前写入的路径可能失效。安装全局包后，在该项目目录重新运行 init codex project --force，生成指向稳定安装位置的 helper。
