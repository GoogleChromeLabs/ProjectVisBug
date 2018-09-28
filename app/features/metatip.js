import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor } from '@ctrl/tinycolor'
import { queryPage } from './search'
import { getStyles, camelToDash, isOffBounds, nodeKey } from './utils'

let tip_map = {}

// todo: 
// - node recycling (for new target) no need to create/delete
// - make single function create/update
export function MetaTip(selectorEngine) {
  const template = ({target: el}) => {
    const { width, height } = el.getBoundingClientRect()
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
        if (style.prop.includes('color') || style.prop.includes('Color') || style.prop.includes('fill') || style.prop.includes('stroke'))
          style.value = `<span color style="background-color:${style.value};"></span>${new TinyColor(style.value).toHslString()}`

        if (style.prop.includes('font-family') && style.value.length > 25)
          style.value = style.value.slice(0,25) + '...'

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
    
    let tip = document.createElement('pb-metatip')

    tip.meta = {
      el, 
      width, 
      height, 
      localModifications, 
      notLocalModifications,
    }

    return tip
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

  const linkQueryClicked = ({detail}) => {
    if (!detail.text) return

    queryPage('[data-hover]', el =>
      el.setAttribute('data-hover', null))

    queryPage(detail.text + ':not([data-selected])', el =>
      detail.activator === 'mouseenter'
        ? el.setAttribute('data-hover', true)
        : selectorEngine.select(el))
  }

  const linkQueryHoverOut = e => {
    queryPage('[data-hover]', el =>
      el.setAttribute('data-hover', null))
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

      $(tip).on('query', linkQueryClicked)
      $(tip).on('unquery', linkQueryHoverOut)
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
        $('a', tip).off('click', linkQueryClicked)
      })

  const removeAll = () => {
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.remove()
        $(tip).off('mouseout DOMNodeRemoved', mouseOut)
        $(tip).off('click', togglePinned)
        $('a', tip).off('click', linkQueryClicked)
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