import { getterTree, mutationTree, actionTree } from 'typed-vuex'

export const state = () => ({
  trading: 'https://trade.neonomad.exchange',
  explorer: 'https://solscan.io',
  trade: 'https://trade.neonomad.exchange',
  whitelist : '#'
})

export const getters = getterTree(state, {})

export const mutations = mutationTree(state, {})

export const actions = actionTree({ state, getters, mutations }, {})
