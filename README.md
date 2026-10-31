# Searl Effect Generator — 等距剖切模型与物理审计

An interactive isometric reconstruction of John Searl's SEG, with a runnable physics audit for every claim.

**这不是一台工作样机的复刻。** 原机不存在、参数自相矛盾、最早期的演示记录在 1991 年的走访中未被证实。这个仓库做的是把说法拆开、把数字算清楚。

## 快速开始

打开 [`searl-seg-light.html`](searl-seg-light.html)（自包含，无依赖），或 [`searl-seg.html`](searl-seg.html) 暗色版。

- 鼠标横向划动，或按 `← →`、数字键 `1–7`
- 七步：磁轴承 → 磁极轨 → **能量账** → 自持加速 → 高压电晕 → 失重 35% → 反重力
- 每一步只有对应部件保持满色，底部读数给出该环节的证据状态与真实数字

## 能量账

| 项 | 数值 |
|---|---|
| 市电输入 | 200 W（20 kV × 10 mA） |
| 宣称电输出 | 15 kW → **75 倍超 unity** |
| 4 K 制冷所需 | ≫ 37 MW（2.8% 卡诺，Masuyama 2026） |

75 只是超 unity 的倍数，**不是卡诺极限**——4 K 是绝对温度，不是温差。

## 仓库内容

| 文件 | 作用 |
|---|---|
| `model.mjs` | 几何、材料、七步判定（所有读数的唯一来源） |
| `build.mjs` | 生成浅色/暗色两版自包含页面 |
| `sim.mjs` | 力与能量预算、缺口分析 |
| `dyn.mjs` | 时域模拟：180 s、10 ms 步长 |
| `drive-actions.json` | headless Chrome 验证脚本 |
| `proofs/` | 9 条可证定理、Lean 4 形式化、数值证书 |
| `shots/` | 验证截图（整页、电晕、滚子分段、幻方、手机） |

## 构建

构建需要 [Anatomy](https://github.com/wheresryan22/anatomy) 的绘图库：

```sh
npx skills add wheresryan22/anatomy -g -a opencode
node build.mjs --light
```

默认从 `~/.config/opencode/skills/anatomy` 读取，可用 `ANATOMY` 环境变量覆盖。已构建的页面是自包含的，打开不需要任何依赖。

## 证据与边界

- **几何与参数**：Sandberg 1985 / 1987 报告、SISRC 2003、SEGM 2022
- **早期史实**：Heerfordt 1991 调查（无火灾、无目击者、Fe-Ti 粘结磁体）
- **失重**：Roshchin–Godin 2000（唯一论文）、Morningstar 2012（复现）
- **相邻物理**：NASA 2009 离子风、Atallah & Howe 2001 磁齿轮、SKF 磁轴承、GP-B 2011、Tajmar 2024（电磁-引力耦合 null）
- **绘制取舍**：极轨按 1 mm 抽稀；滚子转速为减速显示；几何审计未接入（无管路，干涉由构造保证），线条检查 `0/165`
- 本仓库不主张反重力可行，正相反：它是一次可复核的否证

## License

MIT © 2026 everest-an

第三方：构建出的页面内联了 [Anatomy](https://github.com/wheresryan22/anatomy) 绘图库，MIT © 2026 Ryan。
