<template>
  <div class="staking container">
    <BaseDetailModal
      :show="baseModalShow"
      :estimatedapy="estimatedAPY"
      @onCancel="() => (baseModalShow = false)"
      @onSelect="onBaseDetailSelect"
    />

    <StakeModal
      :show="stakeModalShow"
      :enddatemin="endDateOfLock"
      :crpbalance="crpbalance"
      :userStaked="userStaked"
      :estimatedapy="estimatedAPY"
      @onCancel="closeModal"
    />

    <div class="card">
      <div class="card-body">
        <div class="staking-container">
          <div class="staking-head fcsb-container">
            <h3 class="title weight-bold">Staking</h3>
            <div class="information">
              <div class="tvl-info">
                <p class="font-large weight-semi">TVL : ${{ TVL.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}</p>
              </div>

              <div class="action-btn-group">
                <div class="reload-btn icon-cursor" :class="activeSpinning ? 'active' : ''" @click="reloadTimer">
                  <img class="reload-icon" src="@/assets/icons/reload.svg" />
                </div>
              </div>
            </div>
          </div>

          <div class="staking-content fcsb-container">
            <div class="staking-tiers">
              <Carousel
                ref="tierCarousel"
                autoPlay
                :before-change="getCurrentTier"
                :slidesToShow="3"
                :centerMode="true"
                :centerPadding="'0'"
                :slidesToScroll="1"
                arrows
              >
                <div slot="prevArrow" class="custom-slick-arrow prev-arrow">
                  <Icon type="left" />
                </div>
                <div slot="nextArrow" class="custom-slick-arrow next-arrow">
                  <Icon type="right" />
                </div>

                <div v-for="(tier, index) in tiers" :key="index">
                  <div :class="[index + 1 == selectedTier ? 'activeSlide' : 'slide']">
                    <div class="slideWrapper">
                      <div :class="[`staking-tiers-item staking-tiers-item-${index + 1}`]">
                        <div class="staking-tier-preview fcc-container">
                          <div class="tier-text">
                            <span class="font-large"></span>
                            <br />
                            <span class="font-large weight-bold text-upper"></span>
                          </div>
                        </div>
                        <div class="Nomad-container">
                          <label class="font-large weight-bold">{{ tier.name }}</label>
                          <!-- <div class="btn-container">
                      <a
                        class="btn-primary font-medium weight-semi fcc-container"
                        href="#staking-tiers-details"
                        @click="setTierTabs"
                        >About Tiers</a
                      >
                    </div> -->
                        </div>
                        <div class="staking-tier-desc">
                          <label class="font-large weight-bold">{{ tier.price.toLocaleString() }} NNI</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Carousel>
            </div>
            <div class="staking-body">
              <h4 class="weight-bold">NNI Staking</h4>
              <div class="staking-progress">
                <div class="staking-progress-label fcsb-container">
                  <span class="font-xsmall weight-bold">NeoNomad {{ currentTiers }}</span>
                  <span v-if="currentTiers < 3" class="font-xsmall weight-bold">NeoNomad {{ nextTiers }}</span>
                </div>
                <Progress
                  type="line"
                  :stroke-width="14"
                  :percent="Number(pctToNexttiers.toFixed(1))"
                  :show-info="false"
                />
                <div class="staking-progress-info-container">
                  <div
                    v-if="Number(pctToNexttiers.toFixed(1)) > 1"
                    class="staking-progress-end"
                    :style="'margin-left: calc(' + Number(pctToNexttiers.toFixed(1)) + '% - 2px)'"
                  ></div>
                  <label
                    class="staking-progress-percent font-xsmall"
                    :style="'margin-left: calc(' + Number(pctToNexttiers.toFixed(1)) + '% - 2px)'"
                  >
                    {{ userTier }} NNI
                  </label>
                </div>
              </div>

              <div class="staking-infos-group">
                <div class="staking-info fcsb-container">
                  <div class="label font-medium weight-semi spacing-small">
                    Estimated APY
                    <Tooltip placement="bottomLeft">
                      <template slot="title">
                        <div>Potential Annual Percentage Yield based on a daily compounding</div>
                      </template>
                      <img class="tooltip-icon" src="@/assets/icons/info.svg" />
                    </Tooltip>
                  </div>
                  <div class="value font-medium weight-bold">
                    <!-- {{ Math.round(estimatedAPY * 2) / 100 }} % -->
                    30 %
                    <img
                      class="calc-icon icon-cursor"
                      src="@/assets/icons/calculator.svg"
                      @click="
                        () => {
                          this.baseModalShow = true
                        }
                      "
                    />
                  </div>
                </div>

                <div class="staking-info fcsb-container">
                  <div class="label font-medium weight-semi spacing-small">
                    Total Staked
                    <Tooltip placement="bottomLeft">
                      <template slot="title">
                        <div>Total staked NNI token amount</div>
                      </template>
                      <img class="tooltip-icon" src="@/assets/icons/info.svg" />
                    </Tooltip>
                  </div>
                  <div class="value font-medium weight-bold">
                    <!-- {{ totalStaked }} -->
                    Pending
                  </div>
                </div>

                <div class="staking-info fcsb-container">
                  <div class="label font-medium weight-semi spacing-small">
                    Total Value
                    <Tooltip placement="bottomLeft">
                      <template slot="title">
                        <div>Total Value staked (USD)</div>
                      </template>
                      <img class="tooltip-icon" src="@/assets/icons/info.svg" />
                    </Tooltip>
                  </div>

                  <div class="value font-medium weight-bold">
                    <!-- {{ totalStakedPrice }} -->
                    Pending
                  </div>
                </div>
              </div>

              <div class="staking-actions-group">
                <div class="staking-action-item fcsb-container">
                  <div class="reward-pending">
                    <label class="label font-medium">Reward Pending</label>
                    <label class="value font-large weight-bold">{{ pendingRewardDynamic }}</label>
                  </div>
                  <div class="btn-container">
                    <Button
                      class="btn-primary weight-semi spacing-large"
                      :disabled="!wallet.connected || pendingReward == 0"
                      @click="harvestReward"
                      >Harvest</Button
                    >
                  </div>
                </div>

                <div v-if="!wallet.connected" class="btn-container btn-large fcc-container">
                  <Button class="btn-transparent font-large weight-bold" @click="$accessor.wallet.openModal"
                    >Connect Wallet</Button
                  >
                </div>

                <!-- <div v-else>
                  <div v-if="userStaked > 0" class="staking-action-item fcsb-container">
                    <div class="reward-pending">
                      <label class="label font-medium">NNI Staked</label>
                      <label class="value font-large weight-bold">{{ userStaked }}</label>
                    </div>
                    <div class="stake-btn-group fcc-container">
                      <div class="btn-container">
                        <Button
                          class="btn-primary weight-semi spacing-large"
                          :disabled="!wallet.connected || userStaked == 0 || canUnstake == false"
                          @click="unstakeToken"
                          >Unstake</Button
                        >
                      </div>
                      <div class="btn-container">
                        <Button
                          class="btn-transparent weight-semi spacing-large"
                          id="stake"
                          @click="
                            () => {
                              this.stakeModalShow = true
                            }
                          "
                          >Stake</Button
                        >
                        <Button :disabled="true" class="btn-transparent weight-semi spacing-large">Coming Soon</Button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="btn-container btn-large fcc-container">
                    <Button
                      class="btn-transparent font-large weight-bold"
                      id="stake"
                      @click="
                        () => {
                          this.stakeModalShow = true
                        }
                      "
                      >Stake</Button
                    >
                  </div>
                </div> -->
                <div v-else class="btn-container btn-large fcc-container">
                  <Button class="btn-transparent font-large weight-bold" id="stake" :disabled="true"
                    >Coming Soon</Button
                  >
                </div>
              </div>

              <div class="staking-footer">
                <div class="lock-tokens fcsb-container">
                  <label class="label font-small weight-semi spacing-large">
                    {{ endOfLock ? 'End of lock' : 'Lock tokens for' }}
                  </label>
                  <label class="value font-small weight-semi spacing-large">
                    {{ endOfLock ? endOfLock : '0 Day(s)' }}
                  </label>
                </div>
                <div v-if="!endOfLock" class="get-crp fcc-container">
                  <NuxtLink to="/swap/" class="get-crp">
                    <label class="font-medium weight-semi get-nni">Get NNI</label>
                    <img class="union-icon" src="@/assets/icons/union.svg" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- <div class="staking-tiers-details" id="staking-tiers-details">
          <span class="font-large weight-bold">About Tiers</span>
          <div class="staking-tiers-features">
            <Tabs v-model="activeTab">
              <TabPane tab="Tier 1" key="1">
                <Row :gutter="56" class="staking-tier-container fcsb-container">
                  <Col :sm="12" :xs="24" class="staking-tier-tab">
                    <span class="font-medium weight-semi">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                      <br /><br />
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                    </span>
                  </Col>
                  <Col :sm="12" :xs="24" class="staking-tier-preview">
                    <div class="staking-tier-item-box fcc-container">
                      <div class="tier-text">
                        <span class="font-large">Tier 1</span>
                        <br />
                        <span class="font-large weight-bold text-upper">Soon</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Tier 2" key="2">
                <Row :gutter="56" class="staking-tier-container fcsb-container">
                  <Col :sm="12" :xs="24" class="staking-tier-tab">
                    <span class="font-medium weight-semi">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                      <br /><br />
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                    </span>
                  </Col>
                  <Col :sm="12" :xs="24" class="staking-tier-preview">
                    <div class="staking-tier-item-box fcc-container">
                      <div class="tier-text">
                        <span class="font-large">Tier 2</span>
                        <br />
                        <span class="font-large weight-bold text-upper">Soon</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Tier 3" key="3">
                <Row :gutter="56" class="staking-tier-container fcsb-container">
                  <Col :span="12" class="staking-tier-tab">
                    <span class="font-medium weight-semi">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                      <br /><br />
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                    </span>
                  </Col>
                  <Col :span="12" class="staking-tier-preview">
                    <div class="staking-tier-item-box fcc-container">
                      <div class="tier-text">
                        <span class="font-large">Tier 3</span>
                        <br />
                        <span class="font-large weight-bold text-upper">Soon</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Tier 4" key="4">
                <Row :gutter="56" class="staking-tier-container fcsb-container">
                  <Col :span="12" class="staking-tier-tab">
                    <span class="font-medium weight-semi">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                      <br /><br />
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                    </span>
                  </Col>
                  <Col :span="12" class="staking-tier-preview">
                    <div class="staking-tier-item-box fcc-container">
                      <div class="tier-text">
                        <span class="font-large">Tier 4</span>
                        <br />
                        <span class="font-large weight-bold text-upper">Soon</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Tier 5" key="5">
                <Row :gutter="56" class="staking-tier-container fcsb-container">
                  <Col :span="12" class="staking-tier-tab">
                    <span class="font-medium weight-semi">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                      <br /><br />
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                      the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                      type and scrambled it to make a type specimen book.
                    </span>
                  </Col>
                  <Col :span="12" class="staking-tier-preview">
                    <div class="staking-tier-item-box fcc-container">
                      <div class="tier-text">
                        <span class="font-large">Tier 5</span>
                        <br />
                        <span class="font-large weight-bold text-upper">Soon</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </div>
        </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import { Icon, Tooltip, Button, Progress, Tabs, Carousel, Row, Col } from 'ant-design-vue'
import { cloneDeep, get } from 'lodash-es'
import { getTokenBySymbol, TokenInfo, NATIVE_SOL, TOKENS } from '@/utils/tokens'
import { getMultipleAccounts, commitment } from '@/utils/web3'
import { PublicKey } from '@solana/web3.js'
import { getUnixTs } from '@/utils'
import BigNumber from 'bignumber.js'
import { TokenAmount, gt } from '@/utils/safe-math'
import * as anchor from '@project-serum/anchor'
const { BN } = anchor
import moment from 'moment'
const { TabPane } = Tabs
Vue.prototype.moment = moment

import {
  setAnchorProvider,
  createFarmState,
  fundToProgram,
  setExtraReward,
  createExtraReward,
  createPool,
  changePoolAmountMultipler,
  changeTokenPerSecond,
  changePoolPoint,
  getFarmStateAddress,
  getFarmState,
  getExtraRewardConfigs,
  getAllPools,
  getPoolUserAccount,
  estimateRewards,
  estimateRewardsPerSec,
  calculateTiers,
  TIERS_XCRP,
  stake,
  unstake,
  harvest
} from '@/utils/crp-stake'

export default Vue.extend({
  components: {
    Button,
    Tooltip,
    Progress,
    Carousel,
    // Row,
    // Col,
    Icon
    // Tabs,
    // TabPane
  },
  data() {
    return {
      isStateCreated: false as boolean,
      isPoolCreated: false as boolean,
      isExtraRewardCreated: false as boolean,
      isOwner: false as boolean,

      baseModalShow: false as boolean,
      stakeModalShow: false as boolean,
      estimatedAPY: 0 as number,
      lockDuration: 0 as number,
      crpbalance: 0 as any,
      endDateOfLock: 0 as any,
      running: 0 as any,

      totalStaked: '0' as string,
      userStaked: 0 as number,
      userStakedUnformated: 0 as number,
      pendingReward: '0' as string,
      pendingRewardDynamic: 0 as number,
      counterdyn: null as any,
      totalStakedPrice: '0' as string,
      TVL: 0 as number,
      timer: null as any,
      autoRefreshTime: 60 as number,
      countdown: 0 as number,
      activeSpinning: false as boolean,
      endOfLock: '' as string,
      canUnstake: false as boolean,

      pctToNexttiers: 0 as number,
      userTier: 0 as number,
      currentTiers: 0 as number,
      nextTiers: 1 as number,
      selectedTier: 0 as number,
      activeTab: '1' as string,
      tiers: [
        { name: 'The Gypsy', price: 200 },
        { name: 'The Wanderer', price: 2000 },
        { name: 'The Traveler', price: 10000 },
        { name: 'The Nomad', price: 20000 }
      ]
    }
  },
  head: {
    title: 'NeoNomad Finance - Staking'
  },
  computed: {
    ...mapState(['wallet', 'swap', 'liquidity', 'url', 'setting', 'price', 'token'])
  },
  watch: {
    'wallet.tokenAccounts': {
      handler(newTokenAccounts: any) {
        if (this.$wallet?.connected) {
          this.getUserState()
          this.getGlobalState()
        }
      },
      deep: true
    },
    'wallet.connected': {
      handler(connected: any) {
        this.getUserState()
        if (connected) {
          getFarmState().then((result) => {
            if (result) {
              this.isOwner = result.authority.toBase58() == this.$wallet?.publicKey?.toBase58()
            }
          })
        }
      },
      deep: true
    },
    'token.initialized': {
      handler(newState: boolean) {
        this.getGlobalState()
        this.getUserState()
      },
      deep: true
    }
  },
  mounted() {
    this.getTvl()
    setAnchorProvider(this.$web3, this.$wallet)
    this.getGlobalState()
    this.getUserState()

    if (this.currentTiers > 1) {
      this.setTierCarousel(this.currentTiers - 1)
      this.selectedTier = this.currentTiers
      this.activeTab = this.currentTiers.toString()
    } else {
      this.setTierCarousel(0)
      this.selectedTier = 1
      this.activeTab = '1'
    }
    if (this.currentTiers === 2) this.pctToNexttiers = 100
    this.setTimer()
  },
  methods: {
    onCarouselChange(a: any, b: any) {
      console.log(a, b)
    },
    async getTvl() {
      let cur_date = new Date().getTime()
      if (window.localStorage.TVL_last_updated) {
        const last_updated = parseInt(window.localStorage.TVL_last_updated)
        if (cur_date - last_updated <= 600000) {
          this.TVL = window.localStorage.TVL
          return
        }
      }

      let responseData: any = []
      let tvl = 0
      this.TVL = Math.round(tvl)

      window.localStorage.TVL_last_updated = new Date().getTime()
      window.localStorage.TVL = this.TVL
    },

    closeModal() {
      this.stakeModalShow = false
      this.getGlobalState()
      this.getUserState()
    },
    async createGlobalState() {
      const tokenPerSecond = 100
      const rewardMint = TOKENS['NNI'].mintAddress
      createFarmState(this.$web3, this.$wallet, tokenPerSecond, rewardMint).then((result) => {
        this.getGlobalState()
      })
    },
    async createExtraRewardPool() {
      createExtraReward(this.$web3, this.$wallet).then((result) => {
        this.getUserState()
      })
    },
    async createStakingPool() {
      const rewardMint = TOKENS['NNI'].mintAddress
      createPool(this.$web3, this.$wallet, rewardMint, []).then((result) => {
        this.getGlobalState()
      })
    },
    async getGlobalState() {
      if (!this.$accessor.token.initialized) return

      const pools = await getAllPools()
      console.log('pools', pools)

      if (pools.length > 0) {
        this.isPoolCreated = true
      } else {
        this.isPoolCreated = false
      }

      const current_pool = pools[0]

      const farm_state = await getFarmState()
      if (farm_state) {
        this.isStateCreated = true
      } else {
        this.isStateCreated = false
      }

      const stakedAmount = new TokenAmount(current_pool.account.amount, TOKENS['NNI'].decimals)

      if (this.price.prices['NNI']) {
        this.totalStakedPrice =
          '$' +
          (Math.round(parseFloat(stakedAmount.fixed()) * this.price.prices['NNI'] * 1000) / 1000)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      } else {
        this.totalStakedPrice = '$ ' + parseFloat(stakedAmount.fixed())
      }

      this.totalStaked =
        'NNI ' +
        (Math.round(parseFloat(stakedAmount.fixed()) * 1000) / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

      // const apr = Number(farm_state.tokenPerSecond.muln(YEAR2SECOND).div(current_pool.account.amount).toString());
      // this.estimatedAPY = Number((((1 + (apr / 100)/ 365)) ** 365 - 1) * 100);

      const apr =
        (Number(new TokenAmount(farm_state.tokenPerSecond, TOKENS['NNI'].decimals).fixed()) * 365 * 24 * 3600) /
        Number(new TokenAmount(current_pool.account.amount, TOKENS['NNI'].decimals).fixed())
      console.log('farm_state.tokenPerSecond', farm_state.tokenPerSecond.toNumber())
      console.log('current_pool.account.amount', current_pool.account.amount.toNumber())
      this.estimatedAPY =
        (Number(new TokenAmount(farm_state.tokenPerSecond, TOKENS['NNI'].decimals).fixed()) * 365 * 24 * 3600) /
        Number(new TokenAmount(current_pool.account.amount, TOKENS['NNI'].decimals).fixed())
      console.log('this.estimatedAPY', this.estimatedAPY)
      this.estimatedAPY = Number(((1 + this.estimatedAPY / 365) ** 365 - 1) * 100)
      console.log('this.estimatedAPY', this.estimatedAPY)
      if (this.estimatedAPY === Infinity) {
        this.estimatedAPY = 100
      }
    },

    async getUserState() {
      if (!this.$accessor.token.initialized || !this.$wallet?.connected) {
        return
      }
      let crpbalanceDatas = this.wallet.tokenAccounts[TOKENS['NNI'].mintAddress]

      if (crpbalanceDatas) {
        this.crpbalance = crpbalanceDatas.balance.fixed() * 1
      }

      const farm_state = await getFarmState()
      const extraRewardConfigs = await getExtraRewardConfigs()
      if (extraRewardConfigs) {
        this.isExtraRewardCreated = true
      } else {
        this.isExtraRewardCreated = false
      }
      const pools = await getAllPools()
      const current_pool = pools[0]
      const userAccount = await getPoolUserAccount(this.$wallet, current_pool.publicKey)
      console.log('userAccount', userAccount)
      if (!userAccount) {
        return
      }
      const endDateOfLock = userAccount.lastStakeTime.toNumber() + userAccount.lockDuration.toNumber()
      const unlockDateString = moment(new Date(endDateOfLock * 1000)).format('MM/DD/YYYY HH:mm:SS')
      this.endDateOfLock = endDateOfLock
      this.endOfLock = unlockDateString
      this.canUnstake = !(
        (userAccount.lastStakeTime.toNumber() + userAccount.lockDuration.toNumber()) * 1000 >
        new Date().getTime()
      )

      //@ts-ignore
      this.userStaked =
        Math.ceil(parseFloat(new TokenAmount(userAccount.amount, TOKENS['NNI'].decimals).fixed()) * 1000) / 1000
      this.userStakedUnformated = Number(new TokenAmount(userAccount.amount, TOKENS['NNI'].decimals).fixed())

      const rewardAmount = estimateRewards(farm_state, extraRewardConfigs, current_pool.account, userAccount)
      console.log('rewardAmount', rewardAmount)
      const rewardsPerSec = estimateRewardsPerSec(farm_state, extraRewardConfigs, current_pool.account, userAccount)
      const tiers_info = calculateTiers(this.userStaked, userAccount.lockDuration.toNumber())
      this.$accessor.wallet.setStakingTiers(tiers_info)
      this.pendingReward = new TokenAmount(rewardAmount, TOKENS['NNI'].decimals).fixed()
      this.pendingRewardDynamic = (new TokenAmount(rewardAmount, TOKENS['NNI'].decimals).fixed() as unknown) as number

      if (this.running != 1) this.dynamicRebase(rewardsPerSec, this.pendingRewardDynamic)

      this.running = 1

      this.currentTiers = tiers_info.tiers
      this.nextTiers = tiers_info.tiers + 1

      if (this.nextTiers == TIERS_XCRP.length) {
        this.nextTiers--
        this.currentTiers--
        this.pctToNexttiers = 100
        this.userTier = TIERS_XCRP[this.nextTiers]
      } else {
        this.userTier = tiers_info.xCRP
        this.pctToNexttiers =
          ((tiers_info.xCRP - TIERS_XCRP[this.currentTiers]) /
            (TIERS_XCRP[this.nextTiers] - TIERS_XCRP[this.currentTiers])) *
          100
      }

      if (this.currentTiers === 5) this.pctToNexttiers = 100

      if (this.currentTiers > 1) {
        this.setTierCarousel(this.currentTiers - 1)
        this.selectedTier = this.currentTiers
        this.activeTab = this.currentTiers.toString()
      } else {
        this.setTierCarousel(0)
        this.selectedTier = 1
        this.activeTab = '1'
      }
    },

    dynamicRebase(rewardsPerSec: any, pendingRewardDynamic: any) {
      return false
      const nreward = this.pendingRewardDynamic * 1 + rewardsPerSec / 100
      this.pendingRewardDynamic = Math.round(nreward * 1000000000) / 1000000000
      setTimeout(() => {
        this.dynamicRebase(rewardsPerSec, nreward)
      }, 10)
    },

    onBaseDetailSelect(lock_duration: number, estimated_apy: number) {
      this.baseModalShow = false
      this.estimatedAPY = estimated_apy
      this.lockDuration = lock_duration
    },

    async unstakeToken() {
      const pools = await getAllPools()
      const current_pool = pools[0]
      const poolSigner = current_pool.publicKey.toString()
      const rewardMint = current_pool.account.mint.toString()
      const rewardPoolVault = current_pool.account.vault.toString()

      const key = getUnixTs().toString()
      this.$notify.info({
        key,
        message: 'Making transaction...',
        description: '',
        duration: 0
      })

      unstake(
        this.$web3,
        this.$wallet,
        poolSigner,
        rewardMint,
        rewardPoolVault,

        get(this.wallet.tokenAccounts, `${rewardMint}.tokenAccountAddress`),
        this.userStakedUnformated * Math.pow(10, TOKENS['NNI'].decimals)
      )
        .then((txid) => {
          this.$notify.info({
            key,
            message: 'Transaction has been sent',
            description: (h: any) =>
              h('div', [
                'Confirmation is in progress.  Check your transaction on ',
                h(
                  'a',
                  {
                    attrs: { href: `${this.url.explorer}/tx/${txid}`, target: '_blank' }
                  },
                  'here'
                )
              ])
          })

          const description = 'Unstaking NNI'

          this.$accessor.transaction.sub({ txid, description })
        })
        .catch((error) => {
          this.$notify.error({
            key,
            message: 'Unstaking failed',
            description: error.message
          })
        })
        .finally(() => {
          this.$accessor.wallet.getTokenAccounts()
        })
    },
    async getUserAccount() {
      const pools = await getAllPools()
      const current_pool = pools[0]
      const userAccount = await getPoolUserAccount(this.$wallet, current_pool.publicKey)
      console.log(userAccount)
    },
    async harvestReward() {
      const programState = await getFarmState()

      const pools = await getAllPools()
      const current_pool = pools[0]
      const poolSigner = current_pool.publicKey.toString()
      const rewardMint = current_pool.account.mint.toString()
      const rewardPoolVault = current_pool.account.vault.toString()

      const key = getUnixTs().toString()
      this.$notify.info({
        key,
        message: 'Making transaction...',
        description: '',
        duration: 0
      })

      harvest(
        this.$web3,
        this.$wallet,

        poolSigner,
        rewardMint,
        get(this.wallet.tokenAccounts, `${rewardMint}.tokenAccountAddress`),
        programState.rewardVault
      )
        .then((txid) => {
          this.$notify.info({
            key,
            message: 'Transaction has been sent',
            description: (h: any) =>
              h('div', [
                'Confirmation is in progress.  Check your transaction on ',
                h(
                  'a',
                  {
                    attrs: { href: `${this.url.explorer}/tx/${txid}`, target: '_blank' }
                  },
                  'here'
                )
              ])
          })

          const description = 'Harvesting NNI'

          this.$accessor.transaction.sub({ txid, description })
        })
        .catch((error) => {
          this.$notify.error({
            key,
            message: 'Harvest failed',
            description: error.message
          })
        })
        .finally(() => {
          this.$accessor.wallet.getTokenAccounts()
        })
    },
    setTimer() {
      this.timer = setInterval(async () => {
        if (this.countdown < this.autoRefreshTime) {
          this.countdown += 1
          if (this.countdown === this.autoRefreshTime) {
            await this.flush()
          }
        }
      }, 1000)
    },
    async flush() {
      this.countdown = 0
      this.getGlobalState()
      if (this.$wallet?.connected) {
        this.getUserState()
      }
    },
    reloadTimer() {
      this.activeSpinning = true
      setTimeout(() => {
        this.activeSpinning = false
      }, 1000)
      this.flush()
      this.$accessor.wallet.getTokenAccounts()
    },
    getCurrentTier(from: any, to: any) {
      this.selectedTier = to + 1
    },
    setTierCarousel(idx: number) {
      ;(this.$refs.tierCarousel as Vue & { goTo: (idx: number) => number }).goTo(idx)
    },
    setTierTabs() {
      this.activeTab = this.selectedTier.toString()
    }
  }
})
</script>

<style lang="less" scoped>
.staking {
  // global styles

  .btn-container {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    padding: 3px;
    width: 85px;
    height: auto;

    &.btn-large {
      width: 100%;
      height: 50px;
    }
  }

  .btn-transparent {
    background: transparent;
    padding: 4.5px 0;
    border-radius: 8px;
    border: none;
    width: 100%;
    height: auto;
  }

  .btn-primary {
    background: #2b336700;
    padding: 4.5px 0;
    border-radius: 48px;
    border: none;
    width: 100%;
    height: auto;
    color: #fff;

    &:disabled {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  // class styles
  // .staking-container {
  //   background: linear-gradient(#ac72d6e1, #4b55e7c2);
  //   border-radius: 18px;
  //   box-shadow: 0 0 5px #2e1664;
  //   padding: 20px 35px;
  //   margin-top: 20px;

  //   @media @max-sl-mobile {
  //     padding: 15px;
  //   }
  // }

  &.container {
    margin-top: 38px;

    @media @max-sl-mobile {
      margin-top: 28px;
    }

    .card {
      .card-body {
        padding: 0;

        .staking-head {
          @media @max-sl-mobile {
            display: block !important;
          }

          .title {
            text-align: center;
            position: relative;
            float: left;

            @media @max-sl-mobile {
              margin-bottom: 18px !important;
            }
          }

          .information {
            display: flex;
            align-items: center;
            justify-content: space-between;

            @media @max-sl-mobile {
              width: 100%;
            }

            .tvl-info {
              margin-right: 18px;
            }

            .action-btn-group {
              display: flex;
              align-items: center;

              .reload-btn {
                background: linear-gradient(rgba(75, 85, 231, 0.65098), rgba(182, 97, 150, 0.74902));
                border-radius: 8px;
                padding: 6px;
                margin-right: 18px;
                display: flex;
                align-items: center;
                justify-content: center;

                @media @max-lg-tablet {
                  margin-left: 4px;
                }

                .reload-icon {
                  width: 18px;
                  height: 18px;
                }

                &.active .reload-icon {
                  transform: rotate(360deg);
                  transition: all 1s ease-in-out;
                }
              }
            }
          }
        }

        .staking-content {
          max-width: 970px;
          width: 100%;
          margin: 20px auto !important;
          border-radius: 18px;
          padding: 30px 0;
          align-items: center !important;

          @media @max-sl-mobile {
            padding: 0;
            display: inline-block !important;
            max-width: unset;
          }

          .staking-tiers {
            max-width: 450px;
            height: 450px;
            margin: 0 28px 0 0;
            width: 100%;

            @media @max-md-tablet {
              max-width: 450px;
              margin: 0 auto 28px;
            }

            @media @max-sm-mobile {
              max-width: 290px;
              height: 350px;
            }

            .staking-tier-item {
              padding: 0 4px;

              .staking-tier-preview {
                height: 277px;
                margin-bottom: 28px;
              }

              .btn-container {
                width: 120px;

                .btn-primary {
                  background: @color-blue800;
                }
              }
            }
          }

          .staking-body {
            width: calc(100% - 450px);
            padding: 25px;
            position: relative;
            z-index: 0;
            border-radius: 18px;
            box-shadow: inset 0 0 28px #2d0b50e1;
            background: rgba(129, 116, 245, 0.5);

            @media @max-md-tablet {
              width: calc(100% - 348px);
            }

            @media @max-sl-mobile {
              width: 100%;
              padding: 15px;
            }

            .staking-progress {
              margin-top: 28px;

              .staking-progress-label {
                margin-bottom: 4px;
              }

              .staking-progress-info-container {
                position: relative;
                padding: 0 4px;

                .staking-progress-end {
                  width: 2px;
                  height: 14px;
                  background: @color-petrol500;
                  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.55);
                  margin: -20px 0 4px 0;
                }
              }
            }

            .staking-infos-group {
              margin-top: 28px;

              .staking-info {
                margin-bottom: 8px;

                &:last-child {
                  margin-bottom: 0;
                }

                .label {
                  color: @color-gray;
                  display: flex;
                  align-items: center;

                  .tooltip-icon {
                    width: 12px;
                    height: 12px;
                    margin-left: 4px;
                  }
                }

                .value {
                  display: flex;
                  align-items: center;
                  text-align: right;
                  color: #fff;

                  .calc-icon {
                    margin-left: 8px;
                  }
                }
              }
            }

            .staking-actions-group {
              margin: 18px 0;

              .staking-action-item {
                background: rgba(226, 227, 236, 0.1);
                border-radius: 18px;
                padding: 16px;
                margin-bottom: 18px;

                &:last-child {
                  margin-bottom: 0;
                }

                .label {
                  color: @color-gray;
                }

                .value {
                  font-weight: bold;
                  font-size: 20px;
                  line-height: 25px;
                  color: #fff;
                  display: block;
                }

                .stake-btn-group {
                  .btn-container {
                    margin-right: 8px;

                    &:last-child {
                      margin-right: 0;
                    }
                  }
                }
              }
            }

            .staking-footer {
              .lock-tokens {
                .label {
                  color: @color-gray;
                }
              }

              .get-crp {
                margin-top: 18px;

                .get-nni {
                  color: #fff;
                }

                .union-icon {
                  margin-left: 8px;
                }
              }
            }
          }
        }

        .staking-tiers-details {
          max-width: 870px;
          min-width: 335px;
          width: 100%;
          margin: 30px auto !important;
          background: @color-blue700;
          border: 3px solid @color-blue500;
          padding: 18px;
          border-radius: 18px;

          .staking-tiers-features {
            margin: 18px 0;

            .staking-tier-container {
              margin: 0 !important;

              @media @max-sl-mobile {
                display: inline-block !important;
              }

              .staking-tier-tab {
                padding-left: 0 !important;

                @media @max-sl-mobile {
                  padding-right: 0 !important;
                  width: 100%;
                }
              }

              .staking-tier-preview {
                padding-right: 0 !important;

                @media @max-sl-mobile {
                  margin-top: 28px;
                  width: 100%;
                  padding-left: 0 !important;
                }

                .staking-tier-item-box {
                  background: url('@/assets/background/tier-blur.png');
                  background-size: cover;
                  border-radius: 18px;
                  border: 5px solid @color-blue-dark;
                  width: 100%;
                  height: 300px;
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
.staking {
  // ant carousel
  .ant-carousel {
    .custom-slick-arrow {
      top: 50%;
      width: 25px;
      height: 25px;
      font-size: 25px;
      color: #fff;
      background-color: rgba(31, 45, 61, 0.11);
      opacity: 0.3;

      &.prev-arrow {
        left: 10px;
        z-index: 1;
      }

      &.next-arrow {
        right: 10px;
      }

      &::before {
        display: none;
      }

      &:hover {
        opacity: 0.5;
      }
    }

    .slick-dots {
      position: relative;
      margin-top: -40px;
      bottom: 0;
      height: auto;

      li {
        margin-left: 0;
        margin-right: 18px;
        width: 24px;
        height: 24px;
        padding: 3px;
        background: transparent;
        border-radius: 50%;

        &:last-child {
          margin-right: 0;
        }

        button {
          width: 18px !important;
          height: 18px !important;
          padding: 4px;
          border: 4px solid @color-blue800;
          border-radius: 50%;
          background: @color-petrol400;
          opacity: 0.4;
        }

        &.slick-active {
          background: #fff0;

          button {
            background: #fff;
            opacity: 1;
          }
        }
      }
    }
  }

  // ant progress
  .ant-progress {
    width: 100%;
  }

  // ant tabs
  .ant-tabs-bar {
    border-bottom: 0;
    margin: 0 0 28px 0;

    .ant-tabs-nav {
      .ant-tabs-tab {
        margin: 0 18px 0 0;
        font-weight: 600;
        font-size: 20px;
        line-height: 30px;
        color: #eae8f1;
      }

      .ant-tabs-tab-active {
        color: @color-petrol500;
      }

      .ant-tabs-ink-bar {
        position: relative;
        margin-top: 8px;
        width: 50px !important;
        height: 4px;
        background: @color-petrol400;
        border-radius: 10px;
      }
    }
  }
}
</style>

<style lang="less">
.Nomad-container {
  height: 1px;
  display: flex !important;
  align-items: center;
  justify-content: space-between;
}
</style>

<style lang="less">
.staking-tiers-item-1 {
  background: url('@/assets/background/The_Gypsy.jpg');
}
.staking-tiers-item-2 {
  background: url('@/assets/background/The_Wanderer.jpg');
}
.staking-tiers-item-3 {
  background: url('@/assets/background/The_Traveller.jpg');
}
.staking-tiers-item-4 {
  background: url('@/assets/background/Mystery.png');
}
.staking-tiers-item {
  height: 450px;
  margin: auto;
  width: 100%;
  background-size: cover;
  padding: 24px !important;
  position: relative;
  z-index: 0;
  border-radius: 18px;

  @media @max-sl-mobile {
    height: 350px;
  }

  &::after {
    content: '';
  }

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: @gradient-color-icon;
    padding: 2px;
    border-radius: 18px;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  @media @max-md-tablet {
    max-width: 320px;
  }

  @media @max-sm-mobile {
    max-width: 290px;
  }

  .staking-tier-item {
    padding: 0 4px;

    .staking-tier-preview {
      height: 277px;
      margin-bottom: 28px;
    }

    .btn-container {
      width: 120px;

      .btn-primary {
        background: @color-blue800;
      }
    }
  }
}

.staking-tier-desc {
  position: absolute;
  bottom: 45px;
  width: 100%;
  text-align: center;
  left: 0;
}

.slideWrapper {
  display: flex;
  justify-content: center;
}

.slide {
  transform: scale(1, 0.8);
  opacity: 0.8;
  transition: 0.5s ease-in-out;
}

.activeSlide {
  transition: transform 0.5s;
  position: relative;
  z-index: 1000;
  width: 200% !important;
  transform: translateX(-25%);
  height: 220% !important;
}
</style>
