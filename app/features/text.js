import { $ } from 'blingblingjs'

export function EditText(elements) {
  if (!elements.length) return

  const removeEditability = e => {
    e.target.removeAttribute('contenteditable')
    e.target.removeEventListener('blur', removeEditability)
    e.target.removeEventListener('keydown', stopBubbling)
  }

  const stopBubbling = e => e.stopPropagation()

  elements.map(el => {
    el.setAttribute('contenteditable', 'true')
    el.focus()
    $(el).on('keydown', stopBubbling)
    $(el).on('blur', removeEditability)
  })
}