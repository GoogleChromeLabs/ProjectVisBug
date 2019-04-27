import { default as visbug_css }     from './vis-bug/vis-bug.element.css'
import { default as handle_css }     from './selection/handles.element.css'
import { default as hover_css }      from './selection/hover.element.css'
import { default as distance_css }   from './selection/distance.element.css'
import { default as gridline_css }   from './selection/gridlines.element.css'
import { default as label_css }      from './selection/label.element.css'
import { default as overlay_css }    from './selection/overlay.element.css'
import { default as boxmodel_css }   from './selection/box-model.element.css'
import { default as metatip_css }    from './metatip/metatip.element.css'
import { default as hotkeymap_css }  from './hotkey-map/base.element.css'

const constructStylesheet = (styles, stylesheet = new CSSStyleSheet()) => {
  stylesheet.replaceSync(styles)
  return stylesheet
}

export const VisBugStyles    = constructStylesheet(visbug_css)
export const HandleStyles    = constructStylesheet(handle_css)
export const HoverStyles     = constructStylesheet(hover_css)
export const MetatipStyles   = constructStylesheet(metatip_css)
export const DistanceStyles  = constructStylesheet(distance_css)
export const GridlineStyles  = constructStylesheet(gridline_css)
export const LabelStyles     = constructStylesheet(label_css)
export const OverlayStyles   = constructStylesheet(overlay_css)
export const BoxModelStyles  = constructStylesheet(boxmodel_css)
export const HotkeymapStyles = constructStylesheet(hotkeymap_css)
