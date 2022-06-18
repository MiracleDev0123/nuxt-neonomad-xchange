<template>
  <Modal title="Create Farm Program" :visible="true" :footer="null" :width="400" centered>
    <div v-if="isSuperOwner">
      <Row :gutter="32" class="actions">
        <Col :span="24">
          <Button ghost @click="$emit('onCreate')"> Create </Button>
        </Col>
      </Row>
    </div>
    <div v-else>This Program is not available now</div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Row, Col, Button } from 'ant-design-vue'

// fix: Failed to resolve directive: ant-portal
Vue.use(Modal)

export default Vue.extend({
  components: {
    Modal,
    Row,
    Col,
    Button
  },

  props: {
    isSuperOwner: {
      type: Boolean,
      default: false
    }
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

.coin-modal {
  background: rgba(0, 0, 0, 0.9471);
  border-radius: 4px;

  .label {
    padding: 0.75rem 1rem 0;
    font-size: 12px;
    line-height: 14px;
    color: rgb(133, 133, 141);
  }

  input {
    width: 0;
    padding: 0;
    border: none;
    background-color: transparent;
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
    flex: 1 1 auto;
    color: @text-color;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:active,
    &:focus,
    &:hover {
      outline: 0;
    }
  }

  input[disabled] {
    cursor: not-allowed;
  }

  .coin-input {
    padding: 0.75rem 0.75rem 0.75rem 1rem;

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

    .max-button {
      height: 32px;
      padding: 0 16px;
      color: @primary-color;
    }

    .coin-name {
      padding: 0.5rem;
      line-height: 24px;
      font-weight: 600;
    }
  }
}
</style>
