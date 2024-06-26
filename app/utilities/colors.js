import Color from 'colorjs.io'

export const colors = ["#eb4034", "#30850f", "#116da7", "#4334eb", "#b134eb", "#df168e", "#e8172c", "#8f2e2b", "#8f692b", "#8a8f2b", "#358f2b", "#2b8f82", "#2b678f", "#2b2b8f", "#8f2b8f", "#8f2b55", "#1eff00", "#a86800", "#ff0000", "#008035", "#0026ff", "#bb00ff", "#d600b6", "#e60067", "#137878"];

export function contrast_color(c) {
  try {
  const color = new Color(c)
  
  const whContrast = color.contrastLstar('white')
  const blContrast = color.contrastLstar('black')

  return whContrast > blContrast ? 'white' : 'black'
  } catch {}
}