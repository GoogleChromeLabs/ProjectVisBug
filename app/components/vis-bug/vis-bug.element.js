import $          from 'blingblingjs'
import hotkeys    from 'hotkeys-js'

import {
  Handles, Handle, Label, Overlay, Gridlines, Corners,
  Hotkeys, Metatip, Ally, Distance, BoxModel, Grip
} from '../'

import {
  Selectable, Moveable, Padding, Margin, EditText, Font,
  Flex, Search, ColorPicker, BoxShadow, HueShift, MetaTip,
  Guides, Screenshot, Position, Accessibility, draggable
} from '../../features/'

import {
  VisBugStyles,
  VisBugLightStyles,
  VisBugDarkStyles
} from '../styles.store'

import { VisBugModel }            from './model'
import * as Icons                 from './vis-bug.icons'
import { provideSelectorEngine }  from '../../features/search'
import { PluginRegistry }         from '../../plugins/_registry'
import {
  metaKey,
  isPolyfilledCE,
  constructibleStylesheetSupport,
  schemeRule
} from '../../utilities/'

export default class VisBug extends HTMLElement {
  constructor() {
    super()

    this.toolbar_model  = VisBugModel
    this.$shadow        = this.attachShadow({mode: 'closed'})
    this.applyScheme    = schemeRule(
      this.$shadow,
      VisBugStyles, VisBugLightStyles, VisBugDarkStyles
    )
  }

  static get observedAttributes() {
    return ['color-scheme']
  }

  connectedCallback() {
    this._tutsBaseURL = this.getAttribute('tutsBaseURL') || 'tuts'

    this.setup()

    this.selectorEngine = Selectable(this)
    this.colorPicker    = ColorPicker(this.$shadow, this.selectorEngine)

    provideSelectorEngine(this.selectorEngine)

    this.toolSelected($('[data-tool="guides"]', this.$shadow)[0])
  }

