import {
  CRP_LP_VERSION_V1,
  DEVNET_MODE,
  ENDPOINT_CRP,
  ENDPOINT_RAY,
  LIQUIDITY_POOL_PROGRAM_ID_V2,
  LIQUIDITY_POOL_PROGRAM_ID_V3,
  LIQUIDITY_POOL_PROGRAM_ID_V4,
  SERUM_PROGRAM_ID_V2,
  SERUM_PROGRAM_ID_V3
} from './ids'
import { NATIVE_SOL, TOKENS, TokenInfo } from './tokens'
// @ts-ignore
import SERUM_MARKETS from '@project-serum/serum/lib/markets.json'
import { cloneDeep } from 'lodash-es'
import { getSwapOutAmount } from '@/utils/swap'
const PRICE_IMPACT_LIMIT = 10 //percentage
export interface LiquidityPoolInfo {
  name: string
  coin: TokenInfo
  pc: TokenInfo
  lp: TokenInfo

  version: number
  programId: string

  ammId: string
  ammAuthority: string
  ammOpenOrders: string
  ammTargetOrders: string
  ammQuantities: string

  poolCoinTokenAccount: string
  poolPcTokenAccount: string

  poolWithdrawQueue: string
  poolTempLpTokenAccount: string

  serumProgramId: string
  serumMarket: string
  serumBids?: string
  serumAsks?: string
  serumEventQueue?: string
  serumCoinVaultAccount: string
  serumPcVaultAccount: string
  serumVaultSigner: string

  official: boolean
}

/**
 * Get pool use two mint addresses

 * @param {string} coinMintAddress
 * @param {string} pcMintAddress

 * @returns {LiquidityPoolInfo | undefined} poolInfo
 */
export function getPoolByTokenMintAddresses(
  coinMintAddress: string,
  pcMintAddress: string
): LiquidityPoolInfo | undefined {
  const pool = LIQUIDITY_POOLS.find(
    (pool) =>
      (pool.coin.mintAddress === coinMintAddress && pool.pc.mintAddress === pcMintAddress) ||
      (pool.coin.mintAddress === pcMintAddress && pool.pc.mintAddress === coinMintAddress)
  )

  if (pool) {
    return cloneDeep(pool)
  }

  return pool
}

export function getCropperPoolListByTokenMintAddresses(
  coinMintAddress: string,
  pcMintAddress: string,
  ammIdOrMarket: string | undefined
): LiquidityPoolInfo[] {
  const crp_pools = LIQUIDITY_POOLS.filter((pool) => {
    if (coinMintAddress && pcMintAddress) {
      if (
        ((pool.coin.mintAddress === coinMintAddress && pool.pc.mintAddress === pcMintAddress) ||
          (pool.coin.mintAddress === pcMintAddress && pool.pc.mintAddress === coinMintAddress)) &&
        pool.version === CRP_LP_VERSION_V1
        // && pool.official //@zhaohui
      ) {
        return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
      }
    } else {
      return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
    }
    return false
  })
  return cloneDeep(crp_pools)
}

export function getRaydiumPoolListByTokenMintAddresses(
  coinMintAddress: string,
  pcMintAddress: string,
  ammIdOrMarket: string | undefined
): LiquidityPoolInfo[] {
  const crp_pools = LIQUIDITY_POOLS.filter((pool) => {
    if (coinMintAddress && pcMintAddress) {
      if (
        ((pool.coin.mintAddress === coinMintAddress && pool.pc.mintAddress === pcMintAddress) ||
          (pool.coin.mintAddress === pcMintAddress && pool.pc.mintAddress === coinMintAddress)) &&
        pool.version === 4
        // && pool.official //@zhaohui
      ) {
        return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
      }
    } else {
      return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
    }
    return false
  })
  return cloneDeep(crp_pools)
}

export function getPoolListByTokenMintAddresses(
  coinMintAddress: string,
  pcMintAddress: string,
  ammIdOrMarket: string | undefined
): LiquidityPoolInfo[] {
  const crp_pools = getCropperPoolListByTokenMintAddresses(coinMintAddress, pcMintAddress, ammIdOrMarket)
  if (crp_pools.length) {
    return crp_pools
  } else return getRaydiumPoolListByTokenMintAddresses(coinMintAddress, pcMintAddress, ammIdOrMarket)
}

export function getLpMintByTokenMintAddresses(
  coinMintAddress: string,
  pcMintAddress: string,
  version = [3, 4]
): string | null {
  const pool = LIQUIDITY_POOLS.find(
    (pool) =>
      ((pool.coin.mintAddress === coinMintAddress && pool.pc.mintAddress === pcMintAddress) ||
        (pool.coin.mintAddress === pcMintAddress && pool.pc.mintAddress === coinMintAddress)) &&
      version.includes(pool.version)
  )

  if (pool) {
    return pool.lp.mintAddress
  }

  return null
}

export function getLpListByTokenMintAddresses(
  coinMintAddress: string,
  pcMintAddress: string,
  ammIdOrMarket: string | undefined,
  version = [CRP_LP_VERSION_V1]
): LiquidityPoolInfo[] {
  const pool = LIQUIDITY_POOLS.filter((pool) => {
    if (coinMintAddress && pcMintAddress) {
      if (
        ((pool.coin.mintAddress === coinMintAddress && pool.pc.mintAddress === pcMintAddress) ||
          (pool.coin.mintAddress === pcMintAddress && pool.pc.mintAddress === coinMintAddress)) &&
        version.includes(pool.version) &&
        pool.official
      ) {
        return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
      }
    } else {
      return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
    }
    return false
  })
  if (pool.length > 0) {
    return pool
  } else {
    return LIQUIDITY_POOLS.filter((pool) => {
      if (coinMintAddress && pcMintAddress) {
        if (
          ((pool.coin.mintAddress === coinMintAddress && pool.pc.mintAddress === pcMintAddress) ||
            (pool.coin.mintAddress === pcMintAddress && pool.pc.mintAddress === coinMintAddress)) &&
          version.includes(pool.version)
        ) {
          return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
        }
      } else {
        return !(ammIdOrMarket !== undefined && pool.ammId !== ammIdOrMarket && pool.serumMarket !== ammIdOrMarket)
      }
      return false
    })
  }
}

