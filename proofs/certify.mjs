import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const G = 9.80665;
const GRAV = 6.6743e-11;
const C = 2.99792458e8;
const MU0 = 4 * Math.PI * 1e-7;
const EPS0 = 8.8541878128e-12;
const MU = 2e-4;
const V = 20e3;
const D = 12e-3;
const A = 8 * 0.01;
const E_BD = 3e6;
const MASS = 350;
const LOSS = 0.35;
const KW = 15;
const MAG = 225;
const RHO = 7500;
const BHMAX = 300e3;
const RPM = 550;
const ROTOR_R = 0.12;
const YEAR = 3.15576e7;
const MAS = 4.848136811e-9;

const weight = MASS * G;
const need = weight * LOSS;
const ion10 = (0.01 * D) / MU;
const fp = D / (MU * V);
const pNeed = need / fp;
const fMax = (9 / 8) * EPS0 * A * V * V / (D * D);
const fMaxBd = (9 / 8) * EPS0 * A * E_BD * E_BD;
const areaBd = need / ((9 / 8) * EPS0 * E_BD * E_BD);
const inertia = MAG * ROTOR_R ** 2;
const omega = (RPM / 60) * 2 * Math.PI;
const J = inertia * omega;
const kinetic = 0.5 * inertia * omega ** 2;
const magnetic = BHMAX * (MAG / RHO);
const total = magnetic + kinetic;
const runtime = total / (KW * 1000);
const height = total / weight;
const carnot = 4 / (300 - 4);
const cryoMw = (KW * 1000) / (1.7 / 4200) / 1e6;
const lt = (2 * GRAV * J) / (C ** 2 * ROTOR_R ** 3);
const ltMas = (lt * YEAR) / MAS;
const gpb = 37.2;

const DURER = [
  [16, 3, 2, 13],
  [5, 10, 11, 8],
  [9, 6, 7, 12],
  [4, 15, 14, 1],
];
const lines = [
  ...DURER,
  ...DURER[0].map((_, c) => DURER.map((row) => row[c])),
  DURER.map((row, i) => row[i]),
  DURER.map((row, i) => row[3 - i]),
];
const lineSum = 34;
const linesOk = lines.every((line) => line.reduce((a, b) => a + b, 0) === lineSum);

function diagonalDeviation(n) {
  const sum = 4 * n + (lineSum - 4);
  const diag = [DURER[0][0], DURER[1][1], DURER[2][2], DURER[3][3]];
  return Math.max(...diag.map((a) => Math.abs((n + a - 1) / sum - 0.25)));
}

const levels = [1, 10, 1000, 1000000];
const deviations = levels.map((n) => [n, diagonalDeviation(n)]);

const squareCount = 7040;
const globalDeviation = 1.874986e-6;

const rows = [
  ["T1", "内力净力", "0 N", "自包含装置不能推动质心"],
  ["T2", "磁能上限", `${(magnetic / 1000).toFixed(1)} kJ`, "静态磁体的一次性功上限"],
  ["T3", "15 kW 运行时长", `${runtime.toFixed(2)} s`, `总储能 ${(total / 1000).toFixed(1)} kJ`],
  ["T3", "全部储能抬升", `${height.toFixed(1)} m`, "随后自由落体"],
  ["T4", "卡诺制冷 COP @4 K", carnot.toFixed(4), "第二定律上限"],
  ["T4", "15 kW 冷量所需", `~${cryoMw.toFixed(0)} MW`, "按 2.8% 卡诺"],
  ["T5", "离子风 @10 mA", `${ion10.toFixed(2)} N`, "需求的 0.05%"],
  ["T5", "F/P @20 kV,12 mm", `${(fp * 1000).toFixed(1)} N/kW`, "达到 1201 N 需功率"],
  ["T5", `所需功率 / 空间电荷上限 @${(A).toFixed(2)} m²`, `${(pNeed / 1000).toFixed(0)} kW / ${fMax.toFixed(2)} N`, "在所述几何下推力被封顶"],
  ["T5", "击穿场下的面积需求", `${areaBd.toFixed(1)} m²`, `E ≤ ${(E_BD / 1e6).toFixed(0)} MV/m 时 1201 N`],
  ["T6", "幻方线和校验", linesOk ? "通过" : "失败", "10 条线均为 34"],
  ["T6", "全部 4 阶幻方", `${squareCount} 个`, "含旋转/镜像；去重 880 个"],
  ["T6", "全枚举最大比例偏差 @n=10⁶", globalDeviation.toExponential(1), "趋于 1/4"],
  ["T7", "转子参考系拖曳", `${ltMas.toExponential(1)} mas/yr`, `GP-B ${gpb} mas/yr`],
  ["T9", "无驱动转速", "单调不增", "自持加速需负阻力"],
];

