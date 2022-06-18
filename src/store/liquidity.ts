import { getterTree, mutationTree, actionTree } from 'typed-vuex'

import { ACCOUNT_LAYOUT, getBigNumber, MINT_LAYOUT } from '@/utils/layouts'
import { AMM_INFO_LAYOUT, AMM_INFO_LAYOUT_V3, AMM_INFO_LAYOUT_V4, getLpMintListDecimals } from '@/utils/liquidity'
import { LIQUIDITY_POOLS, getAddressForWhat, LiquidityPoolInfo } from '@/utils/pools'
import fixedpools from './pairs.json';
import allowedPools from './allowedPools.json';
import { commitment, createAmmAuthority, getFilteredProgramAccounts, getMultipleAccounts, getMintDecimals, getAMMGlobalStateAccount as getAMMGlobalStateAccount } from '@/utils/web3'



import { OpenOrders } from '@project-serum/serum'
import { PublicKey } from '@solana/web3.js'
import { TokenAmount } from '@/utils/safe-math'
import { cloneDeep } from 'lodash-es'
import logger from '@/utils/logger'
import { CRP_AMM_LAYOUT_V1 } from '@/utils/nni-swap'
import { 
  LIQUIDITY_POOL_PROGRAM_ID_V4,
  CRP_LP_PROGRAM_ID_V1, 
  SERUM_PROGRAM_ID_V3, 
  CRP_LP_VERSION_V1,
  LP_UPDATE_INTERVAL,
  MARKET_UPDATE_INTERVAL,
  DEVNET_MODE,
  NNI_LP_PROGRAM_ID_V1} from '@/utils/ids'
import { _MARKET_STATE_LAYOUT_V2 } from '@project-serum/serum/lib/market'
import { NATIVE_SOL, TOKENS } from '@/utils/tokens'

const AUTO_REFRESH_TIME = 60

export const state = () => ({
  initialized: false,
  loading: false,

  autoRefreshTime: AUTO_REFRESH_TIME,
  countdown: 0,
  lastSubBlock: 0,

  infos: {}
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

  setCountdown(state, countdown: number) {
    state.countdown = countdown
  },

  setLastSubBlock(state, lastSubBlock: number) {
    state.lastSubBlock = lastSubBlock
  }
})

async function getSerumMarkets(conn:any){

  let need_to_update = false
  let cur_date = new Date().getTime()

  if(window.localStorage.market_last_updated_v2 && !DEVNET_MODE){
    const last_updated = parseInt(window.localStorage.market_last_updated_v2)
    if(cur_date - last_updated >= MARKET_UPDATE_INTERVAL || last_updated < 1638191914){
      need_to_update = true
    }
  }
  else
  {
    need_to_update = true
  }
  // need_to_update = true
  let markets: any = {}

  if(need_to_update)
  {
    let marketAll = await getFilteredProgramAccounts(conn, new PublicKey(SERUM_PROGRAM_ID_V3), [
      {
        dataSize: _MARKET_STATE_LAYOUT_V2.span
      }
    ])
    marketAll.forEach((item: any) => {
      const market = _MARKET_STATE_LAYOUT_V2.decode(item.accountInfo.data)
      markets[item.publicKey] = {
        asks : market.asks.toString(),
        bids : market.bids.toString(),
        eventQueue : market.eventQueue.toString(),
        baseVault : market.baseVault.toString(),
        quoteVault : market.quoteVault.toString(),
        vaultSignerNonce: market.vaultSignerNonce.toArrayLike(Buffer, 'le', 8)
      }
    })
    if(!DEVNET_MODE)
    {
      window.localStorage.market_last_updated_v2 = new Date().getTime()
      window.localStorage.markets = JSON.stringify(markets)
    }
  }
  else
  {
    markets = JSON.parse(window.localStorage.markets)
  }


  return markets
}

