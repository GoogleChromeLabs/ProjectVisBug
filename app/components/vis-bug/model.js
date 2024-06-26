import * as Icons from './vis-bug.icons'
import { metaKey, altKey } from '../../utilities/'

export const VisBugModel = {
  g: {
    tool:        'Régua',
    icon:        Icons.guides,
    label:       '<span><u>G</u>uia</span>',
    description: 'Verifique o alinhamento e meça as distâncias',
    instruction: `<div table>
                    <div>
                      <b>Guias de elementos:</b>
                      <span>hover</span>
                    </div>
                    <div>
                      <b>Medida:</b>
                      <span>click+hover</span>
                    </div>
                    <div>
                      <b>Medir vários:</b>
                      <span>shift+click</span>
                    </div>
                    <div>
                      <b>Limpar:</b>
                      <span>esc</span>
                    </div>
                  </div>`,
  },
  i: {
    tool:        'inspector',
    icon:        Icons.inspector,
    label:       '<span><u>I</u>nspecionar</span>',
    description: 'Inspeccione os estilos comuns de um elemento',
    instruction: `<div table>
                    <div>
                      <b>Fixar:</b>
                      <span>clique</span>
                    </div>
                    <div>
                      <b>Fixar vários:</b>
                      <span>shift+clique</span>
                    </div>
                    <div>
                      <b>Posicionar:</b>
                      <span>clique e arraste pela área do cabeçalho</span>
                    </div>
                    <div>
                      <b>Limpar:</b>
                      <span>esc</span>
                    </div>
                  </div>`,
  },
  // x: {
  //   tool:        'accessibility',
  //   icon:        Icons.accessibility,
  //   label:       'Acessibilidade',
  //   description: 'Inspect attributes & contrast compliance',
  //   instruction: `<div table>
  //                   <div>
  //                     <b>Fixar:</b>
  //                     <span>clique</span>
  //                   </div>
  //                   <div>
  //                     <b>Fixar vários:</b>
  //                     <span>shift+clique</span>
  //                   </div>
  //                   <div>
  //                     <b>Limpar:</b>
  //                     <span>esc</span>
  //                   </div>
  //                 </div>`,
  // },
  l: {
    tool:        'position',
    icon:        Icons.position,
    label:       'Posição',
    description: 'Agarre e posicione elementos em qualquer lugar',
    instruction: `<div table>
                    <div>
                      <b>Deslocar:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Colocar:</b>
                      <span>Clique e arraste</span>
                    </div>
                    <div>
                      <b>Restaurar:</b>
                      <span>${altKey} + delete</span>
                    </div>
                  </div>`,
  },
  m: {
    tool:        'margin',
    icon:        Icons.margin,
    label:       '<span><u>M</u>argem</span>',
    description: 'Ajustar espaçamento externo',
    instruction: `<div table>
                    <div>
                      <b>+ Margem:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>- Margem:</b>
                      <span>${altKey} + ◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Todos os Lados:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                    <div>
                      <b>Formador:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  p: {
    tool:        'padding',
    icon:        Icons.padding,
    label:       '<span><u>P</u>adding</span>',
    description: 'Ajustar espaçamento interno',
    instruction: `<div table>
                    <div>
                      <b>+ Preenchimento:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>- Preenchimento:</b>
                      <span>${altKey} + ◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Todos os Lados:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                    <div>
                      <b>Formador:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`
  },
  // b: {
  //   tool:        'border',
  //   icon:        Icons.border,
  //   label:       'Borda',
  //   description: ''
  // },
  a: {
    tool:        'align',
    icon:        Icons.align,
    label:       '<span><u>A</u>linhamento Flexbox</span>',
    description: 'Ajustar características de layout flexível',
    instruction: `<div table>
                    <div>
                      <b>Linhas:</b>
                      <span>${metaKey} + ▼</span>
                    </div>
                    <div>
                      <b>Colunas:</b>
                      <span>${metaKey} + ▶</span>
                    </div>
                    <div>
                      <b>Alinhamento:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Distribuição:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Ordem:</b>
                      <span>${metaKey} + shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Embrulho:</b>
                      <span>${metaKey} + shift + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Formador:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  v: {
    tool:        'move',
    icon:        Icons.move,
    label:       '<span><u>M</u>ovimento</span>',
    description: 'Mude a posição dos elementos',
    instruction: `<div table>
                    <div>
                      <b>Lateral:</b>
                      <span>clique no contêiner ⇒ arraste o filho</span>
                    </div>
                    <div>
                      <b>Lateral:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Fora e acima:</b>
                      <span>▲</span>
                    </div>
                    <div>
                      <b>Abaixo e dentro, fora e sob:</b>
                      <span>▼</span>
                    </div>
                    <div>
                      <b>Formador:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  // h: {
  //   tool:        'hueshift',
  //   icon:        Icons.hueshift,
  //   label:       '<span><u>M</u>udança de Matiz</span>',
  //   description: ``,
  //   instruction: `<div table>
  //                   <div>
  //                     <b>Saturação:</b>
  //                     <span>◀ ▶</span>
  //                   </div>
  //                   <div>
  //                     <b>Brilho:</b>
  //                     <span>▲ ▼</span>
  //                   </div>
  //                   <div>
  //                     <b>Matiz:</b>
  //                     <span>${metaKey} +  ▲ ▼</span>
  //                   </div>
  //                   <div>
  //                     <b>Opacidade:</b>
  //                     <span>${metaKey} +  ◀ ▶</span>
  //                   </div>
  //                   <div>
  //                     <b>Formador:</b>
  //                     <span>shift + /</span>
  //                   </div>
  //                 </div>`,
  // },
  d: {
    tool:        'boxshadow',
    icon:        Icons.boxshadow,
    label:       '<span>Sombreamento</span>',
    description: ``,
    instruction: `<div table>
                    <div>
                      <b>Posição X/Y:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Borrar:</b>
                      <span>${altKey} + ▲ ▼</span>
                    </div>
                    <div>
                    <b>Espalhar:</b>
                      <span>${altKey} + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Opacidade:</b>
                      <span>${metaKey} + ◀ ▶</span>
                    </div>
                  </div>`,
  },
  // t: {
  //   tool:        'transform',
  //   icon:        Icons.transform,
  //   label:       'Transformação 3D',
  //   description: ''
  // },
  f: {
    tool:        'font',
    icon:        Icons.font,
    label:       '<span><u>F</u>ontes</span>',
    description: '',
    instruction: `<div table>
                    <div>
                      <b>Tamanho:</b>
                      <span>▲ ▼</span>
                    </div>
                    <div>
                      <b>Alinhamento:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Leading:</b>
                      <span>Shift + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Espaçamento de letras:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Peso:</b>
                      <span>${metaKey} + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Formador:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  e: {
    tool:        'text',
    icon:        Icons.text,
    label:       '<span><u>E</u>ditar Texto</span>',
    description: 'Basta dar <b>duplo clique</b> em qualquer texto na página',
    instruction: '',
  },
  // c: {
  //   tool:        'screenshot',
  //   icon:        Icons.camera,
  //   label:       'Captura de Tela',
  //   description: 'Captura elementos selecionados ou a página inteira'
  // },
  // s: {
  //   tool:        'search',
  //   icon:        Icons.search,
  //   label:       '<span><u>P</u>esquisar</span>',
  //   description: 'Selecione elementos programaticamente procurando por eles ou use plugins integrados com comandos especiais',
  //   instruction: '',
  // },
  w: {
    tool:        'download',
    icon:        Icons.download,
    label:       '<span>Baixar HTML</span>',
    description: `Baixa o HTML da página`,
    instruction: ``,
  },
  y: {
    tool:        'addPixel',
    icon:        Icons.facebook_pixel,
    label:       '<span>Pixel Facebbok</span>',
    description: `Adiciona pixel do facebook`,
    instruction: ``,
  }
//   j: {
//     tool:        'switchViewtodesktop',
//     icon:        Icons.desktop,
//     label:       '<span>Change Image</span>',
//     description: `Baixa o HTML da página`,
//     instruction: ``,
//   }
}

