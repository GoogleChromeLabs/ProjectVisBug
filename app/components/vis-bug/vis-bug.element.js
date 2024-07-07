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
    super();
    this.iframeContent = null; // Armazena o conteúdo do iframe
    this.globalPageContent = '',
    this.pixelMeta = '',
    this.pixeGoogle = '',
    this.pixeCookie = '',
    this.originalContent = document.documentElement.innerHTML;
    this.toolbar_model = VisBugModel;
    this.$shadow = this.attachShadow({ mode: 'closed' });
    this.applyScheme = schemeRule(
      this.$shadow,
      VisBugStyles, VisBugLightStyles, VisBugDarkStyles
    );
  }

  switchView() {
    const e = document.getElementById("editorFrame");
    if (e) {
      // Sair da visualização móvel e aplicar alterações ao documento original
      this.updateOriginalContentWithIframeContent(e);
      e.parentNode.remove();
      
      // Remover o botão de sair da visualização móvel
      const exitButton = document.getElementById("exitMobileViewButton");
      if (exitButton) {
        exitButton.remove();
      }
      
      // Atualizar o conteúdo do documento original
      const t = (new DOMParser).parseFromString(this.iframeContent, "text/html");
      document.documentElement.innerHTML = t.documentElement.innerHTML;
      
      // Mostrar todos os elementos do corpo exceto aqueles com tag name 'vis-bug'
      Array.from(document.body.children).forEach((el) => {
        if ("vis-bug" !== el.tagName.toLowerCase()) {
          el.style.display = "";
        }
      });
    } else {
      // Entrar na visualização móvel
      const div = document.createElement("div");
      div.id = "mobileView";
      div.style.position = "fixed";
      div.style.top = "50%";
      div.style.left = "50%";
      div.style.transform = "translate(-50%, -50%)";
      div.style.width = "375px";
      div.style.height = "615px";
      div.style.overflow = "auto";

      const e = document.createElement("iframe");
      e.id = "editorFrame";
      e.style.width = "100%";
      e.style.height = "99%";
      
      const t = this.iframeContent || document.documentElement.outerHTML;
      e.srcdoc = t;
      div.appendChild(e);
      document.body.appendChild(div);
      
      const exitButton = document.createElement("button");
      exitButton.id = "exitMobileViewButton";
      exitButton.textContent = "Desktop View";
      exitButton.style.position = "fixed";
      exitButton.style.top = "31px";
      exitButton.style.right = "22vw";
      exitButton.style.padding = "10px 20px";
      exitButton.style.backgroundColor = "#FF9C08";
      exitButton.style.borderRadius = "5px";
      exitButton.style.color = "white";
      exitButton.style.borderStyle = "none";
      exitButton.addEventListener("click", () => this.switchView());
      document.body.appendChild(exitButton);

      Array.from(document.body.children).forEach((el) => {
        console.log(el.tagName.toLowerCase());
        if (el.id !== "mobileView" && el.id !== "exitMobileViewButton") {
          el.style.display = "none";
        }
      });

      e.onload = () => {
        const t = e.contentDocument || e.contentWindow.document;
        //após o carregamento do iframe, remover o botão que ativa a visualização móvel        <li data-tool="switchView" data-key="switchView" class="mobile">

        const switchViewButton = document.documentElement.outerHTML;

        if (switchViewButton) {
          switchViewButton.remove();
        }

        const r = document.createElement("style");
        r.textContent = `
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `;
        t.head.appendChild(r);
      };
    }
  }

  updateOriginalContentWithIframeContent(iframe) {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    const newContent = iframeDocument.documentElement.innerHTML;
    this.iframeContent = newContent;

    // Atualizar o documento original com as mudanças feitas no iframe
    const originalDocument = (new DOMParser).parseFromString(newContent, "text/html");
    document.documentElement.innerHTML = originalDocument.documentElement.innerHTML;
  }

  createMobileView() {
    let self = this;
    const e = document.createElement("div");
    e.id = "mobileView";
    e.style.width = "375px"; // Defina a largura para simular um dispositivo móvel
    e.style.height = "100vh";
    e.style.margin = "0 auto";
    e.style.border = "1px solid black";
    e.style.overflowY = "scroll";
    e.style.position = "relative";
    e.style.background = "white";
    e.style.transformOrigin = "top left";
    e.style.transform = "scale(1.0)";
    e.style.scrollbarWidth = "thin"; // Para navegadores que suportam (ex: Firefox)
    e.style.scrollbarColor = "#888 #f1f1f1"; // Cor do thumb e track (Firefox)
    e.style.msOverflowStyle = "-ms-autohiding-scrollbar"; // Para Microsoft Edge
    // Para Webkit (Chrome, Safari, etc.)
    e.style.webkitScrollbar = {
      width: '4px'
    };
    e.style.webkitScrollbarTrack = {
      background: '#f1f1f1'
    };
    e.style.webkitScrollbarThumb = {
      background: '#888',
      borderRadius: '2px'
    };
    e.style.webkitScrollbarThumbHover = {
      background: '#555'
    };
        
  
    e.innerHTML = self.originalContent;
  
    document.body.appendChild(e);
  
    Array.from(document.body.children).forEach((el) => {
      if ("vis-bug" !== el.tagName.toLowerCase() && el !== e) {
        el.style.display = "none";
      }
    });
  
    const r = document.createElement("style");
    r.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        width: 100%;
        height: 100%;
      }
      img, video {
        max-width: 100%;
        height: auto;
      }
      iframe {
        max-width: 100%;
      }
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
      [data-tool="download"] {
        display: none;
      }
      /* Adiciona uma meta tag viewport para simular dispositivo móvel */
      @media (max-width: 375px) {
        body {
          overflow-x: hidden;
        }

        #mobileView {
        scrollbar-width: thin !important;
        }
      }
    `;
    e.appendChild(r);
  }

 switchToNormalView() {
  let self = this;
  const e = document.getElementById("mobileView");
  if (e) {
      // If mobile view exists, switch to desktop view
      e.remove();

      // Restore the original body content
      document.body.innerHTML = self.originalContent;

      // Show all body children
      Array.from(document.body.children).forEach((el) => {
          el.style.display = "";
      });
  }
}

// This function will be used to track changes in the iframe and apply them to the mobile media query
applyChangesToMobileMediaQuery() {
  const e = document.getElementById("mobileView");

  if (e) {
    const iframeStyles = e.style.cssText;

    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @media (max-width: 375px) {
        ${iframeStyles}
      }
    `;

    document.head.appendChild(styleElement);
  }
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
    // Tratar is not a function
    if (typeof this.deactivate_feature === 'function') {
      this.deactivate_feature()
    }
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

    const switchViewButton = this.$shadow.querySelector('[data-tool="switchViewtodesktop"]');
    if (switchViewButton) {
      switchViewButton.addEventListener('click', () => this.switchView());
    }
  
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
  
    this.inputFocused = false;
    
    const clickEvent = (e) => {
      const target = e.currentTarget || e.target;
      const toolButton = target.closest('[data-tool]');
      if (toolButton) this.toolSelected(toolButton) && e.stopPropagation();
    };

    Array.from(buttonPieces).forEach(toolButton => {
      draggable({
        el: this,
        surface: toolButton,
        cursor: 'pointer',
        clickEvent: clickEvent,
        // // Add a condition to prevent dragging if text is being selected
        // dragCondition: (event) => {
        //   return !this.selectorEngine.isActive();
        // }
      });
    });
  
    draggable({
      el: this,
      surface: main_ol,
      cursor: 'grab',
      // Prevent dragging main_ol if text is being selected
      // dragCondition: (event) => {
      //   return !this.inputFocused && !this.selectorEngine.isActive();
      // }
    });
  
  
    // const linkInput = this.$shadow.querySelector('#link-input');
    // if (linkInput) {
    //   linkInput.addEventListener('focus', () => {
    //     this.inputFocused = true;
    //   });
    //   linkInput.addEventListener('blur', () => {
    //     this.inputFocused = false;
    //   });
    //   linkInput.addEventListener('paste', (e) => {
    //     e.preventDefault();
    //     const text = (e.clipboardData || window.clipboardData).getData('text');
    //     document.execCommand('insertText', false, text);
    //   });
    // }
  
    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => {
        // if (!this.inputFocused) {
          e.preventDefault();
          this.toolSelected(
            $(`[data-tool="${value.tool}"]`, this.$shadow)[0]
          );
        // }
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
    if (el === null || el === undefined) return
    if (typeof el === 'string')
      el = $(`[data-tool="${el}"]`, this.$shadow)[0]

    if (this.active_tool && this.active_tool.dataset.tool === el.dataset.tool) return

    if (this.active_tool) {
      this.active_tool.attr('data-active', null)
      if (typeof this.deactivate_feature === 'function') {
        this.deactivate_feature();
      }
    }

    el.attr('data-active', true)
    this.active_tool = el
    if (el.dataset.tool === 'download1') {
      this.downloadHtmlWithStylesAndScripts();
    } else if (el.dataset.tool === 'link') {
      const linkContainer = this.$shadow.querySelector('.link');
      linkContainer.style.display = 'block';
    } else if (el.dataset.tool === 'text') {
      el.style.userSelect = 'all';
      this[el.dataset.tool]()
    } else if (el.dataset.tool === 'addPixel') {
      const pixelModal = this.$shadow.querySelector('#pixel-modal');
      pixelModal.style.display = 'block';
  
      const addButton = this.$shadow.querySelector('#add-pixel-button');
      addButton.onclick = () => {
        const pixelInput = this.$shadow.querySelector('#pixel-input');
        const pixelCode = pixelInput.value.trim();
        if (pixelCode) {
          this.pixelMeta = pixelCode
          pixelModal.style.display = 'none';
        }
        pixelModal.style.display = 'none';
      };
    }
    else {
      this[el.dataset.tool]()
    }
    //this.deactivate_feature = this.toolbar_model[el.dataset.tooley].deactivate
  }

  addPixelToHeader(pixelCode, clone) {

    const pixelScript = `
      <!-- Facebook Pixel Code -->
      <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelCode}');
      fbq('track', 'PageView');
      </script>
      <noscript>
      <img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${pixelCode}&ev=PageView&noscript=1"/>
      </noscript>
      <!-- End Facebook Pixel Code -->
    `;

    const head = clone.head || clone.getElementsByTagName('head')[0];
    head.insertAdjacentHTML('beforeend', pixelScript);

    console.log('Código do pixel adicionado:', pixelCode);
  }
  
  removeFacebookPixelsFromHeader(clone) {
  // Função para remover tags script do pixel do Facebook e scripts que contenham !function(f,b,e,v,n,t,s) ou fbq
  const scripts = clone.getElementsByTagName('script');
  const scriptsArray = Array.from(scripts);
  const scriptsToRemove = scriptsArray.filter(script => {
    const scriptContent = script.innerHTML;
    return scriptContent.includes('connect.facebook.net') ||
           scriptContent.includes('fbq') ||
           scriptContent.includes('!function(f,b,e,v,n,t,s)') ||
           scriptContent.includes('www.googletagmanager.com') ||
           scriptContent.includes('pixelId') || 
           scriptContent.includes('PageView') || 
           scriptContent.includes('facebook') 
  });

  scriptsToRemove.forEach(script => {
    script.parentNode.removeChild(script);
  });

  // Função para remover tags noscript do pixel do Facebook
  const noscripts = clone.getElementsByTagName('noscript');
  const noscriptsArray = Array.from(noscripts);
  const facebookPixelNoscripts = noscriptsArray.filter(noscript => {
    return noscript.innerHTML.includes('www.facebook.com/tr');
  });

  facebookPixelNoscripts.forEach(noscript => {
    noscript.parentNode.removeChild(noscript);
  });
  }

  removeCookies(clone) {
    // Obtenha todos os iframes na página
    const iframes = clone.getElementsByTagName('iframe');
  
    // Converta a coleção HTML para um array para usar métodos de array
    const iframesArray = Array.from(iframes);
  
    // Filtre os iframes que têm o atributo frameborder="0"
    const iframesToRemove = iframesArray.filter(iframe => {
      return iframe.getAttribute('frameborder') === '0';
    });
  
    // Remova cada um dos iframes encontrados
    iframesToRemove.forEach(iframe => {
      iframe.parentNode.removeChild(iframe);
    });
  
    console.log(`${iframesToRemove.length} iframe(s) with frameborder="0" removed.`);
  }
  
  changeImage() {
    const images = document.querySelectorAll('img, picture img');
    
    if (images.length === 0) {
      console.log('Nenhuma imagem encontrada.');
      return;
    }

    images.forEach(img => {
      console.log('Adicionando evento de clique à imagem:', img);
      img.addEventListener('click', (e) => {
        console.log('Imagem clicada:', img);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = event.target.result;
            img.src = imageData;
          };
          reader.readAsDataURL(file);
        });

        input.click(); // Abre a janela de seleção de arquivo
      });
    });
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
       <li data-tool="switchView" data-key="switchView" id="sumir" class="mobile">
        ${Icons.mobile_device}
      </li>
      <!-- <li data-tool="link" aria-label="Change Link" aria-description="Change the link of an element">
        ${Icons.link}
        <div class="link" style="display: inline-block">
          <input type="text" id="link-input" style="cursor-none" placeholder="Novo URL">
          <button id="save-link" style="display: inline-block;">Salvar</button>
          <span>Atualizado</span>
          </div> -->
      </li>
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
          ${Icons.border_icon}
        </li>
      </ol>
    <!-- Modal for adding Facebook Pixel -->
      <div id="pixel-modal" style="display: none;">
        <input type="text" id="pixel-input" placeholder="Insira o código do pixel do Facebook">
        <button id="add-pixel-button">Adicionar</button>
      </div>
    
      <style>
      #pixel-modal {
        position: fixed;
        top: 50%;
        left: 190px;
        transform: translate(-50%, -50%);
        background-color: #24272b;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        z-index: 1000;
      }
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
        user-select: text;
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
    @media (max-width: 375px) {
      #sumir {
          display: none;
        }
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

  download() {
    this.active_tool = $('[data-tool="inspector"]', this.$shadow)[0]
    this.active_tool.attr('data-active', true)
    this.downloadHtmlWithStylesAndScripts();
    this.deactivate_feature = null
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
    
    if (!htmlContent.startsWith('<!DOCTYPE html>')) {
      htmlContent = '<!DOCTYPE html>' + htmlContent;
    }
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

  async downloadHtmlWithStylesAndScripts2() {

  // Adicionar spinner de carregamento
  const loadingSpinner = document.createElement('div');
  loadingSpinner.id = 'loadingSpinner';
  loadingSpinner.style.position = 'fixed';
  loadingSpinner.style.top = '50%';
  loadingSpinner.style.left = '50%';
  loadingSpinner.style.transform = 'translate(-50%, -50%)';
  loadingSpinner.style.border = '16px solid #f3f3f3';
  loadingSpinner.style.borderRadius = '50%';
  loadingSpinner.style.borderTop = '16px solid #3498db';
  loadingSpinner.style.width = '120px';
  loadingSpinner.style.height = '120px';
  loadingSpinner.style.animation = 'spin 2s linear infinite';
  document.body.appendChild(loadingSpinner);

      const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    const cloneDocument = document.cloneNode(true);
    // Embed all stylesheets
    const styleSheets = [...document.styleSheets];
    for (const styleSheet of styleSheets) {
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
    }

    // Embed all scripts
    const scripts = [...document.scripts];
    for (const script of scripts) {
      if (script.src) {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        cloneDocument.body.appendChild(newScript);
      } else {
        const newScript = document.createElement('script');
        newScript.textContent = script.textContent;
        cloneDocument.body.appendChild(newScript);
      }
    }
    // Replace image URLs with base64 data
    const images = [...cloneDocument.querySelectorAll('img')];
    for (const image of images) {
      const url = image.src;
      const extension = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
      const allowedExtensions = ['webp', 'jpg', 'jpeg', 'png'];
      if (allowedExtensions.includes(extension)) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        await new Promise(async (resolve, reject) => {
          img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            const base64Data = canvas.toDataURL(`image/${extension}`);
            image.src = base64Data;
            downloadedImages++;
            imageCount.textContent = `Imagens baixadas: ${downloadedImages} / ${totalImages}`;
            resolve();
          };
          img.onerror = async function () {
            try {
              const response = await fetch(url, { mode: 'no-cors' });
              const blob = await response.blob();
              const reader = new FileReader();
              reader.onloadend = function () {
                const base64Data = reader.result;
                image.src = base64Data;
                downloadedImages++;
                imageCount.textContent = `Imagens baixadas: ${downloadedImages} / ${totalImages}`;
                resolve();
              };
              reader.readAsDataURL(blob);
            } catch (error) {
              console.error(`Failed to load image: ${url}`, error);
              
              resolve();
            }
          };
          try {
            img.src =  await this.getBase64Image(url);
          } catch (error) {
            console.error(`Failed to load image: ${url}`, error);
            img.src = '';
            resolve();
          }
        });
      }
    }
    
    const visBugElement = cloneDocument.querySelector('vis-bug');
    const spin = cloneDocument.getElementById('loadingSpinner');
    if (visBugElement) {
      visBugElement.remove();
      spin.remove();
    }

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
    this.deactivate_feature();
  }

  //Esse funciona bem, tem que rever as imagens
  async downloadHtmlWithStylesAndScriptsImage() {
    // Adicionar spinner de carregamento
    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'loadingSpinner';
    loadingSpinner.style.position = 'fixed';
    loadingSpinner.style.top = '50%';
    loadingSpinner.style.left = '50%';
    loadingSpinner.style.transform = 'translate(-50%, -50%)';
    loadingSpinner.style.border = '16px solid #f3f3f3';
    loadingSpinner.style.borderRadius = '50%';
    loadingSpinner.style.borderTop = '16px solid #3498db';
    loadingSpinner.style.width = '120px';
    loadingSpinner.style.height = '120px';
    loadingSpinner.style.animation = 'spin 2s linear infinite';
    loadingSpinner.style.zIndex = '1000';
    document.body.appendChild(loadingSpinner);
  
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      #imageCount {
        position: fixed;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        color: #3498db;
        z-index: 1000;
      }
    `;
    document.head.appendChild(style);
  
    const imageCount = document.createElement('div');
    imageCount.id = 'imageCount';
    document.body.appendChild(imageCount);
  
    const cloneDocument = document.cloneNode(true);
    // Embed all stylesheets
    const styleSheets = [...document.styleSheets];
    for (const styleSheet of styleSheets) {
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
    }
  
    // Embed all scripts
    const scripts = [...document.scripts];
    for (const script of scripts) {
      if (script.src) {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        cloneDocument.body.appendChild(newScript);
      } else {
        const newScript = document.createElement('script');
        newScript.textContent = script.textContent;
        cloneDocument.body.appendChild(newScript);
      }
    }
  
    // Replace image URLs with base64 data
    const images = [...cloneDocument.querySelectorAll('img')];
    const totalImages = images.length;
    let downloadedImages = 0;
    imageCount.textContent = `Estamos baixando sua página: 0 / ${totalImages}`;
  
    for (const image of images) {
      const url = image.src;
      const extension = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
      const allowedExtensions = ['webp', 'jpg', 'jpeg', 'png'];
      if (allowedExtensions.includes(extension)) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        // await new Promise(async (resolve, reject) => {
        //   img.onload = function () {
        //     canvas.width = img.width;
        //     canvas.height = img.height;
        //     context.drawImage(img, 0, 0);
        //     const base64Data = canvas.toDataURL(`image/${extension}`);
        //     image.src = base64Data;
        //     downloadedImages++;
        //     imageCount.textContent = `Imagens baixadas: ${downloadedImages} / ${totalImages}`;
        //     resolve();
        //   };
        //   img.onerror = async function () {
        //     debugger
        //     try {
        //       const response = await fetch(url, { mode: 'no-cors' });
        //       const blob = await response.blob();
        //       const reader = new FileReader();
        //       reader.onloadend = function () {
        //         const base64Data = reader.result;
        //         image.src = base64Data;
        //         downloadedImages++;
        //         imageCount.textContent = `Imagens baixadas: ${downloadedImages} / ${totalImages}`;
        //         resolve();
        //       };
        //       reader.readAsDataURL(blob);
        //     } catch (error) {
        //       console.error(`Failed to load image: ${url}`, error);
        //       resolve();
        //     }
        //   };
        //   try {
        //     img.src = await this.getBase64Image(url);
        //   } catch (error) {
        //     console.error(`Failed to load image: ${url}`, error);
        //     img.src = '';
        //     resolve();
        //   }
        // });
        await new Promise(async (resolve, reject) => {
          img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            const base64Data = canvas.toDataURL(`image/${extension}`);
            image.src = base64Data;
            resolve();
          };
          try {
            img.src =  await this.getBase64Image(url);
            console.error(`Failed to load image: ${url}`, error);
            downloadedImages++;
            imageCount.textContent = `Imagens baixadas: ${downloadedImages} / ${totalImages}`;
            loadingSpinner.remove();
            reject();
          } catch (error) {
            console.error(`Failed to load image: ${url}`, error);
            img.src = '';
            downloadedImages++;
            imageCount.textContent = `Imagens baixadas: ${downloadedImages} / ${totalImages}`;
            loadingSpinner.remove();
            resolve();
          }
        });
      }
    }

    const visBugElement = cloneDocument.querySelector('vis-bug');
    const spin = cloneDocument.getElementById('loadingSpinner');
    if (visBugElement) {
      visBugElement.remove();
      spin.remove();
    }
    loadingSpinner.style.visibility = 'hidden';
    loadingSpinner.remove();
    imageCount.style.visibility = 'hidden';
    spin.remove();

    this.removeFacebookPixelsFromHeader(cloneDocument);
    this.removeCookies(cloneDocument);
    this.addPixelToHeader(this.pixelMeta, cloneDocument);
    const htmlContent = cloneDocument.documentElement.outerHTML;
    
    // if (!htmlContent.startsWith('<!DOCTYPE html>')) {
    //   htmlContent.innerHTML = '<!DOCTYPE html>' + htmlContent;
    // }

    // preciso inserir https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css no head
    const head = cloneDocument.head || cloneDocument.getElementsByTagName('head')[0];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    head.appendChild(link);
    
    this.globalPageContent = htmlContent;

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

  async downloadHtmlWithStylesAndScripts() {
    const imageCount = document.createElement('div');
    imageCount.id = 'imageCount';
    document.body.appendChild(imageCount);
  
    const cloneDocument = document.cloneNode(true);
    // Embed all stylesheets
    const styleSheets = [...document.styleSheets];
    for (const styleSheet of styleSheets) {
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
    }
  
    // Embed all scripts
    const scripts = [...document.scripts];
    for (const script of scripts) {
      if (script.src) {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        cloneDocument.body.appendChild(newScript);
      } else {
        const newScript = document.createElement('script');
        newScript.textContent = script.textContent;
        cloneDocument.body.appendChild(newScript);
      }
    }
  
    const visBugElement = cloneDocument.querySelector('vis-bug');
    if (visBugElement) {
      visBugElement.remove();
    }

    this.removeFacebookPixelsFromHeader(cloneDocument);
    //Rever pois em alguns casos não exibe o video
    // this.removeCookies(cloneDocument);
    if(this.pixelMeta !== '') {
      this.addPixelToHeader(this.pixelMeta, cloneDocument);
    }

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
  
  async getBase64Image(imageUrl) {
    try {
      const response = await fetch('https://api-aicopi.zapime.com.br/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
      }).then(res => {
        if (res.status === 500 || res.status === 404 || res.status === 400) {
          return ''
        } else {
          return res
        }
      })
      if (response === '') {
        return ''
      } else {
        const data = await response.json()
        return data.base64Image
      }
    } catch (error) {
      console.error('Error fetching base64 image:', error);
      return '';
    }
  }


  get activeTool() {

    if (this.active_tool === null || this.active_tool === undefined) {
      return
    } 
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
