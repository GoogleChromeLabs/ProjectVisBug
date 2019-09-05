/* source: https://github.com/hail2u/color-blindness-emulation */
const FILTERS = `
  <?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.1">
    <defs>
      <filter id="protanopia">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.567, 0.433, 0,     0, 0
                  0.558, 0.442, 0,     0, 0
                  0,     0.242, 0.758, 0, 0
                  0,     0,     0,     1, 0"/>
      </filter>
      <filter id="protanomaly">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.817, 0.183, 0,     0, 0
                  0.333, 0.667, 0,     0, 0
                  0,     0.125, 0.875, 0, 0
                  0,     0,     0,     1, 0"/>
      </filter>
      <filter id="deuteranopia">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.625, 0.375, 0,   0, 0
                  0.7,   0.3,   0,   0, 0
                  0,     0.3,   0.7, 0, 0
                  0,     0,     0,   1, 0"/>
      </filter>
      <filter id="deuteranomaly">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.8,   0.2,   0,     0, 0
                  0.258, 0.742, 0,     0, 0
                  0,     0.142, 0.858, 0, 0
                  0,     0,     0,     1, 0"/>
      </filter>
      <filter id="tritanopia">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.95, 0.05,  0,     0, 0
                  0,    0.433, 0.567, 0, 0
                  0,    0.475, 0.525, 0, 0
                  0,    0,     0,     1, 0"/>
      </filter>
      <filter id="tritanomaly">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.967, 0.033, 0,     0, 0
                  0,     0.733, 0.267, 0, 0
                  0,     0.183, 0.817, 0, 0
                  0,     0,     0,     1, 0"/>
      </filter>
      <filter id="achromatopsia">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.299, 0.587, 0.114, 0, 0
                  0.299, 0.587, 0.114, 0, 0
                  0.299, 0.587, 0.114, 0, 0
                  0,     0,     0,     1, 0"/>
      </filter>
      <filter id="achromatomaly">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.618, 0.320, 0.062, 0, 0
                  0.163, 0.775, 0.062, 0, 0
                  0.163, 0.320, 0.516, 0, 0
                  0,     0,     0,     1, 0"/>
      </filter>
    </defs>
  </svg>  
`

const types = [
  'protanopia',
  'protanomaly',
  'deuteranopia',
  'deuteranomaly',
  'tritanopia',
  'tritanomaly',
  'achromatopsia',
  'achromatomaly',
]

export const commands = [
  'colorblind',
  'simulate-colorblind',
  ...types,
]

const state = {
  filters_injected: false,
}

const makeFilterSVGNode = () => {
  const node = document.createElement('div')
  node.innerHTML = FILTERS
  return node.firstElementChild
}

const makeSelectMenu = query => {
  const node = document.createElement('select')

  node.innerHTML = types
    .map(type =>
      `<option id="${type}">${type}</option>`)
    .join('')

  if (!query.includes('colorblind'))
    node.querySelector(`#${query}`)
      .selected = 'selected'

  node.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 999999999;
  `

  node.setAttribute('size', types.length)

  node.addEventListener('input', e => 
    document.body.style.filter = `url(#${e.target.value})`)

  return node
}

export default async function({selected, query}) {
  query = query.slice(1, query.length)

  // only inject filters once
  if (!state.filters_injected) {
    const filters = makeFilterSVGNode()
    const select = makeSelectMenu(query)

    document.body.appendChild(filters)
    document.body.appendChild(select)

    state.filters_injected = true
  }

  query.includes('colorblind')
    ? document.body.style.filter = `url(#${types[0]})`
    : document.body.style.filter = `url(#${query})`
}
