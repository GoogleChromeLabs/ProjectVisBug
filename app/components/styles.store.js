import { default as handle_css }   from './selection/handles.element.css'
import { default as hover_css }    from './selection/hover.element.css'
import { default as distance_css } from './selection/distance.element.css'

const constructStylesheet = (styles, stylesheet = new CSSStyleSheet()) => {
  stylesheet.replaceSync(styles)
  return stylesheet
}

const HandleStyles   = constructStylesheet(handle_css)
const HoverStyles    = constructStylesheet(hover_css)
const DistanceStyles = constructStylesheet(distance_css)

export {
  HandleStyles,
  HoverStyles,
  DistanceStyles,
}
