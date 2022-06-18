<template>
  <Modal
    :title="title"
    :visible="true"
    :footer="null"
    :width="400"
    :closable="false"
    :mask-closable="true"
    centered
    @cancel="$emit('onCancel')"
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />

    <div class="liquidity-box">
      <div class="fcsb-container">
        <span></span>
        <span v-if="coin.balance && !coin.balance.wei.isNaN()"> Balance: {{ coin.balance.fixed() }} </span>
      </div>
      <div class="fcsb-container">
        <div class="fcc-container">
          <div class="coins-container">
            <div class="coin-group font-small weight-semi">
              <CoinIcon v-if="coinIcon" :mint-address="coin ? coin.mintAddress : ''" />
              {{ coin.symbol }}
            </div>
          </div>
          <button
            v-if="coin.balance && (isNullOrZero(value) || lt(value, coin.balance.toEther()))"
            class="input-button font-xsmall weight-bold fcc-container"
            @click="setMax"
          >
            Max
          </button>
        </div>

        <input
          v-model="value"
          inputmode="decimal"
          autocomplete="off"
          autocorrect="off"
          placeholder="0.00"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minlength="1"
          maxlength="79"
          spellcheck="false"
        />
      </div>
    </div>

    <div v-if="text" v-html="text" class="info-box">
      <img class="info-icon" src="@/assets/icons/info.svg" />
      <label class="font-xsmall weight-bold" v-html="text"> </label>
    </div>

    <div class="btn-group fcsb-container">
      <div class="btn-container">
        <Button class="btn-fill font-medium weight-semi" @click="$emit('onCancel')"> Cancel </Button>
      </div>
      <div class="btn-container">
        <Button
          class="btn-transparent font-medium weight-semi"
          :loading="loading"
          :disabled="loading || isNullOrZero(value) || !lte(value, coin.balance.toEther()) || !validateTotalSupply()"
          @click="$emit('onOk', value)"
        >
          Confirm
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Button } from 'ant-design-vue'

import { inputRegex, escapeRegExp } from '@/utils/regex'
import { lt, lte, isNullOrZero } from '@/utils/safe-math'
import { getTotalSupply } from '@/store/liquidity'
const MIN_LP_SUPPLY = 0.001
// fix: Failed to resolve directive: ant-portal
Vue.use(Modal)

export default Vue.extend({
  components: {
    Modal,
    Button
  },

  props: {
    title: {
      type: String,
      default: ''
    },
    coin: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: ''
    },
    coinIcon: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      value: ''
    }
  },
  watch: {
    // input amount change
    value(newValue: string, oldValue: string) {
      this.$nextTick(() => {
        if (!inputRegex.test(escapeRegExp(newValue))) {
          this.value = oldValue
        }
      })
    }
  },

  methods: {
    lt,
    lte,
    isNullOrZero,
    validateTotalSupply() {
      if (this.title == 'Remove Liquidity') {
        const lp_info = Object(this.$accessor.liquidity.infos)[this.coin.mintAddress]
        if (lp_info) {
          const totalSupply = lp_info.lp.totalSupply.fixed()
          const res = parseFloat(this.value) <= parseFloat(totalSupply) - MIN_LP_SUPPLY //
          return res
        } else {
          return false
        }
      }
      return true
    },

    setMax() {
      if (this.title == 'Remove Liquidity') {
        let self = this

        const lp_info = Object(this.$accessor.liquidity.infos)[this.coin.mintAddress]
        if (lp_info) {
          const totalSupply = lp_info.lp.totalSupply.fixed()
          self.value = '' + Math.min(parseFloat(self.coin.balance.fixed()), parseFloat(totalSupply) - MIN_LP_SUPPLY)
        }
      } else {
        this.value = this.coin.balance.fixed()
      }
    }
  }
})
</script>

<style lang="less" scoped>
@import '../styles/variables';
.liquidity-box {
  background: rgba(226, 227, 236, 0.1);
  border-radius: 18px;
  padding: 12px;

  .coins-container {
    background: @gradient-color-outline;
    background-origin: border-box;
    padding: 2px;
    border-radius: 8px;
    margin-right: 8px;

    .coin-group {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 6px;
      background: @color-blue800;

      img {
        border-radius: 50%;
        width: 12px;
        height: 12px;
        margin-right: 4px;
      }

      .from-to {
        margin: 0 4px;
      }
    }
  }

  .input-button {
    height: 32px;
    width: 32px;
    border: 1px solid @color-blue300;
    border-radius: 4px;
    color: #ccd1f1;
    background: transparent;
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
  }

  input[disabled] {
    cursor: not-allowed;
  }

  .balance-info {
    margin-top: 8px;
    color: @color-blue200;
  }
}

.lp-breakdown {
  margin-top: 8px;

  label {
    color: @color-blue200;
  }

  .lp-coins-container {
    margin-top: 18px;

    .lp-coin-box {
      background: @color-blue600;
      padding: 4px 12px;
      border-radius: 8px;
      margin-right: 8px;
      color: @color-blue100;

      &:last-child {
        margin-right: 0;
      }
    }
  }
}

.info-box {
  background: @color-blue800;
  padding: 18px;
  border-radius: 18px;
  margin-top: 18px;
  display: flex;
  align-items: baseline;

  .info-icon {
    width: 12px;
    height: 12px;
    margin-right: 8px;
  }

  label {
    color: @color-blue100;
  }
}

.btn-group {
  margin-top: 8px;

  .btn-container {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    padding: 3px;
    height: 50px;
    margin-right: 4px;
    width: calc(50% - 4px);

    &:last-child {
      margin-right: 0;
    }

    .btn-transparent,
    .btn-fill {
      height: 100%;
      width: 100%;
      border-radius: 38px;
      border: 0;
    }

    .btn-transparent {
      background: transparent;
    }

    .btn-fill {
      background: @color-blue700;
    }
  }
}
</style>
