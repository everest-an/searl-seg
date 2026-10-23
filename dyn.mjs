import { CLAIMED_MASS, DRIVE_RPM } from "./model.mjs";

const G = 9.80665;
const M = CLAIMED_MASS;
const W = M * G;
const MAGNET = 225;
const I = MAGNET * 0.12 ** 2;
const OMEGA0 = (DRIVE_RPM / 60) * Math.PI * 2;
const DT = 0.01;
const T = 180;
const MAGNETIC_J = 9e3;
const KINETIC_J = 0.5 * I * OMEGA0 ** 2;

const drag = (w) => 0.02 * w + 0.0004 * w * w;
const ion = (amps) => (amps * 0.012) / 2e-4;

function run({ drive, amps, claim, hv = true }) {
  let w = OMEGA0;
  let z = 0;
  let vz = 0;
  let stopped = null;
  let ten = null;
  let one = null;
  const trace = [];
  for (let t = 0; t < T; t += DT) {
    if (drive) w = OMEGA0;
    else {
      w = Math.max(0, w - (drag(w) / I) * DT);
      if (w < OMEGA0 * 0.1 && ten === null) ten = t;
      if (w < OMEGA0 * 0.01 && one === null) one = t;
      if (w < 1 && stopped === null) stopped = t;
    }
    const lift = (hv ? ion(amps) + 1.4 : 0) + (claim ? 1201 : 0);
    const net = lift - W;
    if (net > 0.01 || z > 0) {
      vz += (net / M) * DT;
      vz *= 1 - 0.4 * DT;
      z += vz * DT;
      if (z < 0) { z = 0; vz = 0; }
    }
    if (Math.abs(t % 2) < DT / 2) trace.push([t, w, z]);
  }
  return { stopped, ten, one, z, w, trace };
}

const cases = [
  { name: "断电、无高压", drive: false, amps: 0, claim: false, hv: false },
  { name: "驱动 550 rpm、无高压", drive: true, amps: 0, claim: false },
  { name: "20 kV、10 mA（真实电晕）", drive: true, amps: 0.01, claim: false },
  { name: "20 kV、20 A（400 kW）", drive: true, amps: 20, claim: false },
  { name: "宣称的 35% 失重", drive: true, amps: 0, claim: true },
  { name: "20 kV、57.2 A（1.14 MW）", drive: true, amps: 57.2, claim: false },
];

const pad = (text, width) => String(text).padEnd(width);
console.log("");
console.log("SEARL SEG — 时域模拟（I = 225 kg × 0.12² = 3.24 kg·m²，180 s，dt = 10 ms）");
console.log("".padEnd(84, "─"));
console.log(`${pad("工况", 30)} ${pad("升至", 12)} ${pad("最终", 12)} 结论`);
const results = cases.map((item) => ({ item, out: run(item) }));
for (const { item, out } of results) {
  const lift = (item.hv === false ? 0 : ion(item.amps) + 1.4) + (item.claim ? 1201 : 0);
  console.log(`${pad(item.name, 30)} ${pad(lift.toFixed(1) + " N", 12)} ${pad((out.z).toFixed(2) + " m", 12)} ${lift > W ? "离地" : "未离地"}`);
}
console.log("".padEnd(84, "─"));
const at60 = results[0].out.trace.find(([t]) => t >= 60);
console.log(`断电 60 s 后转速               ${(at60[1] * 60 / (2 * Math.PI)).toFixed(0)} rpm`);
console.log(`断电后降到 10% 转速            ${results[0].out.ten === null ? ">180" : results[0].out.ten.toFixed(1)} s`);
console.log(`悬停所需电流                  ${(W / 60).toFixed(1)} A @ 20 kV = ${((W / 60) * 20e3 / 1e6).toFixed(2)} MW`);
console.log(`转子总储能                    磁 ${(MAGNETIC_J / 1000).toFixed(0)} kJ + 动 ${(KINETIC_J / 1000).toFixed(1)} kJ = ${((MAGNETIC_J + KINETIC_J) / 1000).toFixed(1)} kJ`);
console.log(`全部储能可抬升                 ${((MAGNETIC_J + KINETIC_J) / W).toFixed(1)} m（然后自由落体）`);
console.log(`传闻中的 50 ft（15.2 m）需要    ${(15.24 * W / 1000).toFixed(0)} kJ，是总储能的 ${(15.24 * W / (MAGNETIC_J + KINETIC_J)).toFixed(1)} 倍`);
console.log(`15 kW 输出 60 s 需要            ${(15e3 * 60 / 1000).toFixed(0)} kJ，是总储能的 ${(15e3 * 60 / (MAGNETIC_J + KINETIC_J)).toFixed(0)} 倍`);
console.log("".padEnd(84, "─"));

const trace = results[0].out.trace;
const rows = 9;
const cols = 60;
const peak = trace[0][1];
const grid = Array.from({ length: rows }, () => Array(cols).fill(" "));
trace.forEach(([, w], index) => {
  const x = Math.min(cols - 1, Math.floor((index / trace.length) * cols));
  const y = rows - 1 - Math.floor((w / peak) * (rows - 1));
  grid[y][x] = "●";
});
console.log("断电后的转速（每列 3 s，纵轴 0–550 rpm）");
for (const line of grid) console.log("  " + line.join(""));
console.log(`  0 s${" ".repeat(38)}60 s`);
console.log("");
console.log(`结论：没有驱动时，转子在 ${results[0].out.stopped.toFixed(0)} 秒内停转；所有真实电晕电流给出的升力都小于 1 N；`);
console.log("      即使宣称的 35% 为真，也仍差 2231 N 才离地。要悬停需要 1.14 MW 的电晕功率。");
