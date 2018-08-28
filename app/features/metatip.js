import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { TinyColor } from '@ctrl/tinycolor'
import { queryPage } from './search'
import { getStyles, camelToDash, createClassname, isOffBounds, nodeKey } from './utils'

const metatipStyles = {
  host: `
    position: absolute;
    z-index: 99999;
    background: white;
    color: hsl(0,0%,20%);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    box-shadow: 0 0 0.5rem hsla(0,0%,0%,10%);
    border-radius: 0.25rem;
  `,
  h5: `
    display: flex;
    font-size: 1rem;
    font-weight: bolder;
    margin: 0;
  `,
  h6: `
    margin-top: 1rem;
    margin-bottom: 0;
    font-weight: normal;
  `,
  small: `
    font-size: 0.7rem;
    color: hsl(0,0%,60%);
  `,
  small_span: `
    color: hsl(0,0%,20%);
  `,
  brand: `
    color: hotpink;
  `,
  first_div: `
    display: grid;
    grid-template-columns: auto auto;
    grid-gap: 0.25rem 0.5rem;
    margin: 0.5rem 0 0;
    padding: 0;
    list-style-type: none;
    color: hsl(0,0%,40%);
    font-size: 0.8rem;
    font-family: 'Dank Mono', 'Operator Mono', 'Inconsolata', 'Fira Mono', 'SF Mono', 'Monaco', 'Droid Sans Mono', 'Source Code Pro', monospace;
  `,
  div_value: `
    color: hsl(0,0%,20%);
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
  `,
  div_color: `
    display: inline-block;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    margin-right: 0.25rem;
  `,
}

let tip_map = {}

