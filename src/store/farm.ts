import { getterTree, mutationTree, actionTree } from 'typed-vuex'

import { FarmInfo, FARMS, getAddressForWhat, getFarmByPoolId } from '@/utils/farms'
import {
  STAKE_INFO_LAYOUT,
  STAKE_INFO_LAYOUT_V4,
  USER_STAKE_INFO_ACCOUNT_LAYOUT,
  USER_STAKE_INFO_ACCOUNT_LAYOUT_V4
} from '@/utils/stake'
import { commitment, getFilteredProgramAccounts, getMultipleAccounts } from '@/utils/web3'

import { ACCOUNT_LAYOUT, getBigNumber } from '@/utils/layouts'
import { PublicKey } from '@solana/web3.js'
import { FARM_PROGRAM_ID, STAKE_PROGRAM_ID, STAKE_PROGRAM_ID_V4, STAKE_PROGRAM_ID_V5 } from '@/utils/ids'
import { TokenAmount, lt } from '@/utils/safe-math'
import { cloneDeep } from 'lodash-es'
import logger from '@/utils/logger'
import { FarmAccountLayout, UserInfoAccountLayout, YieldFarm } from '@/utils/farm'
import { TOKENS, getTokenByMintAddress } from '@/utils/tokens'

import { LiquidityPoolInfo, LIQUIDITY_POOLS } from '@/utils/pools'

const AUTO_REFRESH_TIME = 60

