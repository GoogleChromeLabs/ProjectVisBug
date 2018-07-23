import $ from 'blingblingjs'

let imgs = []

export function watchImagesForUpload() {
  imgs = $('img')

  clearWatchers(imgs)
  initWatchers(imgs)
}

const initWatchers = imgs => {
  imgs.on('dragover', onDragEnter)
  imgs.on('dragleave', onDragLeave)
  document.addEventListener('drop', onDrop)
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
  e.preventDefault()
}

const onDragLeave = e => {
  $(e.target).attr('data-droptarget', null)
}

const onDrop = async (e) => {
  e.preventDefault()
  $(e.target).attr('data-droptarget', null)

  const selectedImages = $('img[data-selected=true]')

  const srcs = await Promise.all(
    [...e.dataTransfer.files].map(previewFile))
  
  if (!selectedImages.length && e.target.nodeName === 'IMG')
    e.target.src = srcs[0]
  else {
    let i = 0
    selectedImages.forEach(img => {
      img.src = srcs[i++]
      if (i >= srcs.length) i = 0
    })
  }
}

const clearWatchers = imgs => {
  imgs.off('dragenter', onDragEnter)
  imgs.off('dragleave', onDragLeave)
  document.removeEventListener('drop', onDrop)
  imgs = []
}