async function getNeonomadPools(conn:any){
  let allowedAmmIds: any = allowedPools;
  const ammAll = await getFilteredProgramAccounts(conn, new PublicKey(NNI_LP_PROGRAM_ID_V1), [
    {
      dataSize: CRP_AMM_LAYOUT_V1.span
    }
  ])

  const lpMintAddressList: string[] = []
  ammAll.forEach((item) => {
    const ammLayout = CRP_AMM_LAYOUT_V1.decode(Buffer.from(item.accountInfo.data))
    if (
      ammLayout.pcMintAddress.toString() === ammLayout.serumMarket.toString() ||
      ammLayout.lpMintAddress.toString() === '11111111111111111111111111111111'
    ) {
      return
    }
    lpMintAddressList.push(ammLayout.lpMintAddress.toString())
  })
  const lpMintListDecimls = await getLpMintListDecimals(conn, lpMintAddressList)

  for (let indexAmmInfo = 0; indexAmmInfo < ammAll.length; indexAmmInfo += 1) {
    const ammInfo = CRP_AMM_LAYOUT_V1.decode(Buffer.from(ammAll[indexAmmInfo].accountInfo.data))

    if (fixedpools.find((item) => item.ammId === ammAll[indexAmmInfo].publicKey.toString()) && !DEVNET_MODE) {
      continue
    }

    if (
      !Object.keys(lpMintListDecimls).includes(ammInfo.lpMintAddress.toString()) ||
      ammInfo.pcMintAddress.toString() === ammInfo.serumMarket.toString() ||
      ammInfo.lpMintAddress.toString() === '11111111111111111111111111111111'
    ) {
      continue
    }

    const fromCoin =
      ammInfo.coinMintAddress.toString() === TOKENS.WSOL.mintAddress
        ? NATIVE_SOL.mintAddress
        : ammInfo.coinMintAddress.toString()
    const toCoin =
      ammInfo.pcMintAddress.toString() === TOKENS.WSOL.mintAddress
        ? NATIVE_SOL.mintAddress
        : ammInfo.pcMintAddress.toString()
    let coin = Object.values(TOKENS).find((item) => item.mintAddress === fromCoin)
    
    if (!coin) {
      TOKENS[`unknow-${ammInfo.coinMintAddress.toString()}`] = {
        symbol: 'unknown',
        name: 'unknown',
        mintAddress: ammInfo.coinMintAddress.toString(),
        decimals: await getMintDecimals(conn, ammInfo.coinMintAddress as PublicKey),
        cache: true,
        tags: []
      }
      coin = TOKENS[`unknow-${ammInfo.coinMintAddress.toString()}`]
    }
    if (!coin.tags.includes('unofficial')) {
      coin.tags.push('unofficial')
    }

    let pc = Object.values(TOKENS).find((item) => item.mintAddress === toCoin)
    if (!pc) {
      TOKENS[`unknow-${ammInfo.pcMintAddress.toString()}`] = {
        symbol: 'unknown',
        name: 'unknown',
        mintAddress: ammInfo.pcMintAddress.toString(),
        decimals: await getMintDecimals(conn, ammInfo.pcMintAddress as PublicKey),
        cache: true,
        tags: []
      }
      pc = TOKENS[`unknow-${ammInfo.pcMintAddress.toString()}`]
    }
    if (!pc.tags.includes('unofficial')) {
      pc.tags.push('unofficial')
    }

    if (coin.mintAddress === TOKENS.WSOL.mintAddress) {
      coin.symbol = 'SOL'
      coin.name = 'SOL'
      coin.mintAddress = '11111111111111111111111111111111'
    }
    if (pc.mintAddress === TOKENS.WSOL.mintAddress) {
      pc.symbol = 'SOL'
      pc.name = 'SOL'
      pc.mintAddress = '11111111111111111111111111111111'
    }
    const lp = {
      symbol: `${coin.symbol}-${pc.symbol}`,
      name: `${coin.symbol}-${pc.symbol}`,
      coin,
      pc,
      tags: ['cropper'],
      mintAddress: ammInfo.lpMintAddress.toString(),
      decimals: lpMintListDecimls[ammInfo.lpMintAddress]
    }

    // const { publicKey } = await createAmmAuthority(new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V5))
    const [authority, nonce] = await PublicKey.findProgramAddress(
      [ammAll[indexAmmInfo].publicKey.toBuffer()],
      new PublicKey(NNI_LP_PROGRAM_ID_V1)
    );

    const itemLiquidity: LiquidityPoolInfo = {
      name: `${coin.symbol}-${pc.symbol}`,
      coin,
      pc,
      lp,
      version: CRP_LP_VERSION_V1,
      programId: NNI_LP_PROGRAM_ID_V1,
      ammId: ammAll[indexAmmInfo].publicKey.toString(),
      ammAuthority: authority.toString(),
      ammOpenOrders: "", // ammInfo.ammOpenOrders.toString(),
      ammTargetOrders: "", //ammInfo.ammTargetOrders.toString(),
      ammQuantities: NATIVE_SOL.mintAddress,
      poolCoinTokenAccount: ammInfo.poolCoinTokenAccount.toString(),
      poolPcTokenAccount: ammInfo.poolPcTokenAccount.toString(),
      poolWithdrawQueue: "", //ammInfo.poolWithdrawQueue.toString(),
      poolTempLpTokenAccount: "", //ammInfo.poolTempLpTokenAccount.toString(),
      serumProgramId: SERUM_PROGRAM_ID_V3,
      serumMarket: ammInfo.serumMarket.toString(),
      serumBids: "",//market.bids.toString(),
      serumAsks: "",//market.asks.toString(),
      serumEventQueue: "", //market.eventQueue.toString(),
      serumCoinVaultAccount: "", //market.baseVault.toString(),
      serumPcVaultAccount: "", //market.quoteVault.toString(),
      serumVaultSigner: "",
      official: true
    }
    if (!LIQUIDITY_POOLS.find((item) => item.ammId === itemLiquidity.ammId)) {
      if(allowedAmmIds[itemLiquidity.ammId]){
        LIQUIDITY_POOLS.push(itemLiquidity)
      }
    } else {
      for (let itemIndex = 0; itemIndex < LIQUIDITY_POOLS.length; itemIndex += 1) {
        if (
          LIQUIDITY_POOLS[itemIndex].ammId === itemLiquidity.ammId &&
          LIQUIDITY_POOLS[itemIndex].name !== itemLiquidity.name &&
          !LIQUIDITY_POOLS[itemIndex].official
        ) {
          LIQUIDITY_POOLS[itemIndex] = itemLiquidity
        }
      }
    }
  }
}

