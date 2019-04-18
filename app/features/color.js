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

  const shadows = {
    active:   '0 0 0 2px hotpink, rgba(0, 0, 0, 0.25) 0px 0.25em 0.5em',
    inactive: '0 0 0 2px white, rgba(0, 0, 0, 0.25) 0px 0.25em 0.5em',
  }

  this.active_color       = 'background'
  this.elements           = []

  // set colors
  fgInput.on('input', ({target:{value}}) => {
    this.elements.map(el =>
      el.style['color'] = value)

    foregroundPicker[0].style.setProperty(`--contextual_color`, value)
  })

  bgInput.on('input', ({target:{value}}) => {
    this.elements.map(el =>
      el.style[el instanceof SVGElement
        ? 'fill'
        : 'backgroundColor'
      ] = value)

    backgroundPicker[0].style.setProperty(`--contextual_color`, value)
  })

  boInput.on('input', ({target:{value}}) => {
    this.elements.map(el =>
      el.style[el instanceof SVGElement
        ? 'stroke'
        : 'borderColor'
      ] = value)

    borderPicker[0].style.setProperty(`--contextual_color`, value)
  })

  const extractColors = elements => {
    this.elements = elements

    let isMeaningfulForeground  = false
    let isMeaningfulBackground  = false
    let isMeaningfulBorder      = false
    let FG, BG, BO

    if (this.elements.length == 1) {
      const el = this.elements[0]

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

      let fg = FG.toHslString()
      let bg = BG.toHslString()
      let bo = BO.toHslString()

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)' || (el.children.length === 0 && el.textContent !== '')
      isMeaningfulBackground = BG.originalInput !== 'rgba(0, 0, 0, 0)'
      isMeaningfulBorder     = BO.originalInput !== 'rgb(0, 0, 0)'

      if (isMeaningfulForeground && !isMeaningfulBackground)
        setActive('foreground')
      else if (isMeaningfulBackground && !isMeaningfulForeground)
        setActive('background')

      const new_fg = isMeaningfulForeground   ? fg : ''
      const new_bg = isMeaningfulBackground   ? bg : ''
      const new_bo = isMeaningfulBorder       ? bo : ''

      const fg_icon = isMeaningfulForeground  ? healthyContrastColor(FG) : ''
      const bg_icon = isMeaningfulBackground  ? healthyContrastColor(BG) : ''
      const bo_icon = isMeaningfulBorder      ? healthyContrastColor(BO) : ''

      fgInput.attr('value', new_fg)
      bgInput.attr('value', new_bg)
      boInput.attr('value', new_bo)

      foregroundPicker.attr('style', `
        --contextual_color: ${new_fg};
        --icon_color: ${fg_icon};
      `)

      backgroundPicker.attr('style', `
        --contextual_color: ${new_bg};
        --icon_color: ${bg_icon};
      `)

      borderPicker.attr('style', `
        --contextual_color: ${new_bo};
        --icon_color: ${bo_icon};
      `)
    }
    else {
      // show all 3 if they've selected more than 1 node
      // todo: this is giving up, and can be solved
      foregroundPicker.attr('style', `
        box-shadow: ${this.active_color == 'foreground' ? shadows.active : shadows.inactive};
        --contextual_color: transparent;
        --icon_color: hsla(0,0%,0%,80%);
      `)

      backgroundPicker.attr('style', `
        box-shadow: ${this.active_color == 'background' ? shadows.active : shadows.inactive};
        --contextual_color: transparent;
        --icon_color: hsla(0,0%,0%,80%);
      `)

      borderPicker.attr('style', `
        box-shadow: ${this.active_color == 'border' ? shadows.active : shadows.inactive};
        --contextual_color: transparent;
        --icon_color: hsla(0,0%,0%,80%);
      `)
    }
  }

  const getActive = () =>
    this.active_color

  const setActive = key => {
    removeActive()
    this.active_color = key

    if (key === 'foreground')
      foregroundPicker[0].style.boxShadow = shadows.active
    if (key === 'background')
      backgroundPicker[0].style.boxShadow = shadows.active
    if (key === 'border')
      borderPicker[0].style.boxShadow = shadows.active
  }

  const removeActive = () =>
    [foregroundPicker, backgroundPicker, borderPicker].forEach(([picker]) =>
      picker.style.boxShadow = shadows.inactive)

  selectorEngine.onSelectedUpdate(extractColors)

  return {
    getActive,
    setActive,
    foreground: { color: color =>
      foregroundPicker[0].style.setProperty('--contextual_color', color)},
    background: { color: color =>
      backgroundPicker[0].style.setProperty('--contextual_color', color)}
  }
}

export const healthyContrastColor = color => {
  let contrast = color.clone()

  contrast = contrast.getLuminance() < .5
    ? contrast.lighten(30)
    : contrast.brighten(30)

  contrast = contrast.isDark()
    ? contrast.tint(50)
    : contrast.shade(50)

  return contrast.toHslString()
}