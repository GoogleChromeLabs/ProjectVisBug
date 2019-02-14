import $ from 'blingblingjs'
import { TinyColor } from '@ctrl/tinycolor'
import { getStyle } from '../utilities/'

export function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker  = $('#foreground', pallete)
  const backgroundPicker  = $('#background', pallete)
  const borderPicker      = $('#border', pallete)
  const fgInput           = $('input', foregroundPicker[0])
  const bgInput           = $('input', backgroundPicker[0])
  const boInput           = $('input', borderPicker[0])

  this.active_color       = 'background'
  this.elements           = []

  // set colors
  fgInput.on('input', e =>
    this.elements.map(el =>
      el.style['color'] = e.target.value))

  bgInput.on('input', e =>
    this.elements.map(el =>
      el.style[el instanceof SVGElement
        ? 'fill'
        : 'backgroundColor'
      ] = e.target.value))

  boInput.on('input', e =>
    this.elements.map(el =>
      el.style[el instanceof SVGElement
        ? 'stroke'
        : 'border-color'
      ] = e.target.value))

  // read colors
  selectorEngine.onSelectedUpdate(elements => {
    if (!elements.length) return
    this.elements = elements

    let isMeaningfulForeground  = false
    let isMeaningfulBackground  = false
    let isMeaningfulBorder      = false
    let FG, BG, BO

    if (this.elements.length == 1) {
      const el = this.elements[0]
      const meaningfulDontMatter = pallete.host.active_tool.dataset.tool === 'hueshift'

      if (el instanceof SVGElement) {
        FG = new TinyColor('rgb(0, 0, 0)')
        var bo_temp = getStyle(el, 'stroke')
        BO = new TinyColor(bo_temp === 'none'
          ? 'rgb(0, 0, 0)'
          : bo_temp)
        BG = new TinyColor(getStyle(el, 'fill'))
      }
      else {
        FG = new TinyColor(getStyle(el, 'color'))
        BG = new TinyColor(getStyle(el, 'backgroundColor'))
        BO = getStyle(el, 'borderWidth') === '0px'
          ? new TinyColor('rgb(0, 0, 0)')
          : new TinyColor(getStyle(el, 'borderColor'))
      }

      let fg = FG.toHexString()
      let bg = BG.toHexString()
      let bo = BO.toHexString()

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)' || (el.children.length === 0 && el.textContent !== '')
      isMeaningfulBackground = BG.originalInput !== 'rgba(0, 0, 0, 0)'
      isMeaningfulBorder     = BO.originalInput !== 'rgb(0, 0, 0)'

      if (isMeaningfulForeground && !isMeaningfulBackground)
        setActive('foreground')
      else if (isMeaningfulBackground && !isMeaningfulForeground)
        setActive('background')

      const new_fg = isMeaningfulForeground ? fg : ''
      const new_bg = isMeaningfulBackground ? bg : ''
      const new_bo = isMeaningfulBorder ? bo : ''

      fgInput.attr('value', new_fg)
      bgInput.attr('value', new_bg)
      boInput.attr('value', new_bo)

      foregroundPicker.attr('style', `
        --contextual_color: ${new_fg};
        display: ${isMeaningfulForeground || meaningfulDontMatter ? 'inline-flex' : 'none'};
      `)

      backgroundPicker.attr('style', `
        --contextual_color: ${new_bg};
        display: ${isMeaningfulBackground || meaningfulDontMatter ? 'inline-flex' : 'none'};
      `)

      borderPicker.attr('style', `
        --contextual_color: ${new_bo};
        display: ${isMeaningfulBorder || meaningfulDontMatter ? 'inline-flex' : 'none'};
      `)
    }
    else {
      // show all 3 if they've selected more than 1 node
      // todo: this is giving up, and can be solved
      foregroundPicker.attr('style', `
        box-shadow: ${this.active_color == 'foreground' ? '0 0 0 2px hotpink' : '0 0.25em 0.5em hsla(0,0%,0%,10%)'};
        display: inline-flex;
      `)

      backgroundPicker.attr('style', `
        box-shadow: ${this.active_color == 'background' ? '0 0 0 2px hotpink' : '0 0.25em 0.5em hsla(0,0%,0%,10%)'};
        display: inline-flex;
      `)

      borderPicker.attr('style', `
        box-shadow: ${this.active_color == 'border' ? '0 0 0 2px hotpink' : '0 0.25em 0.5em hsla(0,0%,0%,10%)'};
        display: inline-flex;
      `)
    }
  })

  const getActive = () =>
    this.active_color

  const setActive = key => {
    removeActive()
    this.active_color = key

    if (key === 'foreground')
      foregroundPicker[0].style.boxShadow = '0 0 0 2px hotpink'
    if (key === 'background')
      backgroundPicker[0].style.boxShadow = '0 0 0 2px hotpink'
    if (key === 'border')
      borderPicker[0].style.boxShadow = '0 0 0 2px hotpink'
  }

  const removeActive = () =>
    [foregroundPicker, backgroundPicker, borderPicker].forEach(([picker]) =>
      picker.style.boxShadow = '0 0.25em 0.5em hsla(0,0%,0%,10%)')

  return {
    getActive,
    setActive,
    foreground: { color: color =>
      foregroundPicker[0].style.setProperty('--contextual_color', color)},
    background: { color: color =>
      backgroundPicker[0].style.setProperty('--contextual_color', color)}
  }
}
