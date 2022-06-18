<template>
  <Modal title="An error occured" :visible="true" :footer="null" :width="600" centered @cancel="$emit('onNothing')">
    <div class="card">
      <div class="card-body">
        <div>
          An error occurred during the staking process.<br /><br />
          Currently, your liquidity is in the liquidity pool and you will receive fees on swaps but no reward from the
          farm.<br />
          If you wish to unstake your LP, please go to pool tab.
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Button, Row, Col } from 'ant-design-vue'

// fix: Failed to resolve directive: ant-portal
Vue.use(Modal)

export default Vue.extend({
  components: {
    Modal //,
    //Button,
    //Row,
    //Col
  },
  data() {
    return {}
  },
  methods: {}
})
</script>

<style lang="less" scoped>
.actions {
  margin-top: 10px;

  button {
    width: 100%;
  }
}
</style>
