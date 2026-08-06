import { HandlesStyles, RotationStyles } from '../styles.store'

export class Rotation extends HTMLElement {
  constructor() {
    super()
    this.$shadow = this.attachShadow({mode: 'closed'})
    this.styles = [HandlesStyles, RotationStyles]
    this.totalAngle = 0
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles
  }

  set position({el}) {
    this.targetElement = el
    
    const computedStyle = getComputedStyle(el)
    if (computedStyle.display === 'inline') el.style.display = 'inline-block'

    const {left, top, width, height} = el.getBoundingClientRect()
    const isFixed = computedStyle.position === 'fixed'

    this.style.setProperty('--top', `${top + (isFixed ? 0 : window.scrollY)}px`)
    this.style.setProperty('--left', `${left}px`)
    this.style.setProperty('--position', isFixed ? 'fixed' : 'absolute')
    this.style.setProperty('--width', `${width}px`)
    
    this.$shadow.innerHTML = this.render()
    this.setupRotationHandlers()
  }

  setupRotationHandlers() {
    const handle = this.$shadow.querySelector('.rotation-handle')
    const line = this.$shadow.querySelector('.rotation-line')
    
    const onMouseDown = e => {
      e.preventDefault()
      const {left, top, width, height} = this.targetElement.getBoundingClientRect()
      this.originalCenter = {
        x: left + width / 2,
        y: top + height / 2
      }
      this.lastAngle = Math.atan2(
        e.clientY - this.originalCenter.y,
        e.clientX - this.originalCenter.x
      )
      
      this.handleRadius = Math.sqrt(
        Math.pow(e.clientX - this.originalCenter.x, 2) + 
        Math.pow(e.clientY - this.originalCenter.y, 2)
      )
      
      line.classList.add('active')
      
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    const onMouseMove = e => {
      const currentAngle = Math.atan2(
        e.clientY - this.originalCenter.y,
        e.clientX - this.originalCenter.x
      )
      
      // track accumulated rotation to allow multiple revolutions
      if (!this.lastAngle) this.lastAngle = currentAngle
      let delta = currentAngle - this.lastAngle
      // normalize the delta to avoid "flipping" at boundary crossing
      if (delta > Math.PI) {
        delta -= 2 * Math.PI
      } else if (delta < -Math.PI) {
        delta += 2 * Math.PI
      }
      
      this.totalAngle += delta
      this.lastAngle = currentAngle
      
      const rotationDegrees = this.totalAngle * (180 / Math.PI)
      this.targetElement.style.transform = `rotate(${rotationDegrees}deg)`
      
      const handleX = e.clientX
      const handleY = e.clientY
      
      const hostRect = this.getBoundingClientRect()
      const handleRect = handle.getBoundingClientRect()
      const handleSize = handleRect.width
      
      // position handle centered on cursor
      handle.style.left = `${handleX - hostRect.left - handleSize/2}px`
      handle.style.top = `${handleY - hostRect.top - handleSize/2}px`

      const lineSvg = line.querySelector('line')
      lineSvg.setAttribute('x1', this.originalCenter.x)
      lineSvg.setAttribute('y1', this.originalCenter.y)
      lineSvg.setAttribute('x2', handleX)
      lineSvg.setAttribute('y2', handleY)
    }

    const onMouseUp = () => {
      this.lastAngle = 0
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      line.classList.remove('active')
    }

    handle.addEventListener('mousedown', onMouseDown)
    
    this.cleanup = () => {
      handle.removeEventListener('mousedown', onMouseDown)
    }
  }

  disconnectedCallback() {
    this.cleanup && this.cleanup()
  }

  render() {
    return `
      <svg class="rotation-line">
        <line/>
      </svg>
      <div class="rotation-handle">
        <svg class="rotation-icon" viewBox="0 0 24 24">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </div>
    `
  }
}

customElements.define('visbug-rotation', Rotation)
