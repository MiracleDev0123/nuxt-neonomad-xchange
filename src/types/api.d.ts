export interface PricesData {
  [key: string]: any
}

export interface InfoData {
  tvl: number
  volume24h: number
  totalvolume: number
}

export interface PairData {}

export interface Rpc {
  url: string
  weight: number
}

export interface ConfigData {
  success: boolean
  strategy: 'speed' | 'weight'
  rpcs: Rpc[]
}

export interface EpochInfo {}

export interface NuxtApiInstance {
  getPrices: () => Promise<PricesData>
  getEpochInfo: (rpc: string) => Promise<EpochInfo>
}

declare module 'cors';