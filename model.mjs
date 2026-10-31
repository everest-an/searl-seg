export const PLATE = { x: -280, y: -280, w: 560, d: 560, r: 20 };
export const PLATE_H = 14;
export const FOOT_H = 8;
export const RING_H = 22;
export const ROLLER_R = 6;
export const ROLLER_H = 24;

export const RINGS = [
  { id: "inner", label: "内环", rIn: 60, rOut: 76, count: 12, polePitch: 1 },
  { id: "mid", label: "中环", rIn: 104, rOut: 122, count: 22, polePitch: 1 },
  { id: "outer", label: "外环", rIn: 152, rOut: 176, count: 32, polePitch: 1 },
].map((ring) => ({ ...ring, orbit: ring.rOut + 2 + ROLLER_R }));

export const DRIVE_RPM = 550;
export const CLAIMED_MPH = 250;
export const CLAIMED_MASS = 350;
export const CLAIMED_LOSS = 0.35;
export const CLAIMED_KW = 15;
export const PARTS = 2124;
export const DEMO_VOLTS = 9;
export const DEMO_WATTS = 36;
export const EHD_N_PER_KW = 50;
export const GPB_MAS_PER_YEAR = 37.2;
export const DRAWN_TICKS = 72;
export const INPUT_W = 20e3 * 0.01;
export const COP = (CLAIMED_KW * 1000) / INPUT_W;
export const CARN = 300 / 4;

const mphToMs = (mph) => mph * 0.44704;
const innerOrbit = RINGS[0].orbit * 2;
export const CLAIMED_RPM =
  (mphToMs(CLAIMED_MPH) / (Math.PI * (innerOrbit / 1000))) * 60;
export const LOST_KG = CLAIMED_MASS * CLAIMED_LOSS;
export const LOST_N = LOST_KG * 9.80665;
export const NEEDED_KW = LOST_N / 1000 / EHD_N_PER_KW;
export const INNER_POLES = Math.round((Math.PI * (RINGS[0].rOut - 3.5) * 2) / 1);
export const ION_N = (0.01 * 0.012) / 2e-4;

export const STAGES = [
  {
    key: "bearing",
    title: "磁轴承",
    verdict: "已知物理",
    detail: "滚子与环面留 2 mm 气隙，磁力支承，无接触",
  },
  {
    key: "poles",
    title: "磁极轨",
    verdict: "已知物理",
    detail: `环面双磁极轨，极距 ${RINGS[0].polePitch} mm，法拉第感应`,
  },
  {
    key: "output",
    title: "能量账",
    verdict: "无证据",
    detail: `输入 ${INPUT_W} W → 宣称 ${CLAIMED_KW} kW：${COP} 倍超 unity（4 K 是成本，不是能源）`,
  },
  {
    key: "selfrun",
    title: "自持加速",
    verdict: "无证据",
    detail: `${DRIVE_RPM} rpm 断驱动后仍加速：永磁静场无净功`,
  },
  {
    key: "corona",
    title: "高压电晕",
    verdict: "已知物理",
    detail: `20 kV 电晕风 5–50 N/kW；本几何 10 mA 仅 ${ION_N.toFixed(1)} N`,
  },
  {
    key: "weight",
    title: "失重 35%",
    verdict: "无证据",
    detail: `${CLAIMED_MASS} kg 台架减 ${LOST_KG.toFixed(1)} kg（${LOST_N.toFixed(0)} N）：1 篇论文、0 次复现`,
  },
  {
    key: "antigrav",
    title: "反重力",
    verdict: "无证据",
    detail: `参考系拖曳实测 ${GPB_MAS_PER_YEAR} mas/yr；同尺寸转子约 10⁻⁶ mas/yr，低 7 个数量级`,
  },
];

