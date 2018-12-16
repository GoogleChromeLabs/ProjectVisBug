import * as Icons from './toolpallete.icons'
import { metaKey, altKey } from '../../utilities/'

export const ToolModel = {
  g: {
    tool:        'guides',
    icon:        Icons.guides,
    label:       'Guides',
    description: 'Verify alignment & check your grid',
    instruction: '',
  },
  i: {
    tool:        'inspector',
    icon:        Icons.inspector,
    label:       'Inspect',
    description: 'Peek into common & current styles of an element',
    instruction: `<div table>
                    <div>
                      <b>Pin it:</b>
                      <span>${altKey} + click</span>
                    </div>
                  </div>`,
  },
  x: {
    tool:        'accessibility',
    icon:        Icons.accessibility,
    label:       'Accessibility',
    description: 'Peek into A11y attributes & compliance status',
    instruction: `<div table>
                    <div>
                      <b>Pin it:</b>
                      <span>${altKey} + click</span>
                    </div>
                  </div>`,
  },
  v: {
    tool:        'move',
    icon:        Icons.move,
    label:       'Move',
    description: 'Push elements in & out of their container, or shuffle them within it',
    instruction: `<div table>
                    <div>
                      <b>Lateral:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Out and above:</b>
                      <span>▲</span>
                    </div>
                    <div>
                      <b>Down and in:</b>
                      <span>▼</span>
                    </div>
                  </div>`,
  },
  // r: {
  //   tool:        'resize',
  //   icon:        Icons.resize,
  //   label:       'Resize',
  //   description: ''
  // },
  m: {
    tool:        'margin',
    icon:        Icons.margin,
    label:       'Margin',
    description: 'Add or subtract outer space from any or all sides of the selected element(s)',
    instruction: `<div table>
                    <div>
                      <b>+ Margin:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>- Margin:</b>
                      <span>${altKey} + ◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>All Sides:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                  </div>`,
  },
  p: {
    tool:        'padding',
    icon:        Icons.padding,
    label:       'Padding',
    description: `Add or subtract inner space from any or all sides of the selected element(s)`,
    instruction: `<div table>
                    <div>
                      <b>+ Padding:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>- Padding:</b>
                      <span>${altKey} + ◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>All Sides:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                  </div>`
  },
  // b: {
  //   tool:        'border',
  //   icon:        Icons.border,
  //   label:       'Border',
  //   description: ''
  // },
  a: {
    tool:        'align',
    icon:        Icons.align,
    label:       'Flexbox Align',
    description: `Create or modify flexbox direction, distribution & alignment`,
    instruction: `<div table>
                    <div>
                      <b>Alignment:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Distribution:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Direction:</b>
                      <span>${metaKey} +  ◀ ▼</span>
                    </div>
                  </div>`,
  },
  h: {
    tool:        'hueshift',
    icon:        Icons.hueshift,
    label:       'Hue Shift',
    description: `Change foreground/background hue, brightness, saturation & opacity`,
    instruction: `<div table>
                    <div>
                      <b>Saturation:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Brightness:</b>
                      <span>▲ ▼</span>
                    </div>
                    <div>
                      <b>Hue:</b>
                      <span>${metaKey} +  ▲ ▼</span>
                    </div>
                    <div>
                      <b>Opacity:</b>
                      <span>${metaKey} +  ◀ ▶</span>
                    </div>
                  </div>`,
  },
  d: {
    tool:        'boxshadow',
    icon:        Icons.boxshadow,
    label:       'Shadow',
    description: `Create & adjust position, blur & opacity of a box shadow`,
    instruction: `<div table>
                    <div>
                      <b>X/Y Position:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Blur:</b>
                      <span>Shift + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Spread:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Opacity:</b>
                      <span>${metaKey} + ◀ ▶</span>
                    </div>
                  </div>`,
  },
  // t: {
  //   tool:        'transform',
  //   icon:        Icons.transform,
  //   label:       '3D Transform',
  //   description: ''
  // },
  l: {
    tool:        'position',
    icon:        Icons.position,
    label:       'Position',
    description: 'Move svg (x,y) and elements (top,left,bottom,right)',
    instruction: `<div table>
                    <div>
                      <b>Nudge:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Move:</b>
                      <span>Click & drag</span>
                    </div>
                  </div>`,
  },
  f: {
    tool:        'font',
    icon:        Icons.font,
    label:       'Font Styles',
    description: 'Change size, alignment, leading, letter-spacing, & weight',
    instruction: `<div table>
                    <div>
                      <b>Size:</b>
                      <span>▲ ▼</span>
                    </div>
                    <div>
                      <b>Alignment:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Leading:</b>
                      <span>Shift + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Letter-spacing:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Weight:</b>
                      <span>${metaKey} + ▲ ▼</span>
                    </div>
                  </div>`,
  },
  e: {
    tool:        'text',
    icon:        Icons.text,
    label:       'Edit Text',
    description: 'Change any text on the page with a <b>double click</b>',
    instruction: '',
  },
  // c: {
  //   tool:        'screenshot',
  //   icon:        Icons.camera,
  //   label:       'Screenshot',
  //   description: 'Screenshot selected elements or the entire page'
  // },
  s: {
    tool:        'search',
    icon:        Icons.search,
    label:       'Search',
    description: 'Select elements by searching for them',
    instruction: '',
  },
}
