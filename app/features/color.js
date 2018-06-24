import { $ } from 'blingblingjs'

export function ChangeForeground(elements, color) {
  elements.map(el =>
    el.style.color = color)
}

export function ChangeBackground(elements, color) {
  elements.map(el =>
    el.style.backgroundColor = color)
}