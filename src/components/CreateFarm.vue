<template>
  <Modal
    title="Design your own farm"
    :visible="true"
    :footer="null"
    :closable="false"
    :mask-closable="true"
    class="create-farm-modal"
    @cancel="$emit('onCancel')"
    centered
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />

    <!-- <div class="create-farm-head fcsb-container">
      <div class="btn-outline">
        <a
          href="https://docs.cropper.finance/cropperfinance/cropperfinance-platform-1/builder-tutorial/create-a-permissionless-farm"
          target="_blank"
        >
          <Button class="link-btn font-small weight-semi">Detailed guide</Button>
        </a>
      </div>
      <div class="btn-outline">
        <a href="https://t.me/CropperFinance" target="_blank">
          <Button class="link-btn font-small weight-semi">Get support </Button>
        </a>
      </div>
    </div> -->

    <div class="create-farm">
      <CoinSelect
        v-if="coinSelectShow && wallet.connected"
        :farmTokenASelect="selectTokenA"
        :farmTokenBSelect="selectTokenB"
        :allowedAllFarm="$wallet.publicKey.toBase58() === allowedFarmCreator"
        @onClose="() => ((coinSelectShow = false), (selectTokenB = false), (selectTokenA = false))"
        @onSelect="onCoinSelect"
      />

      <AmmIdSelect
        :show="ammIdSelectShow"
        :liquidity-list="ammIdSelectList"
        :userClose="false"
        @onClose="() => (ammIdSelectShow = false)"
        @onSelect="onAmmIdSelect"
      />

      <div class="design-farm">
        <Row>
          <Col :span="9" class="step" :class="{ 'bordered-right': !wallet.connected }">
            <Steps :current="current" size="small" direction="vertical" style="width: auto" :status="stepsStatus">
              <Step
                ><template slot="title">
                  <div style="color: #23adb4">Select options</div>
                </template></Step
              >
              <Step>
                <template slot="title">
                  <div v-if="current > 1 || (current === 1 && stepsStatus !== 'error')">Farm Initialization</div>
                  <div v-else-if="current === 1 && stepsStatus === 'error'" style="color: red">Farm Initialization</div>
                  <div v-else>Farm Initialization</div>
                </template></Step
              >
              <Step>
                <template slot="title">
                  <div v-if="current > 2 || (current === 2 && stepsStatus !== 'error')">Farm Created</div>
                  <div v-else-if="current === 2 && stepsStatus === 'error'" style="color: red">Farm Created</div>
                  <div v-else>Farm Created</div>
                </template></Step
              >
            </Steps>
          </Col>

          <Col :span="15" class="notstep" :class="{ 'bordered-left': wallet.connected }">
            <Row v-if="current === 0 && !wallet.connected">
              <Col :span="24" class="step-item">
                <div v-if="!wallet.connected" class="btn-container">
                  <Button class="btn-transparent font-medium weight-semi" @click="$accessor.wallet.openModal">
                    Connect wallet
                  </Button>
                </div>
              </Col>
            </Row>

            <Row v-if="current === 0 && wallet.connected">
              <Col :span="24" class="step-item">
                <label class="font-large weight-bold">Farm Type:</label>
                <div class="step-item-content">
                  <RadioGroup v-model="farmType" @change="selectFarm">
                    <Radio :value="1">Single yield farm</Radio>
                    <!-- <Radio :value="2" disabled>Dual yield farm (Soon)</Radio> -->
                  </RadioGroup>
                </div>
              </Col>
              <Col :span="24" class="step-item">
                <label class="font-large weight-bold">Token pairing and AMM ID:</label>
                <div class="step-item-content">
                  <RadioGroup v-model="ammType" @change="selectAMM">
                    <Radio :value="1">Use existing NeoNomad's AMM ID</Radio>
                    <div class="existing-amm fs-container">
                      <CoinNameInput
                        :label="'Token A'"
                        :mint-address="tokenA ? tokenA.mintAddress : ''"
                        :coin-name="tokenA ? tokenA.symbol : ''"
                        @onSelect="openTokenASelect"
                        :disabled="ammType != 1 ? true : false"
                      />
                      <CoinNameInput
                        :label="'Token B'"
                        :mint-address="tokenB ? tokenB.mintAddress : ''"
                        :coin-name="tokenB ? tokenB.symbol : ''"
                        @onSelect="openTokenBSelect"
                        :disabled="ammType != 1 ? true : false"
                      />
                    </div>
                    <div class="selected-pool" v-if="showSelectedPool && ammType === 1">
                      <label class="font-xsmall weight-bold">Selected Pool</label>
                      <div class="selected-pool-box">
                        <div class="pool-info font-medium">
                          <span><b>AMM ID: </b>{{ userCreateAmmId }}</span>
                        </div>
                        <div v-if="userCreatePoolLiquidity" class="pool-info font-medium">
                          <span><b>Pool Liquidity: </b>{{ userCreatePoolLiquidity }}</span>
                        </div>
                        <img class="close-icon icon-cursor" src="@/assets/icons/close.svg" @click="removeSelected" />
                      </div>
                    </div>
                    <Radio :value="2">Create a new AMM ID</Radio>
                    <div class="create-amm" v-if="ammType != 1">
                      <!-- <NuxtLink to="/pools/create-pool" class="link-pool font-small">
                        https://cropper.finance/pools/create-pool/
                      </NuxtLink> -->
                      <div class="note-reminder font-medium">
                        <em><u>Note:</u> Only USDC, USDT, SOL and CRP pairs will be eligible to farm creation.</em>
                      </div>
                    </div>
                  </RadioGroup>
                  <!-- <div class="info-guide font-small" v-if="ammType === 1">
                    <img src="@/assets/icons/info.svg" />
                    <em>
                      This tool is for advanced users. Before attempting to create a new farm, we suggest going through
                      this
                      <a
                        href="https://docs.cropper.finance/cropperfinance/cropperfinance-platform-1/builder-tutorial/create-a-permissionless-farm"
                        target="_blank"
                      >
                        <u>detailed guide.</u></a
                      ></em
                    >
                  </div> -->
                </div>
              </Col>
              <Col v-if="ammType === 1" :span="24" class="step-item">
                <div class="btn-container">
                  <Button
                    class="btn-transparent font-medium weight-semi"
                    :disabled="!wallet.connected"
                    @click="useExistingAMMID()"
                  >
                    Next
                  </Button>
                </div>
              </Col>
              <Col v-if="ammType === 2" :span="24" class="step-item">
                <div class="btn-container">
                  <Button class="btn-transparent font-medium weight-semi" :disabled="true" @click="createNewAMMID()">
                    Next
                  </Button>
                </div>
              </Col>
            </Row>

            <!-- Create Farm -->
            <Row v-if="current === 1">
              <Col :span="24" class="step-item">
                <label class="font-large weight-bold">Reward emission:</label>
                <div class="step-item-content">
                  <CoinInput
                    v-model="fromCoinAmount"
                    label="Initial Reward Token Amount"
                    :balance-offset="rewardCoin && rewardCoin.symbol === 'SOL' ? -0.05 : 0"
                    :mint-address="rewardCoin ? rewardCoin.mintAddress : ''"
                    :coin-name="rewardCoin ? rewardCoin.symbol : ''"
                    :balance="rewardCoin ? rewardCoin.balance : null"
                    :show-half="true"
                    :show-arrow="false"
                    @onInput="(amount) => (fromCoinAmount = amount)"
                    @onFocus="
                      () => {
                        fixedFromCoin = true
                      }
                    "
                    @onMax="
                      () => {
                        fixedFromCoin = true
                        fromCoinAmount = rewardCoin && rewardCoin.balance ? rewardCoin.balance.fixed() : '0'
                      }
                    "
                  />

                  <div class="note">
                    <span class="font-xsmall weight-bold">
                      Note: you will be able to add rewards into your farm whenever you want.
                      <br />
                    </span>
                    <div class="note-highlight fb-container">
                      <img class="info-icon" src="@/assets/icons/info.svg" />
                      <span class="note-highlight-content font-xsmall weight-bold">
                        Please note that all rewards provided are final and unused rewards cannot be recovered upon
                        completion of the farm.
                      </span>
                    </div>
                  </div>
                </div>
              </Col>
              <Col :span="24" class="step-item">
                <label class="font-large weight-bold">Farm duration:</label>
                <div class="step-item-content">
                  <div class="calendar-from">
                    <img src="@/assets/icons/calendar-from.svg" />
                    <DatePicker
                      v-model="startTime"
                      format="DD MMMM YYYY"
                      @openChange="handleStartOpenChange"
                      disabled
                    />
                  </div>
                  <div class="calendar-to">
                    <img src="@/assets/icons/calendar-to.svg" />
                    <DatePicker v-model="endTime" format="DD MMMM YYYY" @openChange="handleEndOpenChange" />
                    <img src="@/assets/icons/arrow-down.svg" :style="endOpen ? 'transform: rotate(180deg);' : ''" />
                  </div>
                  <!-- <div>
                    <b>Reward per week:</b>&nbsp; {{ rewardPerWeek }} &nbsp;{{
                      rewardCoin != null ? rewardCoin.symbol : ''
                    }}
                  </div>
                  <div><b>AMM ID:</b>&nbsp;{{ userCreateAmmId }}</div> -->
                </div>
              </Col>

              <Col :span="24">
                <div class="btn-container">
                  <Button
                    v-if="!wallet.connected"
                    class="btn-transparent font-medium weight-semi"
                    @click="$accessor.wallet.openModal"
                  >
                    Connect wallet
                  </Button>
                  <Button
                    v-else-if="farm_created"
                    class="btn-transparent font-medium weight-semi"
                    :disabled="!wallet.connected"
                    @click="addRewardToFarm"
                  >
                    <span v-if="activeSpin"> Please wait &nbsp; &nbsp; </span>
                    <span v-else> Add rewards </span>

                    <div v-if="activeSpin" class="spinner-container">
                      <Spin :spinning="true">
                        <Icon slot="indicator" type="loading" style="font-size: 24px" spin />
                      </Spin>
                    </div>
                  </Button>

                  <Button
                    v-else
                    class="btn-transparent font-medium weight-semi"
                    :disabled="!wallet.connected"
                    @click="confirmFarmInfo"
                  >
                    <span v-if="activeSpin"> Please wait &nbsp; &nbsp; </span>
                    <span v-else> Next </span>
                    <div v-if="activeSpin" class="spinner-container">
                      <Spin :spinning="true">
                        <Icon slot="indicator" type="loading" style="font-size: 24px" spin />
                      </Spin>
                    </div>
                  </Button>
                </div>
              </Col>
            </Row>

            <!-- Farm Created -->
            <Row v-if="current === 2">
              <Col :span="24" class="step-item">
                <div v-if="!isCRPTokenPair" class="farm-created">
                  <label class="font-large weight-bold"
                    >Congratulations! Your farm has been successfully created!</label
                  >
                </div>
                <div class="lp-icons">
                  <div class="lp-icons-group">
                    <div class="icons">
                      <CoinIcon :mint-address="tokenA.mintAddress" />
                      <span class="font-small weight-semi">{{ tokenA.symbol }} - </span>
                      <CoinIcon :mint-address="tokenB.mintAddress" />
                      <span class="font-small weight-semi">{{ tokenB.symbol }}</span>
                    </div>
                  </div>
                </div>
                <div class="btn-container">
                  <Button
                    v-if="!wallet.connected"
                    class="btn-transparent font-medium weight-semi"
                    @click="$accessor.wallet.openModal"
                  >
                    Connect wallet
                  </Button>
                  <Button
                    v-else
                    class="btn-transparent font-medium weight-semi"
                    :disabled="!wallet.connected"
                    @click="gotoFarms"
                  >
                    View Farm
                  </Button>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'nuxt-property-decorator'
