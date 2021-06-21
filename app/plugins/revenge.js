// http://heydonworks.com/revenge_css_bookmarklet/

import { loadStyles } from '../utilities/styles.js'

export const commands = [
  'revenge',
  'revenge.css',
  'heydon',
]

export const description = 'show error boxes in comic sans that point out bad HTML'

export default async function() {
  await loadStyles(['https://cdn.jsdelivr.net/gh/Heydon/REVENGE.CSS@master/revenge.css'])
}