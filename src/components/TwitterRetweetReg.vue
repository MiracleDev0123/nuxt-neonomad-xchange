<template>
  <div :class="this.progression">
    <Modal
      :title="title"
      :visible="show"
      :footer="null"
      :mask-closable="true"
      :closable="true"
      @cancel="$emit('onClose')"
    >
      <div v-if="this.progression < 1">
        <div class="whitelisting">
          <span>Whitelisting</span>
        </div>

        <Row :gutter="32" class="actions">
          <Col :span="24" style="text-align: center">
            <div class="btncontainer">
              <Button ghost @click="nextStep()"> + Register for whitelist </Button>
            </div>
          </Col>
        </Row>
      </div>
      <div v-else-if="this.progression == 1" class="multistepmodal">
        <div class="steps">
          <div :class="this.twitterA ? 'done' : 'notdone'">
            <span v-if="!this.twitterA" class="first">1</span>
            <span v-else class="span first"><img src="@/assets/icons/check-circle-green.svg" alt="" /></span>
            <div>
              <a
                href="https://twitter.com/CropperFinance"
                class="social-icon"
                target="_blank"
                @click="validateTwitterA()"
              >
                <img src="@/assets/icons/twitter-purple.svg" width="30" height="30" />
              </a>
              <a
                href="https://twitter.com/CropperFinance"
                target="_blank"
                style="color: #c6c6c6"
                @click="validateTwitterA()"
              >
                Follow <b>CropperFinance on Twitter</b>
              </a>
            </div>
          </div>

          <div :class="this.telegramA ? 'done' : 'notdone'">
            <span v-if="!this.telegramA">2</span>
            <span v-else class="span"><img src="@/assets/icons/check-circle-green.svg" alt="" /></span>
            <div>
              <a href="https://t.me/CropperFinance" class="social-icon" target="_blank" @click="validateTelegramA()">
                <img src="@/assets/icons/telegram-purple.svg" width="30" height="30" />
              </a>
              <a href="https://t.me/CropperFinance" style="color: #c6c6c6" target="_blank" @click="validateTelegramA()">
                Join <b>CropperFinance on Telegram</b>
              </a>
            </div>
          </div>

          <div
            v-if="this.farm.links.twitter && this.farm.slug != 'cropper'"
            :class="this.twitterB ? 'done' : 'notdone'"
          >
            <span v-if="!this.twitterB">3</span>
            <span v-else class="span"><img src="@/assets/icons/check-circle-green.svg" alt="" /></span>
            <div>
              <a :href="this.farm.links.twitter" target="_blank" class="social-icon" @click="validateTwitterB()">
                <img src="@/assets/icons/twitter-purple.svg" width="30" height="30" />
              </a>
              <a :href="this.farm.links.twitter" target="_blank" style="color: #c6c6c6" @click="validateTwitterB()">
                Follow <b>{{ this.farm.shortname }} on Twitter</b>
              </a>
            </div>
          </div>

          <div
            v-if="this.farm.links.telegram && this.farm.slug != 'cropper'"
            :class="this.telegramB ? 'done' : 'notdone'"
          >
            <span v-if="!this.telegramB">4</span>
            <span v-else class="span"><img src="@/assets/icons/check-circle-green.svg" alt="" /></span>
            <div>
              <a :href="this.farm.links.telegram" target="_blank" class="social-icon" @click="validateTelegramB()">
                <img src="@/assets/icons/telegram-purple.svg" width="30" height="30" />
              </a>

              <a :href="this.farm.links.telegram" target="_blank" style="color: #c6c6c6" @click="validateTelegramB()">
                Join <b>{{ this.farm.shortname }} on Telegram</b>
              </a>
            </div>
          </div>

          <div :class="this.inputtwitter ? 'done' : 'notdone'">
            <span v-if="!this.inputtwitter">{{ this.farm.links.twitter && this.farm.slug != 'cropper' ? 5 : 3 }}</span>
            <span v-else class="span"><img src="@/assets/icons/check-circle-green.svg" alt="" /></span>
            <div>
              Input your twitter ID
              <div class="social-input-form">
                <span class="inputContent">
                  <input type="text" class="twlink" placeholder="@your-twitter-id" @input="tw($event.target.value)" />
                  <button class="submitbutton" @click="checkTw()">Submit</button>
                </span>
              </div>
            </div>
          </div>

          <div :class="this.inputtelegram ? 'done' : 'notdone'">
            <span v-if="!this.inputtelegram">{{ this.farm.links.twitter && this.farm.slug != 'cropper' ? 6 : 4 }}</span>
            <span v-else class="span"><img src="@/assets/icons/check-circle-green.svg" alt="" /></span>
            <div>
              Input your telegram ID
              <div class="social-input-form">
                <span class="inputContent">
                  <input type="text" class="twlink" placeholder="@your-telegram-id" @input="tg($event.target.value)" />
                  <button class="submitbutton" @click="checkTg()">Submit</button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="infoCheck">We will be checking if you've completed the above tasks.</div>

        <Row :gutter="32" class="actions">
          <Col :span="24" style="text-align: center">
            <div class="btncontainer" :disabled="!this.stepAok">
              <Button ghost :disabled="!this.stepAok" @click="nextStep()"> Next task </Button>
            </div>
          </Col>
        </Row>
      </div>

      <div v-else-if="this.progression == 3">
        <div class="congrats">
          <div v-if="registerError != ''" class="error">
            {{ registerError }}
          </div>
          <div v-else>You have been successfully registered !</div>
        </div>

        <Row :gutter="32" class="actions">
          <Col :span="24" style="text-align: center">
            <div class="btncontainer">
              <Button ghost @click="$emit('onClose')"> Close </Button>
            </div>
          </Col>
        </Row>
      </div>

      <div v-else-if="this.progression == 2" class="multistepmodal">
        <div class="steps">
          <div :class="this.inputretwit ? 'done big' : 'notdone big'">
            <span v-if="!this.inputretwit" class="first">1</span>
            <span v-else class="span2 first"><img src="@/assets/icons/check-circle-green.svg" alt="" /></span>
            <Row :gutter="24">
              <Col :span="10" class="twitter-section-left" v-html="this.farm.links.retweet_html"> </Col>
              <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
              <div class="twitter-section-right">
                <div class="inforetweet">
                  Quote Retweet <span>this tweet</span> <br />
                  • Tagging 3 friends <br />
                  • Using the hashtag <br />
                  #CropperFinance #Fertilizer
                </div>

                <div class="social-input-form twitter-link">
                  <span class="inputContent">
                    <input
                      type="text"
                      class="twlink"
                      placeholder="Paste your retweet link here"
                      @input="nurl($event.target.value)"
                    />
                    <button class="submitbutton" @click="checkUrl()">Submit</button>
                  </span>
                </div>
              </div>
            </Row>
          </div>
        </div>

        <div class="infoCheck">We will be checking if you've completed the above tasks.</div>

        <Row :gutter="32" class="actions">
          <Col :span="24" style="text-align: center">
            <div class="btncontainer" :disabled="!this.stepBok">
              <Button ghost :disabled="!this.stepBok" @click="nextStep()"> Finished </Button>
            </div>
          </Col>
        </Row>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Modal, Button, Row, Col } from 'ant-design-vue'