import { Steps, Row, Col, Button, Tooltip, Icon, DatePicker, Radio, Spin, Modal } from 'ant-design-vue'
import { getMarket, createAmm, clearLocal } from '@/utils/market'
import BigNumber from '@/../node_modules/bignumber.js/bignumber'
import { TokenAmount } from '@/utils/safe-math'
import { NATIVE_SOL, TokenInfo, TOKENS, getTokenByMintAddress } from '@/utils/tokens'
import { createAssociatedId } from '@/utils/web3'
import { PublicKey } from '@solana/web3.js'
import {
  AMM_ASSOCIATED_SEED,
  FARM_PROGRAM_ID,
  LIQUIDITY_POOL_PROGRAM_ID_V4,
  FARM_INITIAL_ALLOWED_CREATOR
} from '@/utils/ids'
import { getBigNumber } from '@/utils/layouts'
import { cloneDeep, get } from 'lodash-es'
import moment from 'moment'
import { YieldFarm } from '@/utils/farm'
import { getCropperPoolListByTokenMintAddresses, LIQUIDITY_POOLS, LiquidityPoolInfo } from '@/utils/pools'
import { Token } from '@solana/spl-token'
const Step = Steps.Step
const RadioGroup = Radio.Group

@Component({
  head: {
    title: 'NeoNomads Create Farm'
  },
  components: {
    Modal,
    Steps,
    Row,
    Col,
    Button,
    Step,
    Tooltip,
    Icon,
    DatePicker,
    RadioGroup,
    Radio,
    Spin
  }
})
export default class CreateFarm extends Vue {
  rewardCoin: TokenInfo | null = null
  tokenA: TokenInfo | null = null
  tokenB: TokenInfo | null = null
  fromCoinAmount: string = ''
  fixedFromCoin: boolean = true
  selectFromCoin: boolean = false
  selectTokenA: boolean = false
  selectTokenB: boolean = false
  allowedFarmCreator: string = FARM_INITIAL_ALLOWED_CREATOR
  coinSelectShow: boolean = false
  startTime: any = moment()
  endTime: any = moment().add(28, 'days')
  endOpen: any = false
  isCRPTokenPair: boolean = false
  ammIdSelectShow: boolean = false
  ammIdSelectList: any = []

