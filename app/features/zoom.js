import hotkeys from 'hotkeys-js'
import { metaKey } from '../utilities/'

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

export const zoomIn = (amount = .1) => {
  state.page.scale += amount
  document.body.style.transform = `scale(${state.page.scale})`
}

export const zoomOut = (amount = .1) => {
  state.page.scale -= amount
  document.body.style.transform = `scale(${state.page.scale})`
}

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
    state.page.scale = 1
    document.body.style.transform = `scale(1)`
    e.preventDefault()
  }
  else if (metaKey && key === '9') {
    const fixedScale = ((window.innerHeight * .9) / document.body.clientHeight).toFixed(2)
    state.page.scale = parseFloat(fixedScale)
    document.body.style.transform = `scale(${state.page.scale})`
    e.preventDefault()
  }
}

const handleKeyup = ({metaKey}) => {
  if (state.meta.down && !metaKey) {
    state.meta.down = false
    document.body.style.transition = null
  }
}

const handleWheel = e => {
  if (state.meta.down) {
    e.preventDefault()
    document.body.style.transition = 'none'

    e.deltaY > 0
      ? zoomOut(.01)
      : zoomIn(.01)
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

const start = () => {
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