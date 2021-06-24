export const commands = [
  'detect overflows',
  'overflow',
]

export const description = 'find elements that overflows (wider than page body)'

export default function() {
  document.querySelectorAll('*').forEach(el => {
    const isOverflowing = el.offsetWidth > document.documentElement.offsetWidth
    const isFlag = el.classList.contains('visbug-detect-overflows')
    const alreadyHasFlag = el.lastChild && el.lastChild.className == 'visbug-detect-overflows'
    const isVisbug = false
    if (isOverflowing && !isFlag && !alreadyHasFlag && !isVisbug) {
      createFlag(el)
    }
  })
}

// TODO: show line pointing to the offending element
function createFlag(offendingElement) {
  const position = offendingElement.getBoundingClientRect()
  const left = position.left
  const top = position.top
  const zIndex = offendingElement.computedStyleMap().get('z-index').value
  const outline = offendingElement.style.outline

  const offset = 16
  const flagLeft = left <= 0 ? offset : left >= window.innerWidth ? window.innerWidth - offset : left
  const flagTop = top <= 0 ? offset : top >= window.innerHeight ? window.innerHeight - offset : top
  
  const flag = document.createElement("BUTTON")
  flag.innerText = "!"
  flag.style.cssText = `all: initial; position: absolute; top: calc(${flagTop}px - 0.5rem); left: calc(${flagLeft}px - 1rem); background: red; border-radius: 1rem; border: 0.15rem solid white; height: 1.5rem; width: 1.5rem; font-size: 1rem; text-align: center; transition: width 0.3s; z-index: ${isNaN(zIndex) ? 9001 : zIndex + 1};`
  flag.title = 'Overflowing the page body!'
  flag.className = "visbug-detect-overflows"
  flag.onmouseover = () => {
    offendingElement.style.outline = '3px solid red'
  }
  flag.onfocus = () => {
    offendingElement.style.outline = '3px solid red'
  }
  flag.onmouseleave = () => {
    offendingElement.style.outline = outline
  }
  flag.onblur = () => {
    offendingElement.style.outline = outline
  }

  document.body.appendChild(flag)
}