import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor, readability, isReadable } from '@ctrl/tinycolor'
import { getStyle, isOffBounds, nodeKey } from './utils'

const metatipStyles = {
  host: `
    position: absolute;
    z-index: 99999;
    background: white;
    color: hsl(0,0%,20%);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    box-shadow: 0 0 0.5rem hsla(0,0%,0%,10%);
    border-radius: 0.25rem;
  `,
  h5: `
    display: flex;
    font-size: 1rem;
    font-weight: bolder;
    margin: 0;
  `,
  first_div: `
    display: grid;
    grid-template-columns: auto auto;
    grid-gap: 0.25rem 0.5rem;
    padding: 0;
    list-style-type: none;
    color: hsl(0,0%,40%);
    font-size: 0.8rem;
    font-family: 'Dank Mono', 'Operator Mono', 'Inconsolata', 'Fira Mono', 'SF Mono', 'Monaco', 'Droid Sans Mono', 'Source Code Pro', monospace;
  `,
  div_value: `
    color: hsl(0,0%,20%);
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    text-align: right;
    white-space: pre;
  `,
}

let tip_map = {}

export function Accessibility() {
  const template = ({target: el}) => {
    let tip = document.createElement('div')
    const contrast_results = determineColorContrast(el)

    tip.classList.add('pb-metatip')
    tip.style = metatipStyles.host

    tip.innerHTML = `
      <h5 style="${metatipStyles.h5}">${el.nodeName.toLowerCase()}</h5>
      <div style="${metatipStyles.first_div}">
        <span prop>Color contrast:</span>
        <span style="${metatipStyles.div_value}">${contrast_results}</span>
      </div>
    `

    return tip
  }

  const determineColorContrast = el => {
    // todo: crawl parent element until you find a legit bg color
    // question: how to know if the current node is actually a black background?
    // question: is there an api for composited values?
    const background  = getStyle(el, 'background-color')
    const text        = getStyle(el, 'color')

    return (
      Math.floor(readability(background, text)  * 100) / 100
      + "::" + 
      (isReadable(background, text) ? 'pass' : 'fail')
    )
  }

  const tip_position = (node, e) => ({
    top: `${e.clientY > window.innerHeight / 2
      ? e.pageY - node.clientHeight
      : e.pageY}px`,
    left: `${e.clientX > window.innerWidth / 2
      ? e.pageX - node.clientWidth - 25
      : e.pageX + 25}px`,
  })

  const mouseOut = ({target}) => {
    if (tip_map[nodeKey(target)] && !target.hasAttribute('data-metatip')) {
      target.removeEventListener('mouseout', mouseOut)
      target.removeEventListener('DOMNodeRemoved', mouseOut)
      target.removeEventListener('click', togglePinned)
      tip_map[nodeKey(target)].tip.remove()
      delete tip_map[nodeKey(target)]
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
    if (tip_map[nodeKey(e.target)]) {
      // return if it's pinned
      if (e.target.hasAttribute('data-metatip')) 
        return
      // otherwise update position
      const tip = tip_map[nodeKey(e.target)].tip
      const {left, top} = tip_position(tip, e) 
      tip.style.left  = left
      tip.style.top   = top 
    }
    // create new tip
    else {
      const tip = template(e)
      document.body.appendChild(tip)

      const {left, top} = tip_position(tip, e) 
      tip.style.left    = left
      tip.style.top     = top 

      $(e.target).on('mouseout DOMNodeRemoved', mouseOut)
      $(e.target).on('click', togglePinned)

      tip_map[nodeKey(e.target)] = { tip, e }

      // tip.animate([
      //   {transform: 'translateY(-5px)', opacity: 0},
      //   {transform: 'translateY(0)', opacity: 1}
      // ], 150)
    }
  }

  $('body').on('mousemove', mouseMove)

  hotkeys('esc', _ => removeAll())

  const hideAll = () =>
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.style.display = 'none'
        $(tip).off('mouseout DOMNodeRemoved', mouseOut)
        $(tip).off('click', togglePinned)
      })

  const removeAll = () => {
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.remove()
        $(tip).off('mouseout DOMNodeRemoved', mouseOut)
        $(tip).off('click', togglePinned)
      })
    
    $('[data-metatip]').attr('data-metatip', null)

    tip_map = {}
  }

  Object.values(tip_map)
    .forEach(({tip,e}) => {
      tip.style.display = 'block'
      tip.innerHTML = template(e).innerHTML
      tip.on('mouseout', mouseOut)
      tip.on('click', togglePinned)
    })

  return () => {
    $('body').off('mousemove', mouseMove)
    hotkeys.unbind('esc')
    hideAll()
  }
}