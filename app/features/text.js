import { $ } from 'blingblingjs'
import hotkeys from 'hotkeys-js'

const removeEditability = e => {
  e.target.removeAttribute('contenteditable')
  e.target.removeEventListener('blur', removeEditability)
  e.target.removeEventListener('keydown', stopBubbling)
}

const stopBubbling = e => e.key != 'Escape' && e.stopPropagation()

export function EditText(elements) {
  if (!elements.length) return

  elements.map(el => {
    el.setAttribute('contenteditable', 'true')
    el.focus()
    $(el).on('keydown', stopBubbling)
    $(el).on('blur', removeEditability)
  })

  hotkeys('escape,esc', (e, handler) => {
    elements.forEach(target => removeEditability({target}))
    window.getSelection().empty()
    hotkeys.unbind('escape,esc')
  })
}