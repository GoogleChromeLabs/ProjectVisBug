import $ from 'blingblingjs'
import { TinyColor } from '@ctrl/tinycolor'
import Color from 'colorjs.io'
import { getStyle, contrast_color } from '../utilities/'
import { handleEditEvent } from "./events";

const state = {
  active_color: 'undefined',
  elements: [],
}

export function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker  = $('#foreground', pallete)
  const backgroundPicker  = $('#background', pallete)
  const borderPicker      = $('#border', pallete)
  const fgInput           = $('input', foregroundPicker[0])
  const bgInput           = $('input', backgroundPicker[0])
  const boInput           = $('input', borderPicker[0])

  const shadows = {
    active:   '0 0 0 2px var(--neon-pink), rgba(0, 0, 0, 0.25) 0px 0.25em 0.5em',
    inactive: '0 0 0 2px var(--theme-bg), rgba(0, 0, 0, 0.25) 0px 0.25em 0.5em',
  }

  fgInput.on('input', ({ target: { value } }) => {
    state.elements.map(el => {
      const oldStyle = el.style["color"];
      el.style['color'] = value
      handleEditEvent({
        el,
        editType: "STYLE",
        newValue: { color: value },
        oldValue: { color: oldStyle },
      });
    })

    foregroundPicker[0].style.setProperty(`--contextual_color`, value)
  })

  bgInput.on('input', ({ target: { value } }) => {
    state.elements.map(el => {
      const oldStyle = el.style[el instanceof SVGElement ? "fill" : "backgroundColor"];
      el.style[el instanceof SVGElement ? 'fill' : 'backgroundColor'] = value
      handleEditEvent({
        el,
        editType: "STYLE",
        newValue: { [el instanceof SVGElement ? "fill" : "backgroundColor"]: value },
        oldValue: { [el instanceof SVGElement ? "fill" : "backgroundColor"]: oldStyle },
      });
    })
    backgroundPicker[0].style.setProperty(`--contextual_color`, value)
  })

  boInput.on('input', ({ target: { value } }) => {
    state.elements.map(el => {
      const oldStyle =
        el.style[el instanceof SVGElement ? "fill" : "backgroundColor"];
      el.style[el instanceof SVGElement
        ? 'stroke'
        : 'borderColor'
      ] = value

      handleEditEvent({
        el,
        editType: "STYLE",
        newValue: { [el instanceof SVGElement ? "fill" : "backgroundColor"]: value },
        oldValue: { [el instanceof SVGElement ? "fill" : "backgroundColor"]: oldStyle },
      });
    });

    borderPicker[0].style.setProperty(`--contextual_color`, value)
  })

  const extractColors = elements => {
    state.elements = elements

    let isMeaningfulForeground  = false
    let isMeaningfulBackground  = false
    let isMeaningfulBorder      = false
    let FG, BG, BO

    if (state.elements.length == 1) {
      const el = state.elements[0]

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

      let fg = `#`+FG.toHex()
      let bg = `#`+BG.toHex()
      let bo = `#`+BO.toHex()

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)' || (el.children.length === 0 && el.textContent !== '')
      isMeaningfulBackground = BG.originalInput !== 'rgba(0, 0, 0, 0)'
      isMeaningfulBorder     = BO.originalInput !== 'rgb(0, 0, 0)'

      if (isMeaningfulForeground && !isMeaningfulBackground)
        setActive('foreground')
      else if (isMeaningfulBackground && !isMeaningfulForeground || isMeaningfulBackground && isMeaningfulForeground)
        setActive('background')

      const new_fg = isMeaningfulForeground   ? fg : ''
      const new_bg = isMeaningfulBackground   ? bg : ''
      const new_bo = isMeaningfulBorder       ? bo : ''

      const fg_icon = isMeaningfulForeground  ? contrast_color(fg) : ''
      const bg_icon = isMeaningfulBackground  ? contrast_color(bg) : ''
      const bo_icon = isMeaningfulBorder      ? contrast_color(bo) : ''
      
      fgInput.attr('value', fg)
      bgInput.attr('value', bg)
      boInput.attr('value', bo)
      fgInput.value = fg
      bgInput.value = bg
      boInput.value = bo

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
        box-shadow: ${state.active_color == 'foreground' ? shadows.active : shadows.inactive};
        --contextual_color: transparent;
        --icon_color: var(--theme-bg);
      `)

      backgroundPicker.attr('style', `
        box-shadow: ${state.active_color == 'background' ? shadows.active : shadows.inactive};
        --contextual_color: transparent;
        --icon_color: var(--theme-bg);
      `)

      borderPicker.attr('style', `
        box-shadow: ${state.active_color == 'border' ? shadows.active : shadows.inactive};
        --contextual_color: transparent;
        --icon_color: var(--theme-bg);
      `)
    }
  }

  const getActive = () =>
    state.active_color

  const setActive = key => {
    removeActive()
    state.active_color = key

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
    foreground: {
      color: color =>
        foregroundPicker[0].style.setProperty('--contextual_color', color)
    },
    background: {
      color: color =>
        backgroundPicker[0].style.setProperty('--contextual_color', color)
    }
  }
}

export const preferredNotation = (color, preference) => {
  const isRGB = color.startsWith('rgb')

  if (preference === 'hsl')
    return new Color(color).to('hsl').toString({precision: 2})
  else if (isRGB )
    return new Color(color).toString({format: preference, precision: 2}) 
  else 
    return color
}
