export function numberBetween(min, max) {
  return Math.floor(min + (Math.random() * (max - min)))
}

export function clamp(min, val, max) {
  return Math.max(min, Math.min(val, max))
}
