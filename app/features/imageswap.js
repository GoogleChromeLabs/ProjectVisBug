import $ from 'blingblingjs'

let imgs = []
let dropzone_tmpl = `<input type="file" style="
  position: absolute; 
  top:0; right:0; left:0; bottom:0;
  z-index:9;
"/>`

export function watchImagesForUpload(selected) {
  imgs = selected.filter(el => el.nodeName == 'IMG')

  !imgs.length
    ? clearWatchers(imgs)
    : initWatchers(imgs)
}

const initWatchers = imgs => {
  imgs.forEach(img => {
    const $img = $(img)
    $img.on('dragenter dragover', onDragEnter)
    $img.on('dragleave', onDragLeave)
  })
}

const previewFile = file => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => resolve(reader.result)
  })
}

const onDragEnter = e => {
  $(e.target).attr('data-droptarget', true)
  // show highlight
  // create drag zone node and append
  // ensure parent has position rel
  // setup listener on dropzone
  console.log('dragenter')
}

const onDragLeave = e => {
  $(e.target).attr('data-droptarget', null)
  // remove highlight
  // remove dropzone
  // remove parent position relative
  // remove listeners
  console.log('dragleave')
}

const onDrop = async (e) => {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.effectAllowed = 'none'
  e.dataTransfer.dropEffect = 'none'

  $(e.target).attr('data-droptarget', null)
  const srcs = await Promise.all(
    [...dt.files].map(previewFile))
  console.log(srcs)
}

const clearWatchers = imgs => {
  imgs.forEach(img => {
    const $img = $(img)
    $img.off('dragenter dragover', onDragEnter)
    $img.off('dragleave', onDragLeave)
  })
  imgs = []
}