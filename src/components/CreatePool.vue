<template>
  <Modal
    title="Design your own pool"
    :visible="true"
    :footer="null"
    :closable="false"
    :mask-closable="true"
    class="create-pool-modal"
    @cancel="$emit('onCancel')"
    centered
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />

    <!-- <div class="create-pool-head fcsb-container">
      <div class="btn-outline">
        <a
          href="https://docs.cropper.finance/cropperfinance/cropperfinance-platform-1/builder-tutorial/create-a-permissionless-pool"
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

    <div class="create-pool">
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
        :user-close="true"
        @onClose="() => (ammIdSelectShow = false)"
        @onSelect="onAmmIdSelect"
      />
      <div class="design-pool">
        <Row>
          <Col :span="10" class="step" :class="{ 'bordered-right': !wallet.connected }">
            <Steps :current="current" size="small" direction="vertical" style="width: auto" :status="stepsStatus">
              <Step>
                <p slot="title" style="color: #23adb4">
                  {{ stepTitleInputMarket }}
                </p>
              </Step>
              <Step
                ><template slot="title">
                  <div v-if="current > 1 || (current === 1 && stepsStatus !== 'error')">
                    {{ stepTitleMarketInfo }}
                  </div>
                  <div v-else-if="current === 1 && stepsStatus === 'error'" style="color: red">
                    {{ stepTitleMarketInfo }}
                  </div>
                  <div v-else>{{ stepTitleMarketInfo }}</div>
                </template></Step
              >
              <Step
                ><template slot="title">
                  <div v-if="current > 2 && stepsStatus !== 'error'">Pool Created</div>
                  <div v-else-if="current === 2 && stepsStatus === 'error'" style="color: red">Pool Created</div>
                  <div v-else slot="title">Pool Created</div>
                </template></Step
              >
            </Steps>
          </Col>

          <Col :span="14" class="notstep" :class="{ 'bordered-left': wallet.connected }">
            <div v-if="!wallet.connected" class="btn-container">
              <Button class="btn-transparent font-medium weight-semi" @click="$accessor.wallet.openModal">
                Connect wallet
              </Button>
            </div>

            <Row v-if="current === 0 && wallet.connected">
              <Col :span="24" class="item-title">
                <label class="font-large weight-bold">Create a new liquidity pool:</label>
                <div class="inner-content">
                  <label class="font-small weight-semi spacing-large">Input market ID here</label>
                  <input
                    v-model="inputMarket"
                    :disabled="!marketInputFlag"
                    class="font-medium"
                    placeholder="Eg. 3iCYi5bQxXN5X4omCxME1jj9D91vNpYYqzbiSr9u7ccG"
                  />
                  <!-- <div class="detailed-guide font-small">
                    <u>Note:</u> This tool is for advanced users. Before attempting to create a new liquidity pool, we
                    suggest going through this
                    <a
                      href="https://docs.cropper.finance/cropperfinance/cropperfinance-platform-1/builder-tutorial/create-a-permissionless-pool"
                      target="_blank"
                    >
                      detailed guide.</a
                    >
                  </div> -->
                </div>
              </Col>
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
                  :disabled="!wallet.connected || alreadyExists"
                  :loading="getMarketLoading"
                  @click="marketInputFlag ? getMarketMsg() : rewriteMarket()"
                >
                  {{
                    !wallet.connected
                      ? 'Connect'
                      : getMarketLoading
                      ? ''
                      : marketInputFlag
                      ? alreadyExists
                        ? 'This market already exists'
                        : 'Confirm'
                      : 'Cancel'
                  }}
                </Button>
              </div>
            </Row>

            <Row v-if="current === 1">
              <Col span="24" class="item-title">
                <label class="font-large weight-bold">Market Information:</label>
                <Row class="token-mint-address">
                  <Col span="24" class="mint-address-container">
                    <label class="mint-label font-small weight-semi spacing-large">Base token mint address</label>
                    <div class="mint-address font-medium">
                      {{ getNameForMint(marketMsg.baseMintAddress.toBase58()) }}
                    </div>
                  </Col>

                  <Col span="24" class="mint-address-container">
                    <label class="mint-label font-small weight-semi">Quote Token Mint Address</label>
                    <div class="mint-address">
                      {{ getNameForMint(marketMsg.quoteMintAddress.toBase58()) }}
                    </div>
                  </Col>
                </Row>
              </Col>

              <div class="item-title">
                <div class="inner-content market-input-group">
                  <div class="market-input-info font-medium">
                    Set
                    <b>{{ getSymbolForMint(marketMsg.baseMintAddress.toBase58()) }}</b>
                    Starting Price in
                    <b>{{ getSymbolForMint(marketMsg.quoteMintAddress.toBase58()) }}</b
                    >:
                  </div>
                  <div class="market-input-form">
                    <input
                      v-model="inputPrice"
                      type="number"
                      class="font-medium"
                      :disabled="createAmmFlag"
                      :step="1"
                      accuracy="2"
                      style="width: 100%"
                      placeholder="input amount"
                    />
                  </div>
                </div>

                <div class="inner-content market-input-group">
                  <div class="market-input-info font-medium">
                    <b>{{ getSymbolForMint(marketMsg.baseMintAddress.toBase58()) }}</b>
                    Initial Liquidity:
                  </div>
                  <div class="market-input-form">
                    <input
                      v-model="inputBaseValue"
                      type="number"
                      class="font-medium"
                      :disabled="createAmmFlag"
                      :step="1"
                      accuracy="2"
                      style="width: 100%"
                      placeholder="input amount"
                    />
                  </div>
                </div>

                <div class="inner-content market-input-group">
                  <div class="market-input-info font-medium">
                    <b>{{ getSymbolForMint(marketMsg.quoteMintAddress.toBase58()) }}</b>
                    Initial Liquidity:
                  </div>
                  <div class="market-input-form">
                    <input
                      v-model="inputQuoteValue"
                      type="number"
                      class="font-medium"
                      :disabled="createAmmFlag"
                      :step="1"
                      accuracy="2"
                      style="width: 100%"
                      placeholder="input amount"
                    />
                  </div>
                </div>

                <!-- <div class="inner-content">
                  <div class="detailed-guide font-small">
                    <u>Note:</u> This tool is for advanced users. Before attempting to create a new liquidity pool, we
                    suggest going through this
                    <a
                      href="https://docs.cropper.finance/cropperfinance/cropperfinance-platform-1/builder-tutorial/create-a-permissionless-pool"
                      target="_blank"
                    >
                      detailed guide.</a
                    >
                  </div>
                </div> -->

                <div class="inner-content">
                  <div v-if="!wallet.connected" class="btn-container">
                    <Button class="btn-transparent font-medium weight-semi" @click="$accessor.wallet.openModal">
                      Connect wallet
                    </Button>
                  </div>

                  <div v-else class="btn-container">
                    <Button
                      class="btn-transparent font-medium weight-semi"
                      :loading="createAmmFlag"
                      :disabled="createAmmFlag || !(inputPrice !== null && isAmountValid)"
                      @click="createKey"
                    >
                      {{ createAmmFlag ? '' : isAmountValid == false ? 'Insufficient amount' : 'Confirm' }}
                    </Button>
                  </div>
                </div>
              </div>
            </Row>

            <Row v-if="current === 2">
              <Col :span="24" class="item-title">
                <label class="pool-created font-large weight-bold">
                  Congratulations! Your pool has been successfully created!
                </label>
              </Col>
              <Col class="lp-icons" :span="24">
                <div class="lp-icons-group">
                  <div class="icons">
                    <CoinIcon :mint-address="getNameForMint(marketMsg.baseMintAddress.toBase58())" />
                    <span class="font-small weight-semi">
                      {{ getSymbolForMint(marketMsg.baseMintAddress.toBase58()) }} -
                    </span>
                    <CoinIcon :mint-address="getNameForMint(marketMsg.baseMintAddress.toBase58())" />
                    <span class="font-small weight-semi">
                      {{ getSymbolForMint(marketMsg.quoteMintAddress.toBase58()) }}
                    </span>
                  </div>
                </div>
              </Col>
              <Col class="item-title">
                <label class="created-amm-id font-small">AMM ID: {{ userCreateAmmId }}</label>
              </Col>
              <div class="btn-container">
                <Button
                  v-if="!wallet.connected"
                  class="btn-transparent font-medium weight-semi"
                  @click="$accessor.wallet.openModal"
                >
                  Connect wallet
                </Button>
                <NuxtLink to="/pools/" v-else>
                  <Button class="btn-transparent font-medium weight-semi">View pool</Button>
                </NuxtLink>
              </div>
            </Row>
          </Col>
        </Row>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'nuxt-property-decorator'
