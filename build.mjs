import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  PLATE,
  PLATE_H,
  FOOT_H,
  RING_H,
  ROLLER_R,
  ROLLER_H,
  RINGS,
  DRIVE_RPM,
  STAGES,
  DRAWN_TICKS,
  INPUT_W,
  CLAIMED_KW,
} from "./model.mjs";

const ANATOMY = process.env.ANATOMY ?? "C:/Users/ASUS/.config/opencode/skills/anatomy";
const k = await import(pathToFileURL(join(ANATOMY, "kit/iso-kit.mjs")).href);
const G = await import(pathToFileURL(join(ANATOMY, "kit/lathe.mjs")).href);
const { kitScript } = await import(pathToFileURL(join(ANATOMY, "scripts/inline-kit.mjs")).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 650;
const HEIGHT = 470;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PLATE.x, PLATE.y, 78], [PLATE.x + PLATE.w, PLATE.y + PLATE.d, 78]],
  WIDTH,
  HEIGHT,
  { pad: 40, azimuth: 45, elevation: 30 },
);

const F = G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const RING_TOP = theme === "light" ? "var(--anatomy-shade-0)" : "var(--anatomy-lit-top)";
const ROLLER_FILL = theme === "light" ? "var(--anatomy-shade-1)" : "var(--anatomy-face)";
const ROLLER_TOP = theme === "light" ? "var(--anatomy-shade-1)" : "var(--anatomy-lit-top)";
const ROLLER_SHADE = theme === "light" ? "var(--anatomy-shade-0)" : "var(--anatomy-lit-shade)";
const ACTIVE_FILL = theme === "light" ? "var(--anatomy-shade-0)" : "var(--anatomy-shade-3)";
const ACTIVE_TOP = theme === "light" ? "var(--anatomy-shade-1)" : "var(--anatomy-top)";
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

const CABINET = { x: 158, y: -244, w: 104, d: 70 };
const CAB_H = 76;
const GAUGE = [CABINET.x + CABINET.w / 2, CABINET.y + CABINET.d / 2];
const GAUGE_Z = CAB_H + 0.15;
const GAUGE_R = 22;
const COUPON = { cx: -205, cy: -205 };
const COIL_COUNT = 8;
const HV_R = 230;
const HV_Z = 40;

const needleAt = (rpm) => {
  const angle = (-135 + 270 * Math.min(1, Math.max(0, rpm / 600))) * (Math.PI / 180);
  const [cx, cy] = GAUGE;
  return k.lineOnTop(
    [cx + Math.sin(angle) * 2.4, cy - Math.cos(angle) * 2.4],
    [cx + Math.sin(angle) * (GAUGE_R - 3), cy - Math.cos(angle) * (GAUGE_R - 3)],
    GAUGE_Z,
    P,
  );
};

function hub() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 30, 0, 5, P, 64, 0.6), { tone: "lo", crease: "mid" }));
  out.push(S(k.cylinder(0, 0, 20, 5, 15, P, 48, 0.6), { tone: "mid", crease: "mid" }));
  out.push(L(k.ring(0, 0, 8, 20, P, 32), { tone: "mid" }));
  out.push(L(k.ring(0, 0, 3.4, 20, P, 24), { tone: "lo" }));
  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2;
    out.push(D([at([Math.cos(angle) * 14, Math.sin(angle) * 14, 20])], { size: 0.45, tone: "lo" }));
  }
  return out.join("");
}

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 40)) {
    out.push(S(k.cylinder(x, y, 10, -PLATE_H - FOOT_H, FOOT_H, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 7.4, -PLATE_H - 1, 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 7), 0, P), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 14), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 18);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.6, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  out.push(L(k.ring(0, 0, 192, 0.25, P, 140), { tone: "faint" }));
  for (const radius of [96, 140, 192]) {
    out.push(L(k.ring(0, 0, radius, 0.4, P, 140), { tone: "faint" }));
  }
  out.push(hub());
  const square = { x: -21, y: 236, w: 42, d: 42, r: 2 };
  out.push(S(k.slabOf(square, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(square, 2), 0.8, P), { tone: "faint" }));
  const cell = 9.5;
  out.push(
    L(
      [1, 2, 3]
        .map((index) => {
          const offset = 2 + index * cell;
          return (
            k.lineOnTop([square.x + 2, square.y + offset], [square.x + 40, square.y + offset], 0.82, P) +
            k.lineOnTop([square.x + offset, square.y + 2], [square.x + offset, square.y + 40], 0.82, P)
          );
        })
        .join(""),
      { tone: "faint", free: true },
    ),
  );
  const magic = [16, 3, 2, 13, 5, 10, 11, 8, 9, 6, 7, 12, 4, 15, 14, 1];
  for (let index = 0; index < 16; index++) {
    const cx = square.x + 2 + (index % 4) * cell + cell / 2;
    const cy = square.y + 2 + Math.floor(index / 4) * cell + cell / 2;
    out.push(k.faceTextSvg(k.topMatrix([cx, cy], 0.86, P, "x"), String(magic[index]), { size: 3.4, tone: "mid", anchor: "middle" }));
  }
  return out.join("");
}

