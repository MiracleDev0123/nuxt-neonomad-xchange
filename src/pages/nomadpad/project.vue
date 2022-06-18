<template>
  <div class="fertilizer-project container launchpad-bg">
    <div class="card">
      <div class="card-body">
        <SubscribeModal
          :show="subscribeShow"
          :content="SubscribeModalContent"
          @onCancel="() => (subscribeShow = false)"
          @onOk="
            () => {
              initSubscribe().then((res) => {
                subscribeShow = false
              })
            }
          "
        />
        <TaskProcessModal
          :show="taskModalShow"
          :step="taskModalType === 0 ? socialTicket.telegram + 1 : socialTicket.twitter + 1"
          :project="fertilizer.title"
          :type="taskModalType"
          :mint="fertilizer.mint"
          :tg_a="fertilizer.tg_a"
          :tg_b="fertilizer.tg_b"
          :tw_a="fertilizer.tw_a"
          :tw_b="fertilizer.tw_b"
          :retweetlink="fertilizer.retweetlink"
          @onNext="
            () => {
              if (this.taskModalType === 0) {
                this.socialTicket.telegram++
                if (this.socialTicket.telegram == 3) {
                  taskModalShow = false
                  contextualizeUser()
                }
              } else {
                this.socialTicket.twitter++
                if (this.socialTicket.twitter == 3) {
                  taskModalShow = false
                  contextualizeUser()
                }
              }
            }
          "
          @onPrev="
            () => {
              if (this.taskModalType === 0) this.socialTicket.telegram--
              else this.socialTicket.twitter--
            }
          "
          @onCancel="
            () => {
              contextualizeUser()
              taskModalShow = false
            }
          "
        />
        <IDVerifyModal
          :show="KYCModalShow"
          @onCancel="() => (KYCModalShow = false)"
          @onOk="
            (driver, id, passport, selectedCountry, imgUrl) => {
              sendKYC(driver, id, passport, selectedCountry, imgUrl)
            }
          "
        />

        <div class="project-content">
          <div class="project-preview-container">
            <div class="project-back">
              <div class="back-to-list icon-cursor fcs-container" @click="goBack">
                <img class="back-icon" src="@/assets/icons/back.svg" />
                <span class="back-label font-medium weight-bold">Go back</span>
              </div>
            </div>
            <div class="project-preview-ido-container">
              <div class="project-preview">
                <div class="project-overview fcsb-container">
                  <div class="project-title fcs-container">
                    <img class="project-logo" :src="fertilizer.logo" />
                    <span class="font-large weight-bold">{{ fertilizer.title }}</span>
                  </div>
                  <div
                    class="project-status"
                    :class="
                      currentStep === 0
                        ? 'preparation'
                        : currentStep === 1
                        ? 'whitelist'
                        : currentStep === 2 && currentTimestamp < fertilizer.sales_start_date
                        ? 'sales'
                        : currentStep === 2 &&
                          currentTimestamp > fertilizer.sales_start_date &&
                          fertilizer.sales_end_date > currentTimestamp
                        ? 'open'
                        : (currentStep === 2 && currentTimestamp > fertilizer.sales_end_date) ||
                          (currentStep === 3 && !currentStatus.funded)
                        ? 'distribution'
                        : ''
                    "
                  >
                    <span class="font-xsmall weight-bold">
                      {{
                        currentStep === 0
                          ? projectStatus.preparation
                          : currentStep === 1
                          ? projectStatus.whitelist
                          : currentStep === 2 && fertilizer.sales_start_date > currentTimestamp
                          ? projectStatus.sales
                          : currentStep === 2 &&
                            currentTimestamp > fertilizer.sales_start_date &&
                            fertilizer.sales_end_date > currentTimestamp
                          ? projectStatus.open
                          : (currentStep === 2 && currentTimestamp > fertilizer.sales_end_date) ||
                            (currentStep === 3 && !currentStatus.funded)
                          ? projectStatus.distribution
                          : ''
                      }}
                    </span>
                  </div>
                </div>
                <div
                  v-if="
                    (currentStep === 0 && currentTimestamp < fertilizer.whitelist_start_date) ||
                    (currentStep >= 1 && currentStep < 3)
                  "
                  class="project-countdown"
                >
                  <Countdown
                    :title="
                      currentStep === 0 && currentTimestamp < fertilizer.whitelist_start_date
                        ? 'The whitelist starts in'
                        : currentStep === 1
                        ? 'The Whitelist ends in'
                        : currentStep === 2 && currentTimestamp < fertilizer.sales_start_date
                        ? 'Sales start in'
                        : currentStep === 2 &&
                          currentTimestamp > fertilizer.sales_start_date &&
                          currentTimestamp < fertilizer.sales_end_date
                        ? 'Sales end in'
                        : currentStep === 2 && currentTimestamp > fertilizer.sales_end_date
                        ? 'Distribution starts in'
                        : ''
                    "
                    :value="
                      currentStep === 0 && currentTimestamp < fertilizer.whitelist_start_date
                        ? fertilizer.whitelist_start_date
                        : currentStep === 1
                        ? fertilizer.whitelist_end_date
                        : currentStep === 2 && currentTimestamp < fertilizer.sales_start_date
                        ? fertilizer.sales_start_date
                        : currentStep === 2 &&
                          currentTimestamp > fertilizer.sales_start_date &&
                          currentTimestamp < fertilizer.sales_end_date
                        ? fertilizer.sales_end_date
                        : currentStep === 2 && currentTimestamp > fertilizer.sales_end_date
                        ? fertilizer.distribution_start_date
                        : ''
                    "
                    format="DD:HH:mm:ss"
                  />
                </div>
                <div v-if="currentStep > 0" class="project-progress">
                  <div v-if="currentStep === 1">
                    <div v-if="!userRegistered" class="btn-container">
                      <Button
                        class="btn-transparent font-medium weight-semi icon-cursor"
                        @click="
                          () => {
                            if (this.wallet.connected) this.subscribeShow = true
                            else this.$accessor.wallet.openModal()
                          }
                        "
                        >Join Whitelist</Button
                      >
                    </div>
                    <div v-else class="fcc-container">
                      <img class="status-icon" src="@/assets/icons/check-circle-white.svg" />
                      <span class="font-small weight-semi spacing-large">You are whitelisted</span>
                    </div>
                  </div>
                  <div v-else-if="currentStep === 2">
                    <div v-if="currentTimestamp < fertilizer.sales_end_date">
                      <div v-if="userRegistered" class="fcc-container">
                        <img class="status-icon" src="@/assets/icons/check-circle-white.svg" />
                        <span class="font-small weight-semi spacing-large">You are registered</span>
                      </div>
                      <div v-else class="fcc-container">
                        <img class="alert-icon" src="@/assets/icons/alert-white.svg" />
                        <span class="font-small weight-semi spacing-large">You are not in the whitelist</span>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="currentStep === 3">
                    <div v-if="!currentStatus.funded" class="fcc-container">
                      <img class="status-icon" src="@/assets/icons/check-circle-white.svg" />
                      <span class="font-small weight-semi spacing-large">Distribution in progress</span>
                    </div>
                    <div v-else class="btn-container">
                      <Button class="btn-transparent font-medium weight-semi icon-cursor">Start Farming</Button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="project-ido">
                <div class="project-ido-process">
                  <span class="label font-medium weight-bold">IDO process:</span>
                  <Steps :current="currentStep" size="small" direction="vertical" :status="currentStatus.steps">
                    <Step>
                      <template slot="title">
                        <span class="font-small weight-bold">Preparation</span>
                      </template>
                    </Step>
                    <Step>
                      <template slot="title">
                        <div class="fcsb-container">
                          <span class="font-small weight-bold">Whitelist</span>
                          <span
                            v-if="currentStep >= 1 && userRegistered"
                            class="status-label success font-small weight-bold"
                            >Registered</span
                          >
                          <span
                            v-if="currentStep > 1 && !userRegistered"
                            class="status-label failed font-small weight-bold"
                            >Not Registered</span
                          >
                        </div>
                        <span v-if="currentStep === 1" class="status-label description font-small">
                          You can now register for the whitelist</span
                        >
                      </template>
                    </Step>
                    <Step>
                      <template slot="title">
                        <div class="fcsb-container">
                          <span class="font-small weight-bold">Sales</span>
                          <span v-if="currentStep > 2" class="status-label closed font-small weight-bold">Closed</span>
                        </div>
                        <span v-if="currentStep === 2" class="status-label description font-small"
                          >The purchase of NNI Tokens is live!</span
                        >
                      </template>
                    </Step>
                    <Step>
                      <template slot="title">
                        <div class="fcsb-container">
                          <span class="font-small weight-bold">Distribution</span>
                          <span v-if="currentStep >= 3" class="status-label success font-small weight-bold"
                            >Distributed</span
                          >
                        </div>
                        <span v-if="currentStep === 3" class="status-label description font-small"
                          >The Sale tokens have been distributed</span
                        >
                      </template>
                    </Step>
                  </Steps>
                </div>
              </div>
            </div>
          </div>
          <div class="project-detail-container">
            <div class="project-detail-static">
              <div class="project-detail-card">
                <div class="project-detail-desc">
                  <div class="project-title fcs-container">
                    <img class="project-logo" :src="fertilizer.logo" />
                    <h4 class="weight-bold spacing-medium">{{ fertilizer.title }}</h4>
                  </div>
                  <div class="project-short-desc">
                    <span class="font-medium weight-semi">{{ fertilizer.short_desc }}</span>
                  </div>
                  <span class="font-medium">{{ fertilizer.long_desc }}</span>
                </div>
                <div class="project-detail-info-group">
                  <Row :gutter="16">
                    <Col :md="8" :sm="12" :xs="12" class="project-detail-info-item">
                      <span class="title font-small weight-semi spacing-large">Token Price</span>
                      <div class="value fcs-container">
                        <CoinIcon class="coin-icon" :mint-address="fertilizer.price_token_mint" />
                        <span class="font-medium"
                          ><b>{{ fertilizer.ido_info.sale_rate }}</b> {{ fertilizer.price_token }}</span
                        >
                      </div>
                    </Col>
                    <Col :md="8" :sm="12" :xs="12" class="project-detail-info-item">
                      <span class="title font-small weight-semi spacing-large">Hard Cap</span>
                      <div class="value fcs-container">
                        <CoinIcon class="coin-icon" :mint-address="fertilizer.price_token_mint" />
                        <span class="font-medium"
                          ><b>{{ fertilizer.ido_info.hard_cap }}</b> {{ fertilizer.price_token }}</span
                        >
                      </div>
                    </Col>
                    <Col :md="8" :sm="12" :xs="12" class="project-detail-info-item">
                      <span class="title font-small weight-semi spacing-large">Pool Size</span>
                      <div class="value fcs-container">
                        <img class="coin-icon" :src="fertilizer.logo" />
                        <span class="font-medium"
                          ><b>{{ fertilizer.pool_size }}</b> {{ fertilizer.token_info.symbol }}</span
                        >
                      </div>
                    </Col>
                    <Col :md="8" :sm="12" :xs="12" class="project-detail-info-item">
                      <span class="title font-small weight-semi spacing-large">Blockchain</span>
                      <div class="value fcs-container">
                        <img class="lock-icon" src="@/assets/icons/sol.png" />
                        <span class="font-medium weight-semi">{{ fertilizer.ido_info.sale_type }}</span>
                      </div>
                    </Col>
                    <Col :md="8" :sm="12" :xs="12" class="project-detail-info-item">
                      <span class="title font-small weight-semi spacing-large">Your allocation</span>
                      <div class="value">
                        <span class="font-medium weight-semi">{{ userAllocation }}</span>
                      </div>
                    </Col>
                    <!-- <Col :md="8" :sm="12" :xs="12" class="project-detail-info-item"> 
                      <span class="title font-small weight-semi spacing-large">Website</span> 
                      <div class="value"> 
                        <a class="website font-medium weight-semi" :href="fertilizer.website_url" target="_blank">{{ 
                          fertilizer.website 
                        }}</a> 
                      </div> 
                    </Col> -->
                  </Row>
                </div>
              </div>
            </div>

            <div class="project-detail-condition">
              <div
                class="project-detail-item"
                v-if="
                  (currentStep === 1 && KYCStatus.step < 3 && currentTier > 3 && currentStatus.subscribe) ||
                  (currentStep === 2 &&
                    KYCStatus.step < 3 &&
                    (currentStatus.win || (currentTier > 3 && currentStatus.subscribe)))
                "
              >
                <div class="project-detail-open">
                  <div>
                    <!-- <div class="kyc-form"> 
                      <div class="kyc-progress-container fcs-container"> 
                        <div class="kyc-step text-center" :class="KYCStatus.step >= 1 ? 'active' : ''"> 
                          <span class="kyc-no m-auto font-medium weight-bold">1</span> 
                          <span class="kyc-title font-small weight-bold">ID Verification</span> 
                        </div> 
                        <div class="kyc-step text-center" :class="KYCStatus.step >= 2 ? 'active' : ''"> 
                          <span class="kyc-no m-auto font-medium weight-bold">2</span> 
                          <span class="kyc-title font-small weight-bold">Verification</span> 
                        </div> 
                        <div class="kyc-step text-center" :class="KYCStatus.step >= 3 ? 'active' : ''"> 
                          <span class="kyc-no m-auto font-medium weight-bold">3</span> 
                          <span class="kyc-title font-small weight-bold">Start to buy</span> 
                        </div> 
                      </div> 
                      <div v-if="KYCStatus.step < 3"> 
                        <div class="kyc-status-container fcsb-container"> 
                          <div class="kyc-current-step fcs-container"> 
                            <span class="font-large weight-bold">ID Verification</span> 
                            <img class="info-icon left" src="@/assets/icons/info.svg" /> 
                          </div> 
                          <span 
                            class="kyc-status font-xsmall weight-bold" 
                            :class=" 
                              KYCStatus.step === 1 
                                ? 'failed' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 1 
                                ? 'progress' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 2 
                                ? 'success' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 0 
                                ? 'failed' 
                                : '' 
                            " 
                            >{{ 
                              KYCStatus.step === 1 
                                ? 'Not verified' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 1 
                                ? 'In progress' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 2 
                                ? 'Verified' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 0 
                                ? 'Verification failed' 
                                : '' 
                            }}</span 
                          > 
                        </div> 
                        <div class="kyc-description"> 
                          <span class="font-small weight-semi spacing-large"> 
                            Before you can purchase your allocation, we need to verify your identity. It usually takes 
                            between 24 and 48 hours to be verified. 
                          </span> 
                          <img 
                            v-if="KYCStatus.step === 1" 
                            class="kyc-status-icon flex m-auto" 
                            src="@/assets/icons/kyc-verification.svg" 
                          /> 
                          <img 
                            v-else-if="KYCStatus.step === 2 && KYCStatus.verification === 1" 
                            class="kyc-status-icon flex m-auto" 
                            src="@/assets/icons/kyc-progress.svg" 
                          /> 
                          <img 
                            v-else-if="KYCStatus.step === 2 && KYCStatus.verification === 2" 
                            class="kyc-status-icon flex m-auto" 
                            src="@/assets/icons/kyc-success.svg" 
                          /> 
                          <img 
                            v-else-if="KYCStatus.step === 2 && KYCStatus.verification === 0" 
                            class="kyc-status-icon flex m-auto" 
                            src="@/assets/icons/kyc-failed.svg" 
                          /> 
                        </div> 
                        <div class="btn-container"> 
                          <Button 
                            class="btn-transparent font-medium weight-semi icon-cursor" 
                            :disabled="KYCStatus.step === 2 && KYCStatus.verification === 1" 
                            @click="KYCConfirm" 
                            >{{ 
                              KYCStatus.step === 1 
                                ? 'Verify your ID now' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 1 
                                ? 'Next' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 2 
                                ? 'Next' 
                                : KYCStatus.step === 2 && KYCStatus.verification === 0 
                                ? 'Verify your ID again' 
                                : '' 
                            }}</Button 
                          > 
                        </div> 
                      </div> 
                    </div> -->
                    <div v-if="KYCStatus.userVerified && KYCStatus.step === 3" class="buy-form">
                      <span class="font-medium weight-semi spacing-small"
                        >You can buy sale tokens and preview what you will receive below.</span
                      >
                      <div class="token-amount fcsb-container">
                        <div class="token-amount-input fcs-container">
                          <CoinIcon class="coin-icon" :mint-address="fertilizer.mint" />
                          <input class="font-medium weight-bold" type="number" placeholder="673" />
                        </div>
                        <span class="font-xsmall weight-semi token-max-amount"
                          >max 1500 {{ fertilizer.token_price }}</span
                        >
                      </div>
                      <div class="receive-amount">
                        <label class="font-xmall">You will receive:</label>
                        <div class="receive-amount-output fcs-container">
                          <img class="coin-icon" :src="fertilizer.logo" />
                          <span class="receive-amount-value font-medium weight-semi spacing-small"
                            >0.028 {{ fertilizer.title }}</span
                          >
                        </div>
                      </div>
                      <div class="btn-container">
                        <Button class="btn-transparent font-medium weight-semi icon-cursor">Buy Now</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="currentStep === 0"></div>
              <div
                v-else-if="currentStep === 1 && currentStatus.subscribe && currentTier <= 2"
                class="project-detail-item"
              >
                <h4 class="weight-semi">You are now whitelisted for the NNI IDO Sale.</h4>
                <span class="font-medium"> You can pay and claim once the whitelisting ends. Keep in touch. </span>
                <!-- <div class="ticket-tasks-group fssb-container"> 
                  <div class="ticket-tasks"> 
                    <span class="font-medium weight-bold">Earn tickets by completing these tasks:</span> 
                    <div class="ticket-task-status-group fcsb-container"> 
                      <div 
                        class="ticket-task-status-card fcsb-container icon-cursor" 
                        :class="socialTicket.telegram === 3 ? 'active' : ''" 
                        @click=" 
                          () => { 
                            if (this.socialTicket.telegram == 0 ? 0 : this.socialTicket.telegram - 1 < 2) { 
                              this.taskModalShow = true 
                              this.taskModalType = 0 
                            } 
                          } 
                        " 
                      > 
                        <div class="ticket-task-status fs-container"> 
                          <img class="ticket-social-icon" src="@/assets/icons/telegram-white.svg" /> 
                          <div> 
                            <span class="font-medium weight-bold">Telegram tasks</span> 
                            <br /> 
                            <span class="font-xsmall weight-semi" 
                              >{{ socialTicket.telegram == 0 ? 0 : socialTicket.telegram - 1 }} /2 Tasks completed</span 
                            > 
                          </div> 
                        </div> 
                        <img 
                          v-if="socialTicket.telegram === 2" 
                          class="status-icon" 
                          src="@/assets/icons/check-white.svg" 
                        /> 
                      </div> 
                      <div 
                        class="ticket-task-status-card fcsb-container icon-cursor" 
                        :class="socialTicket.twitter === 3 ? 'active' : ''" 
                        @click=" 
                          () => { 
                            if (this.socialTicket.twitter < 3) { 
                              this.taskModalShow = true 
                              this.taskModalType = 1 
                            } 
                          } 
                        " 
                      > 
                        <div class="ticket-task-status fs-container"> 
                          <img class="ticket-social-icon" src="@/assets/icons/twitter-white.svg" /> 
                          <div> 
                            <span class="font-medium weight-bold">Twitter tasks</span> 
                            <br /> 
                            <span class="font-xsmall weight-semi">{{ socialTicket.twitter }}/3 Tasks completed</span> 
                          </div> 
                        </div> 
                        <img 
                          v-if="socialTicket.twitter === 3" 
                          class="status-icon" 
                          src="@/assets/icons/check-white.svg" 
                        /> 
                      </div> 
                    </div> 
                    <span class="font-medium weight-bold">Share your referral below to earn additional tickets:</span> 
                    <div class="ticket-share-group fcsb-container"> 
                      <input type="text" class="ticket-share-link font-medium" :value="affiliatedLink" disabled /> 
                      <img class="copy-icon icon-cursor" src="@/assets/icons/copy.svg" @click="copyToClipboard()" /> 
                      <div v-if="copyNotification" class="copy-notification"> 
                        <span class="font-small weight-semi spacing-large">Link was copied to clipboard</span> 
                      </div> 
                    </div> 
                    <div class="ticket-btn-group fcsb-container"> 
                      <div class="share-btn btn-container"> 
                        <a :href="telegramShareLink" target="_blank"> 
                          <Button class="btn-primary font-small weight-semi spacing-large icon-cursor" 
                            >Share on Telegram</Button 
                          ></a 
                        > 
                      </div> 
                      <div class="share-btn btn-container"> 
                        <a :href="twitterShareLink" target="_blank"> 
                          <Button class="btn-primary font-small weight-semi spacing-large icon-cursor" 
                            >Share on Twitter</Button 
                          ></a 
                        > 
                      </div> 
                    </div> 
                  </div> 
                  <div class="ticket-preview"> 
                    <div class="ticket-earned"> 
                      <span class="font-medium weight-bold" 
                        >You are now registered for the {{ fertilizer.title }} whitelist and have:</span 
                      > 
                      <div class="ticket-earned-status fcs-container"> 
                        <img class="referral-icon" src="@/assets/icons/referral.svg" /> 
                        <div> 
                          <span class="font-medium weight-semi spacing-small"> 
                            <label class="font-large">{{ 
                              total_tickets + (currentTier == 2 ? 300 : currentTier == 1 ? 20 : 0) 
                            }}</label> 
                            Earned Tickets 
                          </span> 
                          <br /> 
                          <span class="font-xsmall" 
                            >{{ social_tickets }} Social / {{ referral_tickets }} Referrals / 
                            {{ currentTier == 2 ? 300 : currentTier == 1 ? 20 : 0 }} Tier {{ currentTier }}</span 
                          > 
                        </div> 
                      </div> 
                    </div> 
                  </div> 
                </div> -->
              </div>

              <div v-else-if="currentStep === 2 && wallet.connected" class="project-detail-item">
                <div v-if="currentTimestamp < fertilizer.sales_start_date" class="project-detail-sales">
                  <div v-if="userRegistered">
                    <div class="fcc-container">
                      <img class="status-icon" src="@/assets/icons/check-circle-white.svg" />
                      <span class="font-medium weight-semi spacing-small"
                        >Congratulations! You're officially registered and will be able to buy once the sale
                        starts.</span
                      >
                    </div>
                    <Countdown
                      class="sales-start-countdown"
                      title="Sale start in:"
                      :value="fertilizer.sales_start_date"
                      format="DD:HH:mm:ss"
                    />
                  </div>
                  <div v-else-if="!currentStatus.win || !userRegistered" class="text-center">
                    <div class="fcc-container mb-8">
                      <img class="alert-icon" src="@/assets/icons/alert-white.svg" />
                      <h4 class="weight-bold spacing-medium">
                        Sorry, the whitelist has ended and it looks like you were not distributed allocation this time.
                      </h4>
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="
                    currentTimestamp > fertilizer.sales_start_date &&
                    currentTimestamp < fertilizer.sales_end_date &&
                    wallet.connected
                  "
                >
                  <div class="project-detail-open">
                    <div v-if="userRegistered">
                      <!-- <div class="kyc-form"> 
                        <div class="kyc-progress-container fcs-container"> 
                          <div class="kyc-step text-center" :class="KYCStatus.step >= 1 ? 'active' : ''"> 
                            <span class="kyc-no m-auto font-medium weight-bold">1</span> 
                            <span class="kyc-title font-small weight-bold">ID Verification</span> 
                          </div> 
                          <div class="kyc-step text-center" :class="KYCStatus.step >= 2 ? 'active' : ''"> 
                            <span class="kyc-no m-auto font-medium weight-bold">2</span> 
                            <span class="kyc-title font-small weight-bold">Verification</span> 
                          </div> 
                          <div class="kyc-step text-center" :class="KYCStatus.step >= 3 ? 'active' : ''"> 
                            <span class="kyc-no m-auto font-medium weight-bold">3</span> 
                            <span class="kyc-title font-small weight-bold">Start to buy</span> 
                          </div> 
                        </div> 
                        <div v-if="KYCStatus.step < 3"> 
                          <div class="kyc-status-container fcsb-container"> 
                            <div class="kyc-current-step fcs-container"> 
                              <span class="font-large weight-bold">ID Verification</span> 
                              <img class="info-icon left" src="@/assets/icons/info.svg" /> 
                            </div> 
                            <span 
                              class="kyc-status font-xsmall weight-bold" 
                              :class=" 
                                KYCStatus.step === 1 
                                  ? 'failed' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 1 
                                  ? 'progress' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 2 
                                  ? 'success' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 0 
                                  ? 'failed' 
                                  : '' 
                              " 
                              >{{ 
                                KYCStatus.step === 1 
                                  ? 'Not verified' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 1 
                                  ? 'In progress' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 2 
                                  ? 'Verified' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 0 
                                  ? 'Verification failed' 
                                  : '' 
                              }}</span 
                            > 
                          </div> 
                          <div class="kyc-description"> 
                            <span class="font-small weight-semi spacing-large"> 
                              Before you can purchase your allocation, we need to verify your identity. It usually takes 
                              between 24 and 48 hours to be verified. 
                            </span> 
                            <img 
                              v-if="KYCStatus.step === 1" 
                              class="kyc-status-icon flex m-auto" 
                              src="@/assets/icons/kyc-verification.svg" 
                            /> 
                            <img 
                              v-else-if="KYCStatus.step === 2 && KYCStatus.verification === 1" 
                              class="kyc-status-icon flex m-auto" 
                              src="@/assets/icons/kyc-progress.svg" 
                            /> 
                            <img 
                              v-else-if="KYCStatus.step === 2 && KYCStatus.verification === 2" 
                              class="kyc-status-icon flex m-auto" 
                              src="@/assets/icons/kyc-success.svg" 
                            /> 
                            <img 
                              v-else-if="KYCStatus.step === 2 && KYCStatus.verification === 0" 
                              class="kyc-status-icon flex m-auto" 
                              src="@/assets/icons/kyc-failed.svg" 
                            /> 
                          </div> 
                          <div class="btn-container"> 
                            <Button 
                              class="btn-transparent font-medium weight-semi icon-cursor" 
                              :disabled="KYCStatus.step === 2 && KYCStatus.verification === 1" 
                              @click="KYCConfirm" 
                              >{{ 
                                KYCStatus.step === 1 
                                  ? 'Verify your ID now' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 1 
                                  ? 'Next' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 2 
                                  ? 'Next' 
                                  : KYCStatus.step === 2 && KYCStatus.verification === 0 
                                  ? 'Verify your ID again' 
                                  : '' 
                              }}</Button 
                            > 
                          </div> 
                        </div> 
                      </div> -->
                      <div v-if="KYCStatus.userVerified && KYCStatus.step === 3" class="buy-form">
                        <span class="font-medium weight-semi spacing-small"
                          >You can buy sale tokens and preview what you will receive below.</span
                        >
                        <div class="token-amount fcsb-container">
                          <div class="token-amount-input fcs-container">
                            <CoinIcon class="coin-icon" :mint-address="fertilizer.mint" />
                            <input
                              class="font-medium weight-bold"
                              type="number"
                              placeholder="input amount"
                              v-model="buyAmount"
                              @onInput="(amount) => (buyAmount = amount > 1000 ? 1000 : amount)"
                            />
                          </div>
                          <span class="font-xsmall weight-semi token-max-amount">max 1000 USDC</span>
                        </div>
                        <div class="receive-amount">
                          <label class="font-xmall">You will receive:</label>
                          <div class="receive-amount-output fcs-container">
                            <img class="coin-icon" :src="fertilizer.logo" />
                            <span class="receive-amount-value font-medium weight-semi spacing-small"
                              >{{
                                fertilizer.ido_info.sale_rate
                                  ? (buyAmount / fertilizer.ido_info.sale_rate).toFixed(fertilizer.decimals_mint)
                                  : ''
                              }}
                              {{ fertilizer.token_info.symbol }}</span
                            >
                          </div>
                        </div>
                        <div class="btn-container">
                          <Button
                            class="btn-transparent font-medium weight-semi icon-cursor"
                            @click="
                              () => {
                                if (this.wallet.connected) onClickBuyNow()
                                else this.$accessor.wallet.openModal()
                              }
                            "
                            >Buy Now</Button
                          >
                        </div>
                      </div>
                    </div>
                    <div v-else-if="(!currentStatus.win || !currentStatus.subscribe) && false" class="text-center">
                      <div class="fcc-container mb-8">
                        <img class="alert-icon" src="@/assets/icons/alert-white.svg" />
                        <h4 class="weight-bold spacing-medium">
                          Sorry, the whitelist has ended and it looks like you were not distributed allocation this
                          time.
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <div class="project-detail-open">
                    <Countdown
                      class="distribution-start-countdown"
                      title="Distribution starts in:"
                      :value="fertilizer.distribution_start_date"
                      format="DD:HH:mm:ss"
                    />
                    <span class="font-medium weight-semi spacing-small"
                      >You will receive your tokens once distribution begins. Be patient!</span
                    >
                    <div class="buy-form">
                      <div class="token-amount fcsb-container">
                        <div class="token-amount-input fcs-container">
                          <CoinIcon class="coin-icon" :mint-address="fertilizer.mint" />
                          <input
                            class="font-medium weight-bold"
                            type="number"
                            placeholder="0"
                            v-model="userPaidAmount"
                            disabled
                          />
                        </div>
                        <span class="font-xsmall weight-semi token-max-amount"> {{ fertilizer.price_token }}</span>
                      </div>
                      <div class="receive-amount">
                        <label class="font-xmall">You will receive:</label>
                        <div class="receive-amount-output fcs-container">
                          <img class="coin-icon" :src="fertilizer.logo" />
                          <span class="receive-amount-value font-medium weight-semi spacing-small"
                            >{{
                              fertilizer.ido_info.sale_rate
                                ? (userPaidAmount / fertilizer.ido_info.sale_rate).toFixed(fertilizer.decimals_mint)
                                : ''
                            }}
                            {{ fertilizer.token_info.symbol }}</span
                          >
                        </div>
                      </div>
                      <!-- <div class="receive-notification fb-container"> 
                        <img class="info-icon right" src="@/assets/icons/info.svg" /> 
                        <span class="font-xsmall weight-bold" 
                          >You will receive your tokens on 
                          <label class="font-small">Wallet ID: QlkjfjdsiuJDlkjf</label> 
                        </span> 
                      </div> -->
                    </div>
                  </div>
                </div>
              </div>
              <!-- FIXME: remove true -->

              <div
                v-else-if="
                  currentStep === 3 && currentTimestamp > fertilizer.distribution_start_date && wallet.connected
                "
                class="project-detail-item"
              >
                <div
                  v-if="currentTimestamp > fertilizer.distribution_start_date && userRegistered"
                  class="project-detail-open"
                >
                  <span class="font-medium weight-semi spacing-small">Distribution in progress, keep in touch!</span>
                  <div class="buy-form">
                    <div class="token-amount fcsb-container">
                      <div class="token-amount-input fcs-container">
                        <CoinIcon class="coin-icon" :mint-address="fertilizer.mint" />
                        <input
                          class="font-medium weight-bold"
                          type="number"
                          placeholder="input amount"
                          v-model="userPaidAmount"
                          disabled
                        />
                      </div>
                      <span class="font-xsmall weight-semi token-max-amount"> {{ fertilizer.price_token }}</span>
                    </div>
                    <div class="receive-amount">
                      <label class="font-xmall">You will receive:</label>
                      <div class="receive-amount-output fcs-container">
                        <img class="coin-icon" :src="fertilizer.logo" />
                        <span class="receive-amount-value font-medium weight-semi spacing-small"
                          >{{
                            fertilizer.ido_info.sale_rate
                              ? (userPaidAmount / fertilizer.ido_info.sale_rate).toFixed(fertilizer.decimals_mint)
                              : ''
                          }}
                          {{ fertilizer.token_info.symbol }}</span
                        >
                      </div>
                    </div>
                    <!--span class="font-xsmall weight-bold" 
                        >You will receive your tokens on 
                        <label class="font-small">Wallet ID:  
                          {{ wallet.address.substr(0, 4) }} 
                          ... 
                          {{ wallet.address.substr(wallet.address.length - 4, 4) }}</label> 
                      </span-->
                    <div class="btn-container">
                      <Button
                        class="btn-transparent font-medium weight-semi icon-cursor"
                        @click="
                          () => {
                            if (this.wallet.connected) onClaimTokens()
                            else this.$accessor.wallet.openModal()
                          }
                        "
                        >Claim Now</Button
                      >
                    </div>
                  </div>
                </div>
                <div v-else-if="!currentStatus.win || !userRegistered" class="text-center">
                  <div class="fcc-container mb-8">
                    <img class="alert-icon" src="@/assets/icons/alert-white.svg" />
                    <h4 class="weight-bold spacing-medium">
                      Sorry, the sales has ended and it looks like you were not distributed allocation this time.
                    </h4>
                  </div>
                </div>
                <!-- <div v-else-if="currentStatus.funded" class="text-center"> 
                  <h4 class="weight-bold spacing-medium">The {{ fertilizer.title }} public sale has finished!</h4> 
                  <div class="distribution-details"> 
                    <span class="font-medium"> 
                      Sonar Watch raised: 
                      <br /> 
                      <b>500,000 / 500,000 {{ fertilizer.token_price }}</b> 
                    </span> 
                    <div class="sale-details-group fcc-container"> 
                      <div class="sale-detail-card text-left"> 
                        <span class="font-xsmall">ROI (ATH)</span> 
                        <br /> 
                        <span class="font-large weight-bold">8.20x</span> 
                      </div> 
                      <div class="sale-detail-card text-left"> 
                        <span class="font-xsmall">ROI (current)</span> 
                        <br /> 
                        <span class="font-large weight-bold">1.07x</span> 
                      </div> 
                      <div class="sale-detail-card text-left"> 
                        <span class="font-xsmall">Last Price</span> 
                        <br /> 
                        <span class="font-large weight-bold">0.21 {{ fertilizer.token_price }}</span> 
                      </div> 
                    </div> 
                    <div class="btn-container m-auto"> 
                      <Button class="btn-transparent font-medium weight-semi icon-cursor">Start Farming</Button> 
                    </div> 
                  </div> 
                </div> -->
              </div>
            </div>

            <!---------------------------------Whitepaper Edit------------------------------------------------------------------->

            <!-- <div class="project-detail-static banner fcsb-container" v-if="currentTier < 5"> 
              <div class="project-detail-stake"> 
                <h4 class="weight-semi"> 
                  About NeoNomad Finance. 
                </h4> 
                 <h10 class="weight-semi"> 
                  Developed by Nomads, for Nomads. Unbound by time and place, NeoNomad bridges the gap between CeFi and DeFi. The future is a parallel economy. 
                 </h10> 
                   <h9 class="weight-semi"> 
                  NeoNomad is the world's first innovative cryptocurrency ecosystem that combines  
                  several services for a more financially inclusive world. By incorporating a decentralized exchange,  
                  NomadPay, and an NFT marketplace that ties digital art to real-world assets, NeoNomad sets itself apart from  
                  competitors in the DeFi space by offering a diverse array of services to enable users to reach their financial goals as they desire.  
                 </h9> 
                <div class="btn-container anchor"> 
                  <a class="btn-transparent anchor font-medium weight-semi icon-cursor" 
                    href="https://docs.neonomad.finance/tokenomics-fundamentals/whitepaper"> 
                    Whitepaper 
                  </a> 
                </div> 
              </div> 
              <img class="farmer-img isDesktop" src="@/assets/background/NNI_MOON.png" /> 
              <img class="farmer-img isTablet" src="@/assets/background/NNI_MOON.png" /> 
            </div>  -->

            <!---------------------------------Killerpoe's Edit------------------------------------------------------------------->

            <!-- <div class="project-detail-static banner fcsb-container" v-if="currentTier < 5"> 
              <div class="project-detail-stake"> 
            <div data-v-1354f7d8="" class="project-detail-static transparent"> 
               <h3 data-v-1354f7d8="" class="project-category-title weight-semi">Project Details</h3> 
                <div data-v-1354f7d8="" class="ant-row" style="margin: -10px -20px;"> 
                  <div data-v-1354f7d8="" class="ant-col ant-col-xs-24 ant-col-sm-24 ant-col-md-12" style="padding: 10px 20px;"> 
                     <span data-v-1354f7d8="" class="font-large weight-bold">IDO Information</span>  
            <div data-v-1354f7d8="" class="information"> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Sale type</span> <span data-v-1354f7d8="" class="font-xsmall weight-semi spacing-small text-right"><label class="font-medium">Public:</label> 100% unlock</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Whitelist Start Date</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small text-right">Mar 28, 2022-0:00 AM UTC</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Whitelist Ends Date</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small text-right">Mar 4, 2022-0:00 AM UTC</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Sale Starts Date</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small text-right">Mar 31, 2022-4:00 PM UTC</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Sale Ends Date</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small text-right">Apr 3, 2022-4:00 PM UTC</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Token Generation Event (TGE)</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small text-right">Apr 6, 2022-10:00 AM UTC</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Farm Opens</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small text-right">Apr 14, 2022-11:00 AM UTC</span></div> 
         </div> 
      </div> 
      <div data-v-1354f7d8="" class="ant-col ant-col-xs-24 ant-col-sm-24 ant-col-md-12" style="padding: 10px 20px;"> 
         <span data-v-1354f7d8="" class="font-large weight-bold">Tokenomics</span>  
         <div data-v-1354f7d8="" class="information"> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Hardcap</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small">198,000 USDC</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Token Price</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small">0.045 USDC</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Initial Marketcap</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small">248,000</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Initial Circulation Supply</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small">5,511,111</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Total Circulation Supply</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small">200,000,000</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Symbol</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small">NNI</span></div> 
            <div data-v-1354f7d8="" class="information-item fcsb-container"><span data-v-1354f7d8="" class="label font-small weight-semi spacing-large">Category</span> <span data-v-1354f7d8="" class="font-medium weight-semi spacing-small">DeFi, NFT's, Farming</span></div>    
         </div> 
      </div> 
   </div> 
