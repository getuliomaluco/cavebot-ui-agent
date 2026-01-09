export function buildRecoveryGraph(rules) {
  return rules.map((r, i) => ({
    rule: r,
    x: 40,
    y: 40 + i * 140
  }));
}