async function getCropperPools(conn:any){
  let allowedAmmIds: any = allowedPools;
  const ammAll = await getFilteredProgramAccounts(conn, new PublicKey(CRP_LP_PROGRAM_ID_V1), [
    {
      dataSize: CRP_AMM_LAYOUT_V1.span
    }
  ])

  const lpMintAddressList: string[] = []
  ammAll.forEach((item) => {
    const ammLayout = CRP_AMM_LAYOUT_V1.decode(Buffer.from(item.accountInfo.data))
    if (
      ammLayout.pcMintAddress.toString() === ammLayout.serumMarket.toString() ||
      ammLayout.lpMintAddress.toString() === '11111111111111111111111111111111'
    ) {
      return
    }
    lpMintAddressList.push(ammLayout.lpMintAddress.toString())
  })
  const lpMintListDecimls = await getLpMintListDecimals(conn, lpMintAddressList)

  for (let indexAmmInfo = 0; indexAmmInfo < ammAll.length; indexAmmInfo += 1) {
    const ammInfo = CRP_AMM_LAYOUT_V1.decode(Buffer.from(ammAll[indexAmmInfo].accountInfo.data))

    if (fixedpools.find((item) => item.ammId === ammAll[indexAmmInfo].publicKey.toString()) && !DEVNET_MODE) {
      continue
    }

    if (
      !Object.keys(lpMintListDecimls).includes(ammInfo.lpMintAddress.toString()) ||
      ammInfo.pcMintAddress.toString() === ammInfo.serumMarket.toString() ||
      ammInfo.lpMintAddress.toString() === '11111111111111111111111111111111'
    ) {
      continue
    }

    const fromCoin =
      ammInfo.coinMintAddress.toString() === TOKENS.WSOL.mintAddress
        ? NATIVE_SOL.mintAddress
        : ammInfo.coinMintAddress.toString()
    const toCoin =
      ammInfo.pcMintAddress.toString() === TOKENS.WSOL.mintAddress
        ? NATIVE_SOL.mintAddress
        : ammInfo.pcMintAddress.toString()
    let coin = Object.values(TOKENS).find((item) => item.mintAddress === fromCoin)
    
    if (!coin) {
      TOKENS[`unknow-${ammInfo.coinMintAddress.toString()}`] = {
        symbol: 'unknown',
        name: 'unknown',
        mintAddress: ammInfo.coinMintAddress.toString(),
        decimals: await getMintDecimals(conn, ammInfo.coinMintAddress as PublicKey),
        cache: true,
        tags: []
      }
      coin = TOKENS[`unknow-${ammInfo.coinMintAddress.toString()}`]
    }
    if (!coin.tags.includes('unofficial')) {
      coin.tags.push('unofficial')
    }

    let pc = Object.values(TOKENS).find((item) => item.mintAddress === toCoin)
    if (!pc) {
      TOKENS[`unknow-${ammInfo.pcMintAddress.toString()}`] = {
        symbol: 'unknown',
        name: 'unknown',
        mintAddress: ammInfo.pcMintAddress.toString(),
        decimals: await getMintDecimals(conn, ammInfo.pcMintAddress as PublicKey),
        cache: true,
        tags: []
      }
      pc = TOKENS[`unknow-${ammInfo.pcMintAddress.toString()}`]
    }
    if (!pc.tags.includes('unofficial')) {
      pc.tags.push('unofficial')
    }

    if (coin.mintAddress === TOKENS.WSOL.mintAddress) {
      coin.symbol = 'SOL'
      coin.name = 'SOL'
      coin.mintAddress = '11111111111111111111111111111111'
    }
    if (pc.mintAddress === TOKENS.WSOL.mintAddress) {
      pc.symbol = 'SOL'
      pc.name = 'SOL'
      pc.mintAddress = '11111111111111111111111111111111'
    }
    const lp = {
      symbol: `${coin.symbol}-${pc.symbol}`,
      name: `${coin.symbol}-${pc.symbol}`,
      coin,
      pc,
      tags: ['cropper'],
      mintAddress: ammInfo.lpMintAddress.toString(),
      decimals: lpMintListDecimls[ammInfo.lpMintAddress]
    }

    // const { publicKey } = await createAmmAuthority(new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V5))
    const [authority, nonce] = await PublicKey.findProgramAddress(
      [ammAll[indexAmmInfo].publicKey.toBuffer()],
      new PublicKey(CRP_LP_PROGRAM_ID_V1)
    );

    const itemLiquidity: LiquidityPoolInfo = {
      name: `${coin.symbol}-${pc.symbol}`,
      coin,
      pc,
      lp,
      version: CRP_LP_VERSION_V1,
      programId: CRP_LP_PROGRAM_ID_V1,
      ammId: ammAll[indexAmmInfo].publicKey.toString(),
      ammAuthority: authority.toString(),
      ammOpenOrders: "", // ammInfo.ammOpenOrders.toString(),
      ammTargetOrders: "", //ammInfo.ammTargetOrders.toString(),
      ammQuantities: NATIVE_SOL.mintAddress,
      poolCoinTokenAccount: ammInfo.poolCoinTokenAccount.toString(),
      poolPcTokenAccount: ammInfo.poolPcTokenAccount.toString(),
      poolWithdrawQueue: "", //ammInfo.poolWithdrawQueue.toString(),
      poolTempLpTokenAccount: "", //ammInfo.poolTempLpTokenAccount.toString(),
      serumProgramId: SERUM_PROGRAM_ID_V3,
      serumMarket: ammInfo.serumMarket.toString(),
      serumBids: "",//market.bids.toString(),
      serumAsks: "",//market.asks.toString(),
      serumEventQueue: "", //market.eventQueue.toString(),
      serumCoinVaultAccount: "", //market.baseVault.toString(),
      serumPcVaultAccount: "", //market.quoteVault.toString(),
      serumVaultSigner: "",
      official: false
    }
    if (!LIQUIDITY_POOLS.find((item) => item.ammId === itemLiquidity.ammId)) {
      if(allowedAmmIds[itemLiquidity.ammId]){
        LIQUIDITY_POOLS.push(itemLiquidity)
      }
    } else {
      for (let itemIndex = 0; itemIndex < LIQUIDITY_POOLS.length; itemIndex += 1) {
        if (
          LIQUIDITY_POOLS[itemIndex].ammId === itemLiquidity.ammId &&
          LIQUIDITY_POOLS[itemIndex].name !== itemLiquidity.name &&
          !LIQUIDITY_POOLS[itemIndex].official
        ) {
          LIQUIDITY_POOLS[itemIndex] = itemLiquidity
        }
      }
    }
  }
}
async function getRaydiumPools(conn:any){
  let allowedAmmIds: any = allowedPools;
  const ammAll = await getFilteredProgramAccounts(conn, new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V4), [
    {
      dataSize: AMM_INFO_LAYOUT_V4.span
    }
  ])

  const marketToLayout = await getSerumMarkets(conn);

  const lpMintAddressList: string[] = []
  ammAll.forEach((item) => {
    const ammLayout = AMM_INFO_LAYOUT_V4.decode(Buffer.from(item.accountInfo.data))
    if (
      ammLayout.pcMintAddress.toString() === ammLayout.serumMarket.toString() ||
      ammLayout.lpMintAddress.toString() === '11111111111111111111111111111111'
    ) {
      return
    }
    lpMintAddressList.push(ammLayout.lpMintAddress.toString())
  })
  const lpMintListDecimls = await getLpMintListDecimals(conn, lpMintAddressList)

  for (let indexAmmInfo = 0; indexAmmInfo < ammAll.length; indexAmmInfo += 1) {
    const ammInfo = AMM_INFO_LAYOUT_V4.decode(Buffer.from(ammAll[indexAmmInfo].accountInfo.data))
    if (fixedpools.find((item) => item.ammId === ammAll[indexAmmInfo].publicKey.toString()) && !DEVNET_MODE) {
      continue
    }

    if (
      !Object.keys(lpMintListDecimls).includes(ammInfo.lpMintAddress.toString()) ||
      ammInfo.pcMintAddress.toString() === ammInfo.serumMarket.toString() ||
      ammInfo.lpMintAddress.toString() === '11111111111111111111111111111111' || 
      !Object.keys(marketToLayout).includes(ammInfo.serumMarket.toString())
    ) {
      continue
    }
    const fromCoin =
      ammInfo.coinMintAddress.toString() === TOKENS.WSOL.mintAddress
        ? NATIVE_SOL.mintAddress
        : ammInfo.coinMintAddress.toString()
    const toCoin =
      ammInfo.pcMintAddress.toString() === TOKENS.WSOL.mintAddress
        ? NATIVE_SOL.mintAddress
        : ammInfo.pcMintAddress.toString()
    let coin = Object.values(TOKENS).find((item) => item.mintAddress === fromCoin)
    if (!coin) {
      continue;
    }
    if (!coin.tags.includes('unofficial')) {
      coin.tags.push('unofficial')
    }

    let pc = Object.values(TOKENS).find((item) => item.mintAddress === toCoin)
    if (!pc) {
      continue;
    }
    if (!pc.tags.includes('unofficial')) {
      pc.tags.push('unofficial')
    }

    if (coin.mintAddress === TOKENS.WSOL.mintAddress) {
      coin.symbol = 'SOL'
      coin.name = 'SOL'
      coin.mintAddress = '11111111111111111111111111111111'
    }
    if (pc.mintAddress === TOKENS.WSOL.mintAddress) {
      pc.symbol = 'SOL'
      pc.name = 'SOL'
      pc.mintAddress = '11111111111111111111111111111111'
    }
    const lp = {
      symbol: `${coin.symbol}-${pc.symbol}`,
      name: `${coin.symbol}-${pc.symbol}`,
      coin,
      pc,
      tags:['cropper'],
      mintAddress: ammInfo.lpMintAddress.toString(),
      decimals: lpMintListDecimls[ammInfo.lpMintAddress]
    }

    const { publicKey } = await createAmmAuthority(new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V4))

    const market = marketToLayout[ammInfo.serumMarket]
    const serumVaultSigner = await PublicKey.createProgramAddress(
      [ammInfo.serumMarket.toBuffer(), market.vaultSignerNonce],

      new PublicKey(SERUM_PROGRAM_ID_V3)
    )

    const itemLiquidity: LiquidityPoolInfo = {
      name: `${coin?.symbol}-${pc?.symbol}`,
      coin,
      pc,
      lp,
      version: 4,
      programId: LIQUIDITY_POOL_PROGRAM_ID_V4,
      ammId: ammAll[indexAmmInfo].publicKey.toString(),
      ammAuthority: publicKey.toString(),
      ammOpenOrders: ammInfo.ammOpenOrders.toString(),
      ammTargetOrders: ammInfo.ammTargetOrders.toString(),
      ammQuantities: NATIVE_SOL.mintAddress,
      poolCoinTokenAccount: ammInfo.poolCoinTokenAccount.toString(),
      poolPcTokenAccount: ammInfo.poolPcTokenAccount.toString(),
      poolWithdrawQueue: ammInfo.poolWithdrawQueue.toString(),
      poolTempLpTokenAccount: ammInfo.poolTempLpTokenAccount.toString(),
      serumProgramId: SERUM_PROGRAM_ID_V3,
      serumMarket: ammInfo.serumMarket.toString(),
      serumBids: market.bids.toString(),
      serumAsks: market.asks.toString(),
      serumEventQueue: market.eventQueue.toString(),
      serumCoinVaultAccount: market.baseVault.toString(),
      serumPcVaultAccount: market.quoteVault.toString(),
      serumVaultSigner: serumVaultSigner.toString(),
      official: false
    }
    if (!LIQUIDITY_POOLS.find((item) => item.ammId === itemLiquidity.ammId)) {
      if(allowedAmmIds[itemLiquidity.ammId]){
        LIQUIDITY_POOLS.push(itemLiquidity)
      }
    } else {
      for (let itemIndex = 0; itemIndex < LIQUIDITY_POOLS.length; itemIndex += 1) {
        if (
          LIQUIDITY_POOLS[itemIndex].ammId === itemLiquidity.ammId &&
          LIQUIDITY_POOLS[itemIndex].name !== itemLiquidity.name &&
          !LIQUIDITY_POOLS[itemIndex].official
        ) {
          LIQUIDITY_POOLS[itemIndex] = itemLiquidity
        }
      }
    }
  }

}

