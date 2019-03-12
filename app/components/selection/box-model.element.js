export class BoxModel extends HTMLElement {

  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.drawable = {}
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(payload) {
    this.$shadow.innerHTML = this.render(payload)
    if (!this.drawable.measurements) // && payload.color === 'pink'
      this.createMeasurements(payload)
  }

  render({mode, bounds, sides, color = 'pink'}) {
    const total_height  = bounds.height + sides.bottom + sides.top
    const total_width   = bounds.width + sides.right + sides.left

    if (mode === 'padding') {
      this.drawable = {
        height:   bounds.height,
        width:    bounds.width,
        top:      bounds.top + window.scrollY,
        left:     bounds.left,
        rotation: 'rotate(-45)',
      }
    }
    else if (mode === 'margin') {
      this.drawable = {
        height:   total_height,
        width:    total_width,
        top:      bounds.top + window.scrollY - sides.top,
        left:     bounds.left - sides.left,
        rotation: 'rotate(45)',
      }
    }

    if (color === 'pink') {
      this.drawable.bg = 'hsla(330, 100%, 71%, 15%)'
      this.drawable.stripe = 'hsla(330, 100%, 71%, 80%)'
    }
    else {
      this.drawable.bg = 'hsla(267, 100%, 58%, 15%)'
      this.drawable.stripe = 'hsla(267, 100%, 58%, 80%)'
    }

    return `
      ${this.styles({sides})}
      <div mask>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="${this.drawable.rotation}" class="pattern">
              <line x1="0" y="0" x2="0" y2="10" stroke="${this.drawable.stripe}" stroke-width="1"></line>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pinstripe)"></rect>
        </svg>
      </div>
    `
  }

  styles({sides}) {
    return `
      <style>
        :host [mask] {
          pointer-events: none;
          position: absolute;
          z-index: 2147483642;
          width: ${this.drawable.width}px;
          height: ${this.drawable.height}px;
          top: ${this.drawable.top}px;
          left: ${this.drawable.left}px;
          background-color: ${this.drawable.bg};
          clip-path: polygon(
            0% 0%, 0% 100%, ${sides.left}px 100%,
            ${sides.left}px ${sides.top}px,
            ${this.drawable.width - sides.right}px ${sides.top}px,
            ${this.drawable.width - sides.right}px ${this.drawable.height - sides.bottom}px,
            0 ${this.drawable.height - sides.bottom}px, 0 100%,
            100% 100%, 100% 0%
          );
        }
      </style>
    `
  }

  createMeasurements({mode, bounds, sides, color}) {
    const win_width   = window.innerWidth
    const pill_height = 18
    const offset      = 3

    if (mode === 'margin') {
      if (sides.top) {
        this.createMeasurement({
          x: bounds.left + (bounds.width / 2) - offset,
          y: bounds.top - sides.top - (sides.top < pill_height ? pill_height - sides.top : 0),
          d: sides.top,
          q: 'top',
          v: true,
          color,
        })
      }
      if (sides.bottom) {
        this.createMeasurement({
          x: bounds.left + (bounds.width / 2) - offset,
          y: bounds.bottom,
          d: sides.bottom,
          q: 'bottom',
          v: true,
          color,
        })
      }
      if (sides.right) {
        this.createMeasurement({
          x: bounds.right,
          y: bounds.top + (bounds.height / 2) - offset,
          d: sides.right,
          q: 'right',
          v: false,
          color,
        })
      }
      if (sides.left) {
        this.createMeasurement({
          x: win_width - bounds.left,
          y: bounds.top + (bounds.height / 2) - offset,
          d: sides.left,
          q: 'left',
          v: false,
          color,
        })
      }
    }
    else if (mode === 'padding') {
      if (sides.top) {
        this.createMeasurement({
          x: bounds.left + (bounds.width / 2) - offset,
          y: bounds.top - (sides.top < pill_height ? pill_height - sides.top : 0),
          d: sides.top,
          q: 'top',
          v: true,
          color,
        })
      }
       if (sides.bottom) {
         this.createMeasurement({
           x: bounds.left + (bounds.width / 2) - offset,
           y: bounds.bottom - sides.bottom,
           d: sides.bottom,
           q: 'bottom',
           v: true,
           color,
         })
       }
       if (sides.right) {
         this.createMeasurement({
           x: bounds.right - sides.right,
           y: bounds.top + (bounds.height / 2) - offset,
           d: sides.right,
           q: 'right',
           v: false,
           color,
         })
       }
       if (sides.left) {
         this.createMeasurement({
           x: win_width - bounds.left - sides.left,
           y: bounds.top + (bounds.height / 2) - offset,
           d: sides.left,
           q: 'left',
           v: false,
           color,
         })
       }
    }
  }

  createMeasurement(line_model, node_label_id=0) {
    const measurement = document.createElement('visbug-distance')
    measurement.position = { line_model, node_label_id }
    this.$shadow.appendChild(measurement)
  }
}

customElements.define('visbug-boxmodel', BoxModel)
