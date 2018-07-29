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
const template = ({target: el, pageX, pageY}) => {
  const { width, height } = el.getBoundingClientRect()
  const styles = getStyles(el, desiredPropMap).map(style => {
    if (style.prop.includes('color') || style.prop.includes('Color')) {
      style.value = `<span color style="background-color: ${style.value};"></span>${new TinyColor(style.value).toHslString()}`
      return style
    }
    else return style
  })
  
  let metatip = document.createElement('div')
  metatip.classList.add('metatip')
  metatip.style = `
    top:  ${pageY + 25}px;
    left: ${pageX + 25}px;
  `
  metatip.innerHTML = `
    <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}${el.className && '.'+el.className.replace(/ /g, '.')}</h5>
    <small>${Math.round(width)}px × ${Math.round(height)}px</small>
    <div>${styles.reduce((items, item) => `
      ${items}
      <span prop>${item.prop}:</span><span value>${item.value}</span>
    `, '')}</div>
  `

  return metatip
}

export function MetaTip() {
  let tip_map = {}

  const tip_key = node =>
    `${node.nodeName}_${node.children.length}_${node.clientWidth}`

  const mouseOut = ({target}) => {
    if (tip_map[tip_key(target)] && target.getAttribute('data-metatip') !== 'pinned') {
      $(target).off('mouseout', mouseOut)
      $(target).off('click', togglePinned)
      tip_map[tip_key(target)].remove()
      delete tip_map[tip_key(target)]
      console.log(tip_map)
    }
  }

  const togglePinned = ({target}) => 
    target.getAttribute('data-metatip') !== 'pinned'
      ? target.setAttribute('data-metatip', 'pinned')
      : target.removeAttribute('data-metatip')

  const mouseMove = e => {
    // if node is in our hash (already created)
    if (tip_map[tip_key(e.target)]) {
      // return if it's pinned
      if (e.target.getAttribute('data-metatip') === 'pinned') 
        return
      // otherwise update position
      const tip = tip_map[tip_key(e.target)]
      tip.style.top = `${e.pageY + 25}px`
      tip.style.left = `${e.pageX + 25}px`
    }
    // create new tip
    else {
      const tip = template(e)
      document.body.appendChild(tip)

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