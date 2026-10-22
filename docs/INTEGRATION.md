# DSH 0.2.1-rc.2 集成合同 · 0.1.9

依据本机 D:/dsh/resources/app.asar 中的已打包代码。未修改安装包或 profile；未以其他版本的上游源码代替当前合同。

## 加载与布局

组合包声明 dsh.bundle.patch 和 dsh.client，Cordis 只插入 ui-control-room。Host apply() 无操作；浏览器模块由 window.__ModuleLoader__ 加载，React 来自宿主。

Client 注入 slots、sessions、workspaces、connection、layout、sidebarRight，挂载于 shell.overlay，不替换原生 single slot。通过 data-slot、data-shell-overlay 和自有 data-dsh-cr-* 属性定位，不依赖 CSS Module 哈希。主屏路径为 main → main.conversation → [data-phase]，包含 display:contents 包装层。独立主面板和右栏全屏时恢复主屏标记并隐藏场景。

## 原生交互的保留

原输入编辑器、附件、模型、权限、工作区、模式、停止、队列和插话的 DOM 与处理函数不重建。composer.cjs 测量选择行并在视觉上并入同一工具栏，不移动 React 节点；窄栏可横向滚动。保留分栏按钮调用 sidebarRight.toggleExpanded()。

通过 conversation.header 中原生会话层级 nav 的最后一个面包屑隐藏当前任务名，保留祖先会话按钮与 header actions/utilities/corner。HUD 计时下方优先读取 summary.displayTitle，缺省使用 title。步骤／工具状态仍在上方，不将会话标题冒充执行步骤。

隐藏 data-composer-dock 整行：该版本原生此处包含 activity、usage 插槽和 ContextMeter。此隐藏不包括输入卡片或位于其上方的任务／目标、审批和队列控件。停用后恢复。

0.1.8 已恢复原生停止按钮。HUD 只有四个只读数据圆环，没有停止按钮、确认对话框、图片插槽或取消回调。adapter.cjs 保留旧版纯停止适配函数及回归测试供维护，但当前客户端没有绑定或调用它。

## 数据来源

- sessions.list.getSnapshot().byId 中 retainedBy.mainView 选中当前主会话；不额外 retain 或新建 Agent。
- sessions.binding(id) 的 session、eventSource 提供会话状态与当前加载的 Turn 事件。步骤、工具状态读取当前事件；速度优先使用下述会话投影，避免与当前步骤事件窗口耦合。
- session.projections.faceOf('tokenUsage') 提供互斥计费桶；累计值不充当上下文分子。
- session.projections.faceOf('contextPressure') 提供 projectedTokens、pressureTokens 和 contextWindow。遵循原生 contextOccupancy：先取 projectedTokens（0 也有效），否则 pressureTokens；百分比 Math.min(100, Math.round(used/capacity*100))。缺少或非法分子、容量，容量为 0 时显示未知。保留真实分子作悬停读数，超过容量只限制圆环及百分比显示。
- session.projections.faceOf('sessionStats') 提供 decodeTokens、decodeMs；优先使用 decodeTokens / (decodeMs / 1000)，与原生 ActivityPill 相同。两者必须有限非负且 decodeMs 大于 0，结果必须有限；0 输出在有效时间内为真实零速度。源缺失或无测量时，回退当前已加载会话历史中最近一条可测的 assistant/message，支持其 stream 内的 chunk、text-chunks、reasoning-chunks、tool-call-chunks，以及 assistant/attempt 首 Token 记录；不依赖临时 live-chunk 存在。新步骤／重试只重置正在计时的边界，保留最近有效结算速度。无统计时为 null，不使用字符数推算。
- Token、上下文与 sessionStats 三个投影都允许不存在。监听投影源及会话／事件变化；投影消失或重现时重新绑定订阅，200ms 合并发布并有 2 秒刷新。
- connection、layout.panelInfo 和 sidebarRight 只读状态或控制原生布局；无新增 Host RPC、模型调用或权限。

## HUD 与动态

字体、描边、圆环几何、渐变线和梯形阴影沿用已确认的 HUD。用量、速度满环分别为 1e8 和 1000；右二改为上下文百分比。原画只做 CSS translate/rotate/scaleY 微动，左右节奏错开，pointer-events:none；prefers-reduced-motion:reduce 下关闭，窄窗口隐藏。

## 生命周期与兼容边界

ctx.effect 释放样式与 html 版本属性；React effect 释放观察器、订阅、定时器和输入区定位。自定义元素定义在页面生命周期内只注册一次，因此更新后必须刷新客户端／重启 DSH。停用时原任务名、输入下方统计及所有原生界面样式恢复，草稿不删除。

仍依赖该 DSH 版本的语义插槽、DOM 合同与服务字段。预检查仅验证已知签名，不代表真实模型、菜单、网络、Mac 系统标题栏或其他插件组合已验收。

## 0.1.9 速度来源说明

速度优先为全会话已结算输出的平均解码速度，而非当前瞬时采样；回退时为最近可测的已结算回复。snapshot.speedSource 与 HUD 悬停标题注明 session-average 或 last-settled。数据不跨会话缓存；当前会话无投影、无有效历史时保持未知。新源到达和旧源被移除时重新订阅，停用释放。
