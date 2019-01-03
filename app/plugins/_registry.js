import { commands as translate_commands, default as TranslatePlugin } from './translate'
import { commands as blank_page_commands, default as BlankPagePlugin } from './blank-page'
import { commands as barrel_roll_commands, default as BarrelRollPlugin } from './barrel-roll'
import { commands as pesticide_commands, default as PesticidePlugin } from './pesticide'
import { commands as construct_commands, default as ConstructPlugin } from './construct'
import { commands as construct_debug_commands, default as ConstructDebugPlugin } from './construct.debug'

export const PluginRegistry = new Map(Object.entries(
  ...translate_commands.map(command =>        ({[command]:TranslatePlugin})),
  ...blank_page_commands.map(command =>       ({[command]:BlankPagePlugin})),
  ...barrel_roll_commands.map(command =>      ({[command]:BarrelRollPlugin})),
  ...pesticide_commands.map(command =>        ({[command]:PesticidePlugin})),
  ...construct_commands.map(command =>        ({[command]:ConstructPlugin})),
  ...construct_debug_commands.map(command =>  ({[command]:ConstructDebugPlugin})),
))
