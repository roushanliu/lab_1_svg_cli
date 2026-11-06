# Lab 1 Phase 1：SVG 编辑器

## 架构方案

### 1. 模块划分

项目按职责划分为八个模块，源码位于 `src/` 下。模块之间的关系见 [architecture.png](./architecture.png)。

| 模块 | 职责 | 主要元素 |
|---|---|---|
| `cli` | REPL、`svg>` 提示符、统一输出 `error:` | `Cli` |
| `parser` | 将一行文本分词并解析为结构化命令；处理引号和注释 | `Tokenizer`、`CommandParser`、`ParsedCommand` |
| `application` | 协调当前文档、命令分发、历史记录以及 SVG 读写 | `SvgEditor` |
| `commands` | 表示可执行、可撤销的编辑命令，并注册命令名到行为的映射 | `Command`、`CommandDispatcher` 及各具体命令 |
| `history` | 管理 undo/redo 栈和文档 IO 后的锁定状态 | `CommandHistory` |
| `domain` | SVG 文档、图形对象、容器和父子关系；提供移动、缩放、属性、序列化等领域行为 | `Document`、`Shape`、`ContainerShape`、`Group`、`Rect`、`Circle`、`Ellipse`、`Line`、`Text` |
| `factory` | 根据图形类型创建具体图形；为后续插件注册预留接口 | `ShapeFactory`、`ShapeProvider` |
| `io` | SVG 文件读取和写入；读取缺失 id 时自动补 id 并产生 warning | `SvgReader`、`SvgWriter` |

`main.ts` 是组合根，只负责创建 `SvgEditor` 和 `Cli`，不承担业务逻辑。

#### 设计模式的选择

- **Command（作业要求）**：每条编辑操作实现 `Command` 接口，由 `CommandHistory` 统一执行、撤销和重做。各具体命令分别封装一种编辑行为，因此一条 CLI 编辑命令对应一个 undo 单元。显示命令和文档 IO 命令不进入 undo 栈；IO 后清空历史并禁止 undo/redo，直到下一条编辑命令执行。
- **Composite**：`ContainerShape` 和叶子 `Shape` 共享 `move`、`scale`、`delete` 所需的抽象。`Group` 递归操作子图形，使容器和叶子可以被同一组命令处理。
- **Factory**：`ShapeFactory` 集中处理类型名到具体图形类的创建，并通过 `ShapeProvider` 注册内置类型。当前内置 `rect`、`circle`、`ellipse`、`line`、`text`、`g`；`box` 仍是作业定义的后续插件目标，本阶段未实现。

项目中保留两处按名字分派：`CommandDispatcher` 负责命令名分派，`ShapeFactory` 负责图形类型分派。未来增加 `box` 时，应通过 `ShapeProvider` 注册，而不是把类型判断扩散到命令或领域模型中。

### 2. 依赖方向规则

允许的主要依赖方向如下：

```text
main        -> cli, application
cli         -> parser, application
application -> commands, history, domain, io
commands    -> domain, factory
history     -> commands.Command
io          -> domain, factory
factory     -> domain
parser      -> （无业务模块依赖）
domain      -> （不依赖上层模块）
```

规则及理由：

1. `domain` 是最稳定的核心，不得依赖 CLI、解析、应用、历史或文件 IO；文件格式和交互细节不能渗入领域模型。
2. `parser` 只产生结构化输入，不直接修改文档；`cli` 只负责交互，业务操作统一交给 `application`。
3. SVG 文件格式相关逻辑集中在 `io`；图形创建统一经过 `ShapeFactory`。
4. `history` 只依赖 `Command` 抽象，不依赖具体命令；这样撤销机制不会与某一种编辑操作耦合。
5. 命令名分派只能位于 `CommandDispatcher`，图形类型分派只能位于 `ShapeFactory`。

### 3. 变化点假设

| 可能变化 | 当前预留 | 当前决定 |
|---|---|---|
| 增加新的 SVG 图形或复合图形 | `ShapeFactory` 的 provider 注册接口、`Shape` 抽象 | 内置类型通过工厂扩展；`box` 暂不实现，作为后续插件目标 |
| 增加 CLI 命令 | `CommandDispatcher` 的注册表和 `Command` 接口 | 新编辑命令独立成类，不修改历史模块 |
| undo/redo 策略变化 | `CommandHistory` 与具体命令解耦 | 当前只实现按命令粒度的栈式撤销 |
| SVG 语法或属性扩展 | `SvgReader`、`SvgWriter` 与领域模型隔离 | 当前只覆盖作业要求的元素和属性，暂不抽象通用 XML 属性系统 |
| 交互界面变化 | `Cli` 通过 `SvgEditor` 使用核心逻辑 | 暂不为 GUI 或网络接口提前增加适配层 |

## 过程记录