function rings() {
  const out = [];
  RINGS.forEach((ring) => {
    out.push(`<g data-ring="${ring.id}">`);
    out.push(`<path d="${k.ring(0, 0, ring.rOut + 4, 0.12, P, 140)}" fill="var(--anatomy-halo)" opacity="var(--anatomy-halo-opacity)" filter="blur(6px)"/>`);
    out.push(S(G.ringBand(0, RING_H, ring.rIn, ring.rOut, F, P, { steps: 180 }), { tone: "mid", crease: "mid" }));
    out.push(`<path d="${k.ring(0, 0, ring.rOut, RING_H, P, 180)}${k.ring(0, 0, ring.rIn, RING_H, P, 180)}" fill-rule="evenodd" fill="${RING_TOP}" stroke="none"/>`);
    out.push(L(G.circleOf(F, RING_H, ring.rOut, P, 180), { tone: "mid" }));
    out.push(L(G.circleOf(F, RING_H, ring.rIn, P, 180), { tone: "mid" }));
    out.push(L(G.circleOf(F, RING_H, ring.rOut - 1.6, P, 180), { tone: "faint" }));
    out.push(L(G.circleOf(F, RING_H, ring.rIn + 1.6, P, 180), { tone: "faint" }));
    for (const track of [ring.rOut - 4.2, ring.rOut - 11.4]) {
      const ticks = k.radialTicks(0, 0, track + 1.2, DRAWN_TICKS, 6, RING_H + 0.14, [1.6, 2.8], P);
      out.push(L(ticks.minor, { tone: "lo", free: true }));
      out.push(L(ticks.major, { tone: "mid", free: true }));
    }
    out.push(L(k.ring(0, 0, ring.orbit, 0.35, P, 170), { tone: "faint", dashed: true }));
    out.push("</g>");
  });
  return out.join("");
}

function rollers() {
  const out = [];
  RINGS.forEach((ring) => {
    for (let index = 0; index < ring.count; index++) {
      const base = (index / ring.count) * Math.PI * 2;
      const x = ring.orbit * Math.cos(base);
      const y = ring.orbit * Math.sin(base);
      const body = [
        S(k.cylinder(x, y, ROLLER_R, 0, ROLLER_H, P, 26, 0.5), { tone: "mid", crease: "mid" }),
        ...Array.from({ length: 7 }, (_, seam) =>
          L(k.ring(x, y, ROLLER_R - 1.5, ((seam + 1) * ROLLER_H) / 8, P, 20), { tone: "faint" }),
        ),
        L(k.ring(x, y, ROLLER_R - 1.5, ROLLER_H, P, 20), { tone: "faint" }),
        D([at([x, y, ROLLER_H])], { size: 0.42, tone: "hi" }),
      ].join("");
      out.push(
        `<g data-roll="${ring.id}" data-orbit="${ring.orbit}" data-base="${base}" transform="${k.translateAlong(P, [0, 0, 0])}">${body}</g>`,
      );
    }
  });
  return out.join("");
}

const pointAt = (angle, radius, z) => [Math.cos(angle) * radius, Math.sin(angle) * radius, z];

