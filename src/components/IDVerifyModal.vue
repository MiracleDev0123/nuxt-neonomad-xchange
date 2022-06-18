<template>
  <Modal
    title="Verify your ID"
    :visible="show"
    :footer="null"
    :mask-closable="true"
    :closable="false"
    :width="360"
    @cancel="$emit('onCancel')"
    centered
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />
    <div class="verify-container">
      <div class="country-select">
        <span class="select-title font-small weight-semi spacing-large">Select your country</span>
        <Dropdown :trigger="['click']">
          <a class="fcsb-container">
            <span class="font-medium">{{ selectedCountry }}</span>
            <img class="arrow-icon" src="@/assets/icons/arrow-down-white.svg" />
          </a>
          <div slot="overlay">
            <li v-for="country in countries" :key="country.value">
              <a
                @click="
                  () => {
                    selectedCountry = country.label
                    selectedCountryISO = country.value
                  }
                "
                >{{ country.label }}</a
              >
            </li>
          </div>
        </Dropdown>
      </div>
      <div class="id-type-select">
        <span class="select-title font-small weight-semi spacing-large">Select your ID type</span>
        <label class="font-small">We will take two photos of your ID. What type of ID do you want to use?</label>
        <Collapse v-model="showCollapse" accordion>
          <CollapsePanel
            v-show="true"
            key="driver"
            class="id-form-collapse"
            :class="imgUploaded.driver ? 'completed' : ''"
            :disabled="imgUploaded.id || imgUploaded.passport"
          >
            <Row slot="header" class="id-form-header fcsb-container">
              <span class="id-form-title font-medium">Driver's Licence</span>
              <img
                v-if="!imgUploaded.driver"
                class="arrow-icon"
                :class="showCollapse === 'driver' ? 'down' : 'right'"
                src="@/assets/icons/arrow-down-white.svg"
              />
              <img v-else class="status-icon" src="@/assets/icons/status-success.svg" />
            </Row>
            <Row class="id-form-content">
              <div class="fcs-container mb-8">
                <img class="info-icon" src="@/assets/icons/info.svg" />
                <span class="font-small">valid file (jpg, jpeg, png) and max 4MB</span>
              </div>
              <div class="fcs-container">
                <div class="upload-box">
                  <Upload
                    name="avatar"
                    list-type="picture-card"
                    class="id-uploader"
                    :show-upload-list="false"
                    :before-upload="beforeUploadFront"
                    @change="
                      (info) => {
                        this.uploadFrontImage(info)
                        this.imgUploaded.driver = true
                      }
                    "
                  >
                    <img v-if="imgUrl.front" class="img-preview" :src="imgUrl.front" alt="avatar" />
                    <div v-else>
                      <img src="@/assets/icons/upload.svg" />
                      <div class="ant-upload-text font-xsmall">Upload</div>
                    </div>
                  </Upload>
                  <div class="fcsb-container">
                    <span class="upload-title text-small weight-semi spacing-large">Front</span>
                    <img
                      v-if="imgUrl.front"
                      class="img-remove icon-cursor"
                      src="@/assets/icons/close-circle.svg"
                      @click="removeFrontImage('driver')"
                    />
                  </div>
                </div>
                <div class="upload-box">
                  <Upload
                    name="avatar"
                    list-type="picture-card"
                    class="id-uploader"
                    :show-upload-list="false"
                    :before-upload="beforeUploadBack"
                    @change="
                      (info) => {
                        this.uploadBackImage(info)
                        this.imgUploaded.driver = true
                      }
                    "
                  >
                    <img v-if="imgUrl.back" class="img-preview" :src="imgUrl.back" alt="avatar" />
                    <div v-else>
                      <img src="@/assets/icons/upload.svg" />
                      <div class="ant-upload-text font-xsmall">Upload</div>
                    </div>
                  </Upload>
                  <div class="fcsb-container">
                    <span class="upload-title text-small weight-semi spacing-large">Back</span>
                    <img
                      v-if="imgUrl.back"
                      class="img-remove icon-cursor"
                      src="@/assets/icons/close-circle.svg"
                      @click="removeBackImage('driver')"
                    />
                  </div>
                </div>
              </div>
            </Row>
          </CollapsePanel>
          <CollapsePanel
            v-show="true"
            key="id"
            class="id-form-collapse"
            :class="imgUploaded.id ? 'completed' : ''"
            :disabled="imgUploaded.driver || imgUploaded.passport"
          >
            <Row slot="header" class="id-form-header fcsb-container">
              <span class="id-form-title font-medium">ID Card</span>
              <img
                v-if="!imgUploaded.id"
                class="arrow-icon"
                :class="showCollapse === 'id' ? 'down' : 'right'"
                src="@/assets/icons/arrow-down-white.svg"
              />
              <img v-else class="status-icon" src="@/assets/icons/status-success.svg" />
            </Row>
            <Row class="id-form-content">
              <div class="fcs-container mb-8">
                <img class="info-icon" src="@/assets/icons/info.svg" />
                <span class="font-small">valid file (jpg, jpeg, png) and max 4MB</span>
              </div>
              <div class="fcs-container">
                <div class="upload-box">
                  <Upload
                    name="avatar"
                    list-type="picture-card"
                    class="id-uploader"
                    :show-upload-list="false"
                    :before-upload="beforeUploadFront"
                    @change="
                      (info) => {
                        this.uploadFrontImage(info)
                        this.imgUploaded.id = true
                      }
                    "
                  >
                    <img v-if="imgUrl.front" class="img-preview" :src="imgUrl.front" alt="avatar" />
                    <div v-else>
                      <img src="@/assets/icons/upload.svg" />
                      <div class="ant-upload-text font-xsmall">Upload</div>
                    </div>
                  </Upload>
                  <div class="fcsb-container">
                    <span class="upload-title text-small weight-semi spacing-large">Front</span>
                    <img
                      v-if="imgUrl.front"
                      class="img-remove icon-cursor"
                      src="@/assets/icons/close-circle.svg"
                      @click="removeFrontImage('id')"
                    />
                  </div>
                </div>
                <div class="upload-box">
                  <Upload
                    name="avatar"
                    list-type="picture-card"
                    class="id-uploader"
                    :show-upload-list="false"
                    :before-upload="beforeUploadBack"
                    @change="
                      (info) => {
                        this.uploadBackImage(info)
                        this.imgUploaded.id = true
                      }
                    "
                  >
                    <img v-if="imgUrl.back" class="img-preview" :src="imgUrl.back" alt="avatar" />
                    <div v-else>
                      <img src="@/assets/icons/upload.svg" />
                      <div class="ant-upload-text font-xsmall">Upload</div>
                    </div>
                  </Upload>
                  <div class="fcsb-container">
                    <span class="upload-title text-small weight-semi spacing-large">Back</span>
                    <img
                      v-if="imgUrl.back"
                      class="img-remove icon-cursor"
                      src="@/assets/icons/close-circle.svg"
                      @click="removeBackImage('id')"
                    />
                  </div>
                </div>
              </div>
            </Row>
          </CollapsePanel>
          <CollapsePanel
            v-show="true"
            key="passport"
            class="id-form-collapse"
            :class="imgUploaded.passport ? 'completed' : ''"
            :disabled="imgUploaded.driver || imgUploaded.id"
          >
            <Row slot="header" class="id-form-header fcsb-container">
              <span class="id-form-title font-medium">Passport</span>
              <img
                v-if="!imgUploaded.passport"
                class="arrow-icon"
                :class="showCollapse === 'passport' ? 'down' : 'right'"
                src="@/assets/icons/arrow-down-white.svg"
              />
              <img v-else class="status-icon" src="@/assets/icons/status-success.svg" />
            </Row>
            <Row class="id-form-content">
              <div class="fcs-container mb-8">
                <img class="info-icon" src="@/assets/icons/info.svg" />
                <span class="font-small">valid file (jpg, jpeg, png) and max 4MB</span>
              </div>
              <div class="fcs-container">
                <div class="upload-box">
                  <Upload
                    name="avatar"
                    list-type="picture-card"
                    class="id-uploader"
                    :show-upload-list="false"
                    :before-upload="beforeUploadFront"
                    @change="
                      (info) => {
                        this.uploadFrontImage(info)
                        this.imgUploaded.passport = true
                      }
                    "
                  >
                    <img v-if="imgUrl.front" class="img-preview" :src="imgUrl.front" alt="avatar" />
                    <div v-else>
                      <img src="@/assets/icons/upload.svg" />
                      <div class="ant-upload-text font-xsmall">Upload</div>
                    </div>
                  </Upload>
                  <div class="fcsb-container">
                    <span class="upload-title text-small weight-semi spacing-large">Front</span>
                    <img
                      v-if="imgUrl.front"
                      class="img-remove icon-cursor"
                      src="@/assets/icons/close-circle.svg"
                      @click="removeFrontImage('passport')"
                    />
                  </div>
                </div>
                <div class="upload-box">
                  <Upload
                    name="avatar"
                    list-type="picture-card"
                    class="id-uploader"
                    :show-upload-list="false"
                    :before-upload="beforeUploadBack"
                    @change="
                      (info) => {
                        this.uploadBackImage(info)
                        this.imgUploaded.passport = true
                      }
                    "
                  >
                    <img v-if="imgUrl.back" class="img-preview" :src="imgUrl.back" alt="avatar" />
                    <div v-else>
                      <img src="@/assets/icons/upload.svg" />
                      <div class="ant-upload-text font-xsmall">Upload</div>
                    </div>
                  </Upload>
                  <div class="fcsb-container">
                    <span class="upload-title text-small weight-semi spacing-large">Back</span>
                    <img
                      v-if="imgUrl.back"
                      class="img-remove icon-cursor"
                      src="@/assets/icons/close-circle.svg"
                      @click="removeBackImage('passport')"
                    />
                  </div>
                </div>
              </div>
            </Row>
          </CollapsePanel>
        </Collapse>
      </div>
      <Checkbox class="check-container" v-model="accepted">
        <label class="check-label font-small weight-semi spacing-large"
          >Accept
          <span class="highlight">terms & conditions</span>
        </label>
      </Checkbox>
      <div class="btn-container">
        <Button
          class="btn-transparent font-medium weight-semi letter-small icon-cursor"
          :disabled="!(accepted && (imgUploaded.driver || imgUploaded.id || imgUploaded.passport))"
          @click="$emit('onOk', imgUploaded.driver, imgUploaded.id, imgUploaded.passport, selectedCountryISO, imgUrl)"
          >Submit</Button
        >
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Checkbox, Dropdown, Upload, Button, Collapse, Row } from 'ant-design-vue'
Vue.use(Modal)
const CollapsePanel = Collapse.Panel
const countries = require('i18n-iso-countries')
countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

