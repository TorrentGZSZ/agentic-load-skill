# agentic-load-skill

Windows PowerShell 下的 Codex skill 检索与管理 CLI。需要 Node.js 20 或更新版本。

## 从本仓库安装并验证

在本仓库根目录运行：

~~~powershell
npm install
npm run build
node .\bin\agentic-load-skill --help
npm run test:e2e:offline
~~~

需要在终端直接使用命令时，安装本地打包文件：

~~~powershell
npm pack
npm install -g .\agentic-load-skill-0.1.7.tgz
agentic-load-skill --help
~~~

版本号变化时，使用 npm pack 实际输出的文件名。

## 初始化 Codex

在需要使用的项目目录运行：

~~~powershell
agentic-load-skill init codex project
~~~

全局使用时运行：

~~~powershell
agentic-load-skill init codex global
~~~

初始化后重启 Codex。项目安装会在项目的 .agents\skills\agentic-load-skill\ 写入 skill 文件。

## 常用命令

~~~powershell
agentic-load-skill list --json
agentic-load-skill suggest --json
agentic-load-skill route --query "需要完成的任务" --json
agentic-load-skill status --json
~~~

禁用 skill 前先查看 suggest 或 list 输出中的 ID：

~~~powershell
agentic-load-skill disable '<skill-id-from-list>' --yes
agentic-load-skill enable '<skill-id-from-status>'
~~~

disable 会重命名目标 skill 文件；enable 会恢复它。只对你确认要调整的 ID 使用这些命令。

## npm 发布后

包发布到 npm 后，可从任意目录临时运行：

~~~powershell
npx --yes agentic-load-skill@latest --help
~~~

长期使用请安装：

~~~powershell
npm install -g agentic-load-skill
agentic-load-skill init codex project
~~~

当前版本的 init 会记录 CLI 的绝对路径，因此不要把一次性 npx init 当作长期安装方式。
