import log from 'loglevel'

import router from '../router'
import torus from '../torus'
import { ACCOUNT_TYPE, THRESHOLD_KEY_QUESTION_INPUT, THRESHOLD_KEY_STORE_DEVICE_FLOW } from '../utils/enums'

const { torusController } = torus || {}
const { thresholdKeyController } = torusController || {}

export default {
  async addTKey({ dispatch, state }, { postboxKey, calledFromEmbed }) {
    try {
      let finalKey = postboxKey
      if (!finalKey) {
        const postboxWallet = Object.keys(state.wallet).find((x) => state.wallet[x].accountType === ACCOUNT_TYPE.NORMAL)
        const { privateKey, accountType } = state.wallet[postboxWallet]
        finalKey = {
          ethAddress: postboxWallet,
          privKey: privateKey,
          accountType,
        }
      }
      const thresholdKey = await thresholdKeyController.login(finalKey.privKey)
      log.info('tkey 2', thresholdKey)
      return dispatch('initTorusKeyring', {
        keys: [{ ...thresholdKey, accountType: ACCOUNT_TYPE.THRESHOLD }],
        calledFromEmbed,
        rehydrate: false,
        postboxAddress: finalKey.ethAddress,
      })
    } catch (error) {
      // tkey login failed. Allow normal google one to proceed through
      log.error(error)
      return []
    }
  },
  async createNewTKey({ state, dispatch, commit }, payload) {
    const normalAccount = Object.values(state.wallet).find((x) => x.accountType === ACCOUNT_TYPE.NORMAL)
    const thresholdKey = await thresholdKeyController.createNewTKey({ postboxKey: normalAccount.privateKey, ...payload })
    log.info('tkey 2', thresholdKey)
    await dispatch('initTorusKeyring', {
      keys: [{ ...thresholdKey, accountType: ACCOUNT_TYPE.THRESHOLD }],
      calledFromEmbed: false,
      rehydrate: false,
    })
    commit('setTkeyExists', true)
    dispatch('updateSelectedAddress', { selectedAddress: thresholdKey.ethAddress }) // synchronous
  },
  addPassword(_, payload) {
    return thresholdKeyController.addPassword(payload)
  },
  changePassword(_, payload) {
    return thresholdKeyController.changePassword(payload)
  },
  downloadShare(_, payload) {
    return thresholdKeyController.downloadShare(payload)
  },
  showThresholdKeyUi(_, payload) {
    const { type, data: { id } = {} } = payload
    log.info(id, type, router)
    if (type === THRESHOLD_KEY_QUESTION_INPUT) {
      router.push({ name: 'tkeyInputPassword', query: { ...router.currentRoute.query, type, id } })
    } else if (type === THRESHOLD_KEY_STORE_DEVICE_FLOW) {
      router.push({ name: 'tkeyDeviceDetected', query: { ...router.currentRoute.query, type, id } })
    }
  },
  setSecurityQuestionShareFromUserInput(_, payload) {
    const { id, password, rejected } = payload
    thresholdKeyController.setSecurityQuestionShareFromUserInput(id, { password, rejected })
  },
  setStoreDeviceFlow(_, payload) {
    const { id, response, rejected } = payload
    log.info('payload', payload)
    // response is { isOld: Boolean, oldIndex: '' }
    thresholdKeyController.setStoreDeviceFlow(id, { response, rejected })
  },
  clearTkeyError() {
    return thresholdKeyController.clearTkeyError()
  },
  async manualAddTKey({ dispatch, state }, payload) {
    await dispatch('addTKey', payload)
    const thresholdWallet = Object.keys(state.wallet).find((x) => state.wallet[x].accountType === ACCOUNT_TYPE.THRESHOLD)
    return dispatch('updateSelectedAddress', { selectedAddress: thresholdWallet })
  },
}
