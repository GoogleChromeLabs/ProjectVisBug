import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

export default class HotkeyMap extends HTMLElement {
  
  constructor() {
    super()

    this.keyboard_model = {
      num:    ['`','1','2','3','4','5','6','7','8','9','0','-','=','delete'],
      tab:    ['tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
      caps:   ['caps','a','s','d','f','g','h','j','k','l','\'','return'],
      shift:  ['shift','z','x','c','v','b','n','m',',','.','/','shift'],
      space:  ['ctrl','alt','cmd','spacebar','cmd','alt','ctrl']
    }

    // index:flex
    this.key_size_model = {
      num:    {12:2},
      tab:    {0:2},
      caps:   {0:3,11:3},
      shift:  {0:6,11:6},
      space:  {3:10,4:2},
    }

    this.$shadow            = this.attachShadow({mode: 'open'})
    this.$shadow.innerHTML  = this.render()

    this.tool               = 'padding'
    this.$command           = $('[command]', this.$shadow)
  }

  connectedCallback() {
    this.$shift  = $('[keyboard] > section > [shift]', this.$shadow)
    this.$ctrl   = $('[keyboard] > section > [ctrl]', this.$shadow)
    this.$alt    = $('[keyboard] > section > [alt]', this.$shadow)
    this.$cmd    = $('[keyboard] > section > [cmd]', this.$shadow)
    this.$up     = $('[arrows] [up]', this.$shadow)
    this.$down   = $('[arrows] [down]', this.$shadow)
    this.$left   = $('[arrows] [left]', this.$shadow)
    this.$right  = $('[arrows] [right]', this.$shadow)

    hotkeys('shift+/', e =>
      this.$shadow.host.style.display !== 'flex'
        ? this.show()
        : this.hide())
  }

  disconnectedCallback() {
    hotkeys.unbind('*')
  }

  show() {
    this.$shadow.host.style.display = 'flex'
    hotkeys('*', (e, handler) => 
      this.watchKeys(e, handler))
  }

  hide() {
    this.$shadow.host.style.display = 'none'
    hotkeys.unbind('*')
  }

  setTool(tool) {
    if (tool) this.tool = tool
  }

  watchKeys(e, handler) {
    e.preventDefault()
    e.stopPropagation()

    this.$shift.attr('pressed', hotkeys.shift)
    this.$ctrl.attr('pressed', hotkeys.ctrl)
    this.$alt.attr('pressed', hotkeys.alt)
    this.$cmd.attr('pressed', hotkeys.cmd)
    this.$up.attr('pressed', e.code === 'ArrowUp')
    this.$down.attr('pressed', e.code === 'ArrowDown')
    this.$left.attr('pressed', e.code === 'ArrowLeft')
    this.$right.attr('pressed', e.code === 'ArrowRight')

    let amount = hotkeys.shift ? 10 : 1

    let negative = hotkeys.alt ? 'Subtract' : 'Add'
    let negative_modifier = hotkeys.alt ? 'from' : 'to'

    let side = '[arrow key]'
    if (e.code === 'ArrowUp')     side = 'the top side'
    if (e.code === 'ArrowDown')   side = 'the bottom side'
    if (e.code === 'ArrowLeft')   side = 'the left side'
    if (e.code === 'ArrowRight')  side = 'the right side'
    if (hotkeys.cmd)              side = 'all sides'

    this.$command[0].innerHTML = `
      <span negative>${negative} </span>
      <span tool>${this.tool}</span>
      <span light> ${negative_modifier} </span>
      <span side>${side}</span>
      <span light> by </span>
      <span amount>${amount}</span>
    `
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div command>&nbsp;</div>
        <div card>
          <div keyboard>
            ${Object.entries(this.keyboard_model).reduce((keyboard, [row_name, row]) => `
              ${keyboard}
              <section ${row_name}>${row.reduce((row, key, i) => `
                ${row}<span ${key} style="flex:${this.key_size_model[row_name][i] || 1};">${key}</span>
              `, '')}
              </section>
            `, '')}
          </div>
          <div>
            <section arrows>
              <span up>↑</span>
              <span down>↓</span>
              <span left>←</span>
              <span right>→</span>
            </section>
          </div>
        </div>
      </article>
    `
  }

  styles() {
    return `
      <style>
        :host {
          display: none;
          position: fixed;
          z-index: 999;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
          background: hsl(0,0%,95%);

          --dark-grey: hsl(0,0%,40%);
        }

        :host [command] {
          padding: 1rem;
          text-align: center;
          font-size: 3vw;
          font-weight: lighter;
          letter-spacing: 0.1em;
        }

        :host [command] > [light] {
          color: hsl(0,0%,60%);
        }

        :host [card] {
          padding: 1rem;
          background: white;
          box-shadow: 0 0.25rem 0.25rem hsla(0,0%,0%,20%);
          color: var(--dark-grey);
          display: flex;
        }

        :host section {
          display: flex;
          justify-content: center;
        }

        :host section > span, :host [arrows] > span {
          background: hsl(0,0%,90%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 2px;
          padding: 1.5vw;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        :host span[pressed="true"] {
          background: hsl(200, 90%, 70%);
          color: hsl(200, 90%, 20%);
        }

        :host [card] > div:not([keyboard]) {
          display: flex;
          align-items: flex-end;
          margin-left: 1rem;
        }

        :host [arrows] {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }

        :host [arrows] > span:nth-child(1) {
          grid-row: 1;
          grid-column: 2;
        }

        :host [arrows] > span:nth-child(2) {
          grid-row: 2;
          grid-column: 2;
        }

        :host [arrows] > span:nth-child(3) {
          grid-row: 2;
          grid-column: 1;
        }

        :host [arrows] > span:nth-child(4) {
          grid-row: 2;
          grid-column: 3;
        }

        :host [caps] > span:nth-child(1) { justify-content: flex-start; }
        :host [shift] > span:nth-child(1) { justify-content: flex-start; }
        :host [shift] > span:nth-child(12) { justify-content: flex-end; }
      </style>
    `
  }
}

customElements.define('hotkey-map', HotkeyMap)