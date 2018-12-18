import test from 'ava'
import puppeteer from 'puppeteer'

const marginMode = async page =>
  await page.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool="margin"]').click()`)

const getActiveTool = async page =>
  await page.$eval('tool-pallete', el => el.activeTool)

const getMarginTop = async page =>
  await page.$eval('[intro] h2', el => el.style.marginTop)

test.beforeEach(async t => {
  t.context.browser  = await puppeteer.launch()
  t.context.page     = await t.context.browser.newPage()

  await t.context.page.goto('http://localhost:3000')
  await marginMode(t.context.page)
})

test('Can Be Activated', async t => {
  t.is(await getActiveTool(t.context.page), 'margin')
  t.pass()
})

test('Can Be Deactivated', async t => {
  const { page } = t.context

  t.is(await getActiveTool(page), 'margin')
  await page.evaluateHandle(`document.querySelector('tool-pallete').shadowRoot.querySelector('li[data-tool="padding"]').click()`)
  t.is(await getActiveTool(page), 'padding')

  t.pass()
})

test('Adds margin to side', async t => {
  const { page } = t.context

  await page.evaluateHandle(`document.querySelector('[intro] h2').click()`)
  t.is(await getMarginTop(page), '')

  await page.keyboard.press('ArrowUp')

  t.is(await getMarginTop(page), '1px')

  t.pass()
})

test('Remove margin from side', async t => {
  const { page } = t.context

  await page.evaluateHandle(`document.querySelector('[intro] h2').click()`)
  t.is(await getMarginTop(page), '')

  await page.keyboard.press('ArrowUp', { delay: 10 })
  await page.keyboard.press('ArrowUp', { delay: 10 })

  t.is(await getMarginTop(page), '2px')

  await page.keyboard.down('Alt')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up('Alt')

  t.is(await getMarginTop(page), '1px')

  t.pass()
})

test.afterEach(async ({context:{ page, browser }}) => {
  await page.close()
  await browser.close()
})
