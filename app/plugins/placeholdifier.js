import { loadStyles } from '../utilities/styles.js'

export const commands = [
    'placeholdifier',
]

export const description = 'turn the page into a live wireframe'

export default async function() {
    const stylesheet = document.createElement('link')
    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', 'https://unpkg.com/placeholdifier/placeholdifier.css')

    const ignored = ['script', 'link']
    const body = document.querySelector('body')
    const elements = Array.from(body.querySelectorAll('*'))
        .filter(el => !ignored.includes(el.tagName?.toLowerCase()))
    
    elements.forEach(el => {
        if (Array.from(el.classList).includes('placeholdify')) return;
        el.classList.add('placeholdify');
    })
}