// todo: 
// - node recycling (for new target) no need to create/delete
// - make single function create/update
export function MetaTip() {
  const template = ({target: el}) => {
    const { width, height } = el.getBoundingClientRect()
    const styles = getStyles(el)
      .map(style => Object.assign(style, {
        prop: camelToDash(style.prop)
      }))
      .filter(style => 
        style.prop.includes('font-family') 
          ? el.matches('h1,h2,h3,h4,h5,h6,p,a,date,caption,button,figcaption,nav,header,footer') 
          : true
      )
      .map(style => {
        if (style.prop.includes('color') || style.prop.includes('Color'))
          style.value = `<span color style="background-color:${style.value};${metatipStyles.div_color}"></span>${new TinyColor(style.value).toHslString()}`

        if (style.prop.includes('font-family') && style.value.length > 25)
          style.value = style.value.slice(0,25) + '...'

        // check if style is inline style, show indicator
        if (el.getAttribute('style') && el.getAttribute('style').includes(style.prop))
          style.value = `<span local-change>${style.value}</span>`
        
        return style
      })

    const localModifications = styles.filter(style =>
      el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
        ? 1
        : 0)

    const notLocalModifications = styles.filter(style =>
      el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
        ? 0
        : 1)
    
    let tip = document.createElement('div')
    tip.classList.add('pb-metatip')
    tip.style = metatipStyles.host
    tip.innerHTML = `
      <style>
        h5 > a {
          text-decoration: none;
          color: inherit;
        }
        h5 > a:hover { 
          color: hotpink; 
          text-decoration: underline;
        }
        h5 > a:empty { display: none; }
      </style>
      <h5 style="${metatipStyles.h5}">
        <a href="#">${el.nodeName.toLowerCase()}</a>
        <a href="#">${el.id && '#' + el.id}</a>
        ${createClassname(el).split('.')
          .filter(name => name != '')
          .reduce((links, name) => `
            ${links}
            <a href="#">.${name}</a>
          `, '')
        }
      </h5>
      <small style="${metatipStyles.small}">
        <span style="${metatipStyles.small_span}">${Math.round(width)}</span>px 
        <span divider style="${metatipStyles.brand}">×</span> 
        <span style="${metatipStyles.small_span}">${Math.round(height)}</span>px
      </small>
      <div style="${metatipStyles.first_div}">${notLocalModifications.reduce((items, item) => `
        ${items}
        <span prop>${item.prop}:</span>
        <span value style="${metatipStyles.div_value}">${item.value}</span>
      `, '')}</div>
      ${localModifications.length ? `
        <h6 style="${metatipStyles.h6}">Local Modifications</h6>
        <div style="${metatipStyles.first_div}">${localModifications.reduce((items, item) => `
          ${items}
          <span prop>${item.prop}:</span>
          <span value style="${metatipStyles.div_value}">${item.value}</span>
        `, '')}</div>
      ` : ''}
    `

    return tip
  }

  const tip_position = (node, e) => ({
    top: `${e.clientY > window.innerHeight / 2
      ? e.pageY - node.clientHeight
      : e.pageY}px`,
    left: `${e.clientX > window.innerWidth / 2
      ? e.pageX - node.clientWidth - 25
      : e.pageX + 25}px`,
  })

  const mouseOut = ({target}) => {
    if (tip_map[nodeKey(target)] && !target.hasAttribute('data-metatip')) {
      $(target).off('mouseout', mouseOut)
      $(target).off('click', togglePinned)
      tip_map[nodeKey(target)].tip.remove()
      delete tip_map[nodeKey(target)]
    }
  }

  const togglePinned = e => {
    if (e.altKey) {
      !e.target.hasAttribute('data-metatip')
        ? e.target.setAttribute('data-metatip', true)
        : e.target.removeAttribute('data-metatip')
    }
  }

  const linkQueryClicked = e => {
    e.preventDefault()
    e.stopPropagation()
    queryPage(e.target.textContent)
  }

  const mouseMove = e => {
    if (isOffBounds(e.target)) return

    e.altKey
      ? e.target.setAttribute('data-pinhover', true)
      : e.target.removeAttribute('data-pinhover')

    // if node is in our hash (already created)
    if (tip_map[nodeKey(e.target)]) {
      // return if it's pinned
      if (e.target.hasAttribute('data-metatip')) 
        return
      // otherwise update position
      const tip = tip_map[nodeKey(e.target)].tip
      const {left, top} = tip_position(tip, e) 
      tip.style.left  = left
      tip.style.top   = top 
    }
    // create new tip
    else {
      const tip = template(e)
      document.body.appendChild(tip)

      const {left, top} = tip_position(tip, e) 
      tip.style.left    = left
      tip.style.top     = top 

      $('a', tip).on('click', linkQueryClicked)
      $(e.target).on('mouseout DOMNodeRemoved', mouseOut)
      $(e.target).on('click', togglePinned)

      tip_map[nodeKey(e.target)] = { tip, e }

      // tip.animate([
      //   {transform: 'translateY(-5px)', opacity: 0},
      //   {transform: 'translateY(0)', opacity: 1}
      // ], 150)
    }
  }

  $('body').on('mousemove', mouseMove)

  hotkeys('esc', _ => removeAll())

  const hideAll = () =>
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.style.display = 'none'
        $(tip).off('mouseout', mouseOut)
        $(tip).off('click', togglePinned)
        $('a', tip).off('click', linkQueryClicked)
      })

  const removeAll = () => {
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.remove()
        $(tip).off('mouseout', mouseOut)
        $(tip).off('click', togglePinned)
        $('a', tip).off('click', linkQueryClicked)
      })
    
    $('[data-metatip]').attr('data-metatip', null)

    tip_map = {}
  }

  Object.values(tip_map)
    .forEach(({tip,e}) => {
      tip.style.display = 'block'
      tip.innerHTML = template(e).innerHTML
      tip.on('mouseout', mouseOut)
      tip.on('click', togglePinned)
    })

  return () => {
    $('body').off('mousemove', mouseMove)
    hotkeys.unbind('esc')
    hideAll()
  }
}