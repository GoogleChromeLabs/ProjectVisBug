const changeMode = async ({page, tool}) =>
  await page.evaluateHandle(`document.querySelector('vis-bug').$shadow.querySelector('li[data-tool=${tool}]').click()`)

const getActiveTool = async page =>
  await page.$eval('vis-bug', el =>
    el.activeTool)

export {
  changeMode,
  getActiveTool,
}
