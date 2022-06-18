import { Connection } from '@solana/web3.js'
import { Plugin } from '@nuxt/types'

import { sleep } from '@/utils'
import { DEVNET_MODE } from '@/utils/ids'
import { web3Config, commitment } from '@/utils/web3'
import logger from '@/utils/logger'
import { NuxtApiInstance, Rpc } from '@/types/api'

const createWeb3Instance = (endpoint: string) => {
  const web3 = new Connection(endpoint, commitment)
  return web3
}

export function getWeightEndpoint(endpoints: Rpc[]) {
  let pointer = 0
  const random = Math.random() * 100
  let api = endpoints[0].url

  for (const endpoint of endpoints) {
    if (random > pointer + endpoint.weight) {
      pointer += pointer + endpoint.weight
    } else if (random >= pointer && random < pointer + endpoint.weight) {
      api = endpoint.url
      break
    } else {
      api = endpoint.url
      break
    }
  }

  return api
}

const web3Plugin: Plugin = async (ctx, inject) => {

  let config
  let endpoint
  let configFrom

  config = web3Config
  configFrom = 'local'
  

  const { rpcs, strategy } = config

  endpoint = getWeightEndpoint(rpcs)
  
  if(DEVNET_MODE)
    endpoint = 'https://api.devnet.solana.com'; 

  
  
  const web3 = createWeb3Instance(endpoint)

  ctx.$web3 = web3
  inject('web3', web3)
}

export default web3Plugin