Vue.use(Modal)

export default Vue.extend({
  components: {
    Modal,
    Button,
    Row,
    Col
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    farm: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      progression: 0,
      url: false as any,
      inputtelegramContent: false as any,
      inputtwitterContent: false as any,
      twitterA: false as any,
      twitterB: false as any,
      telegramA: false as any,
      telegramB: false as any,
      inputtelegram: false as any,
      inputtwitter: false as any,
      inputretwit: false as any,
      stepAok: false as any,
      stepBok: false as any,
      registerError: '',
      walletAddress: false as any,
      title: 'Community farm'
    }
  },
  methods: {
    async nextStep() {
      if (this.progression < 1) {
        this.progression = 0
      }
      this.title = 'Whitelisting tasks'
      this.progression++
      this.walletAddress =
        'https://api.cropper.finance/fertilizer/project/?f=' + this.farm.slug + '&r=' + this.$accessor.wallet.address

      if (this.progression == 3) {
        let registerUrl =
          'https://api.cropper.finance/pfo/register/?spl=' +
          this.$accessor.wallet.address +
          '&farmId=' +
          this.farm.pfarmID

        const query = new URLSearchParams(window.location.search)
        if (query.get('r')) {
          registerUrl += '&referer=' + query.get('r')
        }

        this.registerError = ''
        let responseData
        try {
          responseData = await fetch(registerUrl).then((res) => res.json())
        } catch {
          this.registerError = 'An error occured'
        } finally {
          this.progression = 3
        }
      }
    },

    validateTwitterA() {
      this.twitterA = true
      this.checkStepA()
    },

    validateTelegramA() {
      this.telegramA = true
      this.checkStepA()
    },

    validateTwitterB() {
      this.twitterB = true
      this.checkStepA()
    },

    validateTelegramB() {
      this.telegramB = true
      this.checkStepA()
    },

    checkTw() {
      if (this.inputtwitterContent.length < 5 || this.inputtwitterContent == false) {
        this.inputtwitter = false
      } else {
        this.inputtwitter = true
      }
      this.checkStepA()
    },

    checkTg() {
      if (this.inputtelegramContent.length < 5 || this.inputtelegramContent == false) {
        this.inputtelegram = false
      } else {
        this.inputtelegram = true
      }
      this.checkStepA()
    },

    checkStepA() {
      if (!this.twitterA) {
        this.stepAok = false
        return
      }
      if (!this.telegramA) {
        this.stepAok = false
        return
      }

      if (this.farm.links.twitter && this.farm.slug != 'cropper') {
        if (!this.twitterB) {
          this.stepAok = false
          return
        }
      }

      if (this.farm.links.telegram && this.farm.slug != 'cropper') {
        if (!this.telegramB) {
          this.stepAok = false
          return
        }
      }

      if (this.inputtelegramContent.length < 5 || this.inputtelegramContent == false) {
        this.stepAok = false
        return
      }
      if (this.inputtwitterContent.length < 5 || this.inputtwitterContent == false) {
        this.stepAok = false
        return
      }

      this.stepAok = true
    },

    nurl(url: string) {
      this.url = url
    },

    tw(url: string) {
      this.inputtwitterContent = url
    },

    tg(url: string) {
      this.inputtelegramContent = url
    },

    checkStepB() {
      if (!this.inputretwit) {
        this.stepBok = false
        return
      }

      this.stepBok = true
    },

    async checkUrl() {
      let url

      this.inputretwit = false

      try {
        url = new URL(this.url)
      } catch (_) {
        return false
      }

      this.inputretwit = true
      this.checkStepB()

      return url.protocol === 'http:' || url.protocol === 'https:'
    }
  }
})
</script>

