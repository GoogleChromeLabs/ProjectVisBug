import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor } from '@ctrl/tinycolor'
import { queryPage } from './search'
import { getStyles, camelToDash, isOffBounds, 
         deepElementFromPoint, getShadowValues,
         getTextShadowValues, setVisbox
} from '../utilities/'

const state = {
  active: {
    tip:  null,
    target: null,
  },
  tips: new Map(),
}

const services = {}

export function MetaTip({select}) {
  services.selectors = {select}

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

const mouseMove = async e => {
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

  toggleTargetCursor(e.altKey, target)
  await setVisbox([target])
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

  $('[data-metatip]').attr('data-metatip', null)

  state.tips.clear()
}

const render = (el, tip = document.createElement('visbug-metatip')) => {
  const { width, height } = el['vis-box']
  const colormode = $('vis-bug')[0].colorMode

  const styles = getStyles(el)
    .map(style => Object.assign(style, {
      prop: camelToDash(style.prop)
    }))
    .filter(style =>
      style.prop.includes('font-family')
        ? el.matches('h1,h2,h3,h4,h5,h6,p,a,date,caption,button,figcaption,nav,header,footer')
        : true
    )
    .map(style => {
      if (style.prop.includes('color') || style.prop.includes('background-color') || style.prop.includes('border-color') || style.prop.includes('Color') || style.prop.includes('fill') || style.prop.includes('stroke'))
        style.value = `<span color style="background-color:${style.value};"></span>${new TinyColor(style.value)[colormode]()}`

      if (style.prop.includes('box-shadow')) {
        const [, color, x, y, blur, spread] = getShadowValues(style.value)
        style.value = `${new TinyColor(color)[colormode]()} ${x} ${y} ${blur} ${spread}`
      }

      if (style.prop.includes('text-shadow')) {
        const [, color, x, y, blur] = getTextShadowValues(style.value)
        style.value = `${new TinyColor(color)[colormode]()} ${x} ${y} ${blur}`
      }

      if (style.prop.includes('font-family') && style.value.length > 25)
        style.value = style.value.slice(0,25) + '...'

      if (style.prop.includes('grid-template-areas'))
        style.value = style.value.replace(/" "/g, '"<br>"')

      if (style.prop.includes('background-image'))
        style.value = `<a target="_blank" href="${style.value.slice(style.value.indexOf('(') + 2, style.value.length - 2)}">${style.value.slice(0,25) + '...'}</a>`

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

const togglePinned = e => {
  const target = deepElementFromPoint(e.clientX, e.clientY)

  if (e.altKey && !target.hasAttribute('data-metatip')) {
    target.setAttribute('data-metatip', true)
    state.tips.set(target, {
      tip: state.active.tip,
      e,
    })
    clearActive()
  }
  else if (target.hasAttribute('data-metatip')) {
    target.removeAttribute('data-metatip')
    wipe(state.tips.get(target))
  }
}

const linkQueryClicked = ({detail:{ text, activator }}) => {
  if (!text) return

  unPseudoQuery()

  queryPage(text + ':not([data-selected])', els =>
    activator === 'mouseenter'
      ? $(els).attr('data-pseudo-select', true)
      : services.selectors.select(els))
}

const unPseudoQuery = _ =>
  queryPage('[data-pseudo-select]', els =>
    $(els).attr('data-pseudo-select', null))

const toggleTargetCursor = (key, target) =>
  key
    ? target.setAttribute('data-pinhover', true)
    : target.removeAttribute('data-pinhover')

const observe = ({tip, target}) => {
  $(tip).on('query', linkQueryClicked)
  $(tip).on('unquery', unPseudoQuery)
  $(target).on('DOMNodeRemoved', handleBlur)
}

const unobserve = ({tip, target}) => {
  $(tip).off('query', linkQueryClicked)
  $(tip).off('unquery', unPseudoQuery)
  $(target).off('DOMNodeRemoved', handleBlur)
}

const clearActive = () => {
  state.active.tip    = null
  state.active.target = null
}
