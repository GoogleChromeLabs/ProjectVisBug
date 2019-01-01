import { commands as BlankPageCommands } from './blank-page'
import { commands as BarrelRollCommands } from './barrel-roll'

// todo: grab commands dynamically
const command_pool = [
  [BlankPageCommands, './blank-page.js'],
  [BarrelRollCommands, './barrel-roll.js'],
]

export const PluginRegistry = new Map()

command_pool.forEach(([plugin_commands, path]) =>
  plugin_commands.forEach(command => {
    if (PluginRegistry.has(command))
      throw new Error('Command already registered')
    else
      PluginRegistry.set(command, path)
  }))

export async function loadPlugin(command) {
  const path = PluginRegistry.get(command)
  return (await import(`../plugins/${path}`)).default()
}