export const commands = [
  'download-images',
  'download-all-images',
]

export default async function () {
  if (window.showDirectoryPicker === undefined) {
    console.log('no directory support :(')
    return;
  }
  const dirHandle = await window.showDirectoryPicker()
  const imgs = document.querySelectorAll("img")

  imgs.forEach(async (img) => {
    const url = img.src
    const name = url.substr(url.lastIndexOf('/') + 1);
    try {
      const response = await fetch(url)
      const file = await dirHandle.getFileHandle(name, { create: true })
      const writable = await file.createWritable()
      await response.body.pipeTo(writable)
    } catch (err) {
      console.error(err)
    }
  })
  // CSS urls
  let css_urls = [...document.styleSheets]
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
      urls.push(style.backgroundImage);
      return urls;
    }, []);

  css_urls.forEach(async (item, i) => {
    let cots = false;
    let start = item.indexOf('(');
    if (item.charAt(start + 1) == '"') cots = true;
    let end = item.lastIndexOf(')');
    if (cots) {
      start += 2;
      end -= 6;
    }
    const url = item.substr(start, end);
    const name = `css-${i + 1}.jpg`;
    try {
      const response = await fetch(url)
      const file = await dirHandle.getFileHandle(name, { create: true })
      const writable = await file.createWritable()
      await response.body.pipeTo(writable)
    } catch (err) {
      console.error(err)
    }
  })
}
