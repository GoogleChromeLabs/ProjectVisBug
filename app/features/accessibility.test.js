import test from 'ava'
import { setupPptrTab, teardownPptrTab, getActiveTool, changeMode } from '../../tests/helpers'

test.beforeEach(setupPptrTab)

const contrastValueSelector = `document.querySelector('visbug-ally').$shadow.querySelector('span[contrast]').textContent.trim()`

test('Can be activated', async t => {
  const {page} = t.context;
  await changeMode({page, tool: 'accessibility'})

  t.is(await getActiveTool(page), 'accessibility')
  t.pass()
})

// test('Can reveal color contrasts between html nodes and backgrounds', async t => {
//   const {page} = t.context;
//   await changeMode({page, tool: 'accessibility'})

//   await page.hover('.google-blue')
//   const blueContrastValue = await page.evaluate(contrastValueSelector)
//   t.is(blueContrastValue, "3.56")
//   t.pass()


//   await page.hover('.google-red')
//   const redContrastValue = await page.evaluate(contrastValueSelector)
//   t.is(redContrastValue, "4.29")
//   t.pass()

//   await page.hover('.google-yellow')
//   const yellowContrastValue = await page.evaluate(contrastValueSelector)
//   t.is(yellowContrastValue, "1.84")
//   t.pass()
// })

test('Does not show a11y tooltip on <svg> node', async t => {
  const {page} = t.context;
  await changeMode({page, tool: 'accessibility'})

  const svgEl = await page.$('svg')
  const {x, y} = await svgEl.boundingBox()
  await page.mouse.click(x + 1, y + 1) // an empty space of the first svg element
  const targetNodeName = await page.$eval('[data-selected="true"]', el => el.nodeName)
  t.is(targetNodeName, 'svg')
  t.pass()

  t.is(await page.$('visbug-ally'), null)
  t.pass()
})

test('Gets fill or stroke value first if the target is one of svg elements', async t => {
  const {page} = t.context;
  await changeMode({page, tool: 'accessibility'})

  await page.hover('svg')
  const pathContrastValue = await page.evaluate(contrastValueSelector)
  t.not(pathContrastValue, "10.44")
  t.pass()
})

test.afterEach(teardownPptrTab)
