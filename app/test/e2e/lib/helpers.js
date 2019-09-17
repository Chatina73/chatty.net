const config = require('./config')

const login = async function(page) {
  await page.evaluate(async config => {
    let data = {
      privKey: config.testPrivateKey,
      ethAddress: config.testEthAddress
    }

    // grabs the vuestore from the first element that has vue attached
    let x = document.querySelector('#app').__vue__.$store
    x.dispatch('addWallet', data)
    x.dispatch('updateSelectedAddress', { selectedAddress: data.ethAddress })
    x.dispatch('subscribeToControllers')
    await x.dispatch('initTorusKeyring', data)
  }, config)
}

const click = async function(page, selector) {
  try {
    await page.waitForSelector(selector, { visible: true })
    await page.click(selector)
  } catch (error) {
    throw new Error(`Could not click on selector: ${selector}`)
  }
}

const waitForText = async function(page, selector, text) {
  try {
    await page.waitForSelector(selector)
    await page.waitForFunction((selector, text) => document.querySelector(selector).innerText.includes(text), {}, selector, text)
  } catch (error) {
    throw new Error(`Text ${text} not found for selector: ${selector}`)
  }
}

const shouldExist = async function(page, selector) {
  try {
    await page.waitForSelector(selector, { visible: true })
  } catch (error) {
    throw new Error(`Selector ${selector} does not exist`)
  }
}

const navigateTo = async function(page, selector, pageContainer) {
  if (config.isMobile) {
    await click(page, '#menu-dropdown-mobile-btn')
    await page.waitFor(100)
    await click(page, `${selector}-mobile`)
    // wait for animation
    await page.waitFor(100)
    await shouldExist(page, pageContainer)
  } else {
    await click(page, selector)
    await shouldExist(page, pageContainer)
  }
}

const loadUrl = async function(page, url) {
  await page.goto(url, { waitUntil: 'networkidle0' })
}

const typeText = async function(page, text, selector) {
  try {
    await page.waitForSelector(selector, { visible: true })
    await page.type(selector, text)
  } catch (error) {
    throw new Error(`Could not text into selector: ${selector}`)
  }
}

const shouldTextNotBeEmpty = async function(page, selector) {
  try {
    await page.waitForSelector(selector)
    await page.waitForFunction(selector => document.querySelector(selector).innerText !== '', {}, selector)
  } catch (error) {
    throw new Error(`Inner text empty for selector: ${selector}`)
  }
}

const shouldValueNotBeEmpty = async function(page, selector) {
  try {
    await page.waitForSelector(selector)
    await page.waitForFunction(selector => document.querySelector(selector).value !== '', {}, selector)
  } catch (error) {
    throw new Error(`Value text empty for for selector: ${selector}`)
  }
}

const selectItem = async function(page, selector, selectorContainer, text) {
  try {
    await click(page, selector)
    await page.evaluate(text => {
      let options = [...document.querySelectorAll('.v-list-item__title')]
      options.forEach(function(option) {
        if (option.innerText == text) option.click()
      })
    }, text)

    await waitForText(page, `${selectorContainer} .v-select__selection`, text)
  } catch (error) {
    throw new Error(`Option ${text} not found for selector: ${selector}`)
  }
}

module.exports = {
  login,
  click,
  waitForText,
  shouldExist,
  navigateTo,
  loadUrl,
  typeText,
  shouldTextNotBeEmpty,
  shouldValueNotBeEmpty,
  selectItem
}
