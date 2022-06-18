import { getterTree, mutationTree, actionTree } from 'typed-vuex'
import { cloneDeep } from 'lodash-es'

import { TOKENS } from '@/utils/tokens'
import { TokenAmount } from '@/utils/safe-math'
import { commitment, getMultipleAccounts } from '@/utils/web3'
import {
  IDO_POOLS,
  IdoPool,
  IdoUserInfo,
  findAssociatedIdoInfoAddress,
  findAssociatedIdoCheckAddress,
  IdoPoolInfo,
  IdoLotteryPoolInfo,
  IDO_POOL_INFO_LAYOUT,
  IDO_USER_INFO_LAYOUT,
  IDO_LOTTERY_POOL_INFO_LAYOUT,
  IDO_LOTTERY_USER_INFO_LAYOUT,
  IDO_LOTTERY_SNAPSHOT_DATA_LAYOUT,
  IdoLotteryUserInfo
} from '@/utils/ido'
import { PublicKey } from '@solana/web3.js'
import logger from '@/utils/logger'
import { getUnixTs } from '@/utils'
import { getBigNumber } from '@/utils/layouts'

const AUTO_REFRESH_TIME = 60

export const state = () => ({
  initialized: false,
  loading: false,

  autoRefreshTime: AUTO_REFRESH_TIME,
  countdown: 0,
  lastSubBlock: 0,

  pools: [] as Array<IdoPool>
})

export const getters = getterTree(state, {})

export const mutations = mutationTree(state, {
  setInitialized(state) {
    state.initialized = true
  },

  setLoading(state, loading: boolean) {
    if (loading) {
      state.countdown = AUTO_REFRESH_TIME
    }

    state.loading = loading

    if (!loading) {
      state.countdown = 0
    }
  },

  setPools(state, pools: Array<IdoPool>) {
    state.pools = cloneDeep(pools)
  },

  setCountdown(state, countdown: number) {
    state.countdown = countdown
  },

  setLastSubBlock(state, lastSubBlock: number) {
    state.lastSubBlock = lastSubBlock
  }
})

export const actions = actionTree(
  { state, getters, mutations },
  {
    async requestInfos({ commit, dispatch }) {},

    async getIdoAccounts(_, { pools }) {}
  }
)
