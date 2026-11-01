const lineSum = 34;
const EXPECTED_COUNT = 7040;
const EXPECTED_DEV = "1.9e-6";

function enumerateMagic() {
  const rows = [];
  const combo = [];
  const perms = (arr, k) => {
    if (k === 4) {
      rows.push(arr.slice());
      return;
    }
    for (let i = k; i < 4; i++) {
      [arr[k], arr[i]] = [arr[i], arr[k]];
      perms(arr, k + 1);
      [arr[k], arr[i]] = [arr[i], arr[k]];
    }
  };
  const pick = (start) => {
    if (combo.length === 4) {
      if (combo.reduce((a, b) => a + b, 0) === lineSum) perms(combo.slice(), 0);
      return;
    }
    for (let v = start; v <= 16; v++) {
      combo.push(v);
      pick(v + 1);
      combo.pop();
    }
  };
  pick(1);

  const rowMask = rows.map((row) => (1 << row[0]) | (1 << row[1]) | (1 << row[2]) | (1 << row[3]));
  let usedMask = 0;
  const col = [0, 0, 0, 0];
  const g = [null, null, null, null];
  const N = 1000000;
  const sum = 4 * N + (lineSum - 4);
  let count = 0;
  let deviation = 0;

  const note = (row) => {
    for (let j = 0; j < 4; j++) {
      const d = Math.abs((N + row[j] - 1) / sum - 0.25);
      if (d > deviation) deviation = d;
    }
  };

  function rec(r) {
    if (r === 3) {
      const need = [lineSum - col[0], lineSum - col[1], lineSum - col[2], lineSum - col[3]];
      const rem = [];
      for (let v = 1; v <= 16; v++) if (!(usedMask & (1 << v))) rem.push(v);
      for (let i = 0; i < 4; i++) if (need[i] < 1 || need[i] > 16) return;
      const a = need.slice().sort((x, y) => x - y).join(",");
      const b = rem.slice().sort((x, y) => x - y).join(",");
      if (a !== b) return;
      if (g[0][0] + g[1][1] + g[2][2] + need[3] !== lineSum) return;
      if (g[0][3] + g[1][2] + g[2][1] + need[0] !== lineSum) return;
      count++;
      for (let i = 0; i < 3; i++) note(g[i]);
      note(need);
      return;
    }
    for (let k = 0; k < rows.length; k++) {
      const row = rows[k];
      if (usedMask & rowMask[k]) continue;
      if (col[0] + row[0] > lineSum || col[1] + row[1] > lineSum) continue;
      if (col[2] + row[2] > lineSum || col[3] + row[3] > lineSum) continue;
      usedMask |= rowMask[k];
      col[0] += row[0];
      col[1] += row[1];
      col[2] += row[2];
      col[3] += row[3];
      g[r] = row;
      rec(r + 1);
      g[r] = null;
      col[0] -= row[0];
      col[1] -= row[1];
      col[2] -= row[2];
      col[3] -= row[3];
      usedMask &= ~rowMask[k];
    }
  }

  rec(0);
  return { count, deviation };
}

const { count, deviation } = enumerateMagic();
console.log(`squares ${count} · deviation ${deviation.toExponential(6)}`);

if (process.argv.includes("--check")) {
  const okCount = count === EXPECTED_COUNT;
  const okDev = deviation.toExponential(1) === EXPECTED_DEV;
  if (!okCount || !okDev) {
    console.error("enumeration does not match the certificate");
    process.exit(1);
  }
  console.log("enumeration matches the certificate");
}