import { Modal, Steps, Row, Col, Button, Tooltip, Icon, DatePicker } from 'ant-design-vue'
import { getMarket, createAmm, clearLocal } from '@/utils/market'
import BigNumber from '@/../node_modules/bignumber.js/bignumber'
import { NATIVE_SOL, TokenInfo, TOKENS } from '@/utils/tokens'
import { TokenAmount } from '@/utils/safe-math'
import { createAssociatedId } from '@/utils/web3'
import { PublicKey } from '@solana/web3.js'
import { DEVNET_MODE } from '../utils/ids'
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
import {
  getPoolListByTokenMintAddresses,
  getPoolByLpMintAddress,
  getAllCropperPools,
  LIQUIDITY_POOLS,
  LiquidityPoolInfo
} from '@/utils/pools'
const Step = Steps.Step
declare const window: any

@Component({
  head: {
    title: 'CropperFinance Create Pool'
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
    DatePicker
  }
})
export default class CreatePool extends Vue {
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
  endTime: any = moment()
  endOpen: any = false
  isCRPTokenPair: boolean = false
  ammIdSelectShow: boolean = false
  ammIdSelectList: any = []

  current: number = 0

  marketInputFlag: boolean = true
  marketFlag: boolean = false
  inputMarket: string = '' //3iCYi5bQxXN5X4omCxME1jj9D91vNpYYqzbiSw9u7tcG
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
  pools: any = []
  alreadyExists: boolean = false