  farmId: any = null
  current: number = 0
  rewardTokenForced: any = null

  marketInputFlag: boolean = true
  marketFlag: boolean = false
  inputMarket: string = ''
  isAmountValid: boolean = false
  inputQuoteValue: number | null = null
  inputBaseValue: number | null = null
  inputPrice: number | null = null
  marketMsg: any | null = null
  getMarketLoading: boolean = false
  marketError: null | string = null
  stepsStatus: string = 'process'
  marketStr: string | null = null
  marketPrice: number | null = null
  baseMintDecimals: number | null = null
  quoteMintDecimals: number | null = null

  createAmmFlag: boolean = false

  stepTitleInputMarket: string = 'Market ID'
  stepTitleMarketInfo: string = 'Price & Initial Liquidity'
  stepTitleInit: string = 'Pool initialization'

  marketTickSize: number = 1

  userCreateAmmId: string = ''
  userCreatePoolLiquidity: string = ''

  liquidityValueChangeFlag: boolean = true

  userLocalAmmIdList: string[] = []

  expectAmmId: undefined | string

  farmType: number = 1
  ammType: number = 1
  showSelectedPool: boolean = false
  activeSpin: boolean = false
  farm_created: boolean = false

  get rewardPerWeek() {
    let result = 0
    let initialAmount = Number.parseFloat(this.fromCoinAmount)

    if (this.startTime.unix() + 14 * 86400 > this.endTime.unix()) {
      this.endTime = moment().set('second', 14 * 86400)
    }

    let duration = 0
    if (this.startTime != null && this.endTime != null) {
      duration = this.endTime.unix() - this.startTime.unix()
    }

    if (duration > 0) {
      result = (initialAmount * 7 * 24 * 3600) / duration
    }
    return result
  }
  get isMobile() {
    return this.$accessor.isMobile
  }

  get wallet() {
    return this.$accessor.wallet
  }

  @Watch('startTime')
  onStartTimeChanged(val: any) {
    console.log('start time changed !')
  }

  @Watch('inputQuoteValue')
  oniIputQuoteValueChanged(val: string) {
    if (
      this.inputPrice !== null &&
      this.baseMintDecimals !== null &&
      this.quoteMintDecimals !== null &&
      this.liquidityValueChangeFlag
    ) {
      this.liquidityValueChangeFlag = false
      if (val.toString().split('.').length > 1 && val.toString().split('.')[1].length > this.quoteMintDecimals) {
        this.inputQuoteValue = parseFloat(parseFloat(val).toFixed(this.quoteMintDecimals))
      }
      this.inputBaseValue =
        Math.floor(((this.inputQuoteValue ?? parseFloat(val)) / this.inputPrice) * 10 ** this.baseMintDecimals) /
        10 ** this.baseMintDecimals
      this.validateAmount()
    }
    setTimeout(() => {
      this.liquidityValueChangeFlag = true
    }, 1)
  }

  @Watch('inputBaseValue')
  onInputBaseValueChanged(val: string) {
    if (
      this.inputPrice !== null &&
      this.baseMintDecimals !== null &&
      this.quoteMintDecimals !== null &&
      this.liquidityValueChangeFlag
    ) {
      this.liquidityValueChangeFlag = false
      if (val.toString().split('.').length > 1 && val.toString().split('.')[1].length > this.baseMintDecimals) {
        this.inputBaseValue = parseFloat(parseFloat(val).toFixed(this.baseMintDecimals))
      }
      this.inputQuoteValue =
        Math.floor((this.inputBaseValue ?? parseFloat(val)) * this.inputPrice * 10 ** this.quoteMintDecimals) /
        10 ** this.quoteMintDecimals
      this.validateAmount()
    }
    setTimeout(() => {
      this.liquidityValueChangeFlag = true
    }, 1)
  }

  @Watch('inputPrice')
  onInputPriceValueChanged(val: number) {
    if (this.inputPrice) {
      if (this.inputBaseValue && this.quoteMintDecimals) {
        this.inputQuoteValue =
          Math.floor(val * this.inputPrice * 10 ** this.quoteMintDecimals) / 10 ** this.quoteMintDecimals
      } else if (this.inputQuoteValue && this.baseMintDecimals) {
        this.inputBaseValue =
          Math.floor((val / this.inputPrice) * 10 ** this.baseMintDecimals) / 10 ** this.baseMintDecimals
      }
      this.validateAmount()
    }
  }

  async validateAmount() {
    this.isAmountValid = false
    if (this.inputBaseValue && this.inputQuoteValue && this.baseMintDecimals && this.quoteMintDecimals) {
      const walletBaseAmount = parseFloat(
        get(this.wallet.tokenAccounts, `${this.marketMsg.baseMintAddress.toBase58()}.balance`).fixed()
      )
      const walletQuoteAmount = parseFloat(
        get(this.wallet.tokenAccounts, `${this.marketMsg.quoteMintAddress.toBase58()}.balance`).fixed()
      )

      if (
        this.inputBaseValue > 0 &&
        this.inputBaseValue < walletBaseAmount &&
        this.inputQuoteValue > 0 &&
        this.inputQuoteValue < walletQuoteAmount
      ) {
        this.isAmountValid = true
      }
    }
  }

  @Watch('inputMarket')
  onInputMarketChanged(val: string) {
    this.inputMarket = val.replace(/(^\s*)|(\s*$)/g, '')
  }

