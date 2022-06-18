<template>
  <div class="coin-select">
    <div class="label fcsb-container font-xsmall weight-bold">
      <span>{{ label }}</span>
    </div>
    <div class="coin-input">
      <div class="main-input fcsb-container">
        <button class="select-button fcc-container" @click="selectCoin">
          <div v-if="coinName" class="coin-container fcc-container">
            <CoinIcon :mint-address="mintAddress" />
            <span class="font-small weight-semi" :class="disabled ? 'coin-disabled' : ''">{{ coinName }}</span>
          </div>
          <span v-else class="font-small weight-semi" :class="disabled ? 'coin-disabled' : ''">Select a token</span>
          <img v-if="!disabled" class="arrow-icon" src="@/assets/icons/arrow-down-white.svg" />
          <img v-else class="arrow-icon" src="@/assets/icons/arrow-down-grey.svg" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { lt } from '@/utils/safe-math'

export default Vue.extend({
  model: {
    prop: 'value',
    event: 'onInput'
  },

  props: {
    label: {
      type: String,
      default: 'From'
    },
    coinName: {
      type: String,
      default: ''
    },
    mintAddress: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    balance: {
      type: Object,
      default: null
    },
    balanceOffset: {
      type: Number,
      default: 0
    },
    showMax: {
      type: Boolean,
      default: true
    },
    showHalf: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    lt,
    focusInput() {
      const input = this.$refs.input as HTMLInputElement
      input.focus()
    },
    inputBalanceByPercent(percent: number) {
      // error balance
      if (!this.balance || this.balance.wei.isNaN()) return

      const availableBalance = Number(this.balance.toEther()) + (this.balanceOffset ?? 0)

      // can't send negative balance
      if (availableBalance < 0) return

      const inputValue = (availableBalance * percent).toFixed(this.balance.decimals)
      this.focusInput()
      this.$emit('onInput', inputValue)
    },
    selectCoin() {
      if (this.disabled == false) this.$emit('onSelect')
    }
  }
})
</script>

<style lang="less" scoped>
.coin-select {
  .label {
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.5);
  }

  .coin-input {
    background: @gradient-color04;
    background-origin: border-box;
    padding: 2px;
    border-radius: 8px;
    width: fit-content;

    button {
      border: none;
      background-color: @color-blue800;
      border-radius: 8px;
      white-space: nowrap;
      cursor: pointer;

      &:active,
      &:focus,
      &:hover {
        outline: 0;
      }

      &:hover {
        background-color: @modal-header-bg;
      }
    }

    .select-button {
      padding: 6px;

      .arrow-icon {
        width: 9px;
        height: 6px;
        margin-left: 4px;
      }

      .coin-disabled {
        color: rgba(255, 255, 255, 0.5);
      }

      .coin-container {
        img {
          height: 12px;
          width: 12px;
          margin-right: 4px;
        }
      }
    }
  }
}
</style>
