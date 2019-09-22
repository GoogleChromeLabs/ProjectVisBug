import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor, readability, isReadable } from '@ctrl/tinycolor'
import {
  getStyle, getStyles, isOffBounds,
  getA11ys, getWCAG2TextSize, getComputedBackgroundColor,
  deepElementFromPoint
} from '../utilities/'

const state = {
  active: {
    tip:  null,
    target: null,
  },
  tips: new Map(),
}

export function Accessibility() {
  $('body').on('mousemove', mouseMove)
  $('body').on('click', togglePinned)

  hotkeys('esc', _ => removeAll())

  restorePinnedTips()

  return () => {
    $('body').off('mousemove', mouseMove)
    $('body').off('click', togglePinned)
    hotkeys.unbind('esc')
    hideAll()
  }
}

const mouseMove = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY)

  if (isOffBounds(target) || target.nodeName.toUpperCase() === 'SVG' ||
      target.nodeName === 'VISBUG-ALLYTIP' || target.hasAttribute('data-allytip')) { // aka: mouse out
    if (state.active.tip) {
      wipe({
        tip: state.active.tip,
        e: {target: state.active.target},
      })
      clearActive()
    }
    return
  }

  toggleTargetCursor(e.altKey, target)

  showTip(target, e)
}

export function showTip(target, e) {
  if (!state.active.tip) { // create
    const tip = render(target)
    document.body.appendChild(tip)

    positionTip(tip, e)
    observe({tip, target})

    state.active.tip    = tip
    state.active.target = target
  }
  else if (target == state.active.target) { // update position
    // update position
    positionTip(state.active.tip, e)
  }
  else { // update content
    render(target, state.active.tip)
    state.active.target = target
    positionTip(state.active.tip, e)
  }
}

export function positionTip(tip, e) {
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
    ? '-7px'
    : 'calc(100% - 1px)')

  tip.style.setProperty('--arrow-left', west
    ? 'calc(100% - 15px - 15px)'
    : '15px')
}

const restorePinnedTips = () => {
  state.tips.forEach(({tip}, target) => {
    tip.style.display = 'block'
    render(target, tip)
    observe({tip, target})
  })
}

export function hideAll() {
  state.tips.forEach(({tip}, target) =>
    tip.style.display = 'none')

  if (state.active.tip) {
    state.active.tip.remove()
    clearActive()
  }
}

export function removeAll() {
  state.tips.forEach(({tip}, target) => {
    tip.remove()
    unobserve({tip, target})
  })

  $('[data-allytip]').attr('data-allytip', null)

  state.tips.clear()
}

const render = (el, tip = document.createElement('visbug-ally')) => {
  const contrast_results = determineColorContrast(el)
  const ally_attributes = getA11ys(el)

  ally_attributes.map(ally =>
    ally.prop.includes('alt')
      ? ally.value = `<span text>${ally.value}</span>`
      : ally)

  ally_attributes.map(ally =>
    ally.prop.includes('title')
      ? ally.value = `<span text longform>${ally.value}</span>`
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
  const color     = getStyle(el, 'fill') || getStyle(el, 'stroke') || getStyle(el, 'color')
  const textSize  = getWCAG2TextSize(el)

  let background  = getComputedBackgroundColor(el)

  const [ aa_contrast, aaa_contrast ] = [
    isReadable(background, color, { level: "AA", size: textSize.toLowerCase() }),
    isReadable(background, color, { level: "AAA", size: textSize.toLowerCase() })
  ]

  return `
    <span prop>Color contrast</span>
    <span value contrast>
      <span style="
        background-color:${background};
        color:${color};
      ">${Math.floor(readability(background, color)  * 100) / 100}</span>
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

const handleBlur = ({target}) => {
  if (!target.hasAttribute('data-allytip') && state.tips.has(target))
    wipe(state.tips.get(target))
}

const wipe = ({tip, e:{target}}) => {
  tip.remove()
  unobserve({tip, target})
  state.tips.delete(target)
}

const togglePinned = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY)

  if (e.altKey && !target.hasAttribute('data-allytip')) {
    target.setAttribute('data-allytip', true)
    state.tips.set(target, {
      tip: state.active.tip,
      e,
    })
    clearActive()
  }
  else if (target.hasAttribute('data-allytip')) {
    target.removeAttribute('data-allytip')
    wipe(state.tips.get(target))
  }
}

const toggleTargetCursor = (key, target) =>
  key
    ? target.setAttribute('data-pinhover', true)
    : target.removeAttribute('data-pinhover')

const observe = ({tip, target}) => {
  $(target).on('DOMNodeRemoved', handleBlur)
}

const unobserve = ({tip, target}) => {
  $(target).off('DOMNodeRemoved', handleBlur)
}

const clearActive = () => {
  state.active.tip    = null
  state.active.target = null
}