  mounted() {
    const localMarket = localStorage.getItem('createMarket')
    if (localMarket !== null && localMarket.length > 30) {
      this.inputMarket = localMarket
      this.getMarketMsg()
    } else {
      clearLocal()
    }
    this.updateLocalData()

    const query = new URLSearchParams(window.location.search)
    if (query.get('rtf')) this.rewardTokenForced = query.get('rtf') as string
  }

  async addRewardToFarm() {
    this.activeSpin = true
    //EgaHTGJeDbytze85LqMStxgTJgq22yjTvYSfqoiZevSK
    const connection = this.$web3
    const wallet: any = this.$wallet

    window.localStorage.pool_last_updated = undefined
    await this.$accessor.liquidity.requestInfos()

    //get liquidity pool info
    let liquidityPoolInfo: any = LIQUIDITY_POOLS.find((item) => item.ammId === this.userCreateAmmId)

    //check liquidity pool
    if (liquidityPoolInfo == undefined) {
      this.$notify.error({
        key: 'Liquidity',
        message: 'Finding liquidity pool',
        description: "Can't find liquidity pool"
      })
      return
    }

    //check reward coin
    if (this.rewardCoin === null) {
      this.$notify.error({
        key: 'reward',
        message: 'Checking reward coin',
        description: 'Select reward coin, please'
      })
      return
    }

    let rewardMintPubkey = new PublicKey(this.rewardCoin?.mintAddress as string)
    let rewardDecimals: number = this.rewardCoin?.decimals as any
    let lpMintPubkey = new PublicKey(liquidityPoolInfo.lp.mintAddress)
    let ammPubkey = new PublicKey(this.userCreateAmmId)

    let startTimestamp: any = this.startTime.unix()
    let endTimestamp: any = this.endTime.unix()

    let initialRewardAmount: number = Number.parseFloat(this.fromCoinAmount)
    let userRewardTokenPubkey = new PublicKey(
      get(this.wallet.tokenAccounts, `${rewardMintPubkey.toBase58()}.tokenAccountAddress`)
    )
    let userRewardTokenBalance = get(this.wallet.tokenAccounts, `${rewardMintPubkey.toBase58()}.balance`)

    //check if creator has some reward
    if (userRewardTokenBalance <= 0 || userRewardTokenBalance < initialRewardAmount) {
      this.$notify.error({
        key: 'Initial Balance',
        message: 'Checking Inital Reward',
        description: 'Not enough Initial Reward token balance'
      })
      return
    }

    //check start and end
    if (startTimestamp >= endTimestamp) {
      this.$notify.error({
        key: 'Period',
        message: 'Checking period',
        description: 'end time must be late than start time'
      })
      return
    }

    if (startTimestamp + 14 * 86400 > endTimestamp) {
      this.$notify.error({
        key: 'Period',
        message: 'Checking period',
        description: "farm can't be shorter than 14 days"
      })
      return
    }
    try {
      let fetchedFarm = await YieldFarm.loadFarm(connection, this.farmId, new PublicKey(FARM_PROGRAM_ID))

      if (fetchedFarm) {
        await fetchedFarm.addReward(wallet, userRewardTokenPubkey, initialRewardAmount * Math.pow(10, rewardDecimals))
        this.current += 1
      }
    } catch {
      this.activeSpin = false
      console.log('creating farm failed')
    }
  }

  async confirmFarmInfo() {
    this.activeSpin = true
    //EgaHTGJeDbytze85LqMStxgTJgq22yjTvYSfqoiZevSK
    const connection = this.$web3
    const wallet: any = this.$wallet

    window.localStorage.pool_last_updated = undefined
    await this.$accessor.liquidity.requestInfos()

    //get liquidity pool info
    let liquidityPoolInfo: any = LIQUIDITY_POOLS.find((item) => item.ammId === this.userCreateAmmId)

    //check liquidity pool
    if (liquidityPoolInfo == undefined) {
      this.$notify.error({
        key: 'Liquidity',
        message: 'Finding liquidity pool',
        description: "Can't find liquidity pool"
      })
      return
    }

    //check reward coin
    if (this.rewardCoin === null) {
      this.$notify.error({
        key: 'reward',
        message: 'Checking reward coin',
        description: 'Select reward coin, please'
      })
      return
    }

    let rewardMintPubkey = new PublicKey(this.rewardCoin?.mintAddress as string)
    let rewardDecimals: number = this.rewardCoin?.decimals as any
    let lpMintPubkey = new PublicKey(liquidityPoolInfo.lp.mintAddress)
    let ammPubkey = new PublicKey(this.userCreateAmmId)

    let startTimestamp: any = this.startTime.unix()
    let endTimestamp: any = this.endTime.unix()

    let initialRewardAmount: number = Number.parseFloat(this.fromCoinAmount)
    let userRewardTokenPubkey = new PublicKey(
      get(this.wallet.tokenAccounts, `${rewardMintPubkey.toBase58()}.tokenAccountAddress`)
    )
    let userRewardTokenBalance = get(this.wallet.tokenAccounts, `${rewardMintPubkey.toBase58()}.balance`)

    //check if creator has some reward
    if (userRewardTokenBalance <= 0 || userRewardTokenBalance < initialRewardAmount) {
      this.$notify.error({
        key: 'Initial Balance',
        message: 'Checking Inital Reward',
        description: 'Not enough Initial Reward token balance'
      })
      return
    }

    //check start and end
    if (startTimestamp >= endTimestamp) {
      this.$notify.error({
        key: 'Period',
        message: 'Checking period',
        description: 'end time must be late than start time'
      })
      return
    }

    if (startTimestamp + 14 * 86400 > endTimestamp) {
      this.$notify.error({
        key: 'Period',
        message: 'Checking period',
        description: "farm can't be shorter than 14 days"
      })
      return
    }

    try {
      let createdFarm = await YieldFarm.createFarmWithParams(
        connection,
        wallet,
        rewardMintPubkey,
        lpMintPubkey,
        ammPubkey,
        startTimestamp,
        endTimestamp
      )
      await this.delay(500)

      // wait for the synchronization
      let loopCount = 0
      while ((await connection.getAccountInfo(createdFarm.farmId)) === null) {
        if (loopCount > 5) {
          // allow loop for 5 times
          break
        }
        loopCount++
      }

      this.farmId = createdFarm.farmId
      window.localStorage['owner_' + createdFarm.farmId] = 1

      this.activeSpin = false
      this.farm_created = true
    } catch {
      this.activeSpin = false
      this.farm_created = false
      console.log('creating farm failed')
    }
  }

