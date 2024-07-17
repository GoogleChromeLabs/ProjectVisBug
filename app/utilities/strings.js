export const camelToDash = (camelString = "") =>
  camelString.replace(/([A-Z])/g, ($1) =>
    "-"+$1.toLowerCase())

export const nodeKey = node => {
  let tree = []
  let furthest_leaf = node

  while (furthest_leaf) {
    tree.push(furthest_leaf)
    furthest_leaf = furthest_leaf.parentNode
      ? furthest_leaf.parentNode
      : false
  }

  return tree.reduce((path, branch) => `
    ${path}${branch.tagName}_${branch.className}_${[...node.parentNode.children].indexOf(node)}_${node.children.length}
  `, '')
}

export const createClassname = (el, ellipse = false) => {
  if (!el.className) return ''

  const combined = Array.from(el.classList).reduce((classnames, classname) =>
    classnames += '.' + escapeSpecialCharacters(classname)
  , '')

  return ellipse && combined.length > 30
    ? combined.substring(0,30) + '...'
    : combined
}

const escapeSpecialCharacters = (query) =>
    Array.from(query)
      .map((char) => /[0-9a-zA-Z_\s-]/.test(char) ?  char : `\\${char}`)
      .join("")


export const metaKey = window.navigator.platform.includes('Mac')
  ? 'cmd'
  : 'ctrl'

export const altKey = window.navigator.platform.includes('Mac')
  ? 'opt'
  : 'alt'

export const notList = ':not(vis-bug):not(script):not(hotkey-map):not(.visbug-metatip):not(visbug-label):not(visbug-handles):not(visbug-corners):not(visbug-grip):not(visbug-gridlines)'