<style lang="less" scoped>
.whitelisting {
  font-weight: bold;
  font-size: 40px;
  line-height: 80px;
  text-align: center;
  letter-spacing: -0.05em;
  margin-bottom: 20px;

  @media @max-sl-mobile {
    font-size: 30px;
  }
}

input.link {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  margin-top: 5px;
}

span.inputContent {
  .twlink {
    border: none;
    padding: 4px 20px;
    background-color: transparent;
    min-width: 280px;
    outline: none;
    font-size: 18px;
    line-height: 22px;
    font-weight: normal;

    @media @max-sl-mobile {
      font-size: 12px;
      padding: 4px 12px;
    }
  }

  .submitbutton {
    position: absolute;
    right: -1px;
    background: #7e7ed8;
    box-sizing: border-box;
    border-radius: 13px;
    height: 39px;
    border: none;
    margin-left: -10px;
    color: #fff;
    letter-spacing: -0.05em;
    line-height: 42px;
    font-size: 18px;
    font-weight: normal;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    cursor: pointer;

    @media @max-sl-mobile {
      font-size: 14px;
    }
  }
}

.retweet {
  display: grid;
  grid-auto-rows: auto;
  row-gap: 14px;
  margin-top: 10px;
  margin-bottom: 20px;
  margin-left: 20px;
  margin-right: 20px;

  .retweet-image {
    height: 200px;
    border: 1px solid @primary-color;
  }

  input {
    color: #000;
    padding: 5px 20px;
    display: inline-block;
    width: 90%;
    border-radius: 5px;
    border: none;
    margin-top: 13px;

    &:active,
    &:focus,
    &:hover {
      outline: 0;
    }
  }
}
.btncontainer {
  background: @gradient-color-icon;
  background-origin: border-box;
  border: 2px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  color: #fff;
  height: 60px;
  min-width: 163px;
  line-height: 60px;
  display: inline-block;
  text-align: center;
  position: relative;
  max-width: 400px;
  margin: 10px auto;

  @media @max-sl-mobile {
    height: 40px;
  }

  &[disabled] {
    background: #767676;
    border: 2px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
  }

  button {
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    line-height: 42px;
    text-align: center;
    letter-spacing: -0.05em;
    color: #fff;
    background: transparent !important;
    width: 100%;
    height: 100%;
    position: relative;
    border: 0;
    outline: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    @media @max-sl-mobile {
      font-size: 14px;
    }
  }

  button:hover,
  button:focus,
  button:active {
    border: none;
  }
}

