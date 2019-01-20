import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor, readability, isReadable } from '@ctrl/tinycolor'
import { getStyle, getStyles, isOffBounds, getA11ys, getWCAG2TextSize, getComputedBackgroundColor } from '../utilities/'

const tip_map = new Map()

export function Accessibility() {
  const template = ({target: el}) => {
    let tip = document.createElement('pb-ally')

    const contrast_results = determineColorContrast(el)
    const ally_attributes = getA11ys(el)

    ally_attributes.map(ally =>
      ally.prop.includes('alt')
        ? ally.value = `<span text>${ally.value}</span>`
        : ally)

    tip.meta = {
      el, 
      ally_attributes,
      contrast_results,
    }

    return tip
  }

  const determineColorContrast = el => {
    // question: how to know if the current node is actually a black background?
    // question: is there an api for composited values?
    const text      = getStyle(el, 'color')
    const textSize  = getWCAG2TextSize(el)

    let background  = getComputedBackgroundColor(el)

    const [ aa_contrast, aaa_contrast ] = [
      isReadable(background, text, { level: "AA", size: textSize.toLowerCase() }),
      isReadable(background, text, { level: "AAA", size: textSize.toLowerCase() })
    ]

    return `
      <span prop>Color contrast</span>
      <span value contrast>
        <span style="
          background-color:${background};
          color:${text};
        ">${Math.floor(readability(background, text)  * 100) / 100}</span>
      </span>
      <span prop>› AA ${textSize}</span>
      <span value style="${aa_contrast ? 'color:green;' : 'color:red'}">${aa_contrast ? '✓' : '×'}</span>
      <span prop>› AAA ${textSize}</span>
      <span value style="${aaa_contrast ? 'color:green;' : 'color:red'}">${aaa_contrast ? '✓' : '×'}</span>
    `
  }

  const mouse_quadrant = e => ({
    north: e.clientY > window.innerHeight / 2,
    west:  e.clientX > window.innerWidth / 2
  })

  const tip_position = (node, e, north, west) => ({
    top: `${north
      ? e.pageY - node.clientHeight - 20
      : e.pageY + 25}px`,
    left: `${west
      ? e.pageX - node.clientWidth + 23
      : e.pageX - 21}px`,
  })

  const update_tip = (tip, e) => {
    const { north, west } = mouse_quadrant(e)
    const {left, top}     = tip_position(tip, e, north, west)

    tip.style.left  = left
    tip.style.top   = top 

    tip.style.setProperty('--arrow', north 
      ? 'var(--arrow-up)'
      : 'var(--arrow-down)')

    tip.style.setProperty('--shadow-direction', north 
      ? 'var(--shadow-up)'
      : 'var(--shadow-down)')

    tip.style.setProperty('--arrow-top', !north 
      ? '-8px'
      : '100%')

    tip.style.setProperty('--arrow-left', west 
      ? 'calc(100% - 15px - 15px)'
      : '15px')
  }

  const mouseOut = ({target}) => {
    if (tip_map.has(target) && !target.hasAttribute('data-metatip')) {
      target.removeEventListener('mouseout', mouseOut)
      target.removeEventListener('DOMNodeRemoved', mouseOut)
      target.removeEventListener('click', togglePinned)
      tip_map.get(target).tip.remove()
      tip_map.delete(target)
    }
  }

  const togglePinned = e => {
    if (e.altKey) {
      !e.target.hasAttribute('data-metatip')
        ? e.target.setAttribute('data-metatip', true)
        : e.target.removeAttribute('data-metatip')
    }
  }

  const mouseMove = e => {
    if (isOffBounds(e.target)) return

    e.altKey
      ? e.target.setAttribute('data-pinhover', true)
      : e.target.removeAttribute('data-pinhover')

    // if node is in our hash (already created)
    if (tip_map.has(e.target)) {
      // return if it's pinned
      if (e.target.hasAttribute('data-metatip')) 
        return
      // otherwise update position
      const { tip } = tip_map.get(e.target)
      update_tip(tip, e)
    }
    // create new tip
    else {
      const tip = template(e)
      document.body.appendChild(tip)

      update_tip(tip, e)

      $(e.target).on('mouseout DOMNodeRemoved', mouseOut)
      $(e.target).on('click', togglePinned)

      tip_map.set(e.target, { tip, e })

    }
  }

  $('body').on('mousemove', mouseMove)

  hotkeys('esc', _ => removeAll())

  const hideAll = () => {
    for (const {tip} of tip_map.values()) {
      tip.style.display = 'none'
      $(tip).off('mouseout DOMNodeRemoved', mouseOut)
      $(tip).off('click', togglePinned)
    }
  }

  const removeAll = () => {
    for (const {tip} of tip_map.values()) {
      tip.remove()
      $(tip).off('mouseout DOMNodeRemoved', mouseOut)
      $(tip).off('click', togglePinned)
    }
    
    $('[data-metatip]').attr('data-metatip', null)

    tip_map.clear()
  }

  for (const {tip,e} of tip_map.values()) {
    tip.style.display = 'block'
    tip.innerHTML = template(e).innerHTML
    tip.on('mouseout', mouseOut)
    tip.on('click', togglePinned)
  }

  return () => {
    $('body').off('mousemove', mouseMove)
    hotkeys.unbind('esc')
    hideAll()
  }
}