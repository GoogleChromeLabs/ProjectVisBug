export class BoxModel extends HTMLElement {
  
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set position(payload) {
    this.$shadow.innerHTML  = this.render(payload)
  }

  render({mode, bounds, sides, color = 'pink'}) {
    const total_height  = bounds.height + sides.bottom + sides.top
    const total_width   = bounds.width + sides.right + sides.left

    let drawable = {}

    if (mode === 'padding') {
      drawable = {
        height:   bounds.height,
        width:    bounds.width,
        top:      bounds.top + window.scrollY,
        left:     bounds.left,
        rotation: 'rotate(-45)',
      }
    }
    else if (mode === 'margin') {
      drawable = {
        height:   total_height,
        width:    total_width,
        top:      bounds.top + window.scrollY - sides.top,
        left:     bounds.left - sides.left,
        rotation: 'rotate(45)',
      }
    }

    if (color === 'pink') {
      drawable.bg = 'hsla(330, 100%, 71%, 15%)'
      drawable.stripe = 'hsla(330, 100%, 71%, 80%)'
    }
    else {
      drawable.bg = 'hsla(267, 100%, 58%, 15%)'
      drawable.stripe = 'hsla(267, 100%, 58%, 80%)'
    }

    return `
      <div style="
        pointer-events: none;
        position: absolute;
        z-index: 2147483644;
        width: ${drawable.width}px;
        height: ${drawable.height}px;
        top: ${drawable.top}px;
        left: ${drawable.left}px;
        background-color: ${drawable.bg};
        clip-path: polygon(
          0% 0%, 0% 100%, ${sides.left}px 100%, 
          ${sides.left}px ${sides.top}px, 
          ${drawable.width - sides.right}px ${sides.top}px, 
          ${drawable.width - sides.right}px ${drawable.height - sides.bottom}px, 
          0 ${drawable.height - sides.bottom}px, 0 100%, 
          100% 100%, 100% 0%
        );
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="pinstripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="${drawable.rotation}" class="pattern">
              <line x1="0" y="0" x2="0" y2="10" stroke="${drawable.stripe}" stroke-width="1"></line>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pinstripe)"></rect>
        </svg>
      </div>
    `
  }
}

customElements.define('visbug-boxmodel', BoxModel)
