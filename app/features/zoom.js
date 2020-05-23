import hotkeys from 'hotkeys-js'
import { metaKey } from '../utilities/'
import { hideGridlines } from './guides'

const state = {
  page: {
    scale: 1,
  },
  meta: {
    down: false,
  },
  mouse: {
    x: 0,
    y: 0,
  }
}

export const zoomIn = async (amount = .1) => {
  const stash = state.visbug.selection()
  state.visbug.unselect_all()
  hideGridlines()

  state.page.scale += amount

  await scale().finished

  stash.forEach(el =>
    state.visbug.select(el))
}

export const zoomOut = async (amount = .1) => {
  const stash = state.visbug.selection()
  state.visbug.unselect_all()
  hideGridlines()

  state.page.scale -= amount
  if (state.page.scale < .01)
    state.page.scale = .01

  await scale().finished

  stash.forEach(el =>
    state.visbug.select(el))
}

export const zoomToFit = async () => {
  const stash = state.visbug.selection()
  state.visbug.unselect_all()
  hideGridlines()

  const fixedScale = ((window.innerHeight * .9) / document.body.clientHeight).toFixed(2)
  state.page.scale = parseFloat(fixedScale)

  await scale().finished

  stash.forEach(el =>
    state.visbug.select(el))

  document.body.scrollIntoView({
    block: 'center',
    inline: 'center',
    behavior: 'smooth',
  })
}

export const zoomToHomebase = async () => {
  const stash = state.visbug.selection()
  state.visbug.unselect_all()
  hideGridlines()

  state.page.scale = 1

  await scale().finished

  stash.forEach(el =>
    state.visbug.select(el))

  document.body.scrollIntoView({
    inline: 'center',
    behavior: 'smooth',
  })
}

export const zoomNatural = async () => {
  const stash = state.visbug.selection()
  state.visbug.unselect_all()
  hideGridlines()

  state.page.scale = 1

  await scale().finished

  stash.forEach(el =>
    state.visbug.select(el))

  document.body.scrollIntoView({
    inline: 'start',
    block: 'start',
  })
}

const scale = () =>
  document.body.animate([{
    transform: `scale(${state.page.scale})`,
    // transformOrigin: `${state.mouse.x}px ${state.mouse.y}px`,
    easing: 'cubic-bezier(0.39, 0.58, 0.57, 1)',
  }], {
    duration: 150,
    fill: 'forwards',
  })

const handleKeydown = e => {
  const {ctrlKey, metaKey, key} = e

  if (!state.meta.down && metaKey) {
    state.meta.down = true
  }

  if (metaKey && key === '=') {
    zoomIn()
    e.preventDefault()
  }
  else if (metaKey && key === '-') {
    zoomOut()
    e.preventDefault()
  }
  else if (metaKey && key === '0') {
    zoomNatural()
    e.preventDefault()
  }
  else if (metaKey && key === '9') {
   zoomToFit()
    e.preventDefault()
  }
  else if (metaKey && key === '8') {
   zoomToHomebase()
    e.preventDefault()
  }
}

const handleKeyup = ({metaKey}) => {
  if (state.meta.down && !metaKey)
    state.meta.down = false
}

const handleWheel = e => {
  if (state.meta.down) {
    e.preventDefault()

    e.deltaY > 0
      ? zoomOut(e.deltaY / 500)
      : zoomIn(e.deltaY / 500 * -1)
  }
}

const handleMousemove = e => {
  state.mouse.x = e.clientX
  state.mouse.y = e.clientY
}

const handleMetaIn = e => {
  e.stopPropagation()
  e.preventDefault()
  zoomIn()
  return false
}

const handleMetaOut = e => {
  e.stopPropagation()
  e.preventDefault()
  zoomOut()
  return false
}

const start = SelectorEngine => {
  state.visbug = SelectorEngine

  window.addEventListener("keydown", handleKeydown, { passive: false })
  window.addEventListener("keyup", handleKeyup)
  window.addEventListener("wheel", handleWheel, { passive: false })
  window.addEventListener('mousemove', handleMousemove, {passive: true})

  hotkeys(`${metaKey}+equals`, handleMetaIn)
  hotkeys(`${metaKey}+minus`, handleMetaOut)
}

const stop = () => {
  window.removeEventListener("keydown", handleKeydown)
  window.removeEventListener("keyup", handleKeyup)
  window.removeEventListener("wheel", handleWheel)
  window.removeEventListener('mousemove', handleMousemove)

  hotkeys.unbind(`${metaKey}+equals`)
  hotkeys.unbind(`${metaKey}+minus`)
}

export const Zoom = {
  start,
  stop,
}
