import { BoxModelStyles } from '../styles.store'
import { getBoxQuad, quadBounds, quadPath, sideMidpoint } from './quad'

export class BoxModel extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.drawable = {}
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = [BoxModelStyles]
  }

  disconnectedCallback() {}

  set position(payload) {
    this.$shadow.innerHTML = this.render(payload)
    this.createMeasurements({...payload, ...this.drawable.measurementQuads})
  }

  render({mode, bounds, sides, color = 'pink', element}) {
    const total_height  = bounds.height + sides.bottom + sides.top
    const total_width   = bounds.width + sides.right + sides.left
    const borderQuad = getBoxQuad(element)
    const borderBounds = quadBounds(borderQuad)
    const origin = {x: borderBounds.left, y: borderBounds.top}
    let outerQuad
    let innerQuad

    if (mode === 'padding') {
      outerQuad = getBoxQuad(element, 'padding')
      innerQuad = getBoxQuad(element, 'content')
      this.drawable = {
        height:   bounds.height - (sides.borders.top + sides.borders.bottom),
        width:    bounds.width - (sides.borders.right + sides.borders.left),
        top:      0 + sides.borders.top,
        left:     0 + sides.borders.left,
        rotation: 'rotate(-45)',
      }
    }
    else if (mode === 'margin') {
      outerQuad = getBoxQuad(element, 'margin')
      innerQuad = borderQuad
      this.drawable = {
        height:   total_height,
        width:    total_width,
        top:      0 - sides.top,
        left:     0 - sides.left,
        rotation: 'rotate(45)',
      }
    }

    this.drawable.d = `${quadPath(outerQuad, origin)} ${quadPath(innerQuad, origin)}`
    this.drawable.measurementQuads = {outerQuad, innerQuad, origin}

    if (color === 'pink') {
      this.drawable.bg = 'color(display-p3 1 0 1 / 15%)'
      this.drawable.stripe = 'color(display-p3 1 0 1 / 80%)'
    }
    else {
      this.drawable.bg = 'color(display-p3 .75 0 1 / 15%)'
      this.drawable.stripe = 'color(display-p3 .75 0 1 / 80%)'
    }

    this.styles({sides})

    return `
      <div mask>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;">
          <defs>
            <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="${this.drawable.rotation}" class="pattern">
              <line x1="0" y="0" x2="0" y2="10" stroke="${this.drawable.stripe}" stroke-width="1"></line>
            </pattern>
          </defs>
          <path d="${this.drawable.d}" style="fill-rule: evenodd; fill: var(--bg)"></path>
          <path d="${this.drawable.d}" style="fill-rule: evenodd;" fill="url(#pinstripe)"></path>
        </svg>
      </div>
    `
  }

  styles({sides}) {
    this.style.setProperty('--width', `${this.drawable.width}px`)
    this.style.setProperty('--height', `${this.drawable.height}px`)
    this.style.setProperty('--top', `${this.drawable.top}px`)
    this.style.setProperty('--left', `${this.drawable.left}px`)
    this.style.setProperty('--bg', `${this.drawable.bg}`)

    this.style.setProperty('--target-left', `${sides.left}px`)
    this.style.setProperty('--target-top', `${sides.top}px`)
    this.style.setProperty('--target-right', `${sides.right}px`)
    this.style.setProperty('--target-bottom', `${sides.bottom}px`)

    this.style.setProperty('--offset-right', `${this.drawable.width - sides.right}px`)
    this.style.setProperty('--offset-bottom', `${this.drawable.height - sides.bottom}px`)
  }

  createMeasurements({sides, color, outerQuad, innerQuad, origin}) {
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (!sides[side]) continue

      const start = sideMidpoint(outerQuad, side)
      const end = sideMidpoint(innerQuad, side)
      const dx = end.x - start.x
      const dy = end.y - start.y

      this.createMeasurement({
        x: start.x - origin.x,
        y: start.y - origin.y,
        d: sides[side],
        length: Math.hypot(dx, dy),
        angle: Math.atan2(dy, dx),
        q: side,
        v: false,
        local: true,
        centered: true,
        color,
      })
    }
  }

  createMeasurement(line_model, node_label_id=0) {
    const measurement = document.createElement('visbug-distance')
    measurement.position = { line_model, node_label_id }
    this.$shadow.appendChild(measurement)
  }
}

customElements.define('visbug-boxmodel', BoxModel)
