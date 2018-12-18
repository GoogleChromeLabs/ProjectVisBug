const changeMode = async ({page, tool}) =>
  await page.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool=${tool}]').click()`)

const getActiveTool = async page =>
  await page.$eval('tool-pallete', el => 
    el.activeTool)

export {
  changeMode,
  getActiveTool,
}