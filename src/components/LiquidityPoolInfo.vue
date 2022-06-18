<template>
  <div v-if="initialized && poolInfo" class="pool-info">
    {{ void ((coin = poolInfo.coin), (pc = poolInfo.pc), (lp = poolInfo.lp)) }}
    <div class="price-base fcc-container font-small weight-semi">
      <span v-if="coinBasePrice">
        1 {{ coin.symbol }} ≈
        {{ getPrice(poolInfo).toFixed(pc.decimals) }}
        {{ pc.symbol }}
      </span>
      <span v-else>
        1 {{ pc.symbol }} ≈
        {{ getPrice(poolInfo, false).toFixed(coin.decimals) }}
        {{ coin.symbol }}
      </span>
      <img class="swap-icon" src="@/assets/icons/swap-vertical.svg" @click="() => (coinBasePrice = !coinBasePrice)" />
    </div>

    <div class="price-info-box">
      <div class="price-info fcsb-container">
        <span class="name font-small weight-bold">Pool liquidity</span>
        <div class="text-right">
          <span class="value">
            {{ coin.balance.format() }}
            <b>{{ coin.symbol }}</b>
          </span>
          <span class="value">
            {{ pc.balance.format() }}
            <b>{{ pc.symbol }}</b>
          </span>
        </div>
      </div>

      <div class="price-info fcsb-container">
        <span class="name font-small weight-bold">LP supply</span>
        <span class="value">
          {{ lp.totalSupply.format() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { getPrice } from '@/utils/liquidity'

export default Vue.extend({
  props: {
    initialized: {
      type: Boolean,
      default: false
    },
    poolInfo: {
      type: [Object || null],
      default: null
    }
  },

  data() {
    return {
      coinBasePrice: true
    }
  },

  methods: {
    getPrice
  }
})
</script>

<style lang="less" scoped>
.pool-info {
  .price-base {
    letter-spacing: 0.5px;
    color: @color-blue200;
    margin-top: 8px;

    .swap-icon {
      margin-left: 10px;
      cursor: pointer;
    }
  }

  .price-info-box {
    margin: 8px 0;
    background: @color-blue800;
    border-radius: 18px;
    padding: 12px;

    .name {
      color: @color-blue200;
    }

    .price-info {
      margin-bottom: 18px;

      &:last-child {
        margin-bottom: 0;
      }

      .value {
        display: block;
        color: @color-blue100;
      }
    }
  }
}
</style>