</div> 
  </div> 
              </div> -->

            <!---------------------------------------------------------------------------------------------------->

            <div class="pds" v-html="fertilizer.longContent"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import { Row, Col, Statistic, Steps } from 'ant-design-vue'
import {
  setAnchorProvider,
  getLaunchpad,
  getProjectFormatted,
  subscribeToWhitelist,
  buyTokens,
  claimTokens,
  LaunchpadProgram,
  getAllProjects,
  getUser
} from '@/utils/crp-launchpad'
import { TOKENS, NATIVE_SOL, getTokenByMintAddress } from '@/utils/tokens'
import moment from 'moment'
import { PublicKey } from '@solana/web3.js'
import { get } from 'lodash-es'
import { checkWalletATA, getMintDecimals } from '@/utils/web3'
import { LAUNCHPAD_PROGRAM_ID, sss } from '@/utils/ids'
const Countdown = Statistic.Countdown
const Step = Steps.Step
const TEST_TIME = 1643356116915
const countries = require('i18n-iso-countries')
// 1643500800000

export default Vue.extend({
  async asyncData({ params, redirect }) {
    return {
      project: null as any
    }
  },

  components: {
    Row,
    Col,
    Countdown,
    Steps,
    Step
  },

  data() {
    return {
      total_tickets: 0,
      userRegistered: false,
      projectId: '' as any,
      fertilizer: {
        picture: '',
        logo: '',
        longContent: '',
        title: '',
        short_desc: '',
        price_token: '',
        price_token_mint: '',
        long_desc: 'Connecting to the Solana Network... Please wait',
        hard_cap: '198K',
        pool_size: 4400000 as any,
        subscribers: 'Pending' as any,
        website: 'NeoNomad Finance',
        website_url: 'https://neonomad.exchange',
        mint: '',
        tw_a: 'https://twitter.com/NeoNomadFinance',
        tw_b: '',
        tg_a: 'https://t.me/NeoNomadFinance',
        tg_b: '',
        retweetlink: 'https://twitter.com',
        ido_info: {
          hard_cap: 0,
          sale_rate: 0 as any,
          sale_type: ''
        },
        token_info: {
          symbol: ''
        },
        whitelist_start_date: 0 as any,
        whitelist_end_date: 0 as any,
        sales_start_date: 0 as any,
        sales_end_date: 0 as any,
        distribution_start_date: 0 as any,
        distribution_end_date: 0 as any,
        date_preparation: 0 as any,
        decimals_mint: 0 as any,
        decimals_sale: 0 as any
      },
      projectStatus: {
        preparation: 'Preparation',
        whitelist: 'Whitelist Open',
        sales: 'Sales',
        open: 'Open Sales',
        distribution: 'Distribution'
      },
      currentStatus: {
        steps: 'process' as string,
        funded: false as boolean,
        win: false as boolean,
        subscribe: false as boolean
      },
      referal: '' as string,
      socialTicket: {
        telegram: 0 as number,
        twitter: 0 as number
      },
      SubscribeModalContent: '' as string,
      currentTimestamp: 0 as any,
      currentStep: 0 as number,
      currentTier: 0 as number,
      affiliatedLink: '' as string,
      twitterShareLink: '' as string,
      telegramShareLink: '' as string,
      subscribeShow: false as boolean,
      taskModalShow: false as boolean,
      taskModalType: 0 as number,
      KYCStatus: {
        step: 3 as number,
        verification: 0 as number,
        userVerified: true as boolean,
        sessionID: '' as string
      },
      KYCModalShow: false as boolean,
      copyNotification: false as boolean,
      timer: null as any,

      social_tickets: 0,
      referral_tickets: 0,
      buyAmount: 0,
      userPaidAmount: '1000',
      userAllocation: '0',
      maxAmount: 1500
    }
  },

  head: {
    title: 'NeoNomad Finance - Nomadpad'
  },

  computed: {
    ...mapState(['app', 'wallet', 'farm', 'url', 'price', 'liquidity'])
  },

  watch: {
    'wallet.address': {
      handler(newTokenAccounts: any) {
        this.loadDatas()
      },
      deep: true
    },
    'wallet.connected': {
      handler(connected: any) {
        setAnchorProvider(this.$web3, this.$wallet)
        this.getProjectData().then((project) => {
          if (project) {
            //@ts-ignore
            this.project = project
            //@ts-ignore
            this.fertilizer.mint = this.project.mint

            this.currentTimestamp = moment().valueOf()
            this.loadDatas()
          }
        })
      },
      deep: true
    }
  },

  async mounted() {
    setAnchorProvider(this.$web3, this.$wallet)
    const query = new URLSearchParams(window.location.search)
    const projectId = query.get('project')
    this.projectId = projectId

    const project = await this.getProjectData()
    if (project) {
      //@ts-ignore
      this.project = project
      //@ts-ignore
      this.fertilizer.mint = this.project.mint

      this.currentTimestamp = moment().valueOf()
      this.loadDatas()
    }
  },

  methods: {
    moment() {
      return moment()
    },
    async getProjectData() {
      // let registerdList
      // try {
      //   registerdList = await fetch('https://flow.cropper.finance/registers/').then((res) => res.json())
      // } catch {
      // } finally {
      // }

      let responseData

      try {
        responseData = await getAllProjects()
      } catch {
        // dummy data
      } finally {
      }

      let key = 0
      console.log('responseData', responseData, this.projectId)

      for (const item of responseData) {
        let mint = item.account.projectMint.toBase58()

        if (mint == this.projectId) {
          let project = {
            status: 'Whitelist Open',
            key: 'k' + key,
            picture: 'picture',
            title: 'NeoNomad Finance',
            short_desc:
              'NeoNomad provides an all-in-one integrated ecosystem, including a decentralized exchange, integrated payment services, a Launchpad, DeFi products and an NFT marketplace to make decentralized finance accessible to all.',
            slug: 'neo_namad',
            hard_cap: '198K',
            subscribers: 0,
            mint: item.account.projectMint.toBase58(),
            whitelist_end_date: 1643500800000,
            whitelist_start_date: 0,
            distribution_end_date: 0,
            distribution_start_date: 0,
            date_preparation: 0,
            sales_end_date: 0,
            sales_start_date: 0,
            token_price: 0,
            price_token: '',
            price_token_mint: '',
            decimals_mint: 0,
            decimals_sale: 0
          }

          let scValues: any = await getProjectFormatted(item.account.projectMint.toBase58())

          const decimals_mint = await getMintDecimals(LaunchpadProgram.provider.connection, item.account.projectMint)
          const decimals_sale = await getMintDecimals(LaunchpadProgram.provider.connection, item.account.saleMint)
          project.decimals_mint = decimals_mint
          project.decimals_sale = decimals_sale
          if (decimals_mint != undefined && decimals_sale != undefined) {
            const amp_mint = Math.pow(10, decimals_mint)
            const amp_sale = Math.pow(10, decimals_sale)
            scValues.total_deposit_amount /= amp_mint
            scValues.total_paid_amount /= amp_sale
            scValues.total_claimed_amount /= amp_mint
          }
          project.hard_cap = (scValues.total_deposit_amount * scValues.token_price).toString()

          if (!scValues) {
            continue
          }

          var curdate = (new Date() as any) * 1

          project.distribution_end_date = (moment(scValues.date_distribution).unix() + 86400 * 2) * 1000
          project.distribution_start_date = moment(scValues.date_distribution).unix() * 1000
          project.date_preparation = moment(scValues.date_preparation).unix() * 1000
          project.sales_end_date = moment(scValues.date_sale_end).unix() * 1000
          project.sales_start_date = moment(scValues.date_sale_start).unix() * 1000
          project.whitelist_end_date = moment(scValues.date_whitelist_end).unix() * 1000
          project.whitelist_start_date = moment(scValues.date_whitelist_start).unix() * 1000

          if (scValues.token_price == undefined) {
            continue
          }

          project.token_price = scValues.token_price

          if (curdate > project.distribution_end_date) {
            project.status = 'Funded'
          } else if (curdate > project.distribution_start_date) {
            project.status = 'Distribution'
          } else if (curdate > project.sales_end_date) {
            project.status = 'Distribution'
          } else if (curdate > project.sales_start_date) {
            project.status = 'Sales'
          } else if (curdate > project.whitelist_end_date) {
            project.status = 'Lottery'
          } else if (curdate > project.whitelist_start_date) {
            project.status = 'Whitelist Open'
          } else {
            project.status = 'Upcoming'
          }
          let token = getTokenByMintAddress(scValues.price_token_mint)

          if (token) {
            project.price_token = token.symbol
            project.price_token_mint = scValues.price_token_mint
          }

          key++
          return project
        }
      }
      return null
    },
    checkCurrentStep() {
      if (this.currentStep === 0 && this.currentTimestamp > this.fertilizer.whitelist_start_date) this.currentStep = 1
      if (this.currentStep === 1 && this.currentTimestamp > this.fertilizer.whitelist_end_date) this.currentStep = 2
      if (this.currentStep === 2 && this.currentTimestamp > this.fertilizer.distribution_start_date)
        this.currentStep = 3

      //@ts-ignore
      if (this.project.closed) currentStatus.funded = 1
    },
    goBack() {
      this.$router.push('/nomadpad')
    },

    async onClaimTokens() {
      console.log('LAUNCHPAD_PROGRAM_ID', sss)
      if (this.wallet.connected) {
        let projectTokenAccount = get(this.wallet.tokenAccounts, `${this.fertilizer.mint}.tokenAccountAddress`)
        if (projectTokenAccount) {
          projectTokenAccount = new PublicKey(projectTokenAccount)
        } else {
          projectTokenAccount = await checkWalletATA(
            this.fertilizer.mint,
            LaunchpadProgram.provider.connection,
            LaunchpadProgram.provider.wallet.publicKey
          )
        }
        let res = await claimTokens(new PublicKey(this.fertilizer.mint), projectTokenAccount)
        if (res.success) {
          const amount = (res.amount / Math.pow(10, this.fertilizer.decimals_mint)).toFixed(
            this.fertilizer.decimals_mint
          )
          this.$notify.success({
            message: `Claim Succeed. ${amount} received`,
            description: 'Transaction Succeed'
          })
        } else {
          this.$notify.error({
            message: 'Claim Failed',
            description: 'Transaction Failed'
          })
        }
      }
    },

    async onClickBuyNow() {
      if (!this.wallet.connected) {
        console.log('wallet not connected!')
        return
      }
      let priceTokenAccount = get(this.wallet.tokenAccounts, `${this.fertilizer.price_token_mint}.tokenAccountAddress`)
      if (priceTokenAccount) {
        priceTokenAccount = new PublicKey(priceTokenAccount)
      } else {
        priceTokenAccount = await checkWalletATA(
          this.fertilizer.price_token_mint,
          LaunchpadProgram.provider.connection,
          LaunchpadProgram.provider.wallet.publicKey
        )
      }
      const decimals_sale = await getMintDecimals(
        LaunchpadProgram.provider.connection,
        new PublicKey(this.fertilizer.price_token_mint)
      )
      const amp_sale = Math.pow(10, decimals_sale)
      const buyAmount = this.buyAmount * amp_sale
      let res = await buyTokens(
        new PublicKey(this.fertilizer.mint),
        new PublicKey(this.fertilizer.price_token_mint),
        priceTokenAccount,
        buyAmount
      )
      if (res.success) {
        this.$notify.success({
          message: 'Buy Succeed',
          description: 'Transaction Succeed'
        })
      } else {
        this.$notify.error({
          message: 'Buy Failed',
          description: 'Transaction Failed'
        })
      }
      console.log('buyAmount =', this.buyAmount)
    },

    async initSubscribe() {
      if (!this.$wallet?.connected) {
        console.log('wallet not connected')
        return
      }
      setAnchorProvider(this.$web3, this.$wallet)
      await this.contextualizeUser()
      if (this.userRegistered) {
        this.$notify.success({
          message: 'Already subscribed',
          description: 'Not allowed double subscriptions'
        })
        return
      }

      let projectTokenAccount = get(this.wallet.tokenAccounts, `${this.fertilizer.mint}.tokenAccountAddress`)
      if (projectTokenAccount) {
        projectTokenAccount = new PublicKey(projectTokenAccount)
      } else {
        projectTokenAccount = await checkWalletATA(
          this.fertilizer.mint,
          LaunchpadProgram.provider.connection,
          LaunchpadProgram.provider.wallet.publicKey
        )
      }
      console.log('this.fertilizer.mint', this.fertilizer.mint)
      console.log('projectTokenAccount', projectTokenAccount)
      let res = await subscribeToWhitelist(new PublicKey(this.fertilizer.mint), projectTokenAccount)
      console.log(res)
      if (res.success) {
        let body = {
          spl: this.wallet.address,
          mint: this.fertilizer.mint,
          tx_id_register: res.txId
        }

        if (this.referal) {
          //@ts-ignore
          body.referer = this.referal
        }

        await this.contextualizeUser()
        this.currentStatus.subscribe = true
        this.$notify.success({
          message: 'Subscribe Succeed',
          description: 'Transaction Succeed'
        })
      } else {
        this.$notify.error({
          message: 'Subscribe Failed',
          description: 'Transaction Failed'
        })
      }
    },

    async contextualizeUser() {
      if (!this.wallet.connected) {
        return
      }
      try {
        const userData = await getUser(new PublicKey(this.fertilizer.mint))
        if (userData) {
          this.userRegistered = true
          this.userPaidAmount = (
            (userData.paidAmount.toNumber() - userData.claimedAmount.toNumber()) /
            Math.pow(10, this.fertilizer.decimals_sale)
          ).toFixed(this.fertilizer.decimals_sale)
          this.userAllocation = (
            (userData.paidAmount.toNumber() - userData.claimedAmount.toNumber()) /
            Math.pow(10, this.fertilizer.decimals_sale) /
            this.fertilizer.ido_info.sale_rate
          ).toFixed(this.fertilizer.decimals_mint)
        } else {
          this.userPaidAmount = '0'
          this.userRegistered = false
          this.userAllocation = '0'
        }
      } catch (e) {
        console.log(e)
      }
    },

    async delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },

    async loadDatas() {
      let responseData = {} as any

      //@ts-ignore
      let item = this.project

      this.currentTimestamp = moment().valueOf()

      var curdate = new Date()
      this.fertilizer.short_desc = item['short_desc']
      this.fertilizer.long_desc = item['short_desc_2']
      this.fertilizer.title = item['title']
      this.fertilizer.tg_a = item['tg_a']
      this.fertilizer.tg_b = item['tg_b']
      this.fertilizer.tw_a = item['twitter_a']
      this.fertilizer.tw_b = item['twitter_b']

      const titleEl = document.querySelector('head title')
      //@ts-ignore
      titleEl?.textContent = 'NeoNomad Finance - Nomadpad'
      const descEl = document.querySelector('head meta[name="description"]')
      descEl?.setAttribute('content', item['seo_desc_meta'])
      const descEl2 = document.querySelector('head meta[name="og:description"]')
      descEl2?.setAttribute('content', item['seo_desc_meta'])

      this.fertilizer.retweetlink = item['post_a']
      this.SubscribeModalContent = item['disclaimer']
      this.fertilizer.website_url = item.website_display
      this.fertilizer.website = item.website_url
      this.fertilizer.logo = '/Crypto_Nomad_Logo_-_White.svg'

      let scValues: any = await getProjectFormatted(this.fertilizer.mint)
      if (!scValues) {
        this.$router.push({
          path: '/nomadpad/'
        })
      }
      const decimals_mint = item.decimals_mint
      const decimals_sale = item.decimals_sale
      this.fertilizer.decimals_mint = decimals_mint
      this.fertilizer.decimals_sale = decimals_sale
      if (decimals_mint != undefined && decimals_sale != undefined) {
        const amp_mint = Math.pow(10, decimals_mint)
        const amp_sale = Math.pow(10, decimals_sale)
        scValues.total_deposit_amount /= amp_mint
        scValues.total_paid_amount /= amp_sale
        scValues.total_claimed_amount /= amp_mint
      }
      const ido_hard_cap = scValues.total_deposit_amount * scValues.token_price

      this.fertilizer.distribution_end_date = (moment(scValues.date_distribution).unix() + 86400 * 2) * 1000
      this.fertilizer.distribution_start_date = moment(scValues.date_distribution).unix() * 1000
      this.fertilizer.date_preparation = moment(scValues.date_preparation).unix() * 1000
      this.fertilizer.sales_end_date = moment(scValues.date_sale_end).unix() * 1000
      this.fertilizer.sales_start_date = moment(scValues.date_sale_start).unix() * 1000
      this.fertilizer.whitelist_end_date = moment(scValues.date_whitelist_end).unix() * 1000
      this.fertilizer.whitelist_start_date = moment(scValues.date_whitelist_start).unix() * 1000
      this.fertilizer.ido_info.sale_rate = scValues.token_price
      this.fertilizer.ido_info.hard_cap = ido_hard_cap
      this.fertilizer.ido_info.sale_type = item.type

      this.checkCurrentStep()
      if (scValues.token_price != undefined && scValues.token_price > 0) {
        this.fertilizer.pool_size = scValues.total_deposit_amount
      }

      let token = getTokenByMintAddress(scValues.price_token_mint)

      if (token) {
        this.fertilizer.price_token = token.symbol
        this.fertilizer.price_token_mint = scValues.price_token_mint
      }

      token = getTokenByMintAddress(this.fertilizer.mint)
      if (token) {
        this.fertilizer.token_info.symbol = token.symbol
      }

      this.contextualizeUser()
    },

    copyToClipboard() {
      var textField = document.createElement('textarea')
      textField.innerText = this.affiliatedLink
      document.body.appendChild(textField)
      textField.select()
      document.execCommand('copy')
      textField.remove()
      this.copyNotification = true
      setTimeout(() => {
        this.copyNotification = false
      }, 3000)
    },

    dataURLtoFile(dataurl: any, filename: any) {
      var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n)

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }

      return new File([u8arr], filename + '.jpg', { type: mime })
    },

    async sendKYC(driver: any, id: any, passport: any, selectedCountry: any, imgUrl: any) {
      var myHeaders = new Headers()
      myHeaders.append('Session-Id', this.KYCStatus.sessionID)

      var formdata = new FormData()
      formdata.append('document_type', driver ? 'DRIVER_LICENSE' : id ? 'NATIONAL_ID' : 'PASSPORT')
      formdata.append('country', countries.alpha2ToAlpha3(selectedCountry))

      if (imgUrl.back) {
        formdata.append('back_document', imgUrl.backfiles, 'Front.png')
      }

      if (imgUrl.front) {
        formdata.append('front_document', imgUrl.frontfiles, 'Front.png')
      }

      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formdata
      }

      let rest = await fetch(
        'https://individual-api.synaps.io/v3/identity/submit?step_id=1909259753480',
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => {
          if (JSON.parse(result).api_code == 'WORKFLOW_STEP_UPLOADED') {
            var requestOptions2 = {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: this.KYCStatus.sessionID })
            }
            fetch('https://flow.cropper.finance/kyc/init/', requestOptions2)

            this.contextualizeUser()

            this.KYCModalShow = false
          } else {
            alert(JSON.parse(result).message)
          }
        })
        .catch((error) => console.log('error', error))
    },

    KYCConfirm() {
      if (this.KYCStatus.step === 1 || (this.KYCStatus.step === 2 && this.KYCStatus.verification === 0))
        this.KYCModalShow = true
      else if (this.KYCStatus.step === 2 && this.KYCStatus.verification === 2) {
        this.KYCStatus.step = 3
        this.KYCStatus.userVerified = true
      }

      // FIXME: remove two lines
      this.KYCStatus.userVerified = true
      this.KYCStatus.step = 3
    }
  }
})
</script>

