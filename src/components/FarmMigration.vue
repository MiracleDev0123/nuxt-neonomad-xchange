<template>
  <Modal :title="title" :visible="true" :footer="null" :width="400" centered @cancel="$emit('onCancel')">
    <div class="card">
      <div class="card-body">
        <div v-for="migrationFarm in migrationFarms" :key="migrationFarm.oldFarmId">
          {{ migrationFarm.oldFarmId }} -> {{ migrationFarm.newFarmId }} {{ migrationFarm.depositBalance }}
          <Button ghost @click="$emit('onMigrate', migrationFarm)"> Migrate </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Button /*Icon*/ } from 'ant-design-vue'
import { mapState } from 'vuex'
import { gt } from '@/utils/safe-math'

// fix: Failed to resolve directive: ant-portal
Vue.use(Modal)

export default Vue.extend({
  components: {
    //Icon,
    Modal,
    Button
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    migrationFarms: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      fixedCoin: ''
    }
  },
  computed: {
    ...mapState(['liquidity', 'setting'])
  },

  methods: {
    gt
  }
})
</script>

<style lang="less" scoped>
.info-guide {
  font-size: 15px;
  line-height: 18px;
  display: flex;
  align-items: flex-start;
  margin: 10px 0;

  em b {
    font-size: 15px;
    line-height: 18px;
  }

  img {
    margin-right: 10px;
  }
}
</style>