function coils() {
  const out = [];
  for (let index = 0; index < COIL_COUNT; index++) {
    const angle = (index / COIL_COUNT) * Math.PI * 2 + Math.PI / COIL_COUNT;
    const radial = [Math.cos(angle), Math.sin(angle), 0];
    const tangent = [-Math.sin(angle), Math.cos(angle), 0];
    const frame = G.frameOf([0, 0, 0], [0, 0, 1], tangent, radial);
    out.push(`<g data-coil="${index}">`);
    out.push(S(G.prismOf(frame, [[-12, 198], [12, 198], [12, 222], [-12, 222]], 0, 3, P), { tone: "lo", crease: "mid" }));
    out.push(S(G.prismOf(frame, [[-11, 196], [11, 196], [11, 216], [-11, 216]], 3, 9, P), { tone: "mid", crease: "mid" }));
    out.push(S(G.prismOf(frame, [[-11, 196], [11, 196], [11, 216], [-11, 216]], 21, 27, P), { tone: "mid", crease: "mid" }));
    out.push(S(G.prismOf(frame, [[-11, 216], [11, 216], [11, 222], [-11, 222]], 3, 27, P), { tone: "mid", crease: "mid" }));
    out.push(S(G.prismOf(frame, [[-10, 219], [10, 219], [10, 229], [-10, 229]], 6, 8, P), { tone: "lo", crease: "mid" }));
    out.push(S(G.prismOf(frame, [[-10, 219], [10, 219], [10, 229], [-10, 229]], 22, 24, P), { tone: "lo", crease: "mid" }));
    out.push(S(G.prismOf(frame, [[-8, 222], [8, 222], [8, 227.5], [-8, 227.5]], 8, 22, P), { tone: "hi", crease: "mid" }));
    const ribs = [10, 13, 16, 19].map((z) => {
      const from = pointAt(angle, 227.7, z);
      const to = [from[0] - Math.sin(angle) * 8, from[1] + Math.cos(angle) * 8, z];
      return k.segment(from, to, P);
    });
    out.push(L(ribs.join(""), { tone: "lo" }));
    out.push(D([at(pointAt(angle, 210, 27))], { size: 0.45, tone: "lo" }));
    out.push(D([at(pointAt(angle, 206, 3.1)), at(pointAt(angle, 214, 3.1))], { size: 0.35, tone: "lo" }));
    out.push("</g>");
  }
  return out.join("");
}

function corona() {
  const out = [];
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 4;
    const tip = [Math.cos(angle) * 202, Math.sin(angle) * 202, 26];
    const side = [-Math.sin(angle), Math.cos(angle)];
    out.push(`<g class="corona">`);
    const [sx, sy] = at(tip);
    out.push(`<ellipse cx="${sx}" cy="${sy}" rx="14" ry="9" fill="var(--anatomy-blue)" opacity=".22" style="filter:blur(3.5px)"/>`);
    out.push(D([at(tip)], { size: 1.1, tone: "hi", pulse: true }));
    for (const spread of [-11, -5.5, 0, 5.5, 11]) {
      const to = [Math.cos(angle) * 179 + side[0] * spread, Math.sin(angle) * 179 + side[1] * spread, 26];
      out.push(L(k.segment(tip, to, P), { tone: "blue", flow: true, free: true }).replace('class="iso-line', 'style="stroke-width:1.1" class="iso-line'));
    }
    out.push(`</g>`);
  }
  return out.join("");
}

function highVoltage() {
  const out = [];
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * HV_R;
    const y = Math.sin(angle) * HV_R;
    out.push(S(k.cylinder(x, y, 4.4, 0, 3, P, 16), { tone: "lo", crease: "mid" }));
    out.push(S(k.cylinder(x, y, 2.2, 3, 24, P, 16), { tone: "mid", crease: "mid" }));
    for (const z of [8, 14, 20]) {
      out.push(L(k.ring(x, y, 2.7, z, P, 14), { tone: "lo" }));
    }
    out.push(S(k.cylinder(x, y, 3.6, 27, 2.4, P, 16), { tone: "lo", crease: "mid" }));
    const tip = [Math.cos(angle) * 202, Math.sin(angle) * 202, 26];
    out.push(L(k.segment([x, y, 26], tip, P), { tone: "mid" }));
    out.push(D([at(tip)], { size: 0.65, tone: "hi" }));
    out.push(D([at([x, y, 29.4])], { size: 0.4, tone: "lo" }));
  }
  out.push(L(k.ring(0, 0, HV_R, 1.2, P, 180), { tone: "lo" }));
  const bases = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 4;
    return at([Math.cos(angle) * HV_R, Math.sin(angle) * HV_R, 1.2]);
  });
  out.push(D(bases, { size: 0.4, tone: "lo" }));
  return out.join("");
}

