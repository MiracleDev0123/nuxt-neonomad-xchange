<template>
  <Modal
    title="Join Whitelist"
    :visible="show"
    :footer="null"
    :mask-closable="true"
    :closable="false"
    :width="470"
    @cancel="$emit('onCancel')"
    centered
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />
    <div class="subscribe-container">
      <div class="notice-container">
        <div class="notice-title fcs-container"> 
          <div class="notice-title-header">
            <img class="alert-icon" src="@/assets/icons/alert-yellow.svg" />
            <span class="font-large weight-bold">Subscription Notice</span>
          </div>
          <span class="font-medium weight-semi">Before using NomadPad, make sure you have read, understood and complied with the NeoNomad<a href="https://docs.neonomad.finance/neonomad-documentation/tokenomics-fundamentals/ido-legal-disclaimer" > disclaimer</a> before participating in any IDO launch.</span>
        </div>
      <div> 
      <span class="font-medium weight-semi">Important - Please make sure you have a minimum of $10 worth of solana in your wallet before proceeding. </span>
       </div> 
          
        
        

        <span class="font-medium weight-semi spacing-small" v-html="this.content">PLACE HOLDER</span>
      </div>
      <Checkbox class="check-container" v-model="countryCheck">
        <label class="font-small weight-semi spacing-large">I confirm and agree to these terms.</label>
      </Checkbox>
      <hcaptcha class="text-center" />
      <div class="btn-container">
        <Button class="btn-transparent font-medium weight-semi letter-small icon-cursor" @click="onSubmit"
          >Join Whitelist</Button
        >
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Checkbox } from 'ant-design-vue'
Vue.use(Modal)

export default Vue.extend({
  components: {
    Modal,
    Checkbox
  },

  props: {
    show: {
      type: Boolean,
      default: false
    },
    content: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      countryCheck: false as boolean,
      captchaCheck: false as boolean
    }
  },

  methods: {
    onSubmit() {
      //@ts-ignore
      this.$hcaptcha
        .getResponse()
        .then((res: any) => {
          if (res) this.captchaCheck = true
        })
        .catch((error: any) => {
          console.log(error)
        })
        .finally(() => {
          if (this.captchaCheck && this.countryCheck) this.$emit('onOk')
        })
    }
  },
  mounted() {}
})
</script>
<style lang="less" scoped>
.btn-container {
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  height: auto;
  width: 100%;
}

.btn-transparent {
  background: transparent;
  width: 100%;
  padding: 10px;
  border-radius: 48px;
  border: none;
  outline: none;
}
</style>
<style lang="less">
.subscribe-container {
  .notice-container {
    background: @color-blue600;
    padding: 24px;
    border-radius: 8px;
    margin-top: 18px;

    .notice-title {
      margin-bottom: 16px;
      flex-direction: column;

      .notice-title-header {
        padding: 0 0 20px 0;
        display: flex !important;
        flex-direction: row;
        align-items: center;
        justify-content: center !important;
        
      }

      .alert-icon {
        margin-right: 16px;
      }
    }
  }

  .check-container {
    margin: 24px 0;

    label {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .btn-container {
    margin-top: 24px;
  }
}

// ant checkbox
.ant-checkbox {
  .ant-checkbox-inner {
    background: transparent;
    width: 21px;
    height: 21px;
    border-radius: 7px;
    border: 2px solid @color-blue300;

    &::after {
      position: absolute !important;
      top: 2px;
      left: 2px;
      width: 13px;
      height: 13px;
      border-radius: 4px;
      border: none !important;
      transform: scale(1) !important;
      transition: all 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86) !important;
      background-color: @color-farms;
    }
  }

  &.ant-checkbox-checked {
    .ant-checkbox-inner {
      border-color: @color-farms !important;
      background: transparent;
    }

    &::after {
      border: none;
    }
  }
}

.ant-checkbox-wrapper:hover .ant-checkbox-inner,
.ant-checkbox:hover .ant-checkbox-inner,
.ant-checkbox-input:focus + .ant-checkbox-inner {
  border-color: @color-farms !important;
}
</style>