  async createFarmAndAddReward() {
    this.activeSpin = true
    //EgaHTGJeDbytze85LqMStxgTJgq22yjTvYSfqoiZevSK
    const connection = this.$web3
    const wallet: any = this.$wallet

    window.localStorage.pool_last_updated = undefined
    await this.$accessor.liquidity.requestInfos()

    //get liquidity pool info
    let liquidityPoolInfo: any = LIQUIDITY_POOLS.find((item) => item.ammId === this.userCreateAmmId)

    //check liquidity pool
    if (liquidityPoolInfo == undefined) {
      this.$notify.error({
        key: 'Liquidity',
        message: 'Finding liquidity pool',
        description: "Can't find liquidity pool"
      })
      return
    }

    //check reward coin
    if (this.rewardCoin === null) {
      this.$notify.error({
        key: 'reward',
        message: 'Checking reward coin',
        description: 'Select reward coin, please'
      })
      return
    }

    let rewardMintPubkey = new PublicKey(this.rewardCoin?.mintAddress as string)
    let rewardDecimals: number = this.rewardCoin?.decimals as any
    let lpMintPubkey = new PublicKey(liquidityPoolInfo.lp.mintAddress)
    let ammPubkey = new PublicKey(this.userCreateAmmId)

    let startTimestamp: any = this.startTime.unix()
    let endTimestamp: any = this.endTime.unix()

    let initialRewardAmount: number = Number.parseFloat(this.fromCoinAmount)
    let userRewardTokenPubkey = new PublicKey(
      get(this.wallet.tokenAccounts, `${rewardMintPubkey.toBase58()}.tokenAccountAddress`)
    )
    let userRewardTokenBalance = get(this.wallet.tokenAccounts, `${rewardMintPubkey.toBase58()}.balance`)

    //check if creator has some reward
    if (userRewardTokenBalance <= 0 || userRewardTokenBalance < initialRewardAmount) {
      this.$notify.error({
        key: 'Initial Balance',
        message: 'Checking Inital Reward',
        description: 'Not enough Initial Reward token balance'
      })
      return
    }

    //check start and end
    if (startTimestamp >= endTimestamp) {
      this.$notify.error({
        key: 'Period',
        message: 'Checking period',
        description: 'end time must be late than start time'
      })
      return
    }
    try {
      let createdFarm = await YieldFarm.createFarmAndAddRewardWithParams(
        connection,
        wallet,
        rewardMintPubkey,
        lpMintPubkey,
        ammPubkey,
        startTimestamp,
        endTimestamp,

        userRewardTokenPubkey,
        initialRewardAmount * Math.pow(10, rewardDecimals)
      )
      await this.delay(500)

      // wait for the synchronization
      let loopCount = 0
      while ((await connection.getAccountInfo(createdFarm.farmId)) === null) {
        if (loopCount > 5) {
          // allow loop for 5 times
          break
        }
        loopCount++
      }

      this.farmId = createdFarm.farmId
      window.localStorage['owner_' + createdFarm.farmId] = 1

      this.activeSpin = false
      this.farm_created = true
    } catch {
      this.activeSpin = false
      this.farm_created = false
      console.log('creating farm failed')
    }

    try {
      let fetchedFarm = await YieldFarm.loadFarm(connection, this.farmId, new PublicKey(FARM_PROGRAM_ID))
      if (!fetchedFarm) {
        console.log("can't fetch farm", this.farmId)
      }
    } catch {
      this.activeSpin = false
      console.log('creating farm failed')
    }

    this.current += 1
  }
  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  gotoFarms() {
    this.$accessor.farm.requestInfos()
    this.$accessor.wallet.getTokenAccounts()
    this.$router.push({ path: `/farms/?s=${this.farmId}` })
  }
  goToFarmInfo() {
    this.current++
  }
  useExistingAMMID() {
    if (this.userCreateAmmId === '') {
      this.$notify.error({
        key: 'AMMID',
        message: 'Using Existing Amm Id',
        description: 'Input valid AMM ID'
      })
      return
    }
    this.current = 1
  }
  createNewAMMID() {
    this.userCreateAmmId = ''
    this.current++
  }
  onAmmIdSelect(liquidityInfo: LiquidityPoolInfo | undefined) {
    this.ammIdSelectShow = false
    if (liquidityInfo) {
      let SymbolA = liquidityInfo.coin.symbol
      let SymbolB = liquidityInfo.pc.symbol
      let SymbolA_value = liquidityInfo.coin.balance
        ? getBigNumber((liquidityInfo.coin.balance as TokenAmount).toEther())
        : 0
      let SymbolB_value = liquidityInfo.pc.balance
        ? getBigNumber((liquidityInfo.pc.balance as TokenAmount).toEther())
        : 0
      this.userCreatePoolLiquidity = SymbolA_value + ' ' + SymbolA + ' | ' + SymbolB_value + ' ' + SymbolB
      this.userCreateAmmId = liquidityInfo.ammId
      this.showSelectedPool = true
    } else {
      this.userCreateAmmId = ''
      this.current++
    }
  }
  openFromCoinSelect() {
    this.selectFromCoin = true
    this.closeAllModal('coinSelectShow')
    setTimeout(() => {
      this.coinSelectShow = true
    }, 1)
  }
  openTokenASelect() {
    this.selectTokenA = true
    this.closeAllModal('coinSelectShow')
    setTimeout(() => {
      this.coinSelectShow = true
    }, 1)
  }
  openTokenBSelect() {
    this.selectTokenB = true
    this.closeAllModal('coinSelectShow')
    setTimeout(() => {
      this.coinSelectShow = true
    }, 1)
  }
  closeAllModal(showName: string) {
    if (showName !== 'coinSelectShow') {
      this.coinSelectShow = false
    }
  }
  onCoinSelect(tokenInfo: TokenInfo) {
    this.showSelectedPool = false
    if (tokenInfo !== null) {
      if (this.selectFromCoin) {
        this.rewardCoin = cloneDeep(tokenInfo)
      } else if (this.selectTokenA || this.selectTokenB) {
        if (this.selectTokenA) {
          this.tokenA = cloneDeep(tokenInfo)
          this.rewardCoin = cloneDeep(tokenInfo)
          if (this.tokenB && this.tokenA.mintAddress === this.tokenB.mintAddress) {
            this.tokenB = null
          }
        } else if (this.selectTokenB) {
          this.tokenB = cloneDeep(tokenInfo)
          if (this.tokenA && this.tokenB.mintAddress === this.tokenA.mintAddress) {
            this.tokenA = null
          }
        }
        if (this.tokenA && this.tokenB) {
          const liquidityListV5 = getCropperPoolListByTokenMintAddresses(
            this.tokenA.mintAddress === TOKENS.WSOL.mintAddress ? NATIVE_SOL.mintAddress : this.tokenA.mintAddress,
            this.tokenB.mintAddress === TOKENS.WSOL.mintAddress ? NATIVE_SOL.mintAddress : this.tokenB.mintAddress,
            undefined
          )
          if (liquidityListV5.length === 1) {
            this.userCreateAmmId = liquidityListV5[0].ammId
          } else if (liquidityListV5.length > 1) {
            // user select amm id
            this.coinSelectShow = false
            setTimeout(() => {
              this.ammIdSelectShow = true

              // @ts-ignore
              this.ammIdSelectList = Object.values(this.$accessor.liquidity.infos).filter((item: LiquidityPoolInfo) =>
                // @ts-ignore
                liquidityListV5.find((liquidityItem) => liquidityItem.ammId === item.ammId)
              )
            }, 1)
            return
          }
        } else {
          this.userCreateAmmId = ''
        }
      }
    } else {
      // check coin
      if (this.rewardCoin !== null) {
        const newFromCoin = Object.values(TOKENS).find((item) => item.mintAddress === this.rewardCoin?.mintAddress)
        if (newFromCoin === null || newFromCoin === undefined) {
          this.rewardCoin = null
        }
      }
    }

    if (this.rewardTokenForced) {
      this.rewardCoin = getTokenByMintAddress(this.rewardTokenForced)
    }

    this.coinSelectShow = false
    this.selectFromCoin = false
    this.selectTokenA = false
    this.selectTokenB = false
  }