协作过程中采用的主要判断是：先把命令和领域操作拆开，再用测试验证每次新增行为；发现输入边界、输出顺序或文件读写与作业约定不一致时，通过后续修复提交纠正。

具体包括：

- 每完成一部分功能实现，均进行人工测试 + 另一位 AI agent 的实现结果检查；
- 检查中发现过一些细节问题，例如颜色值识别错误、命令输出内容与作业要求不一致、树结构输出顺序不符合预期等；
- 对于只影响单个模块或单条命令的细节问题，直接定位并修复，再通过测试确认；
- 对于涉及多个模块联动的问题，例如 CLI、应用层、工厂、SVG 读写之间的交互，则单独分析调用链和依赖方向，确认修复不会破坏既定架构后再修改，并补充相应测试进行回归检查。

以下记录选取了影响架构和功能的关键迭代：

| 阶段 | 代表提交 | 讨论/问题 | 修正结果 |
|---|---|---|---|
| 架构设计 | — | 先明确模块职责、包图表示法、可见性和依赖约束 | 形成八模块方案，并明确 Command、Composite、Factory 的边界；相关早期文档提交已在历史整理时移除 |
| 编辑器骨架 | `946b64b`、`7316856` | 需要让 CLI、应用层和命令历史协同工作，同时不让 CLI 直接改领域对象 | 引入 `SvgEditor`、`CommandDispatcher`、`CommandHistory` 和首批测试 |
| 基本图形编辑 | `7a49dce` | 需要覆盖多种图形的 move、scale、set、delete，并支持撤销 | 以 `Shape` 多态和独立命令类实现，补充矩形、圆、椭圆、线和文本 |
| 复合结构 | `7109d94`、`cfe44c6`、`bd2b2fc` | 分组、解组、移入容器和 z-order 涉及父子关系、顺序和边界校验 | 用 `ContainerShape` 统一容器操作，并修正树输出、顺序和输入边界情况 |
| 反馈与显示 | `82bcf87`、`c13b0dc` | 仅执行操作还不便于验证，需要稳定的结果摘要、tree/show/help 和 SVG 输出 | 增加统一反馈、结构树、属性明细和 `SvgWriter` |
| 文件读回 | `f149e2a` | 外部 SVG 可能缺少 id，且保存结果必须能再次读回 | 增加 `SvgReader`、缺失 id warning 和 round-trip 测试 |
| 最终修正 | `d4bd421` | 对照作业约定检查 CLI IO、工厂参数和读取行为 | 修正错误输出、文件读写、类型工厂和嵌套 SVG 行为 |

## 一致性自查

### 模块划分

实际 `src/` 目录包含 `cli`、`parser`、`application`、`commands`、`history`、`domain`、`factory`、`io` 八个模块，与方案一致。`main.ts` 作为组合根未单独列为业务模块，符合其职责范围。当前没有实现 `box` 插件，README 将其标注为预留而不是已完成能力。

### 依赖方向

抽查源码 import 关系后，实际依赖符合方案：领域模块未依赖上层模块；`history` 只使用 `Command`；`io` 通过 `ShapeFactory` 创建领域对象；CLI 不直接操作领域对象。`application` 负责把具体命令注册到 `CommandDispatcher`，这是应用层组装职责，不构成领域层反向依赖。当前未发现违反既定方向的依赖。

命令名到行为的注册集中在 `CommandDispatcher`，图形类型到具体类的注册集中在 `ShapeFactory`。因此，虽然应用层会构造具体命令对象，但没有形成第二套按命令名分派逻辑。

## 质量保证手段

- `npm test`：当前 2 个测试文件、12 个测试全部通过。应用层测试覆盖创建/显示/撤销、文档 IO 后历史锁定、基本编辑、非法缩放、分组和解组、`addto`、注释与颜色参数、错误边界、show/canvas/help/save、嵌套 SVG 读取、缺失 id warning 以及保存后读回；CLI 进程级测试覆盖启动、命令解析、注释、颜色值、保存/读回和统一错误输出。
- `npm run test:coverage`：使用 Vitest 的 V8 provider 生成文本和 HTML 覆盖率报告，并设置最低门槛：语句 80%、行 80%、函数 70%、分支 70%。当前实测覆盖率达到语句/行 82.91%、函数 74.70%、分支 72.22%，已通过门槛。`main.ts`、CLI 子进程入口和纯类型声明不纳入 V8 统计；CLI 的外部行为由进程级测试验证。
- `npm run build`：TypeScript 编译通过，用于检查模块导入、类型和接口的一致性。
- Git 提交按功能逐步推进，每个阶段都同时补充或调整测试；最终修正后重新执行测试和构建。
- CLI 进程级测试检查了启动信息和输出约定；保存的 SVG 仍可在浏览器打开并由 `read` 再次读回。
- 进行视觉效果人工验收，浏览器中打开保存的 SVG，检查画布尺寸、图形位置、颜色、文字、层级结构和保存结果是否符合预期。