function getBase64(img: any, callback: any) {
  const reader = new FileReader()
  reader.addEventListener('load', () => callback(reader.result))
  reader.readAsDataURL(img)
}

export default Vue.extend({
  components: {
    Modal,
    Checkbox,
    Dropdown,
    Upload,
    Button,
    Collapse,
    CollapsePanel,
    Row
  },

  props: {
    show: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    countries() {
      const list = countries.getNames('en', { select: 'official' })
      return Object.keys(list).map((key) => ({ value: key, label: list[key] }))
    }
  },

  data() {
    return {
      imgUploaded: {
        driver: false as boolean,
        id: false as boolean,
        passport: false as boolean
      },
      imgUrl: {
        front: '' as string,
        back: '' as string,
        frontFull: false as any,
        backFull: false as any,
        frontFull2: false as any,
        backFull2: false as any,
        frontfiles: false as any,
        backfiles: false as any
      },
      selectedCountry: 'France' as string,
      selectedCountryISO: 'FR' as string,
      accepted: false as boolean,
      showCollapse: [] as any[]
    }
  },

  methods: {
    beforeUploadBack(file: any){
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        this.$message.error('You can only upload JPG file!')
      }
      const isLt4M = file.size / 1024 / 1024 < 4
      if (!isLt4M) {
        this.$message.error('Image must smaller than 4MB!')
      }
      this.imgUrl.backfiles = file
      return isJpgOrPng && isLt4M
    },
    beforeUploadFront(file: any) {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        this.$message.error('You can only upload JPG file!')
      }
      const isLt4M = file.size / 1024 / 1024 < 4
      if (!isLt4M) {
        this.$message.error('Image must smaller than 4MB!')
      }
      this.imgUrl.frontfiles = file
      return isJpgOrPng && isLt4M
    },
    uploadFrontImage(info: any) {
      if (info.file.status === 'uploading') {
        return
      }
      if (info.file.status === 'done') {
        // Get this url from response in real world.
        this.imgUrl.frontFull = info.file
        this.imgUrl.frontFull2 = info
        getBase64(info.file.originFileObj, (imgUrl: any) => {
          this.imgUrl.front = imgUrl
        })
      }
    },
    uploadBackImage(info: any) {
      if (info.file.status === 'uploading') {
        return
      }
      if (info.file.status === 'done') {
        // Get this url from response in real world.
        this.imgUrl.backFull = info.file
        this.imgUrl.backFull2 = info
        getBase64(info.file.originFileObj, (imgUrl: any) => {
          this.imgUrl.back = imgUrl
        })
      }
    },
    removeFrontImage(type: string) {
      this.imgUrl.front = ''
      if (this.imgUrl.back === '') {
        if (type === 'driver') this.imgUploaded.driver = false
        else if (type === 'id') this.imgUploaded.id = false
        else this.imgUploaded.passport = false
      }
    },
    removeBackImage(type: string) {
      this.imgUrl.back = ''
      if (this.imgUrl.front === '') {
        if (type === 'driver') this.imgUploaded.driver = false
        else if (type === 'id') this.imgUploaded.id = false
        else this.imgUploaded.passport = false
      }
    }
  },
  mounted() {}
})
</script>
<style lang="less" scoped>
// global stylesheet
.btn-container {
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 48px;
  height: auto;
  width: 100%;
}

