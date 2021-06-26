import { isFixed } from '../utilities/';

export const commands = [
  'detect overflows',
  'overflow',
]

export const description = 'find elements that overflow the page body'

const className = 'visbug-detect-overflows'

export default function detectOverflows() {
  document
    .querySelectorAll('.' + className + ', visbug-hover')
    .forEach((el) => el.remove())
    document.querySelectorAll('*').forEach((el) => {
    const isOverflowing = el.offsetWidth > document.documentElement.offsetWidth
    const isFlag = el.classList.contains(className)
    const alreadyHasFlag = el.lastChild && el.lastChild.className == className
    if (isOverflowing && !isFlag && !alreadyHasFlag) {
      createFlag(el)
    }
  })
  window.addEventListener('scroll', positionFlags)
  positionFlags()
}

function positionFlags() {
  document.querySelectorAll('.' + className).forEach((el) => {
    const { position, left, top, icon } = stayInsideViewport(el)
    el.style.position = position
    el.style.left = left
    el.style.top = top
    el.innerText = icon
  })
}

function createFlag(overflowingElement) {
  const position = overflowingElement.getBoundingClientRect()
  const left = position.left
  const top = position.top
  const zIndex = overflowingElement.style.zIndex
  const outline = overflowingElement.style.outline
  
  const flagText = getFlagText(left, top)
  
  const flag = document.createElement('BUTTON')
  flag.innerText = flagText
  flag.style.cssText = `
    all: initial;
    position: absolute;
    top: 0;
    left: 0;
    background: red;
    border-radius: 1rem;
    border: 0.15rem solid white;
    min-height: 1.5rem;
    min-width: 1.5rem;
    font-size: 1rem;
    text-align: center;
    z-index: ${isNaN(zIndex) ? 9001 : zIndex + 1};
    width: min-content;
    height: min-content;
    padding: 2px;
  `
  flag.title = 'Overflowing the page body!'
  flag.className = className
  flag.onmouseover = () => {
    overflowingElement.style.outline = '10px solid red'
    flag.originalText = flag.innerText
    flag.innerText = flag.title
  }
  flag.onfocus = () => {
    overflowingElement.style.outline = '10px solid red'
    flag.originalText = flag.innerText
    flag.innerText = flag.title
  }
  flag.onmouseleave = () => {
    overflowingElement.style.outline = outline
    flag.innerText = flag.originalText
  }
  flag.onblur = () => {
    overflowingElement.style.outline = outline
    flag.innerText = flag.originalText
  }
  
  const overlay = document.createElement('visbug-hover')
  overlay.position = { el: overflowingElement }
  overlay.style.setProperty(`--hover-stroke`, 'red')
  overlay.style.setProperty(`--position`, isFixed(overflowingElement) ? 'fixed' : 'absolute')
  
  document.body.appendChild(overlay)
  overflowingElement.appendChild(flag)
}

function getFlagText(left, top) {
  const scrollTop = document.documentElement.scrollTop
  const scrollLeft = document.documentElement.scrollLeft
  if (left <= 0) return '←'
  if (scrollLeft + left >= window.innerWidth) return '→'
  if (top <= 0) return '↑'
  if (scrollTop + top >= window.innerHeight) return '↓'
  return '!'
}

function stayInsideViewport(element) {
  const boundingBox = element.getBoundingClientRect()
  const parentBoundingBox = element.parentElement.getBoundingClientRect()
  
  const outsideTop = parentBoundingBox.top < 0
  const outsideBottom = parentBoundingBox.top > window.innerHeight
  const outsideLeft = parentBoundingBox.left < 0
  const outsideRight = parentBoundingBox.left > window.innerWidth
  
  const isOutsideViewport =
    outsideTop || outsideBottom || outsideLeft || outsideRight
    
  if (!isOutsideViewport) {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      icon: '!',
    }
  }

  const output = {
    position: 'fixed',
    left: parentBoundingBox.left,
    top: parentBoundingBox.top,
    icon: '!',
  }
  
  if (outsideTop && !outsideLeft && !outsideRight) {
    output.left = Math.max(0, parentBoundingBox.left) + 'px'
    output.top = 0
    output.icon = '↑'
  } else if (outsideTop && outsideLeft) {
    output.left = 0
    output.top = 0
    output.icon = '←'
  } else if (outsideTop && outsideRight) {
    output.left = Math.max(0, parentBoundingBox.left) + 'px'
    output.top = 0
    output.icon = '→'
  } else if (outsideLeft && !outsideTop && !outsideBottom) {
    output.left = 0
    output.top = Math.max(0, parentBoundingBox.top) + 'px'
    output.icon = '←'
  } else if (outsideRight && !outsideTop && !outsideBottom) {
    output.left = window.innerWidth - boundingBox.width + 'px'
    output.top = Math.max(0, parentBoundingBox.top) + 'px'
    output.icon = '→'
  } else if (outsideBottom && !outsideLeft && !outsideRight) {
    output.left = Math.max(0, parentBoundingBox.left) + 'px'
    output.top = window.innerHeight - boundingBox.height + 'px'
    output.icon = '↓'
  } else if (outsideBottom && outsideLeft) {
    output.left = 0
    output.top = window.innerHeight - boundingBox.height + 'px'
    output.icon = '←'
  } else if (outsideBottom && outsideRight) {
    output.left = Math.max(0, parentBoundingBox.left) + 'px'
    output.top = window.innerHeight - boundingBox.height + 'px'
    output.icon = '→'
  }

  return output
}