export const state = () => ({
  initialized: false,
  loading: false,

  autoRefreshTime: AUTO_REFRESH_TIME,
  countdown: 0,
  lastSubBlock: 0,

  infos: {},
  stakeAccounts: {}
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

  setInfos(state, infos: object) {
    state.infos = cloneDeep(infos)
  },

  setStakeAccounts(state, stakeAccounts) {
    state.stakeAccounts = cloneDeep(stakeAccounts)
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
    async requestInfos({ commit, dispatch }) {
      commit('setLoading', true)
      dispatch('getStakeAccounts')

      const conn = this.$web3
      //const wallet = (this as any)._vm.$wallet

      const farms = {} as any
      //const publicKeys = [] as any

      const farmFilters = [
        {
          dataSize: FarmAccountLayout.span
        }
      ]
      const farmAccountInfos = await getFilteredProgramAccounts(conn, new PublicKey(FARM_PROGRAM_ID), farmFilters)
      const publicKeys = [] as any

      farmAccountInfos.forEach((farmAccountInfo) => {
        const farmAccountAddress = farmAccountInfo.publicKey.toBase58()
        const { data } = farmAccountInfo.accountInfo

        const _farmData = FarmAccountLayout.decode(data)
        const lpTokenMintAddress = _farmData.pool_mint_address.toBase58();
        const rewardTokenMintAddress = _farmData.reward_mint_address.toBase58();
        const ownerAddress = _farmData.owner.toBase58();



        //get liquidity pool info
        let liquidityPoolInfo:LiquidityPoolInfo = LIQUIDITY_POOLS.find((item) => item.lp.mintAddress === lpTokenMintAddress) as any;

        //check liquidity pool
        if(liquidityPoolInfo == undefined || liquidityPoolInfo == null){
          console.log("find liquidity pool error");
          return;
        }
        //get lp token info
        const lpTokenInfo = liquidityPoolInfo.lp;
        

        //get reward token info
        let rewardToken:any;
        if(liquidityPoolInfo.coin.mintAddress === rewardTokenMintAddress){
          rewardToken = liquidityPoolInfo.coin;
        }
        else if(liquidityPoolInfo.pc.mintAddress === rewardTokenMintAddress){
          rewardToken = liquidityPoolInfo.pc;
        }
        else if(liquidityPoolInfo.lp.mintAddress === rewardTokenMintAddress){
          rewardToken = liquidityPoolInfo.lp;
        }


        const query = new URLSearchParams(window.location.search)
        if (query.get('rtf')) rewardToken =  Object.values(TOKENS).find((item) => item.mintAddress === query.get('rtf') as string ) 



        if(rewardTokenMintAddress){
          rewardToken = getTokenByMintAddress(rewardTokenMintAddress);
        }


        if(rewardToken === undefined || rewardToken === null){
          console.log("find reward token info error");
          return;
        }


        const _farmInfo:FarmInfo = {
          name: '',
          lp: { ...lpTokenInfo },
          reward: { ...rewardToken },
          isStake: false,

          fusion: false,
          legacy: false,
          dual: false,
          version: 1,
          programId: FARM_PROGRAM_ID,

          poolId: farmAccountAddress,
          poolAuthority: ownerAddress,
          poolLpTokenAccount: _farmData.pool_lp_token_account.toBase58(), // lp vault
          poolRewardTokenAccount: _farmData.pool_reward_token_account.toBase58() // reward vault
        };
        let foundFarm = FARMS.find((item)=>item.poolId === farmAccountAddress)
        if(foundFarm == undefined){
          FARMS.push(_farmInfo)
        }


        _farmInfo.lp.balance = new TokenAmount(0, lpTokenInfo.decimals);
        _farmInfo.reward.balance = new TokenAmount(0, rewardToken.decimals);
        publicKeys.push(_farmData.pool_lp_token_account);
        publicKeys.push(_farmData.pool_reward_token_account);
        farms[farmAccountAddress] = _farmInfo;
        farms[farmAccountAddress].poolInfo = _farmData;
      })
      
      const splTokenInfo = await getMultipleAccounts(conn, publicKeys, commitment)
      console.log("getMultipleAccounts->2", splTokenInfo.length)
      splTokenInfo.forEach((info) => {
        if (info) {
          const address = info.publicKey.toBase58()
          const data = Buffer.from(info.account.data)
          const parsed = ACCOUNT_LAYOUT.decode(data);
          let foundFarmForLP = FARMS.find((item)=>item.poolLpTokenAccount === address)
          if(foundFarmForLP != undefined){
            farms[foundFarmForLP.poolId].lp.balance.wei = farms[foundFarmForLP.poolId].lp.balance.wei.plus(getBigNumber(parsed.amount))
          }

          let foundFarmForReward = FARMS.find((item)=>item.poolRewardTokenAccount === address)
          if(foundFarmForReward != undefined){
            farms[foundFarmForReward.poolId].reward.balance.wei = farms[foundFarmForReward.poolId].reward.balance.wei.plus(getBigNumber(parsed.amount))
          }
        }
      });
      commit('setInfos', farms)
      logger('Farm infomations updated')
      commit('setInitialized')
      commit('setLoading', false)
    },

    getStakeAccounts({ commit }) {
      console.log("getStakeAccounts")
      const conn = this.$web3
      const wallet = (this as any)._vm.$wallet

      if (wallet && wallet.connected) {
        // stake user info account
        const stakeFilters = [
          {
            memcmp: {
              offset: 0,
              bytes: wallet.publicKey.toBase58()
            }
          },
          {
            dataSize: UserInfoAccountLayout.span
          }
        ]

        const stakeAccounts: any = {}

        getFilteredProgramAccounts(conn, new PublicKey(FARM_PROGRAM_ID), stakeFilters)
          .then((stakeAccountInfos) => {
            stakeAccountInfos.forEach((stakeAccountInfo) => {
              const stakeAccountAddress = stakeAccountInfo.publicKey.toBase58()
              const { data } = stakeAccountInfo.accountInfo

              const userStakeInfo = UserInfoAccountLayout.decode(data)

              const poolId = userStakeInfo.farm_id.toBase58()

              const rewardDebt = getBigNumber(userStakeInfo.reward_debt)

              const farm = getFarmByPoolId(poolId)

              if (farm) {
                const depositBalance = new TokenAmount(getBigNumber(userStakeInfo.deposit_balance), farm.lp.decimals)

                if (Object.prototype.hasOwnProperty.call(stakeAccounts, poolId)) {
                  if (lt(getBigNumber(stakeAccounts[poolId].depositBalance.wei), getBigNumber(depositBalance.wei))) {
                    stakeAccounts[poolId] = {
                      depositBalance,
                      rewardDebt: new TokenAmount(rewardDebt, farm.reward.decimals),
                      stakeAccountAddress
                    }
                  }
                } else {
                  stakeAccounts[poolId] = {
                    depositBalance,
                    rewardDebt: new TokenAmount(rewardDebt, farm.reward.decimals),
                    stakeAccountAddress
                  }
                }
              }
            })
            commit('setStakeAccounts', stakeAccounts)
            logger('User StakeAccounts updated')
          })
          .catch()
      }
    }
  }
)
