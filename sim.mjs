import { RINGS, CLAIMED_MASS, CLAIMED_LOSS, CLAIMED_KW, DRIVE_RPM, PARTS } from "./model.mjs";

const G = 9.80665;
const MU0 = 4 * Math.PI * 1e-7;
const EPS0 = 8.8541878128e-12;
const RHO = 7500;
const BHMAX = 300e3;
const MU_ION = 2e-4;
const HV = 20e3;
const GAP = 12e-3;
const PIN_AREA = 8 * 0.01;
const MAGNET_MASS = 225;
const ROTOR_R = 0.12;
const EARTH_J = 5.9e33;
const GPB_MAS = 37.2;
const GRAV_LT = 6.6743e-11;
const C_LT = 2.99792458e8;
const YEAR_S = 3.15576e7;
const MAS_RAD = 4.848136811e-9;

const weight = CLAIMED_MASS * G;
const need = weight * CLAIMED_LOSS;
const omega = (DRIVE_RPM / 60) * Math.PI * 2;
const inertia = MAGNET_MASS * ROTOR_R ** 2;
const kinetic = 0.5 * inertia * omega ** 2;
const magnetic = BHMAX * (MAGNET_MASS / RHO);
const momentum = inertia * omega;

const ion = (amps) => (amps * GAP) / MU_ION;
const ionNeeded = (need * MU_ION) / GAP;
const ionWatts = HV * ionNeeded;
const field = HV / 10e-3;
const esForce = 0.5 * EPS0 * field ** 2 * PIN_AREA;
const precession = ((2 * GRAV_LT * momentum) / (C_LT ** 2 * ROTOR_R ** 3)) * (YEAR_S / MAS_RAD);
const steel = (distance, area) => {
  const b = Math.min((1e-7 * 2.4e4) / distance ** 3, 0.4);
  return (b * b * area) / (2 * MU0);
};
const spinDown = (watts) => kinetic / watts;

const rows = [
  { name: "需求：35% 失重", value: need, unit: "N", note: `${CLAIMED_MASS} kg × 35%` },
  { name: "离子风 @20 kV, 10 mA", value: ion(0.01), unit: "N", note: `${(ion(0.01) / need * 100).toFixed(3)}% of need` },
  { name: "离子风 @20 kV, 1 A", value: ion(1), unit: "N", note: `${(ion(1) / need * 100).toFixed(1)}% of need` },
  { name: "静电力 @20 kV", value: esForce, unit: "N", note: `${(esForce / need * 100).toFixed(3)}% of need` },
  { name: "转子磁能", value: magnetic / 1000, unit: "kJ", note: `${(magnetic / (CLAIMED_KW * 1000)).toFixed(2)} s at 15 kW` },
  { name: "转子动能", value: kinetic / 1000, unit: "kJ", note: `${(kinetic / (CLAIMED_KW * 1000)).toFixed(2)} s at 15 kW` },
  { name: "钢构件吸引 @0.3 m", value: steel(0.3, 0.05), unit: "N", note: "0.05 m² rebar / frame" },
  { name: "钢构件吸引 @0.1 m", value: steel(0.1, 0.02), unit: "N", note: "0.02 m² bench steel" },
];

const pad = (text, width) => String(text).padEnd(width);
console.log("");
console.log("SEARL SEG — 力与能量预算（按 Roshchin–Godin 几何：1 m 环、225 kg 磁体、350 kg 台架）");
console.log("".padEnd(78, "─"));
for (const row of rows) {
  console.log(`${pad(row.name, 24)} ${pad(row.value.toFixed(row.value < 1 ? 3 : 0), 10)} ${pad(row.unit, 5)} ${row.note}`);
}
console.log("".padEnd(78, "─"));
console.log(`反重力需求            ${need.toFixed(0)} N`);
console.log(`离子风若要达标         ${ionNeeded.toFixed(1)} A @ 20 kV = ${(ionWatts / 1000).toFixed(0)} kW`);
console.log(`系统总重              ${weight.toFixed(0)} N`);
console.log(`无驱动自转时长         ${spinDown(150).toFixed(0)} s（150 W 损耗）`);
console.log(`实验参考系拖曳         ${precession.toExponential(1)} mas/yr（GP-B ${GPB_MAS}）`);
console.log(`转子角动量            ${momentum.toFixed(0)} kg·m²/s（地球 ${(EARTH_J / 1e30).toFixed(0)}×10³⁰）`);
console.log("".padEnd(78, "─"));

