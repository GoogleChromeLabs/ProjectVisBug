import { default as handle_css }   from './selection/handles.element.css'
import { default as hover_css }    from './selection/hover.element.css'
import { default as distance_css } from './selection/distance.element.css'
import { default as gridline_css } from './selection/gridlines.element.css'
import { default as label_css }    from './selection/label.element.css'

const constructStylesheet = (styles, stylesheet = new CSSStyleSheet()) => {
  stylesheet.replaceSync(styles)
  return stylesheet
}

const HandleStyles   = constructStylesheet(handle_css)
const HoverStyles    = constructStylesheet(hover_css)
const DistanceStyles = constructStylesheet(distance_css)
const GridlineStyles = constructStylesheet(gridline_css)
const LabelStyles = constructStylesheet(label_css)

export {
  HandleStyles,
  HoverStyles,
  DistanceStyles,
  GridlineStyles,
  LabelStyles,
}