  createAmmFlag: boolean = false

  stepTitleInputMarket: string = 'Market ID'
  stepTitleMarketInfo: string = 'Price & Initial Liquidity'
  stepTitleInit: string = 'Initialize'

  marketTickSize: number = 1

  userCreateAmmId: string = ''

  liquidityValueChangeFlag: boolean = true

  userLocalAmmIdList: string[] = []

  expectAmmId: undefined | string

  get rewardPerWeek() {
    let result = 0
    let initialAmount = Number.parseFloat(this.fromCoinAmount)

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
      const baseMintAddress =
        this.marketMsg.baseMintAddress.toBase58() == TOKENS.WSOL.mintAddress
          ? NATIVE_SOL.mintAddress
          : this.marketMsg.baseMintAddress.toBase58()
      const quoteMintAddress =
        this.marketMsg.quoteMintAddress.toBase58() == TOKENS.WSOL.mintAddress
          ? NATIVE_SOL.mintAddress
          : this.marketMsg.quoteMintAddress.toBase58()

      const walletBaseAmount = parseFloat(get(this.wallet.tokenAccounts, `${baseMintAddress}.balance`).fixed())
      const walletQuoteAmount = parseFloat(get(this.wallet.tokenAccounts, `${quoteMintAddress}.balance`).fixed())
      console.log(walletBaseAmount)
      console.log(walletQuoteAmount)
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

  poolsFormated() {
    const conn = this.$web3
    const wallet = (this as any).$accessor.wallet
    const liquidity = (this as any).$accessor.liquidity
    const price = (this as any).$accessor.price

    const polo: any = []

    getAllCropperPools().forEach(function (value: any) {
      const liquidityItem = get(liquidity.infos, value.lp_mint)
      let lp = getPoolByLpMintAddress(value.lp_mint)

      if (liquidityItem?.coin.balance) {
        const liquidityCoinValue =
          getBigNumber((liquidityItem?.coin.balance as TokenAmount).toEther()) *
          price.prices[liquidityItem?.coin.symbol as string]
        const liquidityPcValue =
          getBigNumber((liquidityItem?.pc.balance as TokenAmount).toEther()) *
          price.prices[liquidityItem?.pc.symbol as string]
        const liquidityTotalValue = liquidityPcValue + liquidityCoinValue

        const liquidityTotalSupply = getBigNumber((liquidityItem?.lp.totalSupply as TokenAmount).toEther())
        const liquidityItemValue = liquidityTotalValue / liquidityTotalSupply

        value.liquidity = liquidityTotalValue

        if (!window.poolsDatas) {
          window.poolsDatas = {}
        }

        if (window.poolsDatas[value.ammId] && window.poolsDatas[value.ammId]['1day']) {
          value.volume_24h = window.poolsDatas[value.ammId]['1day']
        } else {
          value.volume_24h = 0
        }

        if (window.poolsDatas[value.ammId] && window.poolsDatas[value.ammId]['7day']) {
          value.volume_7d = window.poolsDatas[value.ammId]['7day']
        } else {
          value.volume_7d = 0
        }

        if (window.poolsDatas[value.ammId] && window.poolsDatas[value.ammId]['fees']) {
          value.fee_24h = window.poolsDatas[value.ammId]['fees']
        } else {
          value.fee_24h = 0
        }

        if (window.poolsDatas[value.ammId] && window.poolsDatas[value.ammId]['fees']) {
          value.apy = (window.poolsDatas[value.ammId]['fees'] * 365 * 100) / liquidityTotalValue
        } else {
          value.apy = 0
        }

        value.current = 0

        if (liquidityPcValue != 0 && liquidityCoinValue != 0) {
          if (wallet) {
            value.current = get(wallet.tokenAccounts, `${value.lp_mint}.balance`)
            if (value.current) {
              value.current = (value.current.wei.toNumber() / Math.pow(10, value.current.decimals)) * liquidityItemValue
            } else {
              value.current = 0
            }
          } else {
            value.current = 0
          }
        }

        polo.push(value)
      }
    })

    return polo
  }

  @Watch('inputMarket')
  onInputMarketChanged(val: string) {
    this.alreadyExists = false
    this.inputMarket = val.replace(/(^\s*)|(\s*$)/g, '')

    if (
      // @ts-ignore
      DEVNET_MODE != true &&
      this.pools.filter(
        (pool: any) => (pool.serumMarket as string).toLowerCase() == (this.inputMarket as string).toLowerCase()
      ).length > 0
    ) {
      this.alreadyExists = true
    }
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

    let timer = setInterval(async () => {
      this.pools = this.poolsFormated()
      if (this.pools.length > 0) {
        clearInterval(timer)
      }
    }, 1000)
  }
  async confirmFarmInfo() {
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

      let fetchedFarm = await YieldFarm.loadFarm(connection, createdFarm.farmId, new PublicKey(FARM_PROGRAM_ID))
      if (fetchedFarm) {
        await fetchedFarm.addReward(wallet, userRewardTokenPubkey, initialRewardAmount * Math.pow(10, rewardDecimals))
        this.current += 1
      }
    } catch {
      console.log('creating farm failed')
    }
  }
  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  gotoFarms() {
    this.$router.push({ path: `/farms` })
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
    this.current = 5
  }
  createNewAMMID() {
    this.current++
  }
  onAmmIdSelect(liquidityInfo: LiquidityPoolInfo | undefined) {
    this.ammIdSelectShow = false
    if (liquidityInfo) {
      this.userCreateAmmId = liquidityInfo.ammId
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
          const liquidityListV5 = getPoolListByTokenMintAddresses(
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
      this.current = 1
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
        this.current = 2
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
        window.localStorage.token_last_updated_ = undefined
        window.localStorage.market_last_updated_ = undefined
        window.localStorage.pool_last_updated = undefined
        await this.$accessor.liquidity.requestInfos()
      })
      .catch((error) => {
        this.stepsStatus = 'error'
        this.current = 1
        this.createAmmFlag = false
        this.stepTitleInit = error.message
        throw error
      })
  }
}
</script>

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
  display: flex;
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

