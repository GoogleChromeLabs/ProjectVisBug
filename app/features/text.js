import { $ } from 'blingblingjs'

export function EditText(elements) {
  if (!elements.length) return

  let removeEditability = e => {
    e.target.removeAttribute('contenteditable')
    e.target.removeEventListener('blur', removeEditability)
  }

  elements.map(el => {
    el.setAttribute('contenteditable', 'true')
    $(el).on('blur', removeEditability)
  })
}