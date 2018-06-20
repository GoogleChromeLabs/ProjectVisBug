import ToolPallete from './components/toolpallete.element'

import { Selectable } from './features/selectable'
import { Moveable } from './features/move'

Selectable('.box')
Moveable('[data-selected=true]')