// class stylesheet
.create-pool-head {
  position: absolute;
  top: -3px;
  right: 45px;

  @media @max-sl-mobile {
    position: unset;
    margin-bottom: 38px;
    justify-content: flex-start;
  }
}

.create-pool {
  .design-pool {
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

      .item-title {
        margin-bottom: 28px;

        .created-amm-id {
          color: rgba(255, 255, 255, 0.6);
        }

        .inner-content {
          margin-top: 18px;

          label {
            color: rgba(255, 255, 255, 0.5);
          }

          input {
            background: rgba(226, 227, 236, 0.1);
            border-radius: 12px;
            padding: 10px;
            outline: 0;
            border: none;
            width: 100%;
            color: #fff;
            margin-top: 8px;

            &::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
          }

          .detailed-guide {
            margin-top: 28px;
            color: rgba(255, 255, 255, 0.6);

            a {
              color: #1e758f;
            }
          }
        }

        .market-input-group {
          margin-bottom: 28px;

          .market-input-form {
            input {
              background: rgba(226, 227, 236, 0.1);
              border-radius: 12px;
              padding: 10px 12px;
            }
          }
        }

        .token-mint-address {
          margin-top: 28px;

          .mint-address-container {
            margin-bottom: 28px;

            &:last-child {
              margin-bottom: 0;
            }

            .mint-label {
              color: rgba(255, 255, 255, 0.5);
            }

            .mint-address {
              background: rgba(226, 227, 236, 0.1);
              border-radius: 12px;
              padding: 10px 12px;
              color: rgba(255, 255, 255, 0.5);
              word-break: break-all;
              margin-top: 8px;
            }
          }
        }

        .pool-created {
          margin-bottom: 18px;
        }
      }

      .lp-icons {
        margin-bottom: 28px;

        .lp-icons-group {
          height: 30px;
          background: @gradient-color-outline;
          background-origin: border-box;
          border-radius: 8px;
          padding: 2px;

          .icons {
            height: 100%;
            background-color: @color-blue800;
            border-radius: 8px;
            align-items: center;
            padding: 6px 22px;
          }
        }
      }
    }
  }

  input[type='number'] {
    border: unset;
    background: transparent;
    border-bottom: 1px solid #fff;
  }
}
</style>

<style lang="less">
.create-pool-modal {
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
          font-weight: normal;
          color: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }
}
</style>
