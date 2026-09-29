# agentic-load-skill

Windows PowerShell 下的 Codex skill 检索与管理 CLI。需要 Node.js 20 或更新版本。

## 从 npm 安装

~~~powershell
npm install -g agentic-load-skill
agentic-load-skill --help
~~~

只想临时查看命令时运行：

~~~powershell
npx --yes agentic-load-skill@latest --help
~~~

当前版本的 init 会记录 CLI 的绝对路径，因此请用全局安装的命令初始化，不要用一次性 npx 初始化。

## 从源码安装并验证

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

## 安装后如何使用

初始化会安装本包自带的 `SKILL.md`，并在 `references/local-cli.md` 中写入指向当前 CLI 的 PowerShell helper。重启 Codex 后，它能发现这个 skill 的名称和描述；遇到符合描述的任务时，Codex 才会读取完整说明，通过 helper 调用终端 CLI。普通任务如果已有明确匹配的启用 skill，会优先使用那个 skill；本工具主要用于检索**已禁用**的 skill，或管理已安装的 skill。不会在每次对话中无条件运行。

直接向 Codex 描述任务即可；想明确指定本工具时，可以说：“使用 `$agentic-load-skill` 查找适合处理 PPTX 的已禁用 skill，找到后继续完成任务。”

## 已禁用 skill 的检索流程

以下命令展示 Codex 按 `SKILL.md` 执行的步骤，也可在 PowerShell 手动复现。命令是 `corpus search`，不是 `agentic-load-skill -search`。CLI 另有 `route` 命令，但当前 Codex skill 使用下面的分步流程。

1. 根据任务中的关键术语检索已禁用 skill 的名称和描述，查看结果中的 `matches[].ref`；结果太多就增加 `--all` 条件，没有结果就调整关键词。

   ~~~powershell
   agentic-load-skill corpus search --all "pptx" --any "presentation" --limit 30 --json
   ~~~

2. 对候选结果检查元数据。把下面的占位符换成搜索结果中的 `ref`。

   ~~~powershell
   agentic-load-skill corpus inspect '<corpus-ref-from-search>' --json
   ~~~

3. 只有元数据明确匹配任务时才选用一个候选，并说明依据。`select` 返回 `selected.skillMdPath`；Codex 随后读取该文件并按其中的说明工作。如果证据不足，就不选用。

   ~~~powershell
   agentic-load-skill corpus select '<corpus-ref-from-search>' --query '制作 PPTX 演示文稿' --confidence high --reason '名称和描述明确覆盖 PPTX 制作' --json
   ~~~

`corpus search` 和 `inspect` 只查看已禁用 skill 的元数据；`select` 记录选用结果并返回文件路径。skill 文件由 Codex 读取，不是 CLI 自动执行。

## 查看和管理 skill

~~~powershell
agentic-load-skill list --json
agentic-load-skill suggest --json
agentic-load-skill status --json
~~~

`list` 列出已安装 skill，`suggest` 给出可整理的候选，`status` 查看禁用记录。禁用前先查看 `suggest` 或 `list` 输出中的 ID：

~~~powershell
agentic-load-skill disable '<skill-id-from-list>' --yes
agentic-load-skill enable '<skill-id-from-status>'
~~~

`disable` 会重命名目标 skill 文件；`enable` 会恢复它。只对你确认要调整的 ID 使用这些命令。其他可用命令见 `agentic-load-skill --help`。

## 实验报告

[在线阅读 retriever 实验报告](https://torrentgzsz.github.io/agentic-load-skill/report-all-experiments.html)，或[下载原始 MHTML 快照](https://raw.githubusercontent.com/TorrentGZSZ/agentic-load-skill/main/docs/report-all-experiments.mhtml)。