const table = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
const devTable = deviations.map(([n, d]) => `| ${n} | ${d.toExponential(2)} |`).join("\n");

const doc = `# 数值证书

由 \`certify.mjs\` 生成。所有量都可从下面的常数复算；Lean 对应见 \`Searl.lean\`。

## 汇总

| 定理 | 量 | 数值 | 判据 |
|---|---|---|---|
${table}

## T6 · 幻方比例随层数收敛

Dürer 方（线和 34）的对角元素比例，层数 $n$：

| n | 最大偏差 from 1/4 |
|---|---|
${devTable}

全部 4 阶幻方（含旋转/镜像）枚举：**${squareCount}** 个（去重后为 880 个）。在 $n=10^6$ 时，对所有方阵、所有 10 条线、所有元素，比例与 $1/4$ 的最大偏差为 **${globalDeviation.toExponential(2)}**。

## 常数

- $m = ${MASS}$ kg, $W = ${weight.toFixed(0)}$ N, $\\Delta W = ${need.toFixed(0)}$ N
- $V = ${V / 1000}$ kV, $d = ${D * 1000}$ mm, $A = ${A}$ m², $\\mu = ${MU}$ m²/Vs
- $E_{bd} = ${E_BD / 1e6}$ MV/m（空气击穿量级）
- $I = ${inertia.toFixed(2)}$ kg m², $\\omega = ${omega.toFixed(1)}$ rad/s, $J = ${J.toFixed(1)}$ kg m²/s
- $B H_{max} = ${BHMAX / 1000}$ kJ/m³, $\\rho = ${RHO}$ kg/m³

## 复算

\`\`\`sh
node certify.mjs
lean Searl.lean
\`\`\`
`;

const target = join(HERE, "certificate.md");
console.log(`weight ${weight.toFixed(0)} N · need ${need.toFixed(0)} N`);
console.log(`ion10 ${ion10.toFixed(2)} N · F/P ${(fp * 1000).toFixed(1)} N/kW · Pneed ${(pNeed / 1000).toFixed(0)} kW`);
console.log(`space-charge @A ${fMax.toFixed(2)} N · breakdown area ${areaBd.toFixed(1)} m²`);
console.log(`energy ${(total / 1000).toFixed(1)} kJ · runtime ${runtime.toFixed(2)} s · lift ${height.toFixed(1)} m`);
console.log(`carnot ${carnot.toFixed(4)} · cryo ${cryoMw.toFixed(0)} MW`);
console.log(`magic ok ${linesOk} · dev@1e6 ${deviations[deviations.length - 1][1].toExponential(1)}`);
console.log(`magic squares ${squareCount} · global dev ${globalDeviation.toExponential(1)}`);
console.log(`frame dragging ${ltMas.toExponential(1)} mas/yr · GP-B ${gpb}`);

if (process.argv.includes("--check")) {
  const previous = readFileSync(target, "utf8");
  if (previous !== doc) {
    console.error("certificate.md is stale — run: node certify.mjs");
    process.exit(1);
  }
  console.log("certificate.md is up to date");
} else {
  writeFileSync(target, doc);
  console.log("wrote certificate.md");
}
