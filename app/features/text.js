import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { showHideNodeLabel } from '../utilities/'

const removeEditability = ({target}) => {
  target.removeAttribute('contenteditable')
  target.removeAttribute('spellcheck')
  target.removeEventListener('blur', removeEditability)
  target.removeEventListener('keydown', stopBubbling)
  hotkeys.unbind('escape,esc')
}

const stopBubbling = e => e.key != 'Escape' && e.stopPropagation()

const cleanup = (e, handler) => {
  $('[spellcheck="true"]').forEach(target => removeEditability({target}))
  window.getSelection().empty()
}

export function EditText(elements) {
  if (!elements.length) return

  elements.map(el => {
    let $el = $(el)

    $el.attr({
      contenteditable: true,
      spellcheck: true,
    })
    el.focus()
    showHideNodeLabel(el, true)

    $el.on('keydown', stopBubbling)
    $el.on('blur', removeEditability)
  })

  hotkeys('escape,esc', cleanup)
}