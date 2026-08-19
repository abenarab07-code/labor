export const durations = {
  fast: 0.22,
  ui: 0.38,
  reveal: 0.78,
  cinematic: 1.25,
} as const;

export const easings = {
  easeOut: [0.22, 1, 0.36, 1] as [number, number, number, number],
  easeInOut: [0.76, 0, 0.24, 1] as [number, number, number, number],
  easeSoft: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export const staggers = {
  tight: 0.055,
  editorial: 0.11,
};
