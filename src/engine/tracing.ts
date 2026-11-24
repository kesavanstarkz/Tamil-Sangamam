export interface TraceSample {
  x: number;
  y: number;
}

export function scoreTrace(samples: readonly TraceSample[], outsideCount: number, coveredCount: number): number {
  if (samples.length === 0) return 0;
  const coverage = coveredCount / samples.length;
  const outsideRatio = outsideCount / Math.max(1, coveredCount + outsideCount);
  if (coverage >= 0.92 && outsideRatio < 0.15) return 3;
  if (coverage >= 0.85 && outsideRatio < 0.25) return 2;
  if (coverage >= 0.70) return 1;
  return 0;
}