  disabledStartDate(startTime: any) {
    const endTime = this.endTime
    if (!startTime || !endTime) {
      return false
    }
    if (startTime < moment().endOf('day')) {
      return true
    }
    return startTime.valueOf() > endTime.valueOf()
  }
  disabledEndDate(endTime: any) {
    const startTime = this.startTime
    if (!endTime || !startTime) {
      return false
    }
    return startTime.valueOf() >= endTime.valueOf()
  }
  handleStartOpenChange(open: any) {
    if (!open) {
      this.endOpen = true
    }
  }
  handleEndOpenChange(open: any) {
    this.endOpen = open
  }
  updateLocalData() {
    if (localStorage.getItem('userCreateAMMID') !== null) {
      // @ts-ignore
      this.userLocalAmmIdList = localStorage.getItem('userCreateAMMID').split('+++')
    } else {
      this.userLocalAmmIdList = []
    }
  }

  getNameForMint(mint: string) {
    const mintToken = Object.values(TOKENS).find((item) => item.mintAddress === mint)
    if (mintToken) {
      return `${mintToken.symbol}: ${mint}`
    }
    return mint
  }

  getSymbolForMint(mint: string) {
    const mintToken = Object.values(TOKENS).find((item) => item.mintAddress === mint)
    if (mintToken) {
      return `${mintToken.symbol}`
    }
    return mint
  }

  async getMarketMsg() {
    //@zhaohui
    // this.getMarketLoading = true

    // let market_t = {
    //   address: new PublicKey('9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT'),
    //   baseMintAddress: new PublicKey(TOKENS.B2B.mintAddress),
    //   quoteMintAddress: new PublicKey(TOKENS.CRP.mintAddress),
    //   tickSize: 5,
    //   minOrderSize: 10
    // }

    // this.expectAmmId = (
    //     await createAssociatedId(
    //       new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V4),
    //       new PublicKey('9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT'),
    //       AMM_ASSOCIATED_SEED
    //     )
    //   ).toString()

    // let price_t = 3.5, baseMintDecimals_t = 9, quoteMintDecimals_t = 9
    // this.stepsStatus = 'process'
    // this.stepTitleInputMarket = 'Import Serum Market ID'
    // this.current = 2
    // this.marketMsg = market_t
    // this.marketPrice = price_t
    // this.marketTickSize = getBigNumber(new BigNumber(market_t.tickSize))
    // this.baseMintDecimals = baseMintDecimals_t
    // this.quoteMintDecimals = quoteMintDecimals_t
    // this.marketStr = this.inputMarket
    // this.getMarketLoading = false

    // // let market_info = {
    // //   address: new PublicKey('9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT'),
    // //   baseMintAddress: new PublicKey(TOKENS.USDT.mintAddress),
    // //   quoteMintAddress: new PublicKey(TOKENS.CRP.mintAddress),
    // //   ammId: new PublicKey('3gSjs6MqyHFsp8DXvaKvVUJjV7qg5itf9qmUGuhnSaWH')
    // // }

    // // createAmm(this.$web3, this.$wallet, market_info, 0.5, 1)
    // return;

    this.getMarketLoading = true
    this.marketInputFlag = !this.marketInputFlag
    const { market, price, msg, baseMintDecimals, quoteMintDecimals } = await getMarket(this.$web3, this.inputMarket)

    if (this.inputMarket && market !== null) {
      this.expectAmmId = (
        await createAssociatedId(
          new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V4),
          new PublicKey(this.inputMarket),
          AMM_ASSOCIATED_SEED
        )
      ).toString()
    }
    if (market === null) {
      this.marketInputFlag = !this.marketInputFlag
      this.stepsStatus = 'error'
      this.stepTitleInputMarket = msg
    } else {
      this.stepsStatus = 'process'
      this.stepTitleInputMarket = 'Import Serum Market ID'
      this.current = 2
      this.marketMsg = market
      this.marketPrice = price
      this.marketTickSize = getBigNumber(new BigNumber(market.tickSize))
      this.baseMintDecimals = baseMintDecimals
      this.quoteMintDecimals = quoteMintDecimals
      this.marketStr = this.inputMarket
    }
    this.getMarketLoading = false
  }

  rewriteMarket() {
    this.marketInputFlag = !this.marketInputFlag
    this.current = 0
    this.marketMsg = null
    this.inputMarket = ''
    this.inputQuoteValue = 0
    this.inputBaseValue = 0
    this.inputPrice = 0
    this.marketError = null
    this.createAmmFlag = false
    this.userCreateAmmId = ''
    this.stepTitleMarketInfo = 'Price & Initial Liquidity'
    this.stepTitleInit = 'Initialize'
    clearLocal()
  }

  createKey() {
    this.stepTitleMarketInfo = 'Price & Initial Liquidity'
    this.stepTitleInit = 'Initialize'
    if (
      this.marketMsg == null ||
      this.inputQuoteValue === null ||
      this.inputBaseValue === null ||
      this.inputPrice === null ||
      this.inputQuoteValue <= 0 ||
      this.inputBaseValue <= 0 ||
      this.inputPrice <= 0
    ) {
      this.stepTitleMarketInfo = 'Please input coin value'
      this.stepsStatus = 'error'
      return
    } else {
      this.stepTitleMarketInfo = 'Price & Initial Liquidity'
      this.stepsStatus = 'process'
    }

    this.createAmmFlag = true

    createAmm(this.$web3, this.$wallet, this.marketMsg, this.inputBaseValue, this.inputQuoteValue)
      .then(async (data) => {
        this.stepsStatus = 'process'
        this.userCreateAmmId = data
        if (localStorage.getItem('userCreateAMMID') !== null) {
          localStorage.setItem('userCreateAMMID', localStorage.getItem('userCreateAMMID') + '+++')
        } else {
          localStorage.setItem('userCreateAMMID', '')
        }
        localStorage.setItem(
          'userCreateAMMID',
          localStorage.getItem('userCreateAMMID') +
            `${new Date().getTime()}---${data}---${
              this.marketMsg.address
            }---${this.marketMsg.baseMintAddress.toString()}---${this.marketMsg.quoteMintAddress.toString()}`
        )
        this.updateLocalData()
        this.createAmmFlag = true
        window.localStorage.pool_last_updated = undefined
        await this.$accessor.liquidity.requestInfos()
        this.current = 1
      })
      .catch((error) => {
        this.stepsStatus = 'error'
        this.current = 3
        this.createAmmFlag = false
        this.stepTitleInit = error.message
        throw error
      })
  }

  selectFarm(e: { target: { value: any } }) {
    console.log(e.target.value)
  }

  selectAMM(e: { target: { value: any } }) {
    console.log(e.target.value)
  }

  removeSelected() {
    this.tokenA = null
    this.tokenB = null
    this.userCreateAmmId = ''
    this.userCreatePoolLiquidity = ''
    this.showSelectedPool = false
  }
}
</script>

