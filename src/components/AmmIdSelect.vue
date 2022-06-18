<template>
  <Modal
    title="Confirm the AMM ID"
    :visible="show"
    :footer="null"
    :mask-closable="false"
    :closable="false"
    :width="480"
    @cancel="$emit('onClose')"
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />

    <div class="select-token">
      <div class="token-list">
        <div
          v-for="liquidity in liquidityList"
          :key="liquidity.ammId"
          class="token-info icon-cursor"
          @click="$emit('onSelect', liquidity)"
        >
          <div class="token-info-item font-medium">
            <span><b>AMM ID: </b>{{ liquidity.ammId }}</span>
          </div>

          <div class="token-info-item font-medium">
            <span>
              <b>Pool liquidity: </b>
              {{ liquidity.coin.balance ? liquidity.coin.balance.toEther() : 0 }}
              {{ liquidity.coin.symbol }} |
              {{ liquidity.pc.balance ? liquidity.pc.balance.toEther() : 0 }}
              {{ liquidity.pc.symbol }}
            </span>
          </div>
        </div>
      </div>
      <div class="stdGradientButton" :style="userClose ? '' : 'display: none'">
        <Button v-if="userClose" size="large" ghost @click="$emit('onSelect', undefined)">Create a new one</Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Button } from 'ant-design-vue'

Vue.use(Modal)

export default Vue.extend({
  components: {
    Modal,
    Button
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    liquidityList: {
      // type: List,
      default: []
    },
    userClose: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="less" scoped>
.select-token {
  display: grid;
  grid-auto-rows: auto;
  row-gap: 8px;
  margin: 18px 0;

  .token-list {
    max-height: 60vh;
    overflow: auto;
    direction: ltr;
    will-change: transform;

    .token-info {
      padding: 8px;
      background: @color-blue600;
      border-radius: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .token-info-item {
        color: @color-blue100;
        margin-bottom: 8px;
        word-break: break-word;

        &:last-child {
          margin-bottom: 0;
        }
      }

      &:hover,
      &:active {
        background: @color-blue300;
      }

      &[disabled] {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
  }
}
</style>
