export const commands = [
  'download-images',
  'download-all-images',
]

const fetchAndWrite = async ({url, filename}, dirHandle) => {
  try {
    const response = await fetch(url)
    const file = await dirHandle.getFileHandle(
      filename.length > 40
        ? filename.substr(0, 40)
        : filename, 
      { create: true }
    )
    const writable = await file.createWritable()

    return await response.body.pipeTo(writable)
  } catch (err) {
    console.error(err)
    throw new Error(err)
  }
}

export default async function () {
  if (window.showDirectoryPicker === undefined) {
    alert('missing the Directory Picker api 🙁')
    return
  }

  const imgs = [...document.querySelectorAll("img")]
    .filter(img => img.src)
    .map(img => ({
      url: img.src,
      filename: img.src.substr(img.src.lastIndexOf('/') + 1),
    }))

  const css_urls = [...document.styleSheets]
    .filter(sheet => {
      try { return sheet.cssRules }
      catch { }
    })
    .flatMap(sheet => Array.from(sheet.cssRules))
    .filter(rule => rule.style)
    .filter(rule => rule.style.backgroundImage !== '')
    .filter(rule => rule.style.backgroundImage !== 'initial')
    .filter(rule => rule.style.backgroundImage.includes("url"))
    .reduce((urls, { style }) => {
      let filename = ''
      let url = ''

      let cots = false
      let start = style.backgroundImage.indexOf('(')
      if (style.backgroundImage.charAt(start + 1) == '"') cots = true
      let end = style.backgroundImage.lastIndexOf(')')
      if (cots) {
        start += 2
        end -= 6
      }
      url = style.backgroundImage.substr(start, end)

      const hasParams = url.indexOf("?")
      if (hasParams > 0)
        url = url.substr(0, hasParams)

      filename = url.substr(url.lastIndexOf('/') + 1)

      urls.push({
        url,
        filename: filename
          ? filename
          : url,
      })
      return urls
    }, [])

  if (!confirm(`Download around ${imgs.length + css_urls.length} images?`)) return
  const dirHandle = await window.showDirectoryPicker()

  const downloads = [...imgs, ...css_urls]
    .map(image =>
      fetchAndWrite(image, dirHandle))

  const results = await Promise.allSettled(downloads)
  const successes = results.filter(res => res.status == 'fulfilled')

  confirm(`Successfully downloaded ${successes.length} images 👍`)
}