.infoCheck {
  font-weight: normal;
  font-size: 16px;
  line-height: 19px;
  text-align: center;
  color: #fff;
  margin: 45px auto 20px auto;

  @media @max-sl-mobile {
    font-size: 12px;
    line-height: 14px;
  }
}

.multistepmodal .steps {
  & > div {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    margin: 18px 20px 18px 90px;
    padding: 8px 25px;
    height: 40px;
    position: relative;
    font-weight: normal;
    font-size: 22px;
    line-height: 26px;
    display: flex;
    align-items: center;

    & > div {
      font-weight: normal;
      font-size: 22px;
      line-height: 26px;
      color: #c6c6c6;
      width: 100%;
      display: flex;
      align-items: center;

      @media @max-sl-mobile {
        font-size: 14px;
        display: block;
      }

      .social-icon {
        position: absolute;
        right: 22px;

        @media @max-sl-mobile {
          display: none;
        }
      }

      b {
        margin-left: 5px;
        border-bottom: 1px solid;
      }
    }

    .social-input-form {
      position: absolute;
      right: 0;
      border: 3px solid #7e7ed8;
      box-sizing: border-box;
      border-radius: 4px 13px 13px 4px;
      height: 40px;

      @media @max-sl-mobile {
        position: relative;
      }

      .inputContent {
        height: 33px;
        display: flex;
        align-items: center;
      }
    }

    & > .span {
      position: absolute;
      left: -60px;
      top: 50%;
      height: 40px;
      width: 40px;
      transform: translate(0, -50%);

      @media @max-sl-mobile {
        left: -50px;
        height: 35px;
        width: 35px;
      }

      img {
        width: 100%;
        height: 100%;
      }

      &:not(.first)::before {
        content: '';
        width: 3px;
        background: rgba(72, 164, 105, 0.50196);
        height: 18px;
        left: 18px;
        position: absolute;
        top: -18px;

        @media @max-sl-mobile {
          height: 60px;
          top: -60px;
          left: 16px;
        }
      }
    }

    & > span:not(.span, .span2) {
      position: absolute;
      left: -60px;
      top: 50%;
      transform: translate(0, -50%);
      color: #b5b5b5;
      background: #262859;
      border-radius: 20px;
      width: 40px;
      height: 40px;
      line-height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;

      @media @max-sl-mobile {
        left: -50px;
        height: 35px;
        width: 35px;
      }

      img {
        width: 100%;
        height: 100%;
      }

      &:not(.first)::before {
        content: '';
        width: 3px;
        background: #262859;
        height: 18px;
        left: 18px;
        position: absolute;
        top: -18px;

        @media @max-sl-mobile {
          height: 60px;
          top: -60px;
          left: 16px;
        }
      }
    }

    & > .span2 {
      position: absolute;
      left: -60px;
    }

    // & > span:not(.span2, .span) {
    //   position: absolute;
    //   left: -60px;
    //   top: 50%;
    //   transform: translate(0, -50%);
    //   color: #b5b5b5;
    //   background: #262859;
    //   border-radius: 20px;
    //   width: 40px;
    //   height: 40px;
    //   line-height: 26px;
    //   display: flex;
    //   align-items: center;
    //   justify-content: center;

    //   &:not(.first)::before {
    //     content: '';
    //     width: 3px;
    //     background: #262859;
    //     height: 18px;
    //     left: 18px;
    //     position: absolute;
    //     top: -18px;
    //   }
    // }

    &.done {
      background: #2b5a57;

      .date {
        font-weight: 500;
        font-size: 14px;
        line-height: 19px;
      }

      .social-input-form {
        border-color: #5bca83 !important;

        .twlink {
          color: #5bca83 !important;
        }

        .submitbutton {
          background-color: #5bca83 !important;
        }
      }

      & > div {
        color: #5bca83 !important;
      }

      & > div:not(.done) div.date {
        font-weight: 400;
        font-size: 14px;
        background: #47a3d5;
        border-radius: 10.5px;
        height: 21px;
        line-height: 21px;
        display: inline-block;
        color: #fff;
        padding: 0 10px !important;
        margin-top: 3px;
      }
    }
  }

  .big {
    height: auto !important;
    margin-left: 50px !important;
    padding: 10px;

    @media @max-sl-mobile {
      margin-left: 30px !important;
    }

    .first {
      @media @max-sl-mobile {
        left: -45px !important;
        width: 35px;
        height: 35px;

        img {
          width: 100%;
          height: 100%;
        }
      }
    }

    .ant-row {
      margin: 0 !important;
    }

    .twitter-section-left {
      background-color: white;
      margin-right: 20px;

      @media @max-sl-mobile {
        width: 100%;
        margin-bottom: 10px;
      }

      .twitter-tweet {
        background-color: white;
        padding: 10px;
        border: 1px solid rgba(0, 0, 0, 0.5);
        border-radius: 10px;
        margin: 10px 0 10px 0;
        font-size: 18px;
      }
    }

    .twitter-section-right {
      .inforetweet {
        font-weight: normal;
        font-size: 20px;
        line-height: 24px;
        color: #b5b5b5;

        @media @max-sl-mobile {
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 17px;
        }

        span {
          text-decoration: underline;

          @media @max-sl-mobile {
            font-size: 18px;
            line-height: 22px;
            font-weight: 600;
          }
        }
      }

      .twitter-link {
        bottom: 10px;
        left: calc(41.66666667% + 20px);

        @media @max-sl-mobile {
          left: 0;
        }
      }
    }
  }

  .done.big {
    .twitter-section-right .inforetweet {
      color: #5bca83;
    }
  }
}

.error {
  color: red;
  padding: 0 0 20px;
  font-weight: bold;
  text-align: center;
}

.congrats {
  font-size: 18px;
  text-align: center;
  padding: 20px;
  margin: auto;
}

@media @max-sl-mobile {
  .multistepmodal .steps > div {
    margin: 10px -20px 10px 30px;
    height: 85px;
    padding: 10px;
  }
}
</style>