<style lang="less" scoped>
// global stylesheet
.fertilizer-project {
  .btn-container {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    padding: 3px;
    height: auto;
  }

  .btn-container.anchor {
    text-align: center;
    padding: 10px;
  }

  .btn-transparent {
    background: transparent;
    border-radius: 8px;
    border: none;
    height: auto;
    width: 100%;
    padding: 7.5px 0;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-transparent.anchor {
    color: #fff;
  }

  .btn-primary {
    background: @color-blue700;
    border-radius: 48px;
    border: none;
    height: auto;
    width: auto;
    padding: 4.5px 23.5px;
  }

  .project-status {
    padding: 4px 8px;
    border-radius: 6px;

    &.whitelist {
      background: @color-light-blue;
    }

    &.sales {
      background: @color-purple600;
    }

    &.open {
      background: @color-purple500;
    }

    &.distribution {
      background: @color-yellow600;
      color: @color-neutral900;
    }

    &.preparation {
      background: @color-pink600;
    }
  }

  .status-label {
    &.description {
      color: #fff;
    }

    &.success {
      color: @color-green500;
    }

    &.closed {
      color: @color-red500;
    }
  }

  .status-icon {
    height: 16px;
    width: 16px;
    margin-right: 8px;
  }

  .alert-icon {
    height: 24px;
    width: 24px;
    margin-right: 8px;
  }

  .coin-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 6px;
  }

  .info-icon {
    width: 12px;
    height: 12px;

    &.left {
      margin-left: 8px;
    }

    &.right {
      margin-right: 8px;
    }
  }

  .lock-icon {
    width: 16px;
    height: 16px;
    margin-right: 6px;
  }

  .isDesktop {
    @media @max-lg-tablet {
      display: none;
    }
  }

  .isTablet {
    display: none;

    @media @max-lg-tablet {
      display: unset;
    }

    @media @max-sl-mobile {
      display: none;
    }
  }

  .isMobile {
    display: none;

    @media @max-sl-mobile {
      display: unset;
    }
  }
}

