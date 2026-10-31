import Init.Omega

/-!
  Searl audit — machine-checked core.

  These are the algebraic facts behind the audit:
  magic-square line sums, the invariance of the deviation from 1/4,
  and momentum conservation under equal and opposite internal impulses.
-/

namespace Searl

/-- A line of four entries in a magic square, each shifted by `n`.
The line sum is `4n + S`, where `S` is the unshifted line sum. -/
theorem line_sum (a b c d n : Nat) :
    (n + a) + (n + b) + (n + c) + (n + d) = 4 * n + (a + b + c + d) := by
  omega

/-- The deviation of a selected entry from one quarter of the line sum,
scaled by the line sum: `4(n+a) - (4n+S) = 4a - S`. The right-hand side
does not depend on the level `n`, so the ratio tends to 1/4. -/
theorem ratio_numerator (a s n : Int) :
    4 * (n + a) - (4 * n + s) = 4 * a - s := by
  omega

/-- Equal and opposite internal impulses leave the total momentum unchanged. -/
theorem momentum_conservation (p1 p2 j : Int) :
    (p1 + j) + (p2 - j) = p1 + p2 := by
  omega

/-- A system at rest, acted on only by internal impulses, stays at rest. -/
theorem com_at_rest (j : Int) :
    (0 + j) + (0 + -j) = (0 : Int) := by
  omega

end Searl
