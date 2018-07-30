import $ from 'blingblingjs'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyles } from './utils'

const desiredPropMap = {
  color:            'rgb(0, 0, 0)',
  backgroundColor:  'rgba(0, 0, 0, 0)',
  borderRadius:     '0px',
  padding:          '0px',
  margin:           '0px',
  fontSize:         '16px',
  fontWeight:       '400',
  textAlign:        'start',
  textShadow:       'none',
  textTransform:    'none',
  lineHeight:       'normal',
  display:          'block',
  alignItems:       'normal',
  justifyContent:   'normal',
}

// todo: 
// - node recycling (for new target) no need to create/delete
// - make single function create/update
export function MetaTip() {
  let tip_map = {}

  const template = ({target: el}) => {
    const { width, height } = el.getBoundingClientRect()
    const styles = getStyles(el, desiredPropMap).map(style => {
      if (style.prop.includes('color') || style.prop.includes('Color')) {
        style.value = `<span color style="background-color: ${style.value};"></span>${new TinyColor(style.value).toHslString()}`
        return style
      }
      else return style
    })
    
    let tip = document.createElement('div')
    tip.classList.add('metatip')
    tip.innerHTML = `
      <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}${el.className && '.'+el.className.replace(/ /g, '.')}</h5>
      <small>${Math.round(width)}px × ${Math.round(height)}px</small>
      <div>${styles.reduce((items, item) => `
        ${items}
        <span prop>${item.prop}:</span><span value>${item.value}</span>
      `, '')}</div>
    `

    return tip
  }

  const tip_key = node =>
    `${node.nodeName}_${node.children.length}_${node.clientWidth}`

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
      tip_map[tip_key(target)].remove()
      delete tip_map[tip_key(target)]
    }
  }

  const togglePinned = e => {
    if (!e.target.hasAttribute('data-metatip'))
      e.target.setAttribute('data-metatip', true)
    else {
      e.target.removeAttribute('data-metatip')
      e.target.style = tip_position(e.target, e)
    }
  }

  const mouseMove = e => {
    // if node is in our hash (already created)
    if (tip_map[tip_key(e.target)]) {
      // return if it's pinned
      if (e.target.hasAttribute('data-metatip')) 
        return
      // otherwise update position
      const tip = tip_map[tip_key(e.target)]
      tip.style = tip_position(tip, e)
    }
    // create new tip
    else {
      const tip = template(e)
      document.body.appendChild(tip)

      tip.style = tip_position(tip, e)

      $(e.target).on('mouseout', mouseOut)
      $(e.target).on('click', togglePinned)

      tip_map[tip_key(e.target)] = tip
    }
  }

  $('body > *:not(script):not(tool-pallete)').on('mousemove', mouseMove)

  const removeAll = () => {
    Object.values(tip_map)
      .forEach(tip =>
        tip.remove())
    
    $('[data-metatip]').attr('data-metatip', null)

    tip_map = {}
  }

  return () => {
    $('body > *:not(script):not(tool-pallete)').off('mousemove', mouseMove)
    removeAll()
  }
}