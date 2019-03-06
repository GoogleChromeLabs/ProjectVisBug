import test from 'ava'
import puppeteer from 'puppeteer'

import { changeMode, getActiveTool } from '../../tests/helpers'

const getMarginTop = async page =>
  await page.$eval('[intro] b', el => el.style.marginTop)

test.beforeEach(async t => {
  t.context.browser  = await puppeteer.launch()
  t.context.page     = await t.context.browser.newPage()

  await t.context.page.goto('http://localhost:3000')
  await changeMode({
    page: t.context.page,
    tool: 'margin'
  })
})

test('Can Be Activated', async t => {
  const { page } = t.context
  t.is(await getActiveTool(page), 'margin')
  t.pass()
})

test('Can Be Deactivated', async t => {
  const { page } = t.context

  t.is(await getActiveTool(page), 'margin')
  await page.evaluateHandle(`document.querySelector('vis-bug').$shadow.querySelector('li[data-tool="padding"]').click()`)
  t.is(await getActiveTool(page), 'padding')

  t.pass()
})

test('Adds margin to side', async t => {
  const { page } = t.context

  await page.click(`[intro] h2`)

  t.is(await getMarginTop(page), '')

  await page.keyboard.press('ArrowUp')

  t.is(await getMarginTop(page), '1px')

  t.pass()
})

test('Remove margin from side', async t => {
  const { page } = t.context

  await page.click(`[intro] h2`)
  t.is(await getMarginTop(page), '')

  await page.keyboard.press('ArrowUp')
  t.is(await getMarginTop(page), '1px')

  await page.keyboard.down('Alt')
  await page.keyboard.down('ArrowUp')
  await page.keyboard.up('Alt')
  await page.keyboard.up('ArrowUp')
  t.is(await getMarginTop(page), '0px')

  t.pass()
})

test('Can change values by 10 with shift key', async t => {
  const { page } = t.context

  await page.click(`[intro] h2`)
  t.is(await getMarginTop(page), '')

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up('Shift')
  t.is(await getMarginTop(page), '10px')

  t.pass()
})

test.afterEach(async ({context:{ page, browser }}) => {
  await page.close()
  await browser.close()
})