  disconnectedCallback() {
    this.deactivate_feature()
    this.cleanup()
    this.selectorEngine.disconnect()
    hotkeys.unbind(
      Object.keys(this.toolbar_model).reduce((events, key) =>
        events += ',' + key, ''))
    hotkeys.unbind(`${metaKey}+/`)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'color-scheme')
      this.applyScheme(newValue)
  }

  setup() {
    this.$shadow.innerHTML = this.render();
  
    this.hasAttribute('color-mode')
      ? this.getAttribute('color-mode')
      : this.setAttribute('color-mode', 'hex');
  
    this.hasAttribute('color-scheme')
      ? this.getAttribute('color-scheme')
      : this.setAttribute('color-scheme', 'auto');
  
    this.setAttribute('popover', 'manual');
    this.showPopover && this.showPopover();
  
    const main_ol = this.$shadow.querySelector('ol:not([colors])');
    const buttonPieces = $('li[data-tool], li[data-tool] *', main_ol);
  
    const clickEvent = (e) => {
      const target = e.currentTarget || e.target;
      const toolButton = target.closest('[data-tool]');
      if (toolButton) this.toolSelected(toolButton) && e.stopPropagation();
    };
  
    Array.from(buttonPieces)
      .forEach(toolButton => {
        draggable({
          el: this,
          surface: toolButton,
          cursor: 'pointer',
          clickEvent: clickEvent
        });
      });
  
    draggable({
      el: this,
      surface: main_ol,
      cursor: 'grab',
    });
  
    this.inputFocused = false;
  
    const linkInput = this.$shadow.querySelector('#link-input');
    if (linkInput) {
      linkInput.addEventListener('focus', () => {
        this.inputFocused = true;
      });
      linkInput.addEventListener('blur', () => {
        this.inputFocused = false;
      });
      linkInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, text);
      });
    }
  
    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => {
        if (!this.inputFocused) {
          e.preventDefault();
          this.toolSelected(
            $(`[data-tool="${value.tool}"]`, this.$shadow)[0]
          );
        }
      })
    );
  
    hotkeys(`${metaKey}+/,${metaKey}+.`, e => {
      if (!this.inputFocused) {
        this.$shadow.host.style.display =
          this.$shadow.host.style.display === 'none'
            ? 'block'
            : 'none';
      }
    });
  }
  

  cleanup() {
    this.hidePopover && this.hidePopover()

    Array.from(document.body.children)
      .filter(node => node.nodeName.includes('VISBUG'))
      .forEach(el => el.remove())

    this.teardown()

    document.querySelectorAll('[data-pseudo-select=true]')
      .forEach(el =>
        el.removeAttribute('data-pseudo-select'))
  }

  toolSelected(el) {
    console.log(el)
    if (typeof el === 'string')
      el = $(`[data-tool="${el}"]`, this.$shadow)[0]

    if (this.active_tool && this.active_tool.dataset.tool === el.dataset.tool) return

    if (this.active_tool) {
      this.active_tool.attr('data-active', null)
      this.deactivate_feature()
    }

    el.attr('data-active', true)
    this.active_tool = el

    if (el.dataset.tool === 'download') {
      this.downloadHtmlWithStylesAndScripts();
    } else {
      this[el.dataset.tool]()
    }

    if (el.dataset.tool === 'link') {
      const linkContainer = this.$shadow.querySelector('.link');
      linkContainer.style.display = 'block';

    } else {
      this[el.dataset.tool]()
    }
  }

  render() {
    return `
      <visbug-hotkeys></visbug-hotkeys>
      <ol constructible-support="${constructibleStylesheetSupport ? 'false':'true'}">
        ${Object.entries(this.toolbar_model).reduce((list, [key, tool]) => `
          ${list}
          <li aria-label="${tool.label} Tool" aria-description="${tool.description}" aria-hotkey="${key}" data-tool="${tool.tool}" data-active="${key == 'g'}">
            ${tool.icon}
            ${this.demoTip({key, ...tool})}
          </li>
        `,'')}
      </li>
      <!-- <li data-tool="link" aria-label="Change Link" aria-description="Change the link of an element">
        ${Icons.link}
        <div class="link" style="display: inline-block">
          <input type="text" id="link-input" style="cursor-none" placeholder="Novo URL">
          <button id="save-link" style="display: inline-block;">Salvar</button>
          <span>Atualizado</span>
          </div> -->
      </li>
      </ol>
      <ol colors>
        <li class="color" id="foreground" aria-label="Text" aria-description="Change the text color">
          <input type="color">
          ${Icons.color_text}
        </li>
        <li class="color" id="background" aria-label="Background or Fill" aria-description="Change the background color or fill of svg">
          <input type="color">
          ${Icons.color_background}
        </li>
        <li class="color" id="border" aria-label="Border or Stroke" aria-description="Change the border color or stroke of svg">
          <input type="color">
          ${Icons.color_border}
        </li>
      </ol>


  <style>
      .link {
        position: relative;
        display: inline-block;
      }

      .link > input {
        direction: ltr;
        border: none;
        font-size: 1em;
        padding: 0.4em 0.4em 0.4em 3em;
        outline: none;
        height: 100%;
        width: 300px;
        box-sizing: border-box;
        caret-color: var(--neon-pink);
        background-color: var(--theme-bg);
        color: var(--theme-text_color);
        cursor: none;
        -webkit-appearance: none;

        &::placeholder {
          font-weight: lighter;
          font-size: 0.8em;
          color: var(--theme-icon_color);
        }
      }

      .link > button {
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        padding: 0.4em 0.6em;
        border: none;
        background-color: var(--neon-pink);
        color: white;
        cursor: pointer;
        font-size: 0.8em;
        border-radius: 0.3em;
        transition: background-color 0.3s ease;
      }

      .link > span {
        color: green;
        margin-left: 5px;
      }
    </style>
    `;
  }

  demoTip({key, tool, label, description, instruction}) {
    return `
      <aside ${tool}>
        <figure>
          <img src="${this._tutsBaseURL}/${tool}.gif" alt="${description}" />
          <figcaption>
            <h2>
              ${label}
              <span hotkey>${key}</span>
            </h2>
            <p>${description}</p>
            ${instruction}
          </figcaption>
        </figure>
      </aside>
    `
  }

  move() {
    this.deactivate_feature = Moveable(this.selectorEngine)
  }

  margin() {
    this.deactivate_feature = Margin(this.selectorEngine)
  }

  padding() {
    this.deactivate_feature = Padding(this.selectorEngine)
  }

  font() {
    this.deactivate_feature = Font(this.selectorEngine)
  }

  text() {
    this.selectorEngine.onSelectedUpdate(EditText)
    this.deactivate_feature = () =>
      this.selectorEngine.removeSelectedCallback(EditText)
  }

  align() {
    this.deactivate_feature = Flex(this.selectorEngine)
  }

  search() {
    this.deactivate_feature = Search($('[data-tool="search"]', this.$shadow))
  }

  boxshadow() {
    this.deactivate_feature = BoxShadow(this.selectorEngine)
  }

  hueshift() {
    this.deactivate_feature = HueShift({
      Color:  this.colorPicker,
      Visbug: this.selectorEngine,
    })
  }

  inspector() {
    this.deactivate_feature = MetaTip(this.selectorEngine)
    // Event listener para detectar quando um <a> é selecionado
    this.selectorEngine.onSelectedUpdate(nodes => {
      if (nodes.length && nodes[0].nodeName.toLowerCase() === 'a') {
        this.showLinkModal(nodes[0]);
      }
    });
  }

  showLinkModal(element) {
    const modal = this.$shadow.querySelector('#link-modal');
    const closeModal = this.$shadow.querySelector('#close-link-modal');
    const saveButton = this.$shadow.querySelector('#save-link');
    const newLinkInput = this.$shadow.querySelector('#new-link-url');

    modal.style.display = 'block';

    closeModal.onclick = () => {
        modal.style.display = 'none';
    }

    saveButton.onclick = () => {
        const newURL = newLinkInput.value;
        if (newURL) {
            element.href = newURL;
            this.captureState(); // Capturar o estado após a alteração
            modal.style.display = 'none';
        }
    }
}

  accessibility() {
    this.deactivate_feature = Accessibility(this.selectorEngine)
  }

  guides() {
    this.deactivate_feature = Guides(this.selectorEngine)
  }

  screenshot() {
    this.deactivate_feature = Screenshot()
  }

  position() {
    let feature = Position()
    this.selectorEngine.onSelectedUpdate(feature.onNodesSelected)
    this.deactivate_feature = () => {
      this.selectorEngine.removeSelectedCallback(feature.onNodesSelected)
      feature.disconnect()
    }
  }

  execCommand(command) {
    const query = `/${command}`

    if (PluginRegistry.has(query))
      return PluginRegistry.get(query)({
        selected: this.selectorEngine.selection(),
        query
      })

    return Promise.resolve(new Error("Query not found"))
  }
  downloadHtml() {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadHtmlWithStylesAndScripts() {
    const cloneDocument = document.cloneNode(true);
  
    // Embed all stylesheets
    const styleSheets = [...document.styleSheets];
    styleSheets.forEach((styleSheet) => {
      try {
        if (styleSheet.cssRules) {
          const newStyle = document.createElement('style');
          for (const cssRule of styleSheet.cssRules) {
            newStyle.appendChild(document.createTextNode(cssRule.cssText));
          }
          cloneDocument.head.appendChild(newStyle);
        } else if (styleSheet.href) {
          const newLink = document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = styleSheet.href;
          cloneDocument.head.appendChild(newLink);
        }
      } catch (e) {
        console.warn('Access to stylesheet %s is restricted by CORS policy', styleSheet.href);
      }
    });
  
    // Embed all scripts
    const scripts = [...document.scripts];
    scripts.forEach((script) => {
      if (script.src) {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        cloneDocument.body.appendChild(newScript);
      } else {
        const newScript = document.createElement('script');
        newScript.textContent = script.textContent;
        cloneDocument.body.appendChild(newScript);
      }
    });
  
    const htmlContent = cloneDocument.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  get activeTool() {
    return this.active_tool.dataset.tool
  }

  link() {
    this.selectorEngine.onSelectedUpdate(nodes => {
      if (nodes.length) {
        const node = nodes[0];
        let currentText = node.outerText
        const linkInput = this.$shadow.querySelector('#link-input');
        const linkContainer = this.$shadow.querySelector('.link');
        const saveButton = this.$shadow.querySelector('#save-link');
  
        // Check if the selected element is already a link
        if (node.tagName === 'A') {
          linkInput.value = node.href;
          // node.outerText = currentText
        } else {
          linkInput.value = '';
        }
  
        linkContainer.style.display = 'block';
        linkInput.focus();
  
        const updateLink = () => {
          const url = linkInput.value.trim();
          if (url) {
            if (node.tagName === 'A') {
              // node.outerText = currentText
              node.href = url;
            } else {
              const a = document.createElement('a');
              a.href = url;
              // a.outerText = currentText
              node.parentNode.insertBefore(a, node);
              a.appendChild(node);
            }
            //this.showSaveButton(); // Mostra o botão "Salvar"
            this.showSavedFeedback(); // Mostra o feedback visual de salvamento
          }
          // linkContainer.style.display = 'none';
        };
  
        linkInput.addEventListener('blur', updateLink, { once: true });
        linkInput.addEventListener('keypress', (e) => {
          debugger
          if (e.key === 'Enter') {
            updateLink();
          }
        }, { once: true });
  
        saveButton.addEventListener('click', () => {
          updateLink();
        });
      }
    });
  
    this.deactivate_feature = () =>
      this.selectorEngine.removeSelectedCallback();
  }
  
  showSaveButton() {
    const saveButton = this.$shadow.querySelector('#save-link');
    saveButton.style.display = 'inline-block';
  }
  
  showSavedFeedback() {
    const linkContainer = this.$shadow.querySelector('.link');
    const savedFeedback = document.createElement('span');
    savedFeedback.textContent = 'Salvo!';
    savedFeedback.style.color = 'green'; // Cor do feedback visual
    savedFeedback.style.marginLeft = '5px'; // Espaçamento à esquerda do feedback
  
    linkContainer.appendChild(savedFeedback);
  
    // Remover o feedback visual após alguns segundos (opcional)
    setTimeout(() => {
      linkContainer.removeChild(savedFeedback);
    }, 3000); // Remove após 3 segundos (ajuste conforme necessário)
  }
  

  showSaveButton() {
    const saveButton = this.$shadow.querySelector('#save-link');
    saveButton.style.display = 'inline-block';
  }
  
  
}

customElements.define('vis-bug', VisBug)
