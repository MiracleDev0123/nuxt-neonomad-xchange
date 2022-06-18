<template>
  <div class="information">
    <div class="tvl-info">
      <p class="font-large weight-semi">TVL : ${{ TVL.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue } from 'nuxt-property-decorator'
import { get } from 'lodash-es'
import { getPoolByLpMintAddress, getAllCropperPools } from '@/utils/pools'
import { TokenAmount } from '@/utils/safe-math'
import { getBigNumber } from '@/utils/layouts'

declare const window: any

export default Vue.extend({
  data() {
    return {
      TVL: 0,
      activeSpinning: false
    }
  },
  mounted() {
    this.getTvl()
  },
  methods: {
    async getTvl() {
      let cur_date = new Date().getTime()
      if (window.localStorage.TVL_last_updated) {
        const last_updated = parseInt(window.localStorage.TVL_last_updated)
        if (cur_date - last_updated <= 600000) {
          this.TVL = window.localStorage.TVL
          return
        }
      }

      let tvl = 0
      const pools = this.poolsFormated() as any[]
      pools.forEach((pool) => {
        tvl += pool.liquidity
      })

      this.TVL = Math.round(tvl)

      window.localStorage.TVL_last_updated = new Date().getTime()
      window.localStorage.TVL = this.TVL
    },
    poolsFormated() {
      const conn = this.$web3
      const wallet = (this as any).$accessor.wallet
      const liquidity = (this as any).$accessor.liquidity
      const price = (this as any).$accessor.price

      const polo: any = []

      getAllCropperPools().forEach(function (value: any) {
        const liquidityItem = get(liquidity.infos, value.lp_mint)

        if (!liquidityItem) {
          return
        }

        let lp = getPoolByLpMintAddress(value.lp_mint)

        let newCoin = 0
        let newPc = 0

        if (!price.prices[liquidityItem?.coin.symbol as string] && price.prices[liquidityItem?.pc.symbol as string]) {
          price.prices[liquidityItem?.coin.symbol as string] =
            (price.prices[liquidityItem?.pc.symbol as string] *
              getBigNumber((liquidityItem?.pc.balance as TokenAmount).toEther())) /
            getBigNumber((liquidityItem?.coin.balance as TokenAmount).toEther())
          newCoin = 1
        }

        if (!price.prices[liquidityItem?.pc.symbol as string] && price.prices[liquidityItem?.coin.symbol as string]) {
          price.prices[liquidityItem?.pc.symbol as string] =
            (price.prices[liquidityItem?.coin.symbol as string] *
              getBigNumber((liquidityItem?.coin.balance as TokenAmount).toEther())) /
            getBigNumber((liquidityItem?.pc.balance as TokenAmount).toEther())
          newPc = 1
        }

        const liquidityCoinValue =
          getBigNumber((liquidityItem?.coin.balance as TokenAmount).toEther()) *
          price.prices[liquidityItem?.coin.symbol as string]
        const liquidityPcValue =
          getBigNumber((liquidityItem?.pc.balance as TokenAmount).toEther()) *
          price.prices[liquidityItem?.pc.symbol as string]

        let liquidityTotalValue = liquidityPcValue + liquidityCoinValue
        if (price.prices[liquidityItem?.pc.symbol as string] == 1) {
          liquidityTotalValue = liquidityPcValue * 2
        }

        const liquidityTotalSupply = getBigNumber((liquidityItem?.lp.totalSupply as TokenAmount).toEther())
        const liquidityItemValue = liquidityTotalValue / liquidityTotalSupply

        value.liquidity = liquidityTotalValue

        if (!window.poolsDatas) {
          window.poolsDatas = {}
        }

        if (window.poolsDatas[value.ammId]) {
          value.volume_24h = 0
          if (
            window.poolsDatas[value.ammId][liquidityItem?.coin.mintAddress] &&
            window.poolsDatas[value.ammId][liquidityItem?.coin.mintAddress]['1day']
          ) {
            value.volume_24h +=
              window.poolsDatas[value.ammId][liquidityItem?.coin.mintAddress]['1day'] *
              price.prices[liquidityItem?.coin.symbol as string]
          }

          if (
            window.poolsDatas[value.ammId][liquidityItem?.pc.mintAddress] &&
            window.poolsDatas[value.ammId][liquidityItem?.pc.mintAddress]['1day']
          ) {
            value.volume_24h +=
              window.poolsDatas[value.ammId][liquidityItem?.pc.mintAddress]['1day'] *
              price.prices[liquidityItem?.pc.symbol as string]
          }
        } else {
          value.volume_24h = 0
        }

        if (window.poolsDatas[value.ammId]) {
          value.volume_7d = 0
          if (
            window.poolsDatas[value.ammId][liquidityItem?.coin.mintAddress] &&
            window.poolsDatas[value.ammId][liquidityItem?.coin.mintAddress]['7day']
          ) {
            value.volume_7d +=
              window.poolsDatas[value.ammId][liquidityItem?.coin.mintAddress]['7day'] *
              price.prices[liquidityItem?.coin.symbol as string]
          }

          if (
            window.poolsDatas[value.ammId][liquidityItem?.pc.mintAddress] &&
            window.poolsDatas[value.ammId][liquidityItem?.pc.mintAddress]['7day']
          ) {
            value.volume_7d +=
              window.poolsDatas[value.ammId][liquidityItem?.pc.mintAddress]['7day'] *
              price.prices[liquidityItem?.pc.symbol as string]
          }
        } else {
          value.volume_7d = 0
        }

        if (window.poolsDatas[value.ammId]) {
          value.fee_24h = value.volume_24h * 0.003
        } else {
          value.fee_24h = 0
        }

        if (window.poolsDatas[value.ammId]) {
          value.apy = (value.fee_24h * 365 * 100) / liquidityTotalValue
        } else {
          value.apy = 0
        }

        value.nameSymbol = value.coin1.symbol + ' - ' + value.coin2.symbol

        if (window.labelised.includes(value.ammId)) {
          value.labelized = 1
        }

        value.currentUnformated = null

        if (liquidityPcValue != 0 && liquidityCoinValue != 0) {
          if (wallet) {
            value.current = get(wallet.tokenAccounts, `${value.lp_mint}.balance`)
            value.currentUnformated = value.current
            if (value.current) {
              value.current = (value.current.wei.toNumber() / Math.pow(10, value.current.decimals)) * liquidityItemValue
            } else {
              value.current = 0
            }
          } else {
            value.current = 0
          }
          polo.push(value)
        }
      })
      return polo
    }
  }
})
</script>

<style lang="less">
.information {
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media @max-sl-mobile {
    width: 100%;
  }

  .tvl-info {
    margin-right: 18px;
  }

  .action-btn-group {
    display: flex;
    align-items: center;

    .reload-btn {
      background: linear-gradient(rgba(75, 85, 231, 0.65098), rgba(182, 97, 150, 0.74902));
      border-radius: 8px;
      padding: 6px;
      margin-right: 18px;
      display: flex;
      align-items: center;
      justify-content: center;

      @media @max-lg-tablet {
        margin-left: 5px;
      }

      img {
        width: 18px;
        height: 18px;
      }

      &.active img {
        transform: rotate(360deg);
        transition: all 1s ease-in-out;
      }
    }

    .create-btn {
      top: 20px;
      right: -90px;

      .create-plus-btn {
        background: @color-blue600;
        border-radius: 8px;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
    }
  }
}
</style>