function cabinet() {
  const out = [];
  out.push(S(k.slabOf(CABINET, 0, CAB_H, P, 6, 1), { tone: "mid" }));
  out.push(`<path d="${k.planOutline(k.insetPlan(CABINET, 3.5), CAB_H, P)}" fill="${RING_TOP}" stroke="none"/>`);
  out.push(L(k.planOutline(k.insetPlan(CABINET, 6), CAB_H, P), { tone: "faint" }));
  const face = CABINET.y + CABINET.d;
  out.push(
    L(
      [
        k.segment([CABINET.x + 10, face, 9], [CABINET.x + CABINET.w - 10, face, 9], P),
        k.segment([CABINET.x + 10, face, 56], [CABINET.x + CABINET.w - 10, face, 56], P),
        k.segment([CABINET.x + 10, face, 9], [CABINET.x + 10, face, 56], P),
        k.segment([CABINET.x + CABINET.w - 10, face, 9], [CABINET.x + CABINET.w - 10, face, 56], P),
      ].join(""),
      { tone: "faint", free: true },
    ),
  );
  out.push(L([12, 20, 28].map((z) => k.segment([CABINET.x + 10, face, z], [CABINET.x + CABINET.w - 10, face, z], P)).join(""), { tone: "faint" }));
  const screws = k.corners(CABINET, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, CAB_H, P, 12)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, CAB_H])), { size: 0.38 }));
  const [cx, cy] = GAUGE;
  out.push(L(k.ring(cx, cy, GAUGE_R + 3, CAB_H + 0.05, P, 72), { tone: "mid" }));
  out.push(L(k.ring(cx, cy, GAUGE_R, CAB_H + 0.05, P, 72), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, GAUGE_R - 1, CAB_H + 0.05, P, 64), { tone: "faint" }));
  const ticks = k.radialTicks(cx, cy, GAUGE_R - 2, 24, 6, CAB_H + 0.12, [1.2, 2.6], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "mid" }));
  const redline = [];
  for (let step = 0; step <= 10; step++) {
    const angle = (81 + (step / 10) * 54) * (Math.PI / 180);
    redline.push([cx + Math.sin(angle) * (GAUGE_R + 0.4), cy - Math.cos(angle) * (GAUGE_R + 0.4)]);
  }
  out.push(L(k.pathOf(redline.map(([x, y]) => at([x, y, CAB_H + 0.1]))), { tone: "hi" }));
  out.push(L(k.ring(cx, cy, 1.8, GAUGE_Z, P, 16), { tone: "mid" }));
  out.push(`<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(DRIVE_RPM)}" style="stroke-width:1.2"/>`);
  const plate = { x: CABINET.x + 8, y: CABINET.y + 8, w: 36, d: 15, r: 1.5 };
  out.push(S(k.slabOf(plate, CAB_H, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([3, 7, 11].map((y) => k.lineOnTop([plate.x + 3, plate.y + y], [plate.x + plate.w - 3, plate.y + y], CAB_H + 0.8, P)).join(""), { tone: "faint", free: true }));
  return out.join("");
}

function supply() {
  const out = [];
  const box = { x: -256, y: 172, w: 92, d: 62 };
  const [cx, cy] = [box.x + box.w / 2, box.y + box.d / 2];
  out.push(S(k.slabOf(box, 0, 56, P, 6, 1), { tone: "mid" }));
  out.push(`<path d="${k.planOutline(k.insetPlan(box, 3.5), 56, P)}" fill="${RING_TOP}" stroke="none"/>`);
  out.push(L(k.planOutline(k.insetPlan(box, 5), 56, P), { tone: "faint" }));
  out.push(L(k.ring(cx, cy, 17, 56.05, P, 48), { tone: "mid" }));
  out.push(L(k.ring(cx, cy, 14, 56.05, P, 48), { tone: "faint" }));
  const ticks = k.radialTicks(cx, cy, 12.5, 12, 3, 56.12, [1.2, 2.4], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "mid" }));
  out.push(`<path class="iso-line" data-tone="mid" d="${k.lineOnTop([cx, cy], [cx + 10, cy - 5], 56.2, P)}" style="stroke-width:1.1"/>`);
  out.push(L(k.ring(cx, cy, 1.6, 56.2, P, 16), { tone: "mid" }));
  for (const dx of [-27, 27]) {
    out.push(S(k.cylinder(cx + dx, cy + 16, 5.4, 56, 9, P, 20), { tone: "lo", crease: "mid" }));
    out.push(L(k.ring(cx + dx, cy + 16, 3.2, 65, P, 16), { tone: "mid" }));
    out.push(D([at([cx + dx, cy + 16, 65])], { size: 0.5, tone: "hi" }));
  }
  out.push(S(k.cylinder(box.x + 10, box.y + 10, 3.2, 56, 4, P, 16), { tone: "lo" }));
  out.push(D(k.corners(box, 8).map(([x, y]) => at([x, y, 56])), { size: 0.4, tone: "lo" }));
  const port = [box.x + 14, box.y + 6, 1.4];
  const post = [Math.cos((3 * Math.PI) / 4) * HV_R, Math.sin((3 * Math.PI) / 4) * HV_R, 1.4];
  out.push(L(k.segment(port, post, P), { tone: "mid" }));
  out.push(D([at(port), at(post)], { size: 0.55, tone: "hi" }));
  return out.join("");
}

