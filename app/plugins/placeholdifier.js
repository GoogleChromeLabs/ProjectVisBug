export const commands = [
    'placeholdifier',
]

export const description = 'turn the page into a live wireframe'

export default async function() {
    const stylesheet = document.createElement('link')
    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', 'https://unpkg.com/placeholdifier/placeholdifier.css')
    document.head.appendChild(stylesheet)

    const ignored = ['script', 'link']
    const body = document.querySelector('body')
    const elements = Array.from(body.querySelectorAll('*'))
        .filter(el => {
            if (!el || !el.tagName) return
            return !ignored.includes(el.tagName.toLowerCase())
        })
    
    elements.forEach(el => {
        if (Array.from(el.classList).includes('placeholdify')) return;
        el.classList.add('placeholdify');
    })
}
