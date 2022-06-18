import { TokenAmount } from '@/utils/safe-math'
import { cloneDeep } from 'lodash-es'

import { DEVNET_MODE } from './ids'

export interface TokenInfo {
  symbol: string
  name: string

  mintAddress: string
  decimals: number
  totalSupply?: TokenAmount

  referrer?: string

  details?: string
  docs?: object
  socials?: object

  tokenAccountAddress?: string
  balance?: TokenAmount
  tags: string[]
}

export interface Tokens {
  [key: string]: any
  [index: number]: any
}

export const NATIVE_SOL: TokenInfo = {
  symbol: 'SOL',
  name: 'Native Solana',
  mintAddress: '11111111111111111111111111111111',
  decimals: 9,
  tags:['cropper']
}

export const WRAPPED_SOL: TokenInfo = {
  symbol: 'WSOL',
  name: 'Wrapped Solana',
  mintAddress: 'So11111111111111111111111111111111111111112',
  decimals: 9,
  tags:['cropper']
}
export const POP_TOKENS:any = {
  'buMnhMd5xSyXBssTQo15jouu8VhuEZJCfbtBUZgRcuW': 'NNI',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4': 'WUSDT',
  '3K6rftdAaQYMPunrtNRHgnK2UAtjm2JwyT2oCiTDouYE': 'xCOPE',
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': 'SRM',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
}
const TOKENBASE_MAIN: Tokens = {
  // NNI: {
  //   symbol: 'NNI',
  //   name: 'Neonomad Finance',
  //   mintAddress: 'BcRr96qhSoaKFjGJDKtSWmHDvTrv7ziuq29dRjtUmHuk',
  //   decimals: 6,
  //   tags:['cropper']
  // }
}

const TOKENBASE_DEVNET: Tokens = {
  NNI: {
    symbol: 'NNI',
    name: 'Neonomad Finance',
    mintAddress: 'JBBdiDDL2uGHkYxJQEbtBo1uY5VErjwRJNVeCHipgEJA',
    decimals: 6,
    tags:['cropper']
  },
  USDD: {
    symbol: 'USDC',
    name: 'USDC Coin',
    mintAddress: '47sXKHFzjP8EJLwxhKYeivJZMBwCdT4ZB4xWeHZjGbXr',
    decimals: 6,
    tags:['cropper']
  },
  CRP: {
    symbol: 'CRP',
    name: 'Cropper',
    mintAddress: 'GGaUYeET8HXK34H2D1ieh4YYQPhkWcfWBZ4rdp6iCZtG',
    decimals: 6,
    tags:['cropper']
  },
  
  USDT: {
    symbol: 'USDT',
    name: 'USDT',
    mintAddress: '6La9ryWrDPByZViuQCizmo6aW98cK8DSL7angqmTFf9i',
    decimals: 9,
    tags:['cropper']
  },

  USDC: {
    symbol: 'USDC',
    name: 'USDC Coin',
    mintAddress: '6MBRfPbzejwVpADXq3LCotZetje3N16m5Yn7LCs2ffU4',
    decimals: 9,
    tags:['cropper']
  },
  B2B: {
    symbol: 'B2B',
    name: 'B2B',
    mintAddress: 'ECe1Hak68wLS44NEwBVNtZDMxap1bX3jPCoAnDLFWDHz',
    decimals: 9,
    tags:['cropper']
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    mintAddress: 'G4UK7D15rHE85Q8HLKQ9BBafd2n2sUCkCRWwvWtBfuPe',
    decimals: 9,
    tags:['cropper']
  },
  WSOL: {
    symbol: 'WSOL',
    name: 'Wrapped Solana',
    mintAddress: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    tags:['cropper']
  },
  WUSDT: {
    symbol: 'WUSDT',
    name: 'Wrapped USDT',
    mintAddress: 'BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4',
    decimals: 6,
    tags:['cropper']
  },
  WUSDC: {
    symbol: 'WUSDC',
    name: 'Wrapped USDC',
    mintAddress: 'BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW',
    decimals: 6,
    tags:['cropper']
  },
  xCOPE: {
    symbol: 'xCOPE',
    name: 'xCOPE',
    mintAddress: '3K6rftdAaQYMPunrtNRHgnK2UAtjm2JwyT2oCiTDouYE',
    decimals: 0,
    tags:['cropper']
  },
}

export const TOKENS = cloneDeep(DEVNET_MODE ? TOKENBASE_DEVNET : TOKENBASE_MAIN)

/**
 * Get token use symbol

 * @param {string} symbol

 * @returns {TokenInfo | null} tokenInfo
 */
export function getTokenBySymbol(symbol: string): TokenInfo | null {
  if (symbol === 'SOL') {
    return cloneDeep(NATIVE_SOL)
  }

  let token = cloneDeep(TOKENS[symbol])

  if (!token) {
    token = null
  }

  return token
}

/**
 * Get token use mint addresses

 * @param {string} mintAddress

 * @returns {TokenInfo | null} tokenInfo
 */
export function getTokenByMintAddress(mintAddress: string): TokenInfo | null {
  if (mintAddress === NATIVE_SOL.mintAddress) {
    return cloneDeep(NATIVE_SOL)
  }
  const token = Object.values(TOKENS).find((item) => item.mintAddress === mintAddress)
  return token ? cloneDeep(token) : null
}

export function getTokenSymbolByMint(mint: string) {
  if (mint === NATIVE_SOL.mintAddress) {
    return NATIVE_SOL.symbol
  }

  const token = Object.values({ ...TOKENS }).find((item) => item.mintAddress === mint)

  if (token) {
    return token.symbol
  }
  return 'UNKNOWN'
}

export const TOKENS_TAGS: { [key: string]: { mustShow: boolean; show: boolean; outName: string } } = {
  cropper: { mustShow: true, show: true, outName: 'Cropper Default List' },
  solana: { mustShow: true, show: true, outName: 'Solana Token List' },
}