// background image
// .launchpad-bg {
//    background: @color-blue800 !important;
//   background-image: url('@/assets/background/background_old.png') !important;
//   background-repeat: no-repeat !important;
//   background-position: top !important;
//   background-size: 100% auto !important;
//   //margin-top: -21px;
//   min-height: calc(100vh - 64px - 82px);
// }

// class stylesheet
.fertilizer-project.container {
  margin: 38px 0;

  @media @max-sl-mobile {
    margin: 28px 0;
  }

  .card {
    .card-body {
      padding: 0;

      .project-content {
        display: flex;

        @media @max-md-tablet {
          display: block;
        }

        .project-preview-container {
          position: fixed;
          width: 300px;

          @media @max-md-tablet {
            position: relative;
            width: 100%;
          }

          .project-back {
            margin-bottom: 28px;

            .back-to-list {
              width: fit-content;

              .back-icon {
                margin-right: 8px;
              }

              .back-label {
                color: rgb(255, 254, 254);
              }
            }
          }

          .project-preview-ido-container {
            @media @max-md-tablet {
              display: flex;
              justify-content: space-between;
            }

            @media @max-sl-mobile {
              display: block;
            }

            .project-preview {
              box-shadow: inset 0 0 28px #2d0b50e1;
              background: rgba(129, 116, 245, 0.5);
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;

              @media @max-md-tablet {
                width: 50%;
                margin-bottom: 0;
                margin-right: 8px;
              }

              @media @max-sl-mobile {
                width: 100%;
                margin-bottom: 16px;
                margin-right: 0;
              }

              .project-overview {
                .project-title {
                  .project-logo {
                    border-radius: 50%;
                    margin-right: 8px;
                    width: 40px;
                  }
                }
              }

              .project-countdown {
                margin-top: 16px;
              }

              .project-progress {
                margin-top: 16px;
              }
            }

            .project-ido {
              border-radius: 8px;

              @media @max-md-tablet {
                width: 50%;
                margin-left: 8px;
              }

              @media @max-sl-mobile {
                width: 100%;
                margin-left: 0;
              }

              .project-ido-process {
                height: 100%;
                width: 100%;
                box-shadow: inset 0 0 28px #2d0b50e1;
                background: rgba(129, 116, 245, 0.5);
                border-radius: 8px;
                padding: 13px 21px;

                .label {
                  display: block;
                  margin-bottom: 18px;
                }
              }
            }
          }
        }

        .project-detail-container {
          width: calc(100% - 300px - 16px);
          margin-left: calc(300px + 16px);
          padding-top: 52px;

          @media @max-md-tablet {
            width: 100%;
            margin-left: 0;
            margin-top: 16px;
            padding-top: 0;
          }

          .project-detail-static {
            box-shadow: inset 0 0 28px #2d0b50e1;
            background: rgba(129, 116, 245, 0.5);
            border-radius: 8px;
            padding: 32px;

            @media @max-sl-mobile {
              padding: 24px;
            }

            .project-detail-card {
              display: flex;

              @media @max-lg-tablet {
                display: block;
              }

              .project-detail-desc {
                width: 40%;
                padding-right: 12px;

                @media @max-lg-tablet {
                  width: 100%;
                  padding-right: 0;
                }

                .project-title {
                  margin-bottom: 16px;

                  .project-logo {
                    margin-right: 8px;
                    border-radius: 50%;
                    width: 40px;
                  }
                }

                .project-short-desc {
                  margin-bottom: 8px;
                }
              }

              .project-detail-info-group {
                width: 60%;
                padding-left: 12px;

                @media @max-lg-tablet {
                  width: 100%;
                  padding-left: 0;
                  margin-top: 24px;
                }

                .project-detail-info-item {
                  height: 90px;

                  .title {
                    color: rgba(255, 255, 255, 0.6);
                  }

                  .value {
                    .website {
                      color: #fff;
                      text-decoration: underline;
                      text-underline-position: under;
                    }
                  }
                }
              }
            }

            &.banner {
              padding: 0 32px;
              margin-bottom: 100px;

              @media @max-sl-mobile {
                padding: 0 24px;
              }

              .project-detail-stake {
                padding: 24px 0;

                .btn-container {
                  max-width: 150px;
                  width: 100%;
                  margin-top: 18px;
                }
              }

              .farmer-img {
                width: 28%;

                @media @max-lg-tablet {
                  width: 35%;
                }

                @media @max-sl-mobile {
                  display: none;
                }
              }
            }

            &.transparent {
              background: transparent;
              padding: 0;
              margin-bottom: 60px;

              .project-category-title {
                margin-bottom: 32px !important;
              }

              .project-category-content-about {
                display: flex;
                align-content: stretch;

                @media @max-sl-mobile {
                  display: block;
                }

                .banner-img {
                  width: 100%;
                  height: 100%;
                }
              }

              .project-category-banner-img {
                width: 100%;
                border-radius: 8px;
                margin-bottom: 40px;
              }

              .information {
                .information-item {
                  margin-top: 8px;
                  padding: 8px 0;
                  border-bottom: 1px solid @color-blue200;

                  .label {
                    color: rgba(255, 255, 255, 0.7);
                  }
                }
              }
            }
          }

          .project-detail-condition {
            margin: 32px 0;

            .project-detail-item {
              box-shadow: inset 0 0 28px #2d0b50e1;
              background: rgba(129, 116, 245, 0.5);
              border-radius: 8px;
              padding: 32px;

              @media @max-sl-mobile {
                padding: 24px;
              }

              .ticket-tasks-group {
                margin-top: 32px;

                @media @max-lg-tablet {
                  display: block !important;
                }

                .ticket-tasks {
                  width: 60%;
                  padding-right: 48px;

                  @media @max-lg-tablet {
                    width: 100%;
                    padding-right: 0;
                  }

                  .ticket-task-status-group {
                    margin: 24px 0;

                    @media @max-sl-mobile {
                      display: block !important;
                    }

                    .ticket-task-status-card {
                      background: @color-blue400;
                      width: calc((100% - 24px) / 2);
                      padding: 16px;
                      border-radius: 8px;

                      @media @max-sl-mobile {
                        width: 100%;

                        &:first-child {
                          margin-bottom: 24px;
                        }
                      }

                      &.active {
                        background: @color-green500;
                      }

                      .ticket-task-status {
                        .ticket-social-icon {
                          width: 24px;
                          opacity: 0.5;
                          margin-right: 24px;
                        }
                      }
                    }
                  }

                  .ticket-share-group {
                    position: relative;
                    margin: 8px 0 24px 0;
                    padding: 0 8px;
                    background: rgba(226, 227, 236, 0.1);
                    border-radius: 12px;

                    .ticket-share-link {
                      background: transparent;
                      outline: none;
                      border: none;
                      width: 100%;
                      padding: 10px;
                    }

                    .copy-icon {
                      margin: 0 10px;
                    }

                    .copy-notification {
                      position: absolute;
                      top: 50px;
                      right: 10px;
                      background: @gradient-color-primary;
                      background-origin: border-box;
                      border: 2px solid rgba(255, 255, 255, 0.14);
                      box-shadow: 18px 11px 14px rgba(0, 0, 0, 0.25);
                      border-radius: 8px;
                      padding: 12px;
                    }
                  }

                  .ticket-btn-group {
                    @media @max-sl-mobile {
                      display: block !important;
                    }

                    .share-btn {
                      width: calc((100% - 24px) / 2);

                      @media @max-sl-mobile {
                        width: 100%;

                        &:first-child {
                          margin-bottom: 24px;
                        }
                      }

                      .btn-primary {
                        width: 100%;
                        padding: 10px 0;
                      }
                    }
                  }
                }

                .ticket-preview {
                  width: 40%;
                  height: 100%;
                  background: @color-blue800;
                  border-radius: 8px;
                  padding: 16px;

                  @media @max-lg-tablet {
                    width: 100%;
                    margin-top: 24px;
                  }
                  .ticket-earned {
                    .ticket-earned-status {
                      background: @gradient-color03;
                      padding: 16px;
                      margin-top: 16px;
                      border-radius: 8px;

                      .referral-icon {
                        margin-right: 24px;
                      }
                    }
                  }
                }
              }

              .distribution-details {
                margin-top: 24px;

                .sale-details-group {
                  margin: 24px 0;

                  .sale-detail-card {
                    background: @color-blue500;
                    min-width: 132px;
                    border-radius: 8px;
                    padding: 16px;
                    margin-right: 24px;

                    &:last-child {
                      margin-right: 0;
                    }
                  }
                }

                .btn-container {
                  width: 212px;
                }
              }

              .project-detail-sales {
                .sales-start-countdown {
                  margin-top: 32px;
                }
              }

              .project-detail-open {
                display: table;
                margin: auto;

                .kyc-form {
                  .kyc-progress-container {
                    margin-bottom: 48px;

                    .kyc-step {
                      width: calc((100% - 16px) / 3);
                      margin-right: 8px;

                      &:last-child {
                        margin-right: 0;
                      }

                      .kyc-no {
                        display: block;
                        background: rgba(255, 255, 255, 0.4);
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        margin-bottom: 8px !important;
                        color: @color-blue700;
                      }

                      .kyc-title {
                        color: rgba(255, 255, 255, 0.4);
                      }

                      &.active {
                        .kyc-no {
                          background: @color-petrol500;
                        }

                        .kyc-title {
                          color: @color-petrol500;
                        }
                      }
                    }
                  }

                  .kyc-status-container {
                    margin-bottom: 16px;

                    .kyc-status {
                      padding: 4px 8px;
                      border-radius: 6px;

                      &.failed {
                        background: @color-red600;
                      }

                      &.progress {
                        background: @color-yellow600;
                      }

                      &.success {
                        background: @color-petrol500;
                      }
                    }
                  }

                  .kyc-description {
                    margin-bottom: 24px;

                    .kyc-status-icon {
                      margin-top: 24px !important;
                    }
                  }
                }

                .buy-form {
                  .token-amount {
                    background: rgba(226, 227, 236, 0.1);
                    border-radius: 12px;
                    padding: 10px;
                    margin: 16px 0 8px 0;

                    .token-amount-input {
                      width: calc(100% - 83px);

                      input {
                        border: none;
                        outline: none;
                        background: transparent;
                        width: 100%;

                        &::-webkit-inner-spin-button {
                          display: none;
                        }
                      }
                    }
                    .token-max-amount {
                      color: @color-blue100;
                    }
                  }

                  .receive-amount {
                    .receive-amount-output {
                      background: @color-blue800;
                      border-radius: 12px;
                      padding: 10px;
                      margin-top: 4px;

                      .receive-amount-value {
                        color: rgba(255, 255, 255, 0.5);
                      }
                    }
                  }

                  .receive-notification {
                    background: @color-blue800;
                    margin-top: 32px;
                    padding: 18px;
                    border-radius: 18px;
                  }

                  .btn-container {
                    margin-top: 24px;
                  }
                }

                .distribution-start-countdown {
                  margin-bottom: 32px;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
<style lang="less">
.fertilizer-project {
  // ant steps
  .ant-steps-vertical {
    .ant-steps-item-content {
      min-height: 45px;
    }

    .ant-steps-item-active,
    .ant-steps-item-finish {
      .ant-steps-item-tail::after,
      .ant-steps-item-icon {
        background-color: @color-petrol50 !important;
      }

      .ant-steps-item-title {
        color: @color-petrol50 !important;
      }
    }

    .ant-steps-item-error {
      .ant-steps-item-icon {
        background-color: red !important;
      }
    }

    .ant-steps-item {
      .ant-steps-item-container {
        .ant-steps-item-tail {
          &::after {
            background-color: rgba(255, 255, 255, 0.4);
          }
        }

        .ant-steps-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background-color: rgba(255, 255, 255, 0.4);

          .ant-steps-icon {
            display: flex;
            top: 0;
            font-size: 13px;
            line-height: 19.5px;
            letter-spacing: 0.5px;
            font-weight: 600;
            color: @color-blue700;
          }
        }

        .ant-steps-item-title {
          width: 100%;
          color: rgba(255, 255, 255, 0.4);
        }
      }
    }
  }
}
</style>