<style lang="less">
.create-farm-modal {
  .ant-modal {
    max-width: @tablet-md-width;
    width: 100% !important;

    @media @max-md-tablet {
      max-width: calc(100vw - 16px);
    }

    .ant-modal-content {
      .ant-modal-header {
        .ant-modal-title {
          font-weight: 600 !important;
          font-size: 31px !important;
          line-height: 37px !important;

          @media @max-sl-mobile {
            width: 70%;
          }
        }
      }
      .ant-modal-body {
        margin-top: 38px !important;

        @media @max-sl-mobile {
          margin-top: 18px !important;
        }
      }
    }
  }

  // ant steps
  .ant-steps-vertical {
    .ant-steps-item-content {
      min-height: 60px;
    }

    .ant-steps-item-active,
    .ant-steps-item-finish {
      .ant-steps-item-tail::after,
      .ant-steps-item-icon {
        background-color: @color-petrol500 !important;
      }

      .ant-steps-item-title {
        color: @color-petrol500 !important;
      }
    }

    .ant-steps-item-error {
      .ant-steps-item-icon {
        background-color: red !important;
      }
    }

    .ant-steps-item-process,
    .ant-steps-item-finish {
      .ant-steps-item-title {
        font-weight: 700 !important;
      }
    }

    .ant-steps-item {
      .ant-steps-item-container {
        .ant-steps-item-tail {
          top: 5px;
          left: 15px;
          padding: 30px 0 11px;

          &::after {
            background-color: rgba(255, 255, 255, 0.3);
          }
        }

        .ant-steps-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: none;
          background-color: rgba(255, 255, 255, 0.3);

          .ant-steps-icon {
            font-weight: 700;
            font-size: 16px;
            line-height: 24px;
            top: 0;
            color: @color-blue700;
          }
        }

        .ant-steps-item-title {
          font-size: 20px;
          line-height: 24px;
          color: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }
}

// ant radio
.ant-radio-group {
  width: 100%;
}

.ant-radio-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }

  span {
    font-weight: 600;
    font-size: 13px;
    line-height: 19px;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.ant-radio-wrapper-disabled {
  .ant-radio-inner {
    border-color: #40426c !important;
  }
}

.ant-radio-wrapper-checked {
  span {
    color: #fff;
  }
}

.ant-radio {
  .ant-radio-inner {
    background: transparent;
    border: 2px solid #40426c;
    box-sizing: border-box;
    border-radius: 7px;
    width: 21px;
    height: 21px;
  }

  .ant-radio-inner::after {
    position: absolute;
    width: 13px;
    height: 13px;
    border-radius: 4px;
    top: 2px;
    left: 2px;
    transform: scale(1);
    opacity: 1;
    transition: all 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86);
    background-color: transparent;
  }
}

.ant-radio-checked {
  .ant-radio-inner {
    border-color: @color-farms;
  }

  .ant-radio-inner::after {
    background-color: @color-farms;
  }
}

.ant-radio-checked::after {
  border: none;
}

.ant-radio-wrapper:hover .ant-radio-inner,
.ant-radio:hover .ant-radio-inner {
  border-color: @color-farms;
}

.ant-radio .ant-radio-input:focus + .ant-radio-inner {
  border-color: rgba(255, 255, 255, 0.5);
}

.ant-radio-checked .ant-radio-input:focus + .ant-radio-inner {
  border-color: @color-farms;
}

// ant calendar
.ant-calendar-picker {
  margin-bottom: 18px;
  width: 100%;

  i {
    display: none;
  }
}

.ant-calendar-picker-input.ant-input {
  display: flex;
  align-items: center;
  height: fit-content;
  background: rgba(226, 227, 236, 0.1) !important;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: none;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;

  &[disabled] {
    color: rgba(255, 255, 255, 0.5);
  }
}

.ant-calendar-picker-container {
  .ant-calendar {
    box-shadow: 0 30px 84px rgba(19, 10, 46, 0.08), 0 8px 32px rgba(19, 10, 46, 0.07), 0 3px 14px rgba(19, 10, 46, 0.03),
      0 1px 3px rgba(19, 10, 46, 0.13);
    border-radius: 12px;
    border: none;

    .ant-calendar-panel {
      width: 100%;

      .ant-calendar-input-wrap {
        display: none;
      }

      // Decade Panel
      .ant-calendar-decade-panel {
        background: @color-blue600;
        .ant-calendar-decade-panel-header {
          border: none;
        }
        .ant-calendar-decade-panel-footer {
          display: none;
        }
      }

      // Day Panel
      .ant-calendar-date-panel {
        background: @color-blue600;
        .ant-calendar-header {
          border: none;
        }
        .ant-calendar-footer {
          display: none;
        }
      }

      // Month Panel
      .ant-calendar-month-panel {
        background: @color-blue600;
        .ant-calendar-month-panel-header {
          border: none;
        }
        .ant-calendar-month-panel-footer {
          display: none;
        }
      }

      // Year Panel
      .ant-calendar-year-panel {
        background: @color-blue600;
        .ant-calendar-year-panel-header {
          border: none;
        }
        .ant-calendar-year-panel-footer {
          display: none;
        }
      }
    }
  }

  .ant-calendar-last-month-cell,
  .ant-calendar-next-month-btn-day {
    .ant-calendar-date {
      color: #c9c8cc40 !important;

      &:hover {
        background: @gradient-color-icon;
        background-origin: border-box;
      }
    }
  }

  .ant-calendar table,
  .ant-calendar th {
    // Day Selection
    .ant-calendar-selected-day .ant-calendar-date {
      background: @color-petrol500;
    }

    .ant-calendar-today .ant-calendar-date {
      border-color: @color-petrol500;
    }

    .ant-calendar-cell {
      .ant-calendar-date {
        width: 100%;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 40px;
        color: #f8f7fa;
      }

      .ant-calendar-date:hover {
        background-color: @color-petrol500;
      }
    }

    // Month Selection
    .ant-calendar-month-panel-selected-cell .ant-calendar-month-panel-month {
      background: @color-petrol500;
    }

    .ant-calendar-month-panel-cell {
      .ant-calendar-month-panel-month {
        max-width: 75px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 40px;
        color: #f8f7fa;
      }

      .ant-calendar-month-panel-month:hover {
        background-color: @color-petrol500;
      }
    }

    // Year Selection
    .ant-calendar-year-panel-selected-cell .ant-calendar-year-panel-year {
      background: @color-petrol500;
    }

    .ant-calendar-year-panel-cell {
      .ant-calendar-year-panel-year {
        max-width: 75px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 40px;
        color: #f8f7fa;
      }

      .ant-calendar-year-panel-year:hover {
        background-color: @color-petrol500;
      }
    }

    // Decade Selection
    .ant-calendar-decade-panel-selected-cell .ant-calendar-decade-panel-decade {
      background: @color-petrol500;
    }

    .ant-calendar-decade-panel-cell {
      .ant-calendar-decade-panel-decade {
        max-width: 75px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 40px;
        color: #f8f7fa;
      }

      .ant-calendar-decade-panel-decade:hover {
        background-color: @color-petrol500;
      }
    }
  }
}
</style>

<style lang="less" scoped>
// global stylesheet
.bordered-left {
  border-left: 2px solid @color-blue200;
}

.bordered-right {
  border-right: 2px solid @color-blue200;
}

.bordered-left,
.bordered-right {
  @media @max-sl-mobile {
    border: none;
  }
}

.btn-container {
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 3px;
  height: auto;
  width: fit-content;
}

.btn-transparent {
  background: transparent;
  border-radius: 48px;
  border: none;
  height: 39px;
  padding: 0 32px;

  @media @max-sl-mobile {
    width: 100%;
  }

  &[disabled]:focus,
  &[disabled]:hover {
    background: transparent;
    border: none;
  }
}

.btn-outline {
  background: @gradient-color01;
  border-radius: 48px;
  padding: 3px;
  margin-right: 13px;

  &:last-child {
    margin-right: 0;
  }

  &:hover {
    background: @gradient-color02;
  }

  .link-btn {
    height: 100%;
    background: @color-blue700;
    padding: 5px 15px;
    border-radius: 48px;
    border: 0;
  }
}

u {
  text-underline-position: under;
}

//class stylesheet
.create-farm-head {
  position: absolute;
  top: -3px;
  right: 45px;

  @media @max-sl-mobile {
    position: unset;
    margin-bottom: 38px;
    justify-content: flex-start;
  }
}

.create-farm {
  .design-farm {
    .step {
      padding-right: 48px;

      @media @max-sl-mobile {
        width: 100%;
        padding: 0;
      }
    }

    .notstep {
      vertical-align: middle;
      padding-left: 48px;

      @media @max-sl-mobile {
        width: 100%;
        padding: 0;
      }

      .step-item {
        margin-bottom: 38px;

        &:last-child {
          margin-bottom: 0;
        }

        .selected-pool {
          .selected-pool-box {
            position: relative;
            margin-top: 18px;
            padding: 8px;
            background: @color-blue600;
            border-radius: 8px;
            color: @color-blue100;
            word-break: break-word;

            .pool-info {
              margin-bottom: 8px;

              &:last-child {
                margin-bottom: 0;
              }
            }

            .close-icon {
              position: absolute;
              top: 8px;
              right: 8px;
            }
          }
        }

        .step-item-content {
          margin-top: 18px;

          .info-guide {
            display: flex;
            align-items: baseline;
            margin-top: 18px;

            img {
              width: 12px;
              height: 12px;
              margin-right: 8px;
            }

            a {
              color: @color-petrol500;
            }
          }

          .calendar-from,
          .calendar-to {
            position: relative;

            img:nth-child(1) {
              position: absolute;
              top: 15%;
              left: 20%;

              @media @max-sl-mobile {
                left: 7%;
              }
            }

            img:nth-child(3) {
              position: absolute;
              top: 35%;
              right: 5%;
              width: 11px;
              height: 6px;
              transition: transform 0.3s;
            }
          }

          .note {
            margin-top: 8px;

            span {
              color: rgba(255, 255, 255, 0.5);
            }

            .note-highlight {
              .info-icon {
                margin-right: 8px;
              }

              .note-highlight-content {
                color: hsl(0deg 81% 62%);
              }
            }
          }
        }

        .create-amm {
          .link-pool {
            display: block;
            margin-bottom: 18px;
            color: @color-petrol500;
          }

          .note-reminder {
            color: @color-neutral500;
            opacity: 0.6;
          }
        }

        .existing-amm {
          .coin-select {
            margin-right: 18px;

            &:last-child {
              margin-right: 0;
            }
          }
        }

        .existing-amm,
        .selected-pool {
          margin-bottom: 18px;
        }

        .farm-created {
          margin-bottom: 18px;
        }

        .lp-icons {
          margin-bottom: 18px;

          .lp-icons-group {
            background: @gradient-color-outline;
            background-origin: border-box;
            border-radius: 8px;
            padding: 2px;

            .icons {
              height: fit-content;
              background-color: @color-blue800;
              border-radius: 8px;
              align-items: center;
              padding: 6px;

              img {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 4px;
              }
            }

            .icons span {
              margin-right: 4px;

              &:last-child {
                margin-right: 0;
              }
            }
          }
        }
      }
    }
  }
}
</style>
