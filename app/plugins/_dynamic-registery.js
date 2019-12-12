const entries = [
  'blank-page.js',
  'barrel-roll.js',
  'pesticide.js',
  'construct.js',
  'construct.debug.js',
  'zindex.js',
]

const PluginRegistry = new Map()

entries.forEach(async entry => {
  const { commands } = await import(`./plugins/${entry}`)

  commands.forEach(command => {
    if (PluginRegistry.has(command))
      throw new Error('Command already registered')
    else
      PluginRegistry.set(command, entry)
  })
})

const loadPlugin = async command => {
  const path = PluginRegistry.get(command)
  return (await import(`../plugins/${path}`)).default(command)
}

export {
  PluginRegistry,
  loadPlugin,
}