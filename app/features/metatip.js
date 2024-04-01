import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { preferredNotation } from './color.js'
import { queryPage } from './search'
import { getStyles, camelToDash, isOffBounds,
         deepElementFromPoint, getShadowValues,
         getTextShadowValues, firstUsableFontFromFamily,
         onRemove
} from '../utilities/'

const state = {
  active: {
    tip:  null,
    target: null,
  },
  tips: new Map(),
}

const services = {}

export function MetaTip(visbug) {
  services.selectors = visbug.select
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

  if (isOffBounds(target) || target.nodeName === 'VISBUG-METATIP' || target.hasAttribute('data-metatip')) { // aka: mouse out
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
    document.body.appendChild(tip)

    tip.hidePopover()
    tip.showPopover()

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
  const { left, top }   = tip_position(tip, e, north, west)

  tip.style.left  = left
  tip.style.top   = top

  tip.style.setProperty('--arrow', north
    ? 'var(--arrow-up)'
    : 'var(--arrow-down)')

  tip.style.setProperty('--arrow-top', !north
    ? '-8px'
    : '100%')

  tip.style.setProperty('--arrow-left', west
    ? 'calc(100% - 15px - 15px)'
    : '15px')

  tip.style.setProperty('--is-flipped', west
    ? 'end'
    : '')
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

  $('visbug-metatip').forEach(tip =>
    tip.remove())

  $('[data-metatip]').attr('data-metatip', null)

  state.tips.clear()
}

const render = (el, tip = document.createElement('visbug-metatip')) => {
  const { width, height } = el.getBoundingClientRect()
  const colormode = $('vis-bug').attr('color-mode')

  const styles = getStyles(el)
    .map(style => Object.assign(style, {
      prop: camelToDash(style.prop)
    }))
    .filter(style =>
      style.prop.includes('font-family')
        ? el.matches('h1,h2,h3,h4,h5,h6,p,a,dd,dt,li,ol,pre,abbr,cite,dfn,kbd,q,small,input,label,legend,textarea,blockquote,date,button,figcaption,nav,header,footer,em,b,code,mark,time,summary,details')
        : true
    )
    .map(style => {
      if (style.prop.includes('color') || style.prop.includes('background-color') || style.prop.includes('border-color') || style.prop.includes('Color') || style.prop.includes('fill') || style.prop.includes('stroke')) {
        style.value = `
          <span color style="background-color:${style.value};"></span>
          <span color-value>${preferredNotation(style.value, colormode)}</span>
        `
      }

      if (style.prop.includes('background-image'))
        style.value = `
          <span color gradient style="--_bg:${style.value};"></span>
          <span color-value>${style.value}</span>
        `

      if (style.prop.includes('box-shadow')) {
        const [, color, x, y, blur, spread] = getShadowValues(style.value)
        style.value = `${preferredNotation(color, colormode)} ${x} ${y} ${blur} ${spread}`
      }

      if (style.prop.includes('text-shadow')) {
        const [, color, x, y, blur] = getTextShadowValues(style.value)
        style.value = `${preferredNotation(color, colormode)} ${x} ${y} ${blur}`
      }

      if (style.prop.includes('font-family'))
        style.value = `<span string value>${firstUsableFontFromFamily(style.value)}</span>`

      if (style.prop.includes('grid-template-areas'))
        style.value = style.value.replace(/" "/g, '"<br>"')

      // check if style is inline style, show indicator
      if (el.getAttribute('style') && el.getAttribute('style').includes(style.prop))
        style.value = `<span local-change>${style.value}</span>`

      return style
    })

  const localModifications = styles.filter(style =>
    el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
      ? 1
      : 0)

  const notLocalModifications = styles.filter(style =>
    el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
      ? 0
      : 1)

  tip.meta = {
    el,
    width,
    height,
    localModifications,
    notLocalModifications,
  }

  return tip
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
  if (target.hasAttribute && !target.hasAttribute('data-metatip') && state.tips.has(target))
    wipe(state.tips.get(target))
}

const wipe = ({tip, e:{target}}) => {
  tip.remove()
  unobserve({tip, target})
  state.tips.delete(target)
}

const togglePinned = els => {
  if (state.restoring) return state.restoring = false

  state.tips.forEach(meta => {
    if (!els.includes(meta.e.target)) {
      meta.e.target.removeAttribute('data-metatip')
      wipe(state.tips.get(meta.e.target))
    }
  })

  els
    .filter(el => !el.hasAttribute('data-metatip'))
    .forEach(el => {
      el.setAttribute('data-metatip', true)
      state.tips.set(el, {
        tip: state.active.tip,
        e: {target:el},
      })
      clearActive()
  })
}

const linkQueryClicked = ({detail:{ text, activator }}) => {
  if (!text) return

  queryPage('[data-pseudo-select]', el =>
    el.removeAttribute('data-pseudo-select'))

  queryPage(text + ':not([data-selected])', el =>
    activator === 'mouseenter'
      ? el.setAttribute('data-pseudo-select', true)
      : services.selectors.select(el))
}

const linkQueryHoverOut = e => {
  queryPage('[data-pseudo-select]', el =>
    el.removeAttribute('data-pseudo-select'))
}

const observe = ({tip, target}) => {
  // $(tip).on('query', linkQueryClicked)
  // $(tip).on('unquery', linkQueryHoverOut)
  onRemove(target, handleBlur)
}

const unobserve = ({tip, target}) => {
  // $(tip).off('query', linkQueryClicked)
  // $(tip).off('unquery', linkQueryHoverOut)
}

const clearActive = () => {
  state.active.tip    = null
  state.active.target = null
}
