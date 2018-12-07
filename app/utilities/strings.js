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
  if (!el.className || el.nodeName === 'svg' || el.ownerSVGElement) return ''
  let rawClassname = '.' + el.className.replace(/ /g, '.')

  return ellipse && rawClassname.length > 30
    ? rawClassname.substring(0,30) + '...'
    : rawClassname
}

export const metaKey = window.navigator.platform.includes('Mac')
  ? 'cmd'
  : 'ctrl'

export const altKey = window.navigator.platform.includes('Mac')
  ? 'opt'
  : 'alt'
