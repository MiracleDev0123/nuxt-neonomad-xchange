<template>
  <Modal
    :title="title"
    :visible="true"
    :footer="null"
    :width="400"
    :closable="false"
    :mask-closable="true"
    class="addliq-modal"
    centered
    @cancel="$emit('onCancel')"
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />
    <div class="addliq">
      <CoinInput
        v-model="fromCoinAmount"
        label="Input"
        :mint-address="farmInfo.lp.coin ? farmInfo.lp.coin.mintAddress : ''"
        :coin-name="farmInfo.lp.coin ? farmInfo.lp.coin.symbol : ''"
        :balance="farmInfo.lp.coin ? farmInfo.lp.coin.balance : null"
        @onInput="(amount) => (fromCoinAmount = amount)"
        @onFocus="
          () => {
            fixedCoin = farmInfo.lp.coin.mintAddress
          }
        "
        @onMax="
          () => {
            fixedCoin = farmInfo.lp.coin.mintAddress
            fromCoinAmount = farmInfo.lp.coin.balance ? farmInfo.lp.coin.balance.fixed() : ''
          }
        "
      />

      <div class="plus-icon-container text-center">
        <img src="@/assets/icons/plus.svg" class="plus-icon m-auto" />
      </div>

      <CoinInput
        v-model="toCoinAmount"
        label="Input"
        :mint-address="farmInfo.lp.pc ? farmInfo.lp.pc.mintAddress : ''"
        :coin-name="farmInfo.lp.pc ? farmInfo.lp.pc.symbol : ''"
        :balance="farmInfo.lp.pc ? farmInfo.lp.pc.balance : null"
        @onInput="(amount) => (toCoinAmount = amount)"
        @onFocus="
          () => {
            fixedCoin = farmInfo.lp.pc.mintAddress
          }
        "
        @onMax="
          () => {
            fixedCoin = farmInfo.lp.pc.mintAddress
            toCoinAmount = farmInfo.lp.pc.balance ? farmInfo.lp.pc.balance.fixed() : ''
          }
        "
      />

      <LiquidityPoolInfo :initialized="liquidity.initialized" :pool-info="liquidity.infos[farmInfo.lp.mintAddress]" />
      <div v-if="officialPool === false">
        <div style="margin: 10px">
          <div>AMM ID:</div>
          <div>
            {{ farmInfo.poolId.substr(0, 14) }}
            ...
            {{ farmInfo.poolId.substr(farmInfo.poolId.length - 14, 14) }}
          </div>
        </div>
      </div>

      <div class="btn-container">
        <Button
          class="btn-transparent font-large weight-bold"
          id="vadd"
          :disabled="
            !farmInfo.lp.coin ||
            !fromCoinAmount ||
            !farmInfo.lp.pc ||
            !farmInfo.lp.mintAddress ||
            !liquidity.initialized ||
            liquidity.loading ||
            gt(fromCoinAmount, farmInfo.lp.coin.balance ? farmInfo.lp.coin.balance.fixed() : '0') ||
            gt(toCoinAmount, farmInfo.lp.pc.balance ? farmInfo.lp.pc.balance.fixed() : '0') ||
            suppling
          "
          :loading="suppling"
          @click="$emit('onOk', fromCoinAmount, toCoinAmount, fixedCoin)"
        >
          <template v-if="!farmInfo.lp.coin || !farmInfo.lp.pc"> Select a token </template>
          <template v-else-if="!farmInfo.lp.mintAddress || !liquidity.initialized"> Invalid pair </template>
          <template v-else-if="!fromCoinAmount"> Enter an amount </template>
          <template v-else-if="liquidity.loading"> Updating pool information </template>
          <template v-else-if="gt(fromCoinAmount, farmInfo.lp.coin.balance ? farmInfo.lp.coin.balance.fixed() : '0')">
            Insufficient {{ farmInfo.lp.coin.symbol }} balance
          </template>
          <template v-else-if="gt(toCoinAmount, farmInfo.lp.pc.balance ? farmInfo.lp.pc.balance.fixed() : '')">
            Insufficient {{ farmInfo.lp.pc.symbol }} balance
          </template>
          <template v-else>Add liquidity</template>
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Button } from 'ant-design-vue'
import { mapState } from 'vuex'
import { inputRegex, escapeRegExp } from '@/utils/regex'
import { getOutAmount } from '@/utils/liquidity'
import { gt } from '@/utils/safe-math'

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
    loading: {
      type: Boolean,
      default: false
    },
    farmInfo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      fromCoinAmount: '',
      toCoinAmount: '',
      fixedCoin: '',
      officialPool: true,
      userCheckUnofficial: false,
      userCheckUnofficialMint: undefined as string | undefined,
      userCheckUnofficialShow: false,
      suppling: false
    }
  },
  computed: {
    ...mapState(['liquidity', 'setting'])
  },
  watch: {
    fromCoinAmount(newAmount: string, oldAmount: string) {
      this.$nextTick(() => {
        if (!inputRegex.test(escapeRegExp(newAmount))) {
          this.fromCoinAmount = oldAmount
        } else {
          this.updateAmounts()
        }
      })
    },

    toCoinAmount(newAmount: string, oldAmount: string) {
      this.$nextTick(() => {
        if (!inputRegex.test(escapeRegExp(newAmount))) {
          this.toCoinAmount = oldAmount
        } else {
          this.updateAmounts()
        }
      })
    }
  },

  methods: {
    gt,
    updateAmounts() {
      if (this.farmInfo.lp.coin && this.farmInfo.lp.pc && this.farmInfo.lp.mintAddress) {
        const poolInfo = this.liquidity.infos[this.farmInfo.lp.mintAddress]

        if (this.fixedCoin === this.farmInfo.lp.coin.mintAddress) {
          const amount = getOutAmount(
            poolInfo,
            this.fromCoinAmount,
            this.farmInfo.lp.coin.mintAddress,
            this.farmInfo.lp.pc.mintAddress,
            this.setting.slippage
          )

          if (amount.isNaN() || !amount.isFinite()) {
            this.toCoinAmount = ''
          } else {
            this.toCoinAmount = amount.toFixed(this.farmInfo.lp.pc.decimals)
          }
        } else {
          const poolInfo = this.liquidity.infos[this.farmInfo.lp.mintAddress]

          const amount = getOutAmount(
            poolInfo,
            this.toCoinAmount,
            this.farmInfo.lp.pc.mintAddress,
            this.farmInfo.lp.coin.mintAddress,
            this.setting.slippage
          )

          if (amount.isNaN() || !amount.isFinite()) {
            this.fromCoinAmount = ''
          } else {
            this.fromCoinAmount = amount.toFixed(this.farmInfo.lp.pc.decimals)
          }
        }
      }
    }
  }
})
</script>
<style lang="less" scoped>
.addliq {
  .plus-icon-container {
    margin: 8px 0;
  }
}

.btn-container {
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 3px;
  height: auto;
}

.btn-transparent {
  background: transparent;
  border-radius: 38px;
  border: none;
  height: 44px;
  width: 100%;

  &[disabled]:focus,
  &[disabled]:hover {
    background: transparent;
    border: none;
  }
}
</style>