export function windowBounds() {
//   const height  = window.innerHeight
//   const width   = window.innerWidth
//   const body    = document.documentElement.clientWidth
// 
//   const calcWidth = body <= width
//     ? body
//     : width

  return {
    winHeight: document.body.clientHeight,
    winWidth:  document.body.clientWidth,
  }
}
