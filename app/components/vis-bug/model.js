import * as Icons from './vis-bug.icons'
import { metaKey, altKey } from '../../utilities/'

export const VisBugModel = {
  g: {
    tool:        'guides',
    icon:        Icons.guides,
    label:       '<span><u>G</u>uides</span>',
    description: 'Verify alignment & measure distances',
    instruction: `<div table>
                    <div>
                      <b>Element Guides:</b>
                      <span>hover</span>
                    </div>
                    <div>
                      <b>Measure:</b>
                      <span>click+hover</span>
                    </div>
                    <div>
                      <b>Sticky Measurements:</b>
                      <span>shift+click</span>
                    </div>
                  </div>`,
  },
  i: {
    tool:        'inspector',
    icon:        Icons.inspector,
    label:       '<span><u>I</u>nspect</span>',
    description: 'Peek into common & current styles of an element',
    instruction: `<div table>
                    <div>
                      <b>Pin it:</b>
                      <span>click</span>
                    </div>
                    <div>
                      <b>Position it:</b>
                      <span>click & drag by the header area</span>
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
                      <span>click</span>
                    </div>
                  </div>`,
  },
  v: {
    tool:        'move',
    icon:        Icons.move,
    label:       '<span>Mo<u>v</u>e</span>',
    description: 'Move elements laterally or in, out, over, and under',
    instruction: `<div table>
                    <div>
                      <b>Lateral:</b>
                      <span>click container ⇒ drag child</span>
                    </div>
                    <div>
                      <b>Lateral:</b>
                      <span>◀ ▶</span>
                    </div>
                    <div>
                      <b>Out and above:</b>
                      <span>▲</span>
                    </div>
                    <div>
                      <b>Down+in, out+under:</b>
                      <span>▼</span>
                    </div>
                    <div>
                      <b>Trainer:</b>
                      <span>shift + /</span>
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
    label:       '<span><u>M</u>argin</span>',
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
                    <div>
                      <b>Trainer:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  p: {
    tool:        'padding',
    icon:        Icons.padding,
    label:       '<span><u>P</u>adding</span>',
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
                    <div>
                      <b>Trainer:</b>
                      <span>shift + /</span>
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
    label:       '<span>Flexbox <u>A</u>lign</span>',
    description: `Create or modify flexbox direction, distribution, order & wrapping`,
    instruction: `<div table>
                    <div>
                      <b>Rows:</b>
                      <span>${metaKey} + ▼</span>
                    </div>
                    <div>
                      <b>Columns:</b>
                      <span>${metaKey} + ▶</span>
                    </div>
                    <div>
                      <b>Alignment:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Distribution:</b>
                      <span>Shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Order:</b>
                      <span>${metaKey} + shift + ◀ ▶</span>
                    </div>
                    <div>
                      <b>Wrapping:</b>
                      <span>${metaKey} + shift + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Trainer:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  h: {
    tool:        'hueshift',
    icon:        Icons.hueshift,
    label:       '<span><u>H</u>ue Shift</span>',
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
                    <div>
                      <b>Trainer:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  d: {
    tool:        'boxshadow',
    icon:        Icons.boxshadow,
    label:       '<span>Sha<u>d</u>ow</span>',
    description: `Create & adjust position, blur & opacity of a box shadow`,
    instruction: `<div table>
                    <div>
                      <b>X/Y Position:</b>
                      <span>◀ ▶ ▲ ▼</span>
                    </div>
                    <div>
                      <b>Blur:</b>
                      <span>${altKey} + ▲ ▼</span>
                    </div>
                    <div>
                      <b>Spread:</b>
                      <span>${altKey} + ◀ ▶</span>
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
    label:       '<span><u>F</u>ont Styles</span>',
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
                    <div>
                      <b>Trainer:</b>
                      <span>shift + /</span>
                    </div>
                  </div>`,
  },
  e: {
    tool:        'text',
    icon:        Icons.text,
    label:       '<span><u>E</u>dit Text</span>',
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
    label:       '<span><u>S</u>earch</span>',
    description: 'Select elements programatically by searching for them or use built in plugins with special commands',
    instruction: '',
  },
}