.btn-transparent {
  background: transparent;
  width: 100%;
  height: auto;
  padding: 10px;
  border-radius: 48px;
  border: none;
  outline: none;

  &:disabled {
    color: rgba(255, 255, 255, 0.4);

    &:hover {
      background: unset;
    }
  }
}

.arrow-icon {
  &.up {
    transform: rotate(180deg);
  }

  &.right {
    transform: rotate(270deg);
  }
}

.status-icon {
  width: 16px;
  height: 16px;
}

.info-icon {
  margin-right: 8px;
}

a {
  color: #fff !important;
}

// class stylesheet
.verify-container {
  .country-select {
    margin: 24px 0;
  }

  .id-type-select {
    margin-bottom: 24px;

    .id-form-collapse {
      .id-form-header {
        .id-form-title {
          display: block;
          width: 100%;
        }
      }

      .id-form-content {
        .upload-box {
          width: calc((100% - 10px) / 2) !important;
          margin-right: 10px;

          &:last-child {
            margin-right: 0;
          }

          .img-preview {
            height: 96px;
            width: 100%;
          }

          .img-remove {
            width: 16px;
            height: 16px;
          }
        }
      }

      &.completed {
        background: rgba(49, 183, 159, 0.2);
        border: 2px solid @color-green500;
        opacity: 1 !important;

        .id-form-header .id-form-title {
          color: @color-green500;
        }
      }
    }
  }

  .country-select,
  .id-type-select {
    .select-title {
      display: block;
      margin-bottom: 16px;
    }
  }

  .check-container {
    .check-label {
      opacity: 0.7;

      .highlight {
        color: @color-petrol500;
      }
    }
  }

  .btn-container {
    margin-top: 24px;
  }
}
</style>
<style lang="less">
// ant dropdown
.ant-dropdown-trigger {
  background: rgba(226, 227, 236, 0.1);
  border-radius: 12px;
  padding: 10px 18px;
}

