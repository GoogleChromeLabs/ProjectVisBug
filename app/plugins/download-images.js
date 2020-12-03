export const commands = [
  'download-images',
  'download-all-images',
]

export default async function() {
  const dirHandle = await window.showDirectoryPicker()
  const imgs = document.querySelectorAll("img")
  let i = 0

  imgs.forEach(async (img) => {
    const url = img.src
    const name = `img-${i}.png`
    i++

    try {
      console.log(`Fetching ${url}`)
      const response = await fetch(url)

      console.log(`Saving to ${name}`)

      const file = await dirHandle.getFileHandle(name, { create: true })
      const writable = await file.createWritable()
      await response.body.pipeTo(writable)
    } catch (err) {
      console.error(err)
    }
  })
}
