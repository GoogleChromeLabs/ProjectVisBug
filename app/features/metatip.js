import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyles, camelToDash } from './utils'

const desiredPropMap = {
  color:                'rgb(0, 0, 0)',
  backgroundColor:      'rgba(0, 0, 0, 0)',
  backgroundImage:      'none',
  backgroundSize:       'auto',
  backgroundPosition:   '0% 0%',
  border:               '0px none rgb(0, 0, 0)',
  borderRadius:         '0px',
  padding:              '0px',
  margin:               '0px',
  fontFamily:           '',
  fontSize:             '16px',
  fontWeight:           '400',
  textAlign:            'start',
  textShadow:           'none',
  textTransform:        'none',
  lineHeight:           'normal',
  display:              'block',
  alignItems:           'normal',
  justifyContent:       'normal',
}

let tip_map = {}

// todo: 
// - node recycling (for new target) no need to create/delete
// - make single function create/update
export function MetaTip() {
  const template = ({target: el}) => {
    const { width, height } = el.getBoundingClientRect()
    const styles = getStyles(el, desiredPropMap)
      .map(style => Object.assign(style, {
        prop: camelToDash(style.prop)
      }))
      .filter(style => 
        style.prop.includes('font-family') 
          ? el.matches('h1,h2,h3,h4,h5,h6,p,a,date,caption,button,figcaption,nav,header,footer') 
          : true
      )
      .map(style => {
        if (style.prop.includes('color') || style.prop.includes('Color'))
          style.value = `<span color style="background-color: ${style.value};"></span>${new TinyColor(style.value).toHslString()}`

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
    
    let tip = document.createElement('div')
    tip.classList.add('metatip')
    tip.innerHTML = `
      <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}${el.className && '.'+el.className.replace(/ /g, '.')}</h5>
      <small><span>${Math.round(width)}</span>px <span divider>×</span> <span>${Math.round(height)}</span>px</small>
      <div>${notLocalModifications.reduce((items, item) => `
        ${items}
        <span prop>${item.prop}:</span><span value>${item.value}</span>
      `, '')}</div>
      ${localModifications.length ? `
        <h6>Local Modifications</h6>
        <div>${localModifications.reduce((items, item) => `
          ${items}
          <span prop>${item.prop}:</span><span value>${item.value}</span>
        `, '')}</div>
      ` : ''}
    `

    return tip
  }

  const tip_key = node =>
    `${node.nodeName}_${node.className}_${node.children.length}_${node.clientWidth}`

  const tip_position = (node, e) => `
    top: ${e.clientY > window.innerHeight / 2
      ? e.pageY - node.clientHeight
      : e.pageY}px;
    left: ${e.clientX > window.innerWidth / 2
      ? e.pageX - node.clientWidth - 25
      : e.pageX + 25}px;
  `

  const mouseOut = ({target}) => {
    if (tip_map[tip_key(target)] && !target.hasAttribute('data-metatip')) {
      $(target).off('mouseout', mouseOut)
      $(target).off('click', togglePinned)
      tip_map[tip_key(target)].tip.remove()
      delete tip_map[tip_key(target)]
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
    if (e.target.closest('tool-pallete') || e.target.closest('.metatip') || e.target.closest('hotkey-map')) return

    e.altKey
      ? e.target.setAttribute('data-pinhover', true)
      : e.target.removeAttribute('data-pinhover')

    // if node is in our hash (already created)
    if (tip_map[tip_key(e.target)]) {
      // return if it's pinned
      if (e.target.hasAttribute('data-metatip')) 
        return
      // otherwise update position
      const tip = tip_map[tip_key(e.target)].tip
      tip.style = tip_position(tip, e)
    }
    // create new tip
    else {
      const tip = template(e)
      document.body.appendChild(tip)

      tip.style = tip_position(tip, e)

      $(e.target).on('mouseout', mouseOut)
      $(e.target).on('click', togglePinned)

      tip_map[tip_key(e.target)] = { tip, e }
    }
  }

  $('body').on('mousemove', mouseMove)

  hotkeys('esc', _ => removeAll())

  const hideAll = () =>
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.style.display = 'none'
        $(tip).off('mouseout', mouseOut)
        $(tip).off('click', togglePinned)
      })

  const removeAll = () => {
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.remove()
        $(tip).off('mouseout', mouseOut)
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