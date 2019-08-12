export const applyStyle = payload => {
  const {el, style, was, is} = payload
  el.style[style] = is

  console.info(payload)
}