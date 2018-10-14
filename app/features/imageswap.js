import $ from 'blingblingjs'
import { getStyle } from '../utilities/'

let imgs      = []
  , overlays  = []

export function watchImagesForUpload() {
  imgs = $([
    ...document.images,
    ...findBackgroundImages(document),
  ])

  clearWatchers(imgs)
  initWatchers(imgs)
}

const initWatchers = imgs => {
  imgs.on('dragover', onDragEnter)
  imgs.on('dragleave', onDragLeave)
  imgs.on('drop', onDrop)
  $(document.body).on('dragover', onDragEnter)
  $(document.body).on('dragleave', onDragLeave)
  $(document.body).on('drop', onDrop)
}

const clearWatchers = imgs => {
  imgs.off('dragenter', onDragEnter)
  imgs.off('dragleave', onDragLeave)
  imgs.off('drop', onDrop)
  $(document.body).off('dragenter', onDragEnter)
  $(document.body).off('dragleave', onDragLeave)
  $(document.body).off('drop', onDrop)
  imgs = []
}

const previewFile = file => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => resolve(reader.result)
  })
}

const onDragEnter = e => {
  e.preventDefault()
  const pre_selected = $('img[data-selected=true]')

  if (!pre_selected.length)
    showOverlay(e.currentTarget, 0)
  else
    pre_selected.forEach((img, i) =>
      showOverlay(img, i))
}

const onDragLeave = e => 
  hideOverlays()

const onDrop = async e => {
  e.stopPropagation()
  e.preventDefault()

  const selectedImages = $('img[data-selected=true]')

  const srcs = await Promise.all(
    [...e.dataTransfer.files].map(previewFile))
  
  if (!selectedImages.length)
    if (e.target.nodeName === 'IMG')
      e.target.src = srcs[0]
    else
      imgs
        .filter(img => img.contains(e.target))
        .forEach(img => 
          img.style.backgroundImage = `url(${srcs[0]})`)
  else if (selectedImages.length) {
    let i = 0
    selectedImages.forEach(img => {
      img.src = srcs[i++]
      if (i >= srcs.length) i = 0
    })
  }

  hideOverlays()
}

const showOverlay = (node, i) => {
  const rect    = node.getBoundingClientRect()
  const overlay = overlays[i]

  if (overlay) {
    overlay.update = rect
  }
  else {
    overlays[i] = document.createElement('pb-overlay')
    overlays[i].position = rect
    document.body.appendChild(overlays[i])
  }
}

const hideOverlays = () => {
  overlays.forEach(overlay =>
    overlay.remove())
  overlays = []
}

const findBackgroundImages = el => {
  const src_regex = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i

  return $('*').reduce((collection, node) => {
    const prop = getStyle(node, 'background-image')
    const match = src_regex.exec(prop)

    // if (match) collection.push(match[1])
    if (match) collection.push(node)

    return collection
  }, [])
}