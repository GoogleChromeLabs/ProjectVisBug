import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor, readability, isReadable } from '@ctrl/tinycolor'
import { 
  getStyle, getStyles, isOffBounds, 
  getA11ys, getWCAG2TextSize, getComputedBackgroundColor,
  deepElementFromPoint 
} from '../utilities/'

const tip_map = new Map()

export function Accessibility() {
  $('body').on('mousemove', mouse_move)

  hotkeys('esc', _ => removeAll())

  // restore any pinned & hidden due to tool change
  for (const {tip,e} of tip_map.values()) {
    if (!e.target) continue
      
    tip.style.display = 'block'
    tip.innerHTML = template(e.target).innerHTML
    tip.on('mouseout', mouseOut)
    tip.on('click', togglePinned)
  }

  return () => {
    $('body').off('mousemove', mouse_move)
    hotkeys.unbind('esc')
    hideAll()
  }
}

export function showTip(target, e) {
  // if node is in our hash (already created)
  if (tip_map.has(target)) {
    // return if it's pinned
    if (target.hasAttribute('data-metatip')) 
      return
    // otherwise update position
    const { tip } = tip_map.get(target)
    updateTip(tip, e)
  }
  // create new tip
  else {
    const tip = template(target)
    document.body.appendChild(tip)

    updateTip(tip, e)

    $(target).on('mouseout DOMNodeRemoved', mouseOut)
    $(target).on('click', togglePinned)

    tip_map.set(target, { tip, e })

    // tip.animate([
    //   {transform: 'translateY(-5px)', opacity: 0},
    //   {transform: 'translateY(0)', opacity: 1}
    // ], 150)
  }
}

export function updateTip(tip, e) {
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

export function hideAll() {
  for (const {tip} of tip_map.values()) {
    tip.style.display = 'none'
    $(tip).off('mouseout DOMNodeRemoved', mouseOut)
    $(tip).off('click', togglePinned)
  }
}

export function removeAll() {
  for (const {tip} of tip_map.values()) {
    try { tip.remove() }
    catch (err) {}

    $(tip).off('mouseout DOMNodeRemoved', mouseOut)
    $(tip).off('click', togglePinned)
  }
  
  $('[data-metatip]').attr('data-metatip', null)

  tip_map.clear()
}

const template = el => {
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

const mouseOut = ({target}) => {
  if (!target.hasAttribute('data-metatip'))
    removeAll()
}

const togglePinned = e => {
  if (e.altKey) {
    !e.target.hasAttribute('data-metatip')
      ? e.target.setAttribute('data-metatip', true)
      : e.target.removeAttribute('data-metatip')
  }
}

const mouse_move = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY)

  if (isOffBounds(target)) return

  e.altKey
    ? target.setAttribute('data-pinhover', true)
    : target.removeAttribute('data-pinhover')

  showTip(target, e)
}