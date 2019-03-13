import { default as handle_css }   from './selection/handles.element.css'
import { default as hover_css }    from './selection/hover.element.css'
import { default as distance_css } from './selection/distance.element.css'

const HandleStyles   = new CSSStyleSheet()
const HoverStyles    = new CSSStyleSheet()
const DistanceStyles = new CSSStyleSheet()

HandleStyles.replaceSync(handle_css)
HoverStyles.replaceSync(hover_css)
DistanceStyles.replaceSync(distance_css)

export {
  HandleStyles,
  HoverStyles,
  DistanceStyles,
}
