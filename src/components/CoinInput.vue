<template>
  <div class="coin-select">
    <div class="coin-title">
      <label class="font-xsmall weight-semi">{{ label }}</label>
    </div>
    <div class="coin-input">
      <div class="fcsb-container">
        <div class="fcc-container">
          <button class="select-button fcsb-container" @click="$emit('onSelect')">
            <div v-if="coinName" class="coin-group fcc-container">
              <CoinIcon :mint-address="mintAddress" />
              <span class="font-body-medium weight-bold">{{ coinName }}</span>
            </div>
            <span v-else>Select a token</span>
            <img class="collapse-arrow" v-if="showArrow" src="@/assets/icons/arrow-down-white.svg" />
          </button>
          <button
            v-if="!disabled && !showHalf && balance"
            class="input-button font-xsmall weight-bold fcc-container"
            @click="inputBalanceByPercent(1)"
          >
            Max
          </button>
          <button
            v-if="!disabled && showHalf && balance"
            class="input-button font-xsmall weight-bold fcc-container"
            @click="inputBalanceByPercent(0.5)"
          >
            Half
          </button>
        </div>
        <input
          ref="input"
          :value="value"
          inputmode="decimal"
          autocomplete="off"
          autocorrect="off"
          placeholder="0.00"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minlength="1"
          maxlength="79"
          spellcheck="false"
          :disabled="disabled"
          @input="$emit('onInput', $event.target.value)"
          @focus="$emit('onFocus')"
        />
      </div>
      <div v-if="balance && !balance.wei.isNaN()" class="label fcsb-container font-xsmall weight-semi">
        <span> Balance: {{ balance.fixed() }} </span>
        <span> ~${{ balance.fixed() }} </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { lt } from '@/utils/safe-math'

export default Vue.extend({
  data() {
    return {
      showHalf: false as boolean
    }
  },
  model: {
    prop: 'value',
    event: 'onInput'
  },
  props: {
    label: {
      type: String,
      default: ''
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
    showArrow: {
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
      this.showHalf = !this.showHalf

      // error balance
      if (!this.balance || this.balance.wei.isNaN()) return

      const availableBalance = Number(this.balance.toEther()) + (this.balanceOffset ?? 0)

      // can't send negative balance
      if (availableBalance < 0) return

      const inputValue = (availableBalance * percent).toFixed(this.balance.decimals)
      this.focusInput()
      this.$emit('onInput', inputValue)
    }
  }
})
</script>

<style lang="less" scoped>
.coin-select {
  .coin-title {
    margin-bottom: 8px;

    label {
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .coin-input {
    background: rgba(226, 227, 236, 0.2);
    border-radius: 18px;
    padding: 12px;
    position: relative;
    z-index: 0;

    &::after {
      content: "";
    }

    &::before {
      content: "";
      position: absolute;
      z-index: -1;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:  linear-gradient(246deg, #da2eef 7.97%, #2b6aff 49.17%);
      padding: 1px;
      border-radius: 18px;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    button {
      border: none;
      background-color: transparent;
      font-weight: 600;
      font-size: 14px;
      line-height: 22px;
      border-radius: 4px;
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

    .input-button {
      height: 32px;
      width: 32px;
      border: 1px solid #6574d6;
      border-radius: 4px;
      color: @color-blue50;
    }

    .select-button {
      position: relative;
      padding: 0 10px;
      background: @color-blue800;
      border-radius: 8px;
      width: auto;
      min-width: 100px;
      height: 32px;
      margin-right: 10px;

      .coin-group img {
        width: 14px;
        height: 14px;
        margin-right: 5px;
      }

      .collapse-arrow {
        // position: absolute;
        margin-left: 4px;
        width: 14px;
        height: 8px;
      }
    }

    .select-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 8px;
      padding: 2px;
      background: @gradient-color04;
      background-origin: border-box;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: destination-out;
      mask-composite: exclude;
    }

    input {
      width: 0;
      padding: 0;
      border: none;
      background-color: transparent;
      flex: 1 1 auto;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: right;
      font-weight: 600;
      font-size: 25px;
      line-height: 35px;
      letter-spacing: 0.25px;

      &:active,
      &:focus,
      &:hover {
        outline: 0;
      }

      &::placeholder {
        color: @color-blue200;
      }
    }

    input[disabled] {
      cursor: not-allowed;
    }

    .label {
      margin-top: 8px;
      color: @color-blue100;
    }
  }
}
</style>
