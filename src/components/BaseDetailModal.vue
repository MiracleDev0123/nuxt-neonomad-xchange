<template>
  <Modal
    title="Base detail"
    :visible="show"
    :footer="null"
    :mask-closable="true"
    :closable="false"
    @cancel="$emit('onCancel')"
    centered
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />
    <div class="base-container">
      <div class="base-title">
        <label class="label">Base APY</label>
        <label class="value">
          <!-- {{ Math.round(estimatedapy * 100) / 100 }}% -->
          30%
        </label>
      </div>

      <div class="base-table">
        <div class="base-table-header">
          <Col span="8"> Lock time </Col>
          <Col span="8"> Boost </Col>
          <Col span="8"> Estimated APY </Col>
        </div>
        <div
          class="base-table-body"
          v-for="data in lockData"
          :key="data.tier"
          @click="$emit('onSelect', data.time, data.apy)"
        >
          <Col span="8"> {{ data.time >= 12 ? data.time / 12 + ' year' : data.time + ' month' }} </Col>
          <Col span="8"> {{ data.boost }} x </Col>
          <Col span="8"> {{ Math.round(100 * (Math.round(estimatedapy * 100) / 100) * data.boost) / 100 }} % </Col>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Row, Col } from 'ant-design-vue'

import { setAnchorProvider, getExtraRewardConfigs } from '@/utils/crp-stake'

Vue.use(Modal)

export default Vue.extend({
  components: {
    Modal,
    Col
  },

  props: {
    show: {
      type: Boolean,
      default: false
    },
    crpbalance: {
      type: Number,
      default: 0
    },
    estimatedapy: {
      type: Number,
      default: 0
    },
    userStaked: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      lockData: [
        {
          tier: 1,
          time: 1,
          minutesLock: 43200,
          days: 30,
          boost: 1,
          apy: 11.1,
          text: 'Boost for 1 month locked'
        },
        {
          tier: 2,
          time: 3,
          minutesLock: 129600,
          days: 90,
          boost: 1.1,
          apy: 12.21,
          text: 'Boost for 3 months locked'
        }
      ]
    }
  },

  mounted() {
    setAnchorProvider(this.$web3, this.$wallet)
    getExtraRewardConfigs().then((res: any) => {
      res.configs.forEach((item: any, index: number) => {
        if (index >= this.lockData.length) {
          return
        }
        this.lockData[index].minutesLock = item.duration / 60
        this.lockData[index].boost = item.extraPercentage / (100 * 1000 * 1000 * 1000) + 1
      })
    })
  }
})
</script>
<style lang="less">
.base-container {
  .base-title {
    display: flex;
    justify-content: space-between;
    font-weight: normal;
    font-size: 16px;
    line-height: 19px;
  }

  .base-table {
    margin-top: 20px;
    padding: 12px;
    border: 2px solid #32476c;
    box-sizing: border-box;
    border-radius: 8px;

    .base-table-header {
      font-weight: bold;
      font-size: 12px;
      line-height: 15px;
      margin-bottom: 12px;
      display: flex;
    }

    .base-table-body {
      display: flex;
      font-size: 12px;
      line-height: 14px;
      color: @color-gray;
      padding: 5px 0;
      border-bottom: 1px solid #384d71;
      cursor: pointer;

      &:last-child {
        border-bottom: none;
      }
    }
  }
}
</style>