export const actions = actionTree(
  { state, getters, mutations },
  {
    async requestInfos({ commit }) {
      commit('setLoading', true)

      logger('Liquidity pool infomations fetch')

      const conn = this.$web3
      let need_to_update = false
      let allowedAmmIds: any = allowedPools;

      let cur_date = new Date().getTime()
      if(window.localStorage.pool_last_updated_v2 && !DEVNET_MODE){
        const last_updated = parseInt(window.localStorage.pool_last_updated_v2)

        if(cur_date - last_updated >= LP_UPDATE_INTERVAL || last_updated < 1635525130){
          need_to_update = true
        }
      }
      else
      {
        need_to_update = true
      }
      // need_to_update = true;
      console.log("Need to reload liquidity pools ", need_to_update)
      if(!need_to_update){
        const pools = JSON.parse(window.localStorage.pools)
  
        let ammSet: any = {};

        LIQUIDITY_POOLS.forEach((pool) => {
          ammSet[pool.ammId] = pool.ammId
        })

        pools.forEach((pool:LiquidityPoolInfo)=>{
          if(!ammSet[pool.ammId]){
            if(allowedAmmIds[pool.ammId]){
              LIQUIDITY_POOLS.push(pool)
            }
          }
        })
        if(LIQUIDITY_POOLS.length == 0)
        {
          need_to_update = true
        }
      }
      console.log("before need_to_update", LIQUIDITY_POOLS.length)
      if(need_to_update)
      {


        await getNeonomadPools(conn);
        console.log("before getCropperPools()", LIQUIDITY_POOLS.length)
        await getCropperPools(conn);
        console.log("after getCropperPools()", LIQUIDITY_POOLS.length)
        await getRaydiumPools(conn);
        console.log("after getRaydiumPools()", LIQUIDITY_POOLS.length)
        if(!DEVNET_MODE)
        { 
          window.localStorage.pool_last_updated_v2 = new Date().getTime()
          window.localStorage.pools = JSON.stringify(LIQUIDITY_POOLS)
        }


      }


        let ammSet: any = {};

        LIQUIDITY_POOLS.forEach((pool) => {
          ammSet[pool.ammId] = pool.ammId
        })

        fixedpools.forEach((pool:LiquidityPoolInfo)=>{
          if(!ammSet[pool.ammId] && !DEVNET_MODE){
            if(allowedAmmIds[pool.ammId]){
              LIQUIDITY_POOLS.push(pool)
            }
          }
        })
        

      const liquidityPools = {} as any
      const publicKeys = [] as any
      const amm_state_info = await getAMMGlobalStateAccount(conn, true);
      
      LIQUIDITY_POOLS.forEach((pool) => {


        const { poolCoinTokenAccount, poolPcTokenAccount, ammOpenOrders, ammId, coin, pc, lp } = pool
        
        publicKeys.push(
          new PublicKey(poolCoinTokenAccount),
          new PublicKey(poolPcTokenAccount),
          new PublicKey(ammId),
          new PublicKey(lp.mintAddress)
        )
        // new PublicKey(ammOpenOrders), @zhaohui
        if(ammOpenOrders.length)
        {
          publicKeys.push(new PublicKey(ammOpenOrders))
        }


        const poolInfo = cloneDeep(pool)

        poolInfo.coin.balance = new TokenAmount(0, coin.decimals)
        poolInfo.pc.balance = new TokenAmount(0, pc.decimals)

        liquidityPools[lp.mintAddress] = poolInfo
      })

      const multipleInfo = await getMultipleAccounts(conn, publicKeys, commitment)
      console.log("getMultipleAccounts->3", multipleInfo.length)
      multipleInfo.forEach((info) => {
        if (info) {
          const address = info.publicKey.toBase58()
          const data = Buffer.from(info.account.data)

          const { key, lpMintAddress, version } = getAddressForWhat(address)

          if (key && lpMintAddress) {
            const poolInfo = liquidityPools[lpMintAddress]

            switch (key) {
              case 'poolCoinTokenAccount': {
                const parsed = ACCOUNT_LAYOUT.decode(data)
                // quick fix: Number can only safely store up to 53 bits
                poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(getBigNumber(parsed.amount))

                break
              }
              case 'poolPcTokenAccount': {
                const parsed = ACCOUNT_LAYOUT.decode(data)

                poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(getBigNumber(parsed.amount))

                break
              }
              case 'ammOpenOrders': {
                const OPEN_ORDERS_LAYOUT = OpenOrders.getLayout(new PublicKey(poolInfo.serumProgramId))
                const parsed = OPEN_ORDERS_LAYOUT.decode(data)

                const { baseTokenTotal, quoteTokenTotal } = parsed
                poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(getBigNumber(baseTokenTotal))
                poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(getBigNumber(quoteTokenTotal))

                break
              }
              case 'ammId': {
                let parsed
                if(version == CRP_LP_VERSION_V1){
                  parsed = CRP_AMM_LAYOUT_V1.decode(data)
                  // const { returnFeeNumerator, fixedFeeNumerator, feeDenominator } = parsed
                  poolInfo.fees = {
                    returnFeeNumerator: getBigNumber(amm_state_info.returnFeeNumerator),
                    fixedFeeNumerator: getBigNumber(amm_state_info.fixedFeeNumerator),
                    feeDenominator: getBigNumber(amm_state_info.feeDenominator)
                  }
                }
                else{
                  if (version === 2) {
                    parsed = AMM_INFO_LAYOUT.decode(data)
                  } else if (version === 3) {
                    parsed = AMM_INFO_LAYOUT_V3.decode(data)
                  } 
                  else if(version == 4){
                    parsed = AMM_INFO_LAYOUT_V4.decode(data)
                    const { swapFeeNumerator, swapFeeDenominator } = parsed
                    poolInfo.fees = {
                      swapFeeNumerator: getBigNumber(swapFeeNumerator),
                      swapFeeDenominator: getBigNumber(swapFeeDenominator)
                    }
                  }
                  const { status, needTakePnlCoin, needTakePnlPc } = parsed
                  poolInfo.status = getBigNumber(status)
                  poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.minus(getBigNumber(needTakePnlCoin))
                  poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.minus(getBigNumber(needTakePnlPc))

                }
                break
              }
              // getLpSupply
              case 'lpMintAddress': {
                const parsed = MINT_LAYOUT.decode(data)

                poolInfo.lp.totalSupply = new TokenAmount(getBigNumber(parsed.supply), poolInfo.lp.decimals)

                break
              }
            }
          }
        }
      })

      commit('setInfos', liquidityPools)
      logger('Liquidity pool infomations updated - ' + need_to_update + ' | ' + (new Date().getTime() - cur_date))

      commit('setInitialized')
      commit('setLoading', false)
    }
  }
)

export const getTotalSupply = async (
  conn:any, 
  mintAddress:string
) =>{
  const info = await conn.getAccountInfo(new PublicKey(mintAddress))
  const data = Buffer.from(info.data)
  const parsed = MINT_LAYOUT.decode(data)
  let total_supply = new TokenAmount(getBigNumber(parsed.supply), parsed.decimals).fixed()
  return total_supply
}