export function canWrap(fromMintAddress: string, toMintAddress: string): boolean {
  if (TOKENS.WUSDT && TOKENS.WUSDT.mintAddress) {
    return fromMintAddress === TOKENS.WUSDT.mintAddress && toMintAddress === TOKENS.USDT.mintAddress
  }
  return false
}

export function getPoolByLpMintAddress(lpMintAddress: string): LiquidityPoolInfo | undefined {
  const pool = LIQUIDITY_POOLS.find((pool) => pool.lp.mintAddress === lpMintAddress)
  if (pool) {
    return cloneDeep(pool)
  }
  return pool
}

export function getAddressForWhat(address: string) {
  for (const pool of LIQUIDITY_POOLS) {
    for (const [key, value] of Object.entries(pool)) {
      if (key === 'lp') {
        if (value.mintAddress === address) {
          return { key: 'lpMintAddress', lpMintAddress: pool.lp.mintAddress, version: pool.version }
        }
      } else if (value === address) {
        return { key, lpMintAddress: pool.lp.mintAddress, version: pool.version }
      }
    }
  }

  return {}
}

export function findBestCropperLP(pools: any, baseMint: string, quoteMint: string, amountIn: string, slippage: number) {
  const lpList = getCropperPoolListByTokenMintAddresses(
    baseMint === TOKENS.WSOL.mintAddress ? NATIVE_SOL.mintAddress : baseMint,
    quoteMint === TOKENS.WSOL.mintAddress ? NATIVE_SOL.mintAddress : quoteMint,
    undefined
  )

  let bestLP: any = null
  let maxAmount = 0,
    minPriceImpact = Number.POSITIVE_INFINITY
  lpList.forEach((lpInfo) => {
    let poolInfo = pools[lpInfo.lp.mintAddress]
    if (poolInfo.fees) {
      const { amountOut, amountOutWithSlippage, priceImpact } = getSwapOutAmount(
        poolInfo,
        baseMint,
        quoteMint,
        amountIn,
        slippage
      )
      if (
        (priceImpact < PRICE_IMPACT_LIMIT &&
          minPriceImpact < PRICE_IMPACT_LIMIT &&
          maxAmount < amountOut.wei.toNumber()) ||
        (priceImpact < PRICE_IMPACT_LIMIT && PRICE_IMPACT_LIMIT < minPriceImpact) ||
        (PRICE_IMPACT_LIMIT < priceImpact && priceImpact < minPriceImpact)
      ) {
        maxAmount = amountOut.wei.toNumber()
        bestLP = poolInfo
        minPriceImpact = priceImpact
      }
    }
  })
  return bestLP
}

export function findBestLP(pools: any, baseMint: string, quoteMint: string, amountIn: string, slippage: number) {
  const lpList = getPoolListByTokenMintAddresses(
    baseMint === TOKENS.WSOL.mintAddress ? NATIVE_SOL.mintAddress : baseMint,
    quoteMint === TOKENS.WSOL.mintAddress ? NATIVE_SOL.mintAddress : quoteMint,
    undefined
  )

  let bestLP: any = null
  let maxAmount = 0
  lpList.forEach((lpInfo) => {
    let poolInfo = pools[lpInfo.lp.mintAddress]
    if (poolInfo.fees) {
      const { amountOut, amountOutWithSlippage, priceImpact } = getSwapOutAmount(
        poolInfo,
        baseMint,
        quoteMint,
        amountIn,
        slippage
      )

      console.log('Impact check', priceImpact)

      if (priceImpact > PRICE_IMPACT_LIMIT) {
        return
      }
      if (!bestLP || maxAmount < amountOut.wei.toNumber()) {
        maxAmount = amountOut.wei.toNumber()
        bestLP = poolInfo
      }
    }
  })
  return bestLP
}

export function isOfficalMarket(marketAddress: string) {
  if (DEVNET_MODE) {
    return true
  }
  for (const market of SERUM_MARKETS) {
    if (market.address === marketAddress && !market.deprecated) {
      return true
    }
  }

  for (const pool of LIQUIDITY_POOLS) {
    if (pool.serumMarket === marketAddress && pool.official === true) {
      return true
    }
  }

  return false
}
export function getPoolLocation(version: number) {
  if (version == 4) {
    return ENDPOINT_RAY
  } else if (version == CRP_LP_VERSION_V1) {
    return ENDPOINT_CRP
  }
}
export function getAllCropperPools() {
  const polo: any = []
  LIQUIDITY_POOLS.forEach(function (value) {
    if (
      (value.version == CRP_LP_VERSION_V1 && value.official) ||
      value.ammId === '3aBomPsmJc5wBsYQQffQXtXWiS6pw4hbGv29Dai8DkiY'
    ) {
      let item = {
        name: value.coin.name + ' - ' + value.pc.name,
        coin1: value.coin,
        coin2: value.pc,
        lp_mint: value.lp.mintAddress,
        lp: {
          coin: cloneDeep(value.coin),
          pc: cloneDeep(value.pc),
          mintAddress: cloneDeep(value.lp.mintAddress)
        },
        ammId: value.ammId,
        serumMarket: value.serumMarket
      }
      polo.push(item)
    }
  })
  return polo
}

export const LIQUIDITY_POOLS: LiquidityPoolInfo[] = []
