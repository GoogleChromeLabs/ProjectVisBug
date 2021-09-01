import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { readability, isReadable } from '@ctrl/tinycolor'
import {
  getStyle, isOffBounds,
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

export function Accessibility(visbug) {
  state.restoring = true

  $('body').on('mousemove', mouseMove)
  visbug.onSelectedUpdate(togglePinned)

  hotkeys('esc', _ => removeAll())

  restorePinnedTips()

  return () => {
    $('body').off('mousemove', mouseMove)
    visbug.removeSelectedCallback(togglePinned)
    hotkeys.unbind('esc')
    hideAll()
  }
}

const mouseMove = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY)

  if (isOffBounds(target) || target.nodeName.toUpperCase() === 'SVG' || target.nodeName === 'VISBUG-ALLYTIP' || target.hasAttribute('data-allytip')) { // aka: mouse out
    if (state.active.tip) {
      wipe({
        tip: state.active.tip,
        e: {target: state.active.target},
      })
      clearActive()
    }
    return
  }

  showTip(target, e)
}

export function showTip(target, e) {
  if (!state.active.tip) { // create
    const tip = render(target)
    document.body.insertAdjacentElement('afterend', tip)

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
    ? '-8px'
    : '100%')

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
  state.tips.forEach(({tip}, target) => {
    if (tip)
      tip.style.display = 'none'
  })

  if (state.active.tip) {
    state.active.tip.remove()
    clearActive()
  }
}

export function removeAll() {
  state.tips.forEach(({tip}, target) => {
    tip && tip.remove()
    unobserve({tip, target})
  })

  $('visbug-allytip').forEach(tip =>
    tip.remove())

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
  const foreground = el instanceof SVGElement
    ? (getStyle(el, 'fill') || getStyle(el, 'stroke'))
    : getStyle(el, 'color')

  const textSize  = getWCAG2TextSize(el) === 'Small'
    ? 'AA'
    : 'AA+'

  let background  = getComputedBackgroundColor(el)
  let pass_icon = `
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>
  `
  let fail_icon = `
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
    </svg>
  `

  const [ aa_contrast, aaa_contrast ] = [
    isReadable(background, foreground, { level: "AA", size: getWCAG2TextSize(el).toLowerCase() }),
    isReadable(background, foreground, { level: "AAA", size: getWCAG2TextSize(el).toLowerCase() })
  ]

  return foreground === background
    ? `<div contrast-compliance>Foreground matches background</div>`
    : `
        <div contrast-compliance>
          <span contrast>
            <span title>Contrast ratio</span>
            <span value>${Math.floor(readability(background, foreground)  * 100) / 100}</span>
          </span>
          <span compliance>
            <span title>WCAG Compliance</span>
            <div>
              <span>
                <span value score pass="${aa_contrast ? 'true' : 'false'}">${aa_contrast ? pass_icon : fail_icon}</span>
                <span>${textSize}</span>
              </span>
              <span>
                <span value score pass="${aaa_contrast ? 'true' : 'false'}">${aaa_contrast ? pass_icon : fail_icon}</span>
                <span>A${textSize}</span>
              </span>
            </div>
          </span>
        </div>
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

const togglePinned = els => {
  if (state.restoring) return state.restoring = false

  state.tips.forEach(ally => {
    if (!els.includes(ally.e.target)) {
      ally.e.target.removeAttribute('data-allytip')
      wipe(state.tips.get(ally.e.target))
    }
  })

  els
    .filter(el => !el.hasAttribute('data-allytip'))
    .forEach(el => {
      el.setAttribute('data-allytip', true)
      state.tips.set(el, {
        tip: state.active.tip,
        e: {target:el},
      })
      clearActive()
  })
}

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
