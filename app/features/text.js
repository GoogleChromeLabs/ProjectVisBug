import { $ } from 'blingblingjs'

export function EditText(elements) {
  if (!elements.length) return

  let removeEditability = e => {
    e.target.removeAttribute('contenteditable')
    e.target.removeEventListener('blur', removeEditability)
    e.target.removeEventListener('keydown', stopBubbling)
  }

  let stopBubbling = e => e.stopPropagation()

  elements.map(el => {
    el.setAttribute('contenteditable', 'true')
    $(el).on('keydown', stopBubbling)
    $(el).on('blur', removeEditability)
  })
}