.ant-dropdown {
  .ant-dropdown-content {
    height: 200px;
    overflow-y: scroll;
    background: @color-blue600;
    z-index: 999;

    li {
      padding: 4px;
    }
  }
}

.verify-container {
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

  // ant upload
  .ant-upload-select {
    background: @color-blue600;
    border: 2px dashed @color-blue100 !important;
    height: 100px !important;
    width: 100% !important;
    border-radius: 0 !important;
    margin-bottom: 0 !important;

    .ant-upload {
      padding: 0;
    }

    .ant-upload-text {
      margin-top: 10px;
    }
  }

  // ant collapse
  .ant-collapse {
    border: none;
    background: transparent;

    .ant-collapse-item {
      background: rgba(226, 227, 236, 0.1);
      border-radius: 12px;
      padding: 10px 18px;
      overflow: hidden;
      border-bottom: none;
      margin-top: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      &.ant-collapse-item-disabled {
        opacity: 0.4;
      }

      .ant-collapse-header {
        padding: 0;

        .ant-collapse-arrow {
          display: none;
        }
      }

      .ant-collapse-content {
        border: none !important;
        background: transparent !important;
        padding: 0;
        margin-top: 10px;

        .ant-collapse-content-box {
          padding: 0;
        }
      }
    }

    .ant-collapse-item-disabled > .ant-collapse-header {
      color: unset;
    }
  }
}
</style>