function rack() {
  const out = [];
  const box = { x: 165, y: 178, w: 80, d: 54 };
  out.push(S(k.slabOf(box, 0, 14, P, 5, 0.8), { tone: "lo" }));
  out.push(`<path d="${k.planOutline(k.insetPlan(box, 3), 14, P)}" fill="${RING_TOP}" stroke="none"/>`);
  out.push(L(k.planOutline(k.insetPlan(box, 6), 14, P), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(box, 10), 14, P), { tone: "faint" }));
  for (const dx of [-24, 0, 24]) {
    const x = box.x + box.w / 2 + dx;
    const y = box.y + box.d / 2 + 2;
    out.push(S(k.cylinder(x, y, ROLLER_R, 14, ROLLER_H, P, 26, 0.5), { tone: "mid", crease: "mid" }));
    out.push(L(k.ring(x, y, ROLLER_R - 1.5, 14 + ROLLER_H, P, 20), { tone: "faint" }));
    out.push(D([at([x, y, 14 + ROLLER_H])], { size: 0.42, tone: "hi" }));
  }
  return out.join("");
}

function coupon() {
  const out = [];
  const frame = G.frameOf([COUPON.cx, COUPON.cy, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const plinth = { x: COUPON.cx - 29, y: COUPON.cy - 29, w: 58, d: 58, r: 3 };
  out.push(S(k.slabOf(plinth, 0, 8, P, 6, 0.8), { tone: "mid" }));
  out.push(L(G.circleOf(frame, 8, 30, P, 64), { tone: "faint" }));
  out.push(S(G.disc(8, 11.5, 5, frame, P), { tone: "hi" }));
  out.push(S(G.ringBand(8, 11.5, 5, 9.5, frame, P), { tone: "mid" }));
  out.push(S(G.ringBand(8, 11.5, 9.5, 13.5, frame, P), { tone: "lo" }));
  out.push(S(G.ringBand(8, 11.5, 13.5, 17, frame, P), { tone: "hi" }));
  for (const radius of [5, 9.5, 13.5, 17]) {
    out.push(L(G.circleOf(frame, 11.5, radius, P, 64), { tone: "faint" }));
  }
  out.push(D([at([COUPON.cx, COUPON.cy, 11.6])], { size: 0.45, tone: "hi" }));
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Searl 效应发电机的等距剖切模型：一块方形台板上装三圈同心磁环，环外分别有 12、22、32 个滚子，外圈有 8 个 C 形感应线圈和一圈高压电极，右后角是一台带指针转速表的控制箱，左前角是四层材料的剖面样块。",
  body: [
    `<g data-part="base">${base()}</g>`,
    `<g data-part="rings">${rings()}</g>`,
    `<g data-part="rollers">${rollers()}</g>`,
    `<g data-part="coils">${coils()}</g>`,
    `<g data-part="hv">${highVoltage()}</g>`,
    `<g data-part="corona">${corona()}</g>`,
    `<g data-part="console">${cabinet()}</g>`,
    `<g data-part="supply">${supply()}</g>`,
    `<g data-part="rack">${rack()}</g>`,
    `<g data-part="coupon">${coupon()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const STAGES = ${JSON.stringify(STAGES)};
const DRIVE_RPM = ${DRIVE_RPM};
const GAUGE = ${JSON.stringify(GAUGE)};
const GAUGE_Z = ${GAUGE_Z}, GAUGE_R = ${GAUGE_R};
const TAU = Math.PI * 2;
const stageEl = document.querySelector(".iso-stage");
const svgEl = stageEl.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const needle = svgEl.querySelector('[data-part="needle"]');
const rolls = [...svgEl.querySelectorAll("[data-roll]")].map((el) => ({
  el, orbit: +el.dataset.orbit, base: +el.dataset.base,
}));
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const REV_PER_SEC = 0.055;
let stage = 1, clock = 0, tourClock = 0, touring = true, visible = false, frame = 0, last = 0;
let rpm = DRIVE_RPM, rpmTarget = DRIVE_RPM, idleTimer = 0;
const needleAt = ${needleAt.toString().replace(/k\.lineOnTop/g, "lineOnTop")};

function placeRolls() {
  for (const roll of rolls) {
    const angle = roll.base + TAU * clock * REV_PER_SEC;
    const x = Math.cos(angle) * roll.orbit, y = Math.sin(angle) * roll.orbit;
    const x0 = Math.cos(roll.base) * roll.orbit, y0 = Math.sin(roll.base) * roll.orbit;
    roll.el.setAttribute("transform", translateAlong(P, [x - x0, y - y0, 0]));
  }
}

function showStage(next) {
  stage = clamp(next, 1, STAGES.length);
  stageEl.dataset.stage = String(stage);
  const entry = STAGES[stage - 1];
  const text = entry.title + " · " + entry.verdict + " — " + entry.detail;
  if (readout.textContent !== text) readout.textContent = text;
  stageEl.setAttribute("aria-valuenow", String(stage));
  stageEl.setAttribute("aria-valuetext", text);
  rpmTarget = stage === 3 ? 600 : DRIVE_RPM;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring && !calm) {
    tourClock += dt;
    if (tourClock > 4.6) { tourClock = 0; showStage(stage % STAGES.length + 1); }
  }
  if (!calm) clock += dt; else clock = 0;
  rpm += (rpmTarget - rpm) * (1 - Math.exp(-dt / 0.5));
  placeRolls();
  const d = needleAt(rpm);
  if (needle.getAttribute("d") !== d) needle.setAttribute("d", d);
  frame = visible ? requestAnimationFrame(tick) : 0;
}

const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => {
  touring = false;
  showStage(next);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; tourClock = 0; run(); }, 4200);
  run();
};

new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stageEl);

if (still.matches) touring = false;
stageEl.addEventListener("pointermove", (event) => {
  const box = svgEl.getBoundingClientRect();
  const share = clamp((event.clientX - box.left) / box.width, 0, 0.999);
  steer(Math.floor(share * STAGES.length) + 1);
});
stageEl.addEventListener("pointerleave", () => steer(stage));
stageEl.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); steer(stage + 1); }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); steer(stage - 1); }
  if (event.key === "Home") { event.preventDefault(); steer(1); }
  if (event.key === "End") { event.preventDefault(); steer(STAGES.length); }
  const digit = Number(event.key);
  if (digit >= 1 && digit <= STAGES.length) { event.preventDefault(); steer(digit); }
});
showStage(1);
placeRolls();
run();
`;

const STAGE_PARTS = {
  1: ["rollers"],
  2: ["rings"],
  3: ["coils", "console"],
  4: ["rollers", "rings"],
  5: ["hv", "coils"],
  6: ["base"],
  7: ["rollers", "rings", "hv", "coils", "console", "coupon", "supply", "rack", "base"],
};
const highlight = Object.entries(STAGE_PARTS)
  .map(([step, parts]) => `${parts.map((part) => `.iso-stage[data-stage="${step}"] .iso-svg [data-part="${part}"]`).join(",\n")}{opacity:1}`)
  .join("\n");

const style = `<style>
.iso-stage{outline:none;border-radius:2px}
.iso-stage:focus-visible{outline:2px solid var(--anatomy-mid);outline-offset:6px}
[data-theme="dark"] .iso-svg .iso-line[data-tone="mid"]{stroke:var(--anatomy-hi)}
[data-theme="dark"] .iso-svg .iso-line[data-tone="lo"]{stroke:var(--anatomy-mid)}
.iso-stage .iso-svg [data-part]{transition:opacity .38s ease}
.iso-svg [data-part="rollers"] .iso-fill{fill:${ROLLER_FILL}}
.iso-svg [data-part="rollers"] .iso-top{fill:${ROLLER_TOP}}
.iso-svg [data-part="rollers"] .iso-shade{fill:${ROLLER_SHADE}}
.iso-stage[data-stage] .iso-svg [data-part]{opacity:.86}
.iso-stage[data-stage] .iso-svg [data-part="base"]{opacity:.95}
.iso-stage[data-stage] .iso-svg [data-part="corona"]{opacity:1}
.corona{opacity:0;transition:opacity .45s ease}
.iso-stage[data-stage="5"] .corona{opacity:1;animation:corona-breathe 2.6s ease-in-out infinite}
@keyframes corona-breathe{0%,100%{opacity:.72}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.corona{transition:none;animation:none}}
.iso-stage[data-stage="1"] .iso-svg [data-part="rollers"] .iso-fill,
.iso-stage[data-stage="4"] .iso-svg [data-part="rollers"] .iso-fill{fill:${ACTIVE_FILL}}
.iso-stage[data-stage="1"] .iso-svg [data-part="rollers"] .iso-top,
.iso-stage[data-stage="4"] .iso-svg [data-part="rollers"] .iso-top{fill:${ACTIVE_TOP}}
.iso-stage[data-stage="1"] .iso-svg [data-part="rollers"] .iso-shade,
.iso-stage[data-stage="4"] .iso-svg [data-part="rollers"] .iso-shade{fill:${ACTIVE_FILL}}
.iso-stage[data-stage="1"] .iso-svg [data-part="rollers"] .iso-edge,
.iso-stage[data-stage="4"] .iso-svg [data-part="rollers"] .iso-edge{stroke:var(--anatomy-lit)}
.iso-stage[data-stage="2"] .iso-svg [data-part="rings"] .iso-edge,
.iso-stage[data-stage="5"] .iso-svg [data-part="hv"] .iso-edge,
.iso-stage[data-stage="5"] .iso-svg [data-part="coils"] .iso-edge{stroke:var(--anatomy-lit)}
${highlight}
</style>`;

const ledger = () => {
  const input = ((INPUT_W / (CLAIMED_KW * 1000)) * 100).toFixed(2);
  return `<style>
.seg-ledger{max-width:720px;margin:20px auto 0;color:var(--anatomy-text)}
.seg-ledger h2{font:600 10px/1 var(--anatomy-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 12px}
.seg-row{display:flex;align-items:center;gap:12px;margin:7px 0}
.seg-label{width:82px;text-align:right;font-size:11px;color:var(--anatomy-muted)}
.seg-track{flex:1;height:10px;border-radius:2px;background:var(--anatomy-shade-1);border:1px solid var(--anatomy-shade-0);overflow:hidden}
.seg-bar{display:block;height:100%;border-radius:1px;min-width:3px}
.seg-in{background:var(--anatomy-mid);width:${input}%}
.seg-out{background:var(--anatomy-strong);width:100%}
.seg-bad{background:var(--anatomy-red);width:100%}
.seg-value{width:82px;font:500 11px/1 var(--anatomy-mono);color:var(--anatomy-strong)}
.seg-note{margin:14px 0 0 94px;font-size:11px;line-height:1.75;color:var(--anatomy-muted)}
.seg-note b{color:var(--anatomy-strong);font-weight:500}
</style><section class="seg-ledger"><h2>能量账 · energy ledger</h2><div class="seg-row"><span class="seg-label">市电输入</span><span class="seg-track"><span class="seg-bar seg-in"></span></span><span class="seg-value">200 W</span></div><div class="seg-row"><span class="seg-label">宣称电输出</span><span class="seg-track"><span class="seg-bar seg-out"></span></span><span class="seg-value">15 kW</span></div><div class="seg-row"><span class="seg-label">4 K 制冷所需</span><span class="seg-track"><span class="seg-bar seg-bad"></span></span><span class="seg-value">≫ 37 MW</span></div><p class="seg-note">200 W × <b>75</b> = 15 kW。75 只是超 unity 倍数，<b>不是卡诺极限</b>——4 K 是绝对温度，不是温差。真到 4 K：卡诺制冷 COP = 4/296 ≈ 0.0135，商用 4 K 机约 <b>2.8% 卡诺</b>（4.2 kW 换 1.7 W @4.2 K，Masuyama 2026），15 kW 冷量需约 <b>37 MW</b>。<br>热泵读法（ΔT = 4 K）的 COP 75 才是卡诺极限，但输出是热、要吸 14.8 kW 空气热，与超导无关。环境热路线也有天花板：旋转热磁电机最好 <b>88 W / 2.1%</b>（Hey 2022），热磁发电机 <b>0.14–0.18%</b>（Liu, <i>Nat. Commun.</i> 2023）。2024 年 Tajmar 等在真空屏蔽下未测到任何电磁-引力耦合（<i>Sci. Rep.</i> 14, 70286）。</p></section>`;
};

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Searl 效应发电机 · 剖切模型",
  hint: "悬停或 ← → 逐条核对",
  readout: `${STAGES[0].title} · ${STAGES[0].verdict} — ${STAGES[0].detail}`,
  keys: [
    { mark: "lit", label: "受检环节（这一步高亮）" },
    { mark: "raised", label: "可验证物理：磁轴承 / 感应 / 电晕风" },
    { mark: "dotted", label: "第 ⑤ 步点亮：电晕与离子风" },
    { mark: "dashed", label: "无证据：输出 / 自持加速 / 失重 / 反重力" },
  ],
  caption:
    "按 Sandberg 1985 的公开几何重建：三圈磁环配 12 / 22 / 32 个滚子（另一说 10 / 25 / 35），滚子由 8 段叠成、每段 4 件，3 环 12 件 + 66 组 × 32 件 = 2,124 件；环径与滚子径之比 ≥ 12，滚子外侧留 2 mm 气隙，环面双磁极轨按 1 mm 极距抽稀绘制，外圈 8 个 C 形感应线圈与一圈 20 kV 极化电极；台板前方刻的是 4 阶幻方（Dürer 方），Searl 的全部比例都取自它——但幻方没有单位、层数任意，n 增大时四种材料的比例必然趋于 25 : 25 : 25 : 25。磁轴承、法拉第感应、电晕风都是真实物理——工业磁轴承气隙 0.5–1.0 mm、承载 >30 t（SKF），磁齿轮转矩密度 >100 kNm/m³（Atallah & Howe 2001），电晕风 5–50 N/kW（NASA 2009），单极电机就是法拉第盘。能量账：市电 20 kV × 10 mA = 200 W 输入，宣称 15 kW 输出是 75 倍超 unity；而 4 K 是绝对温度不是温差——真到 4 K，制冷本身要花几十 MW，它是成本不是能源（详见下方能量账）。自持加速、35% 失重与反重力则从未被独立复现。滚子转速为减速显示，表盘读数取自模型。",
  body: `${style}<div class="iso-stage" data-stage="1" tabindex="0" role="slider" aria-label="Searl 效应发电机模型：左右方向键逐条查看七个环节及其证据状态" aria-valuemin="1" aria-valuemax="${STAGES.length}" aria-valuenow="1">${svg}</div>`,
}) + ledger();

const file = theme === "light" ? "searl-seg-light.html" : "searl-seg.html";
const html = k
  .pageHtml({ title: "Searl 效应发电机 · 剖切模型", theme, body, script: kitScript() + live, width: 720 })
  .replace('<html lang="en">', '<html lang="zh-CN">');
writeFileSync(join(HERE, file), html);
console.log("wrote", file);
