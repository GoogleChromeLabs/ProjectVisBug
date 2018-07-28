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
// - node recycling, no need to create/delete
// - consider making this "inspector" mode, in case it's not always useful
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

  $('body > *:not(script):not(tool-pallete)').on('mousemove', e => {
    if (e.target.hasAttribute('data-selected')) return

    if (tip_map[e.target]) {
      const tip = tip_map[e.target]
      tip.style.top = `${e.pageY + 25}px`
      tip.style.left = `${e.pageX + 25}px`
      return
    }

    const tip = template(e)
    document.body.appendChild(tip)

    $(e.target).on('mouseout click', e => {
      if (!tip_map[e.target]) return

      tip_map[e.target].remove()
      delete tip_map[e.target]
    })

    tip_map[e.target] = tip
  })
}