const bars = [
  { name: "需求", value: need },
  { name: "离子风 10 mA", value: ion(0.01) },
  { name: "离子风 1 A", value: ion(1) },
  { name: "静电力", value: esForce },
  { name: "钢 @0.3 m", value: steel(0.3, 0.05) },
  { name: "钢 @0.1 m", value: steel(0.1, 0.02) },
];
const lo = -3;
const hi = 4;
console.log("（对数刻度：10⁻³ → 10⁴ N，每格约 0.15 个数量级）");
for (const bar of bars) {
  const decades = Math.max(0, Math.min(1, (Math.log10(bar.value) - lo) / (hi - lo)));
  const width = Math.round(decades * 46);
  console.log(`${pad(bar.name, 14)} ${"█".repeat(width)}${"·".repeat(46 - width)} ${bar.value.toFixed(bar.value < 1 ? 3 : 0)} N`);
}
console.log("");
console.log("结论：滚子与环之间的磁力是内力，整机净力恒为零（牛顿第三定律）；只有外力能移动它。");
console.log("      没有任何内部机制能在该几何下产生 10² N 级升力；唯一达到该量级的外力是磁体对建筑钢构");
console.log("      的吸引——方向指向地面/台架，且随磁极图案旋转而波动，足以污染弹簧式称重读数。");

const C = 2.99792458e8;
const HBAR = 1.054571817e-34;
const GRAV = 6.6743e-11;
const u10T = 100 / (2 * MU0);
const g10T = (2 * Math.PI * GRAV * u10T) / C ** 2;
const bFor1g = 10 * Math.sqrt(G / g10T);
const uFor1g = (G * C ** 2) / (2 * Math.PI * GRAV);
const casimir = (d) => (Math.PI ** 2 * HBAR * C) / (720 * d ** 4);
const ehdKw = weight / 50;
const ionMw = (weight * 29430) / (2 * 0.6) / 1e6;
const photonGw = (weight * C) / 2 / 1e9;
const helium = CLAIMED_MASS / 1.06;

console.log("");
console.log("要实现它，缺的是什么");
console.log("".padEnd(78, "─"));
console.log(`电磁场→引力的耦合          G/c⁴ ≈ ${(GRAV / C ** 4).toExponential(1)} m/J（每焦耳只产生这么多曲率）`);
console.log(`10 T / 1 m 场给出的加速度   ${g10T.toExponential(1)} m/s²（${(g10T / G).toExponential(1)} g）`);
console.log(`要凑出 1 g 需要的场强       ${bFor1g.toExponential(1)} T（磁星量级）`);
console.log(`要凑出 1 g 需要的能量密度   ${uFor1g.toExponential(1)} J/m³`);
console.log(`Casimir 负能量 @10 nm      -${casimir(1e-8).toExponential(1)} J/m³（差 ${(uFor1g / casimir(1e-8)).toExponential(1)} 倍）`);
console.log(`等价原理上限               |Δa|/a < 10⁻¹⁵（任何新耦合必须低于此值）`);
console.log("".padEnd(78, "─"));
console.log(`真正让 350 kg 悬停的代价：`);
console.log(`  电晕风（空气中）         ${ehdKw.toFixed(0)} kW，且离开空气即失效`);
console.log(`  离子推进（Isp 3000 s）   ${ionMw.toFixed(0)} MW，还要带工质`);
console.log(`  光子火箭                 ${photonGw.toFixed(0)} GW`);
console.log(`  磁悬浮（需钢/导体轨道）   kW 级，3.4 kN 是磁悬浮列车的日常量级`);
console.log(`  氦气浮力                 ${helium.toFixed(0)} m³ 氦气`);
console.log("".padEnd(78, "─"));
console.log("缺口不在零件：磁体、线圈、20 kV 电源都真实存在。缺的是一条把电磁场接到引力场的通道——");
console.log("现有物理里这条通道的强度是 G/c⁴，比需要的弱 10¹⁹ 倍；而任何「屏蔽引力」的方案还需要负能量。");
