# dsh-SpaceX-UI
一个让dsh的ui变成SpaceX发射直播界面的插件
哎，我从来没有制作什么的经验，这是完全ai做出来的<img width="1100" height="236" alt="image" src="https://github.com/user-attachments/assets/28c424e0-1189-41bf-bcce-da49135c2a05" />
下好后复制这个文件地址放到你的dsh里面就好了

---

## 安装当前版本（0.1.9）

适配 DeepSeek Harness 0.2.1-rc.2。仓库根目录已经包含 DSH 组合包声明和预构建运行文件。

在 DSH「插件」安装框填写：

```text
https://github.com/cuimiko/dsh-SpaceX-UI
```

使用默认分支 main。此前只含 README 的旧标签不包含完整插件；当前请使用上面的仓库地址。安装或更新后重启 DSH；先停用其他全局外观皮肤。

也可以使用交付包中的 dsh-control-room-0.1.9.tgz，解压交付 ZIP 后，在安装框填写 TGZ 的本地完整路径。源码 ZIP 用于维护。

完整功能、数据口径与验证边界如下。

# DSH 发射控制室插件 · 0.1.9

适用于 **DeepSeek Harness 0.2.1-rc.2**，通过 DSH 插件管理器安装本地组合包，无需运行原型预览服务器。中央屏幕承载 DSH 原生对话与输入；模型、附件、审批、队列、插话、设置及右侧面板仍由宿主管理。

## 本版界面

- 黑色侧栏、玻璃幕墙与远景星舰、两侧角色和笔记本。对话、任务卡片与输入卡片采用直角深色外观。
- 完整任务名使用原生会话列表的 displayTitle，显示在计时下方；上方保留当前步骤／工具状态，原左上角当前任务名隐藏，祖先会话导航和其他控制保留。
- 输入框下方重复的轮次、速度、用量、命中率和上下文统计整行隐藏。原生停止、发送与插话按钮保留。
- 原 END TASK 圆环改为 **CONTEXT / 上下文占用 / %**，不再提供 HUD 停止或图片插槽。
- 两位角色使用轻微、错开节奏的 CSS 呼吸浮动；没有新增图片或视频依赖。遵循系统减少动态效果设置，角色不拦截点击。中央列不足 900px 时隐藏角色以保留工作空间。

## HUD 数据与比例尺

| 显示 | 来源与满环 |
| --- | --- |
| USAGE | tokenUsage 会话累计已结算输入、输出、缓存读取与写入；自动 K/M/B/T；满环 **100,000,000 Token** |
| SPEED | 优先采用 DSH 原生 sessionStats 的会话平均生成速度：decodeTokens ÷ decodeMs；缺失时回退最近已结算回复的真实计时；满环 **1000 Token/s** |
| CACHE HIT | 会话累计缓存读取 ÷ 全部输入 Token；满环 100% |
| CONTEXT | 原生 contextPressure 的 projectedTokens（缺省时 pressureTokens）÷ contextWindow，按 DSH 相同规则四舍五入并封顶 100% |
| T+ | 当前／最近一轮 Turn 的起止时间，结束后冻结 |

圆环上限是视觉比例尺，不代表服务商额度；数字始终显示实际统计。缺失统计显示「—」，不补零。上下文占用是宿主估计的当前请求压力，与累计 Token 用量不同；缺少容量或压力数据时保持未知。悬停上下文数字可查看分子与容量。

## 安装与更新

交付 ZIP 包含 dsh-control-room-0.1.9.tgz、源码 ZIP、SHA256 和 INSTALL.md。将 tarball 放在固定位置，在 DSH「插件」页输入该文件的绝对路径安装；先关闭其他全局皮肤，更新后重启。只安装 ZIP 内的 TGZ，源码 ZIP 用于维护。

详见 [安装与更新](docs/INSTALL.md)。本主题不修改 profile、账号、数据库或 app.asar，不增加模型／网络调用，没有 install/prepare/postinstall 脚本。

## 插话与排队

在 **设置 → 通用 → 繁忙时的发送行为** 选择队列或插话。运行时的普通草稿会在原发送按钮显示对应方式。默认排队时，Mac 用 Cmd+Enter、Windows 用 Ctrl+Enter 执行插话；改为插话偏好后，该快捷键改为排队。发送窗口、子会话、命令与附件规则继续遵循宿主。

## 源码与验证

src/ 为源码，assets/ 为原画与字体，lib/client.js 为媒体内嵌产物。使用 Node.js 20 或更新版本：

    node scripts/build.cjs
    node --test test/*.test.cjs
    node scripts/verify.cjs
    node scripts/preflight.cjs "D:/dsh"
    node scripts/pack.cjs

[集成说明](docs/INTEGRATION.md) 与 [验证记录](docs/VALIDATION.md) 描述数据口径和验证边界。本版完成自动检查和浏览器隔离验证，尚未代替真实 Windows/Mac DSH 的安装及模型任务验收。未知 DSH 版本需要重新适配，不承诺所有版本兼容。

0.1.9 修复速度频繁显示「—」：步骤切换不再清空读数，优先读取持久的原生 sessionStats；缺失时支持从已保存的原始／压缩流记录提取真实首 Token 时间。悬停 SPEED 数字可区分会话平均与最近已结算回复。
