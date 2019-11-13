const state = {
  bundle: [],
}

setInterval(() => {
  if (state.bundle.length) {
    console.log(state.bundle)
    state.bundle = []
  }
}, 0)

const pushPayload = payload =>
  state.bundle.push(payload)

export const applyStyle = payload => {
  const {el, style, was, is} = payload
  el.style[style] = is

  if (!payload.synthetic)
    pushPayload(payload)
}
