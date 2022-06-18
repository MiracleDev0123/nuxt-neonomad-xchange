<template>
  <div>
    <div class="swap container">
      <div v-if="wsolBalance && wsolBalance.balance.fixed() > 0" class="note-unwrapped-sol">
        <div class="note-content">
          <img class="note-icon" src="@/assets/icons/status-warning.svg" />
          <label class="font-small weight-semi">
            You have {{ wsolBalance.balance.fixed() }} <span style="color: #23adb4">wrapped SOL</span> in your wallet.
            Click to unwrap to native SOL.
          </label>
        </div>
        <Button class="note-btn font-small weight-semi" @click="unwrap">Unwrap SOL</Button>
      </div>

      <CoinSelect v-if="coinSelectShow" @onClose="() => (coinSelectShow = false)" @onSelect="onCoinSelect" />
      <AmmIdSelect
        :show="ammIdSelectShow"
        :liquidity-list="ammIdSelectList"
        :user-close="true"
        @onClose="() => ((ammIdSelectShow = false), (ammIdSelectOld = true))"
        @onSelect="onAmmIdSelect"
      />

      <UnofficialPoolConfirmUser
        v-if="userCheckUnofficialShow"
        @onClose="() => (userCheckUnofficialShow = false)"
        @onSelect="onUserCheckUnofficialSelect"
      />

      <InputAmmIdOrMarket
        v-if="ammIdOrMarketSearchShow"
        @onClose="() => (ammIdOrMarketSearchShow = false)"
        @onInput="onAmmIdOrMarketInput"
      ></InputAmmIdOrMarket>

      <div class="card card-swap">
        <div class="card-body">
          <h4 class="weight-bold page-title">Swap</h4>
          <div class="information">
            <div class="tvl-info">
              <p class="font-large weight-semi">TVL : ${{ TVL.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}</p>
            </div>

            <div class="action-btn-group">
              <div class="reload-btn icon-cursor" :class="activeSpinning ? 'active' : ''" @click="reloadTimer">
                <img src="@/assets/icons/reload.svg" />
              </div>

              <a
                class="create-btn icon-cursor"
                @click="
                  () => {
                    this.createdGlobalState ? (this.createPoolModalOpening = true) : this.createGlobalState()
                  }
                "
              >
                <div v-if="isSuperOwner" class="create-plus-btn font-small weight-semi">
                  {{ this.createdGlobalState ? '+ Create pool' : '+ Create Program' }}
                </div>
              </a>
            </div>
          </div>
          <div class="information">
            <p class="font-large weight-semi">Circulating supply : {{ circulatingSupply.toLocaleString() }}</p>
          </div>
          <CoinInput
            v-model="fromCoinAmount"
            :balance-offset="fromCoin && fromCoin.symbol === 'SOL' ? -0.05 : 0"
            :mint-address="fromCoin ? fromCoin.mintAddress : ''"
            :coin-name="fromCoin ? fromCoin.symbol : ''"
            :balance="fromCoin ? fromCoin.balance : null"
            :show-max="true"
            :show-arrow="true"
            @onInput="(amount) => (fromCoinAmount = amount)"
            @onFocus="
              () => {
                fixedFromCoin = true
              }
            "
            @onMax="
              () => {
                fixedFromCoin = true
                fromCoinAmount = fromCoin && fromCoin.balance ? fromCoin.balance.fixed() : '0'
              }
            "
            @onSelect="openFromCoinSelect"
          />
          <div class="swap-vertical">
            <div>
              <img src="@/assets/icons/swap-horizontal.svg" @click="changeCoinPosition" class="icon-cursor m-auto" />
            </div>
          </div>

          <CoinInput
            v-model="toCoinAmount"
            :mint-address="toCoin ? toCoin.mintAddress : ''"
            :coin-name="toCoin ? toCoin.symbol : ''"
            :balance="toCoin ? toCoin.balance : null"
            :show-max="true"
            :show-arrow="true"
            :disabled="true"
            @onInput="(amount) => (toCoinAmount = amount)"
            @onFocus="
              () => {
                fixedFromCoin = false
              }
            "
            @onMax="
              () => {
                fixedFromCoin = false
                toCoinAmount = toCoin.balance.fixed()
              }
            "
            @onSelect="openToCoinSelect"
          />

          <div class="exchange-info">
            <div
              v-if="fromCoin && toCoin && isWrap && fromCoinAmount"
              class="font-small weight-semi price-base fcc-container"
            >
              <span>
                1 {{ fromCoin.symbol }} = 1
                {{ toCoin.symbol }}
              </span>
            </div>
            <div
              v-else-if="fromCoin && toCoin && !isWrap && fromCoinAmount"
              class="font-small weight-semi price-base fcc-container"
            >
              <span>
                1 {{ hasPriceSwapped ? toCoin.symbol : fromCoin.symbol }} =
                {{ hasPriceSwapped ? (1 / outToPirceValue).toFixed(6) : outToPirceValue }}
                {{ hasPriceSwapped ? fromCoin.symbol : toCoin.symbol }}
                <img
                  src="@/assets/icons/swap-vertical.svg"
                  @click="() => (hasPriceSwapped = !hasPriceSwapped)"
                  class="swap-icon"
                />
              </span>
            </div>
            <div
              v-else-if="fromCoin && toCoin && marketAddress && market && asks && bids && fromCoinAmount"
              class="font-small weight-semi price-base fcc-container"
            >
              <span>
                1 {{ hasPriceSwapped ? toCoin.symbol : fromCoin.symbol }} =
                {{ hasPriceSwapped ? (1 / outToPirceValue).toFixed(6) : outToPirceValue }}
                {{ hasPriceSwapped ? fromCoin.symbol : toCoin.symbol }}
                <img
                  src="@/assets/icons/swap-vertical.svg"
                  @click="() => (hasPriceSwapped = !hasPriceSwapped)"
                  class="swap-icon"
                />
              </span>
            </div>
          </div>

          <div v-if="wallet.connected">
            <div class="swap-actions fcsb-container">
              <div class="swap-status font-medium weight-semi">
                <div v-if="priceImpact <= 2" class="price-status">
                  <img class="status-icon" src="@/assets/icons/status-success.svg" />
                  <label class="font-medium weight-semi price-impact-green">Fair Price</label>
                </div>
                <div v-else-if="priceImpact > 2 && priceImpact <= 5" class="price-status">
                  <img class="status-icon" src="@/assets/icons/status-warning.svg" />
                  <label class="font-medium weight-semi price-impact-orange">Price impact Warning</label>
                </div>
                <div v-else-if="priceImpact > 5" class="price-status">
                  <img class="status-icon" src="@/assets/icons/status-error.svg" />
                  <label class="font-medium weight-semi price-impact-red">Price impact Warning</label>
                </div>
              </div>
              <div class="action-group">
                <div class="action-btn-container fcc-container icon-cursor">
                  <div
                    @click="
                      () => {
                        this.showSlippage = !this.showSlippage
                      }
                    "
                  >
                    <img class="setting-icon" src="@/assets/icons/setting.svg" />
                  </div>
                  <div v-if="showSlippage" class="slippage-container">
                    <input
                      class="slippage-input"
                      id="number"
                      type="number"
                      min="1"
                      max="100"
                      v-model="setting.slippage"
                      @keypress="validateNumber"
                    />
                  </div>
                </div>

                <div
                  class="action-btn-container fcc-container icon-cursor"
                  :class="activeSpinning ? 'loading' : ''"
                  @click="reloadTimer"
                >
                  <!-- {{ autoRefreshTime - countdown }} -->
                  <img class="load-icon" src="@/assets/icons/reload.svg" />
                </div>
              </div>
            </div>

            <div class="price-info">
              <div class="info-box">
                <span class="name">
                  <label class="font-small weight-bold">Pathway</label>
                  <Tooltip placement="bottomLeft">
                    <template slot="title">
                      This trade routes though the following tokens to give you the best price
                    </template>
                    <img src="@/assets/icons/info.svg" class="tooltip-icon icon-cursor" />
                  </Tooltip>
                </span>

                <span v-if="fromCoin && toCoin" class="pathway">
                  <div class="coin-box-container">
                    <div class="coin-box">
                      <CoinIcon :mint-address="fromCoin.mintAddress" />
                      <span class="font-small weight-semi">{{ fromCoin.symbol }}</span>
                    </div>
                  </div>
                  <img class="fst" src="@/assets/icons/swap-right.svg" />
                  <div v-if="midTokenSymbol" class="coin-box-container">
                    <div class="coin-box">
                      <CoinIcon :mint-address="midTokenMint" />
                      <span class="font-small weight-semi">{{ midTokenSymbol }}</span>
                    </div>
                  </div>
                  <img v-if="midTokenSymbol" class="fst" src="@/assets/icons/swap-right.svg" />
                  <div class="coin-box-container">
                    <div class="coin-box">
                      <CoinIcon :mint-address="toCoin.mintAddress" />
                      <span class="font-small weight-semi">{{ toCoin.symbol }}</span>
                    </div>
                  </div>
                </span>
              </div>

              <div v-if="priceImpact" class="info-box">
                <span class="name">
                  <label class="font-small weight-bold"> Price Impact </label>
                  <Tooltip placement="bottomLeft">
                    <template slot="title">
                      The difference between the market price and estimated price due to trade size
                    </template>
                    <img src="@/assets/icons/info.svg" class="tooltip-icon icon-cursor" />
                  </Tooltip>
                </span>
                <span class="value">
                  <label class="font-small weight-bold"> {{ priceImpact.toFixed(2) }}% </label>
                </span>
              </div>

              <div v-if="fromCoin && toCoin && fromCoinAmount && toCoinWithSlippage" class="info-box">
                <span class="name">
                  <label class="font-small weight-bold">Minimum Received</label>
                  <Tooltip placement="bottomLeft">
                    <template slot="title"> The least amount of tokens you will receive for this trade </template>
                    <img src="@/assets/icons/info.svg" class="tooltip-icon icon-cursor" />
                  </Tooltip>
                </span>
                <span class="value">
                  <label class="font-small weight-bold"> {{ toCoinWithSlippage }} {{ toCoin.symbol }} </label>
                </span>
              </div>
            </div>
          </div>

          <!-- <div v-if="officialPool === false">
          <div style="margin: 10px">
            <div>AMM ID:</div>
            <div>
              {{ mainAmmId ? mainAmmId.substr(0, 12) : '' }}
              ...
              {{ mainAmmId ? mainAmmId.substr(mainAmmId.length - 14, 14) : '' }}
            </div>
          </div>
        </div> -->

          <div v-if="!wallet.connected" class="btn-container">
            <Button class="btn-transparent font-large weight-bold" ghost @click="$accessor.wallet.openModal">
              Connect wallet
            </Button>
          </div>

          <div v-else-if="!(officialPool || (!officialPool && userCheckUnofficial))" class="btn-container">
            <Button
              class="btn-transparent font-large weight-bold"
              ghost
              @click="
                () => {
                  setTimeout(() => {
                    userCheckUnofficialShow = true
                  }, 1)
                }
              "
            >
              Confirm Risk Warning
            </Button>
          </div>

          <div v-else class="btn-container">
            <Button
              class="btn-transparent font-large weight-bold"
              :disabled="
                !fromCoin ||
                !fromCoinAmount ||
                !toCoin ||
                !this.mainAmmId ||
                (!marketAddress && !lpMintAddress && !isWrap && !best_dex_type) ||
                !initialized ||
                loading ||
                checkFromCoinAmount() || // not enough SOL to swap SOL to another coin
                (get(liquidity.infos, `${lpMintAddress}.status`) &&
                  get(liquidity.infos, `${lpMintAddress}.status`) !== 1) ||
                swaping
              "
              :loading="swaping"
              :class="`${priceImpact > 5 ? '' : priceImpact > 2 ? '' : ''}`"
              @click="placeOrder"
            >
              <template v-if="!fromCoin || !toCoin"> Select</template>
              <template v-else-if="(!marketAddress && !lpMintAddress && !isWrap && !best_dex_type) || !initialized">
                Insufficient liquidity for this trade
              </template>
              <template v-else-if="!fromCoinAmount"> Enter an amount </template>
              <template v-else-if="loading"> Updating price information </template>
              <template v-else-if="checkFromCoinAmount()"> Insufficient {{ fromCoin.symbol }} balance </template>
              <template
                v-else-if="
                  get(liquidity.infos, `${lpMintAddress}.status`) &&
                  get(liquidity.infos, `${lpMintAddress}.status`) !== 1
                "
              >
                Pool coming soon
              </template>
              <template v-else-if="best_dex_type === 'multi' && (needWrapSol() || needCreateTokens())"
                >Prepare two-step swap</template
              >
              <template v-else>{{ isWrap ? 'Unwrap' : priceImpact > 5 ? 'Exchange' : 'Exchange' }}</template>
            </Button>
          </div>
          <b style="color: #d2cbcb"> <i>If you have a new pair suggestion please contact us on telegram.</i></b>

          <!-- <div v-if="solBalance && +solBalance.balance.fixed() - 0.05 <= 0" class="not-enough-sol-alert">
          <span class="caution-text">Caution: Your SOL balance is low</span>

          <Tooltip placement="bottomLeft">
            <template slot="title">
              SOL is needed for Solana network fees. A minimum balance of 0.05 SOL is recommended to avoid failed
              transactions.
            </template>
            <Icon type="question-circle" />
          </Tooltip>
        </div> -->
        </div>
      </div>
      <div class="card-chart">
        <div class="card card-chart-container"><SwapTokenInfo /></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import { Tooltip, Button } from 'ant-design-vue'
import { cloneDeep, get } from 'lodash-es'
import { Market, Orderbook } from '@project-serum/serum/lib/market.js'
import { getTokenBySymbol, TokenInfo, NATIVE_SOL, TOKENS, WRAPPED_SOL } from '@/utils/tokens'
import { inputRegex, escapeRegExp } from '@/utils/regex'
import { getMultipleAccounts, commitment } from '@/utils/web3'
import { PublicKey } from '@solana/web3.js'
import { SERUM_PROGRAM_ID_V3, ENDPOINT_CRP, ENDPOINT_RAY, ENDPOINT_SRM } from '@/utils/ids'
import {
  getOutAmount,
  getSwapOutAmount,
  place,
  swap,
  twoStepSwap,
  wrap,
  checkUnsettledInfo,
  settleFund,
  prepareTwoStepSwap,
  unwrapWsol
} from '@/utils/swap'
import BigNumber from 'bignumber.js'
import { TokenAmount, gt } from '@/utils/safe-math'
import { getUnixTs } from '@/utils'
import { canWrap, getLiquidityInfoSimilar } from '@/utils/liquidity'
import { getPoolLocation } from '@/utils/pools'

import {
  getLpListByTokenMintAddresses,
  getPoolListByTokenMintAddresses,
  getCropperPoolListByTokenMintAddresses,
  getRaydiumPoolListByTokenMintAddresses,
  findBestLP,
  findBestCropperLP,
  isOfficalMarket,
  LiquidityPoolInfo
} from '@/utils/pools'

const ENDPOINT_MULTI_CRP = 'Two-Step Swap with CRP'
const ENDPOINT_MULTI_USDC = 'Two-Step Swap with USDC'
const ENDPOINT_MULTI_CRP_MIXED = 'Mixed two-Step Swap with CRP '
const ENDPOINT_MULTI_USDC_MIXED = 'Mixed Two-Step Swap with USDC'

export default Vue.extend({
  components: {
    Tooltip,
    Button
  },
  data() {
    return {
      TOKENS,
      TVL: 0 as number,
      circulatingSupply: 425134 as number,
      // should check if user have enough SOL to have a swap
      solBalance: null as TokenAmount | null,
      wsolBalance: null as TokenAmount | null,
      autoRefreshTime: 60,
      countdown: 0,
      marketTimer: null as any,
      initialized: false,
      loading: false,
      // swaping
      swaping: false,
      asks: {} as any,
      bids: {} as any,
      isFetchingUnsettled: false,
      unsettledOpenOrders: null as any,
      // whether have symbol will
      baseSymbol: '',
      baseUnsettledAmount: 0,
      isSettlingBase: false,
      quoteSymbol: '',
      quoteUnsettledAmount: 0,
      isSettlingQuote: false,
      coinSelectShow: false,
      selectFromCoin: true,
      fixedFromCoin: true,
      fromCoin: null as TokenInfo | null,
      toCoin: null as TokenInfo | null,
      fromCoinAmount: '',
      toCoinAmount: '',
      toCoinWithSlippage: '',
      midAmount: '', //multistep-swap
      midAmountWithSlippage: '', //multistep-swap
      // wrap
      isWrap: false,
      // serum
      market: null as any,
      marketAddress: '',
      // amm
      lpMintAddress: '',
      // trading endpoint
      endpoint: '',
      priceImpact: 0,
      coinBasePrice: true,
      outToPirceValue: 0,
      // whether user has toggle swap button
      hasPriceSwapped: false,
      officialPool: true,
      userCheckUnofficial: true,
      userCheckUnofficialMint: undefined as string | undefined,
      userCheckUnofficialShow: false,
      mainAmmId: undefined as string | undefined,

      available_dex: [] as string[],
      best_dex_type: undefined as string | undefined,
      midTokenSymbol: undefined as string | undefined,
      midTokenMint: undefined as string | undefined,
      extAmmId: undefined as string | undefined,
      ammIdSelectShow: false,
      ammIdSelectList: [] as LiquidityPoolInfo[] | [],
      ammIdSelectOld: false,
      ammIdOrMarketSearchShow: false,
      userNeedAmmIdOrMarket: undefined as string | undefined,
      setCoinFromMintLoading: false,
      asksAndBidsLoading: true,
      windowWidth: 0,
      // endpoint_crp: 'NeoNomad Pool',
      // endpoint_ray: 'Raydium Pool',
      sub_endpoint_1: undefined as string | undefined,
      sub_endpoint_2: undefined as string | undefined,

      endpoint_multi_crp: 'Two-Step Swap with CRP',
      endpoint_multi_usdc: 'Two-Step Swap with USDC',
      activeSpinning: false as boolean,
      showInformations: false as boolean,
      showSlippage: false as boolean,
      showPercentage: false as boolean
    }
  },
  head: {
    title: 'NeoNomad Finance - Swap'
  },
  computed: {
    ...mapState(['wallet', 'swap', 'liquidity', 'url', 'setting', 'token'])
  },
  watch: {
    fromCoinAmount(newAmount: string, oldAmount: string) {
      this.$nextTick(() => {
        console.log('start fromCoinAmount()')
        if (!inputRegex.test(escapeRegExp(newAmount))) {
          this.fromCoinAmount = oldAmount
        } else {
          this.updateAmounts()
        }
        console.log('end fromCoinAmount()')
      })
    },
    'wallet.tokenAccounts': {
      handler(newTokenAccounts: any) {
        console.log('start wallet.tokenAccounts()')
        this.updateCoinInfo(newTokenAccounts)
        this.findMarket()
        if (this.mainAmmId) {
          this.needUserCheckUnofficialShow(this.mainAmmId)
        }
        if (this.market) {
          this.fetchUnsettledByMarket()
        }
        this.solBalance = this.wallet.tokenAccounts[NATIVE_SOL.mintAddress]
        this.wsolBalance = this.wallet.tokenAccounts[WRAPPED_SOL.mintAddress]
        this.flush()

        const { from, to, ammId } = this.$route.query
        // @ts-ignore
        this.setCoinFromMint(ammId, from, to)

        if (!to) {
          this.toCoin = Object.values(TOKENS).find((item) => item.symbol === 'NNI')
        }

        if (!from) {
          this.fromCoin = Object.values(TOKENS).find((item) => item.symbol === 'USDC')
        }
        console.log('end wallet.tokenAccounts()')
      },
      deep: true
    },
    fromCoin(newCoin, oldCoin) {
      console.log('start fromCoin()')
      if (
        !this.setCoinFromMintLoading &&
        (oldCoin === null || newCoin === null || newCoin.mintAddress !== oldCoin.mintAddress)
      ) {
        this.userNeedAmmIdOrMarket = undefined
        this.best_dex_type = undefined
        this.findMarket()
        this.fromCoinAmount = ''
        this.toCoinAmount = ''
        this.ammIdSelectOld = false
      }
      console.log('end fromCoin()')
    },
    baseUnsettledAmount() {
      this.isSettlingBase = false
    },
    quoteUnsettledAmount() {
      this.isSettlingQuote = false
    },
    toCoin(newCoin, oldCoin) {
      console.log('start toCoin()')
      if (
        !this.setCoinFromMintLoading &&
        (oldCoin === null || newCoin === null || newCoin.mintAddress !== oldCoin.mintAddress)
      ) {
        this.userNeedAmmIdOrMarket = undefined
        this.best_dex_type = undefined
        this.findMarket()
        this.fromCoinAmount = ''
        this.toCoinAmount = ''
        this.ammIdSelectOld = false
      }
      console.log('end toCoin()')
    },
    market() {
      console.log('start market()')
      this.baseSymbol = ''
      this.baseUnsettledAmount = 0
      this.quoteSymbol = ''
      this.quoteUnsettledAmount = 0
      this.unsettledOpenOrders = null as any
      this.fetchUnsettledByMarket()
      console.log('end market()')
    },
    marketAddress() {
      this.updateAmounts()
    },
    asks() {
      this.updateAmounts()
    },
    bids() {
      this.updateAmounts()
    },
    'liquidity.infos': {
      handler(_newInfos: any) {
        const { from, to, ammId } = this.$route.query
        // @ts-ignore
        this.setCoinFromMint(ammId, from, to)
        this.findMarket()
      },
      deep: true
    },
    'token.initialized': {
      handler(newState: boolean) {
        this.toCoin = getTokenBySymbol('NNI')
        this.fromCoin = getTokenBySymbol('USDC')
        const { from, to, ammId } = this.$route.query
        // @ts-ignore
        this.setCoinFromMint(ammId, from, to)
      },
      deep: true
    },

    'swap.markets': {
      handler(_newInfos: any) {
        this.findMarket()
      },
      deep: true
    },
    'setting.slippage': {
      handler() {
        this.updateAmounts()
      },
      deep: true
    }
  },
  mounted() {
    this.getTvl()
    this.getCirculatingSupply()
    this.$accessor.token.loadTokens()
    this.$accessor.wallet.getTokenAccounts()
    this.updateCoinInfo(this.wallet.tokenAccounts)
    this.setMarketTimer()
    const { from, to, ammId } = this.$route.query
    // @ts-ignore
    this.setCoinFromMint(ammId, from, to)

    this.toCoin = Object.values(TOKENS).find((item) => item.symbol === 'NNI')
    this.fromCoin = Object.values(TOKENS).find((item) => item.symbol === 'USDC')
  },
  methods: {
    gt,
    get,
    async getCirculatingSupply() {
      // const supply = await fetch(
      //   'https://cors-anywhere.herokuapp.com/https://neonomad-api.azurewebsites.net/'
      // ).then((res) => res.json())
      // this.circulatingSupply = supply
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
    validateNumber(event: { target: { value: number }; preventDefault: () => void }) {
      if (event.target.value > 10) {
        event.preventDefault()
      }
    },
    openFromCoinSelect() {
      this.selectFromCoin = true
      this.closeAllModal('coinSelectShow')
      setTimeout(() => {
        this.coinSelectShow = true
      }, 1)
    },
    async flush() {
      clearInterval(this.marketTimer)
      this.countdown = 0
      this.setMarketTimer()
      this.$accessor.token.loadTokens()
      this.updateCoinInfo(this.wallet.tokenAccounts)
    },

    openToCoinSelect() {
      this.selectFromCoin = false
      this.closeAllModal('coinSelectShow')
      setTimeout(() => {
        this.coinSelectShow = true
      }, 1)
    },
    onCoinSelect(tokenInfo: TokenInfo) {
      console.log('start onCoinSelect')
      if (tokenInfo !== null) {
        if (this.selectFromCoin) {
          this.fromCoin = cloneDeep(tokenInfo)
          console.log('fromCoin', this.fromCoin)
          if (this.toCoin?.mintAddress === tokenInfo.mintAddress) {
            this.toCoin = null
            this.changeCoinAmountPosition()
          }
        } else {
          this.toCoin = cloneDeep(tokenInfo)
          console.log('toCoin', this.toCoin)
          if (this.fromCoin?.mintAddress === tokenInfo.mintAddress) {
            this.fromCoin = null
            this.changeCoinAmountPosition()
          }
        }
      } else {
        // check coin
        if (this.fromCoin !== null) {
          const newFromCoin = Object.values(TOKENS).find((item) => item.mintAddress === this.fromCoin?.mintAddress)
          if (newFromCoin === null || newFromCoin === undefined) {
            this.fromCoin = null
          }
        }
        if (this.toCoin !== null) {
          const newToCoin = Object.values(TOKENS).find((item) => item.mintAddress === this.toCoin?.mintAddress)
          if (newToCoin === null || newToCoin === undefined) {
            this.toCoin = null
          }
        }
      }
      this.coinSelectShow = false
      console.log('end onCoinSelect')
    },
    setCoinFromMint(ammIdOrMarket: string | undefined, from: string | undefined, to: string | undefined) {
      console.log('start setCoinFromMint')
      this.setCoinFromMintLoading = true
      let fromCoin, toCoin
      try {
        this.userNeedAmmIdOrMarket = ammIdOrMarket
        // @ts-ignore
        // const liquidityUser = getLiquidityInfoSimilar(ammIdOrMarket, from, to)
        // if (liquidityUser) {
        //   if (from) {
        //     fromCoin = liquidityUser.coin.mintAddress === from ? liquidityUser.coin : liquidityUser.pc
        //     toCoin = liquidityUser.coin.mintAddress === fromCoin.mintAddress ? liquidityUser.pc : liquidityUser.coin
        //   }
        //   if (to) {
        //     toCoin = liquidityUser.coin.mintAddress === to ? liquidityUser.coin : liquidityUser.pc
        //     fromCoin = liquidityUser.coin.mintAddress === toCoin.mintAddress ? liquidityUser.pc : liquidityUser.coin
        //   }
        //   if (!(from && to)) {
        //     fromCoin = liquidityUser.coin
        //     toCoin = liquidityUser.pc
        //   }
        // }

        fromCoin =
          from == NATIVE_SOL.mintAddress ? NATIVE_SOL : Object.values(TOKENS).find((item) => item.mintAddress === from)
        toCoin =
          to == NATIVE_SOL.mintAddress ? NATIVE_SOL : Object.values(TOKENS).find((item) => item.mintAddress === to)
        if (fromCoin || toCoin) {
          if (fromCoin) {
            fromCoin.balance = get(this.wallet.tokenAccounts, `${fromCoin.mintAddress}.balance`)
            this.fromCoin = fromCoin
          }
          if (toCoin) {
            toCoin.balance = get(this.wallet.tokenAccounts, `${toCoin.mintAddress}.balance`)
            this.toCoin = toCoin
          }
        }
      } catch (error: any) {
        this.$notify.warning({
          message: error.message,
          description: ''
        })
      }
      setTimeout(() => {
        this.setCoinFromMintLoading = false
        this.findMarket()
      }, 1)
      console.log('end setCoinFromMint')
    },
    needUserCheckUnofficialShow(ammId: string) {
      if (!this.wallet.connected) {
        return
      }
      this.closeAllModal('userCheckUnofficialShow')
      setTimeout(() => {
        this.userCheckUnofficialShow = false
      }, 1)
    },
    onAmmIdSelect(liquidityInfo: LiquidityPoolInfo | undefined) {
      console.log('start onAmmIdSelect')
      this.ammIdSelectShow = false
      if (liquidityInfo) {
        this.lpMintAddress = liquidityInfo.lp.mintAddress
        this.mainAmmId = liquidityInfo.ammId
        this.userNeedAmmIdOrMarket = this.mainAmmId
        this.officialPool = true
        this.findMarket()
      } else {
        this.ammIdSelectOld = true
        this.findMarket()
      }
      console.log('end onAmmIdSelect')
    },
    onAmmIdOrMarketInput(ammIdOrMarket: string) {
      this.ammIdOrMarketSearchShow = false
      this.setCoinFromMint(ammIdOrMarket, undefined, undefined)
      this.findMarket()
    },
    onUserCheckUnofficialSelect(userSelect: boolean, userSelectAll: boolean) {
      this.userCheckUnofficialShow = false
      if (userSelect) {
        this.userCheckUnofficial = true
        this.userCheckUnofficialMint = this.mainAmmId
        if (userSelectAll) {
          const localCheckStr = localStorage.getItem(`${this.wallet.address}--checkAmmId`)
          if (localCheckStr) {
            localStorage.setItem(`${this.wallet.address}--checkAmmId`, localCheckStr + `---${this.mainAmmId}`)
          } else {
            localStorage.setItem(`${this.wallet.address}--checkAmmId`, `${this.mainAmmId}`)
          }
        }
      } else {
        this.fromCoin = null
        this.toCoin = null
        this.mainAmmId = undefined
        this.available_dex = []
        this.officialPool = true
      }
    },
    changeCoinPosition() {
      this.setCoinFromMintLoading = true
      const tempFromCoin = this.fromCoin
      const tempToCoin = this.toCoin
      const tempFromAmmId = this.mainAmmId
      const tempToAmmId = this.extAmmId
      setTimeout(() => {
        this.setCoinFromMintLoading = false
      }, 1)
      this.fromCoin = tempToCoin
      this.toCoin = tempFromCoin
      this.mainAmmId = tempToAmmId
      this.extAmmId = tempFromAmmId
      this.changeCoinAmountPosition()
    },
    changeCoinAmountPosition() {
      const tempFromCoinAmount = this.fromCoinAmount
      const tempToCoinAmount = this.toCoinAmount
      this.fromCoinAmount = tempToCoinAmount
      this.toCoinAmount = tempFromCoinAmount
    },
    updateCoinInfo(tokenAccounts: any) {
      if (this.fromCoin) {
        const fromCoin = tokenAccounts[this.fromCoin.mintAddress]
        if (fromCoin) {
          this.fromCoin = { ...this.fromCoin, ...fromCoin }
        }
      }
      if (this.toCoin) {
        const toCoin = tokenAccounts[this.toCoin.mintAddress]
        if (toCoin) {
          this.toCoin = { ...this.toCoin, ...toCoin }
        }
      }
    },
    checkFromCoinAmount() {
      return (
        parseFloat(this.fromCoinAmount) >
        parseFloat(
          this.fromCoin && this.fromCoin.balance
            ? this.fromCoin.symbol === 'SOL'
              ? this.fromCoin.balance
                  .toEther()
                  .minus(0.05)
                  .plus(
                    get(this.wallet.tokenAccounts, `${WRAPPED_SOL.mintAddress}.balance`)
                      ? get(this.wallet.tokenAccounts, `${WRAPPED_SOL.mintAddress}.balance`).toEther()
                      : 0
                  )
                  .toFixed(this.fromCoin.balance.decimals)
              : this.fromCoin.balance.fixed()
            : '0'
        )
      )
    },
    findMarket() {
      console.log('start findMarket')
      try {
        this.available_dex = []
        this.lpMintAddress = ''
        this.initialized = true
        this.mainAmmId = undefined
        this.officialPool = true
        if (this.fromCoin && this.toCoin && this.liquidity.initialized) {
          const InputAmmIdOrMarket = this.userNeedAmmIdOrMarket
          // let userSelectFlag = false
          // wrap & unwrap
          if (canWrap(this.fromCoin.mintAddress, this.toCoin.mintAddress)) {
            this.isWrap = true
            this.initialized = true
            this.officialPool = true
            this.mainAmmId = undefined
            return
          }

          if (this.fromCoin.mintAddress && this.toCoin.mintAddress) {
            do {
              // mono-step swap
              const crpLPList = getCropperPoolListByTokenMintAddresses(
                this.fromCoin.mintAddress === WRAPPED_SOL.mintAddress
                  ? NATIVE_SOL.mintAddress
                  : this.fromCoin.mintAddress,
                this.toCoin.mintAddress === WRAPPED_SOL.mintAddress ? NATIVE_SOL.mintAddress : this.toCoin.mintAddress,
                typeof InputAmmIdOrMarket === 'string' ? InputAmmIdOrMarket : undefined
              )
              if (crpLPList.length > 0) {
                this.available_dex.push(ENDPOINT_CRP)
              }

              //two-step swap with CRP
              const lpList_crp_1 = getCropperPoolListByTokenMintAddresses(
                this.fromCoin.mintAddress === WRAPPED_SOL.mintAddress
                  ? NATIVE_SOL.mintAddress
                  : this.fromCoin.mintAddress,
                TOKENS.NNI.mintAddress,
                undefined
              )
              const lpList_crp_2 = getCropperPoolListByTokenMintAddresses(
                TOKENS.NNI.mintAddress,
                this.toCoin.mintAddress === WRAPPED_SOL.mintAddress ? NATIVE_SOL.mintAddress : this.toCoin.mintAddress,
                undefined
              )
              if (lpList_crp_1.length > 0 && lpList_crp_2.length > 0) {
                this.available_dex.push(ENDPOINT_MULTI_CRP)
              }

              //two-step swap with USDC
              const lpList_usdc_1 = getCropperPoolListByTokenMintAddresses(
                this.fromCoin.mintAddress === WRAPPED_SOL.mintAddress
                  ? NATIVE_SOL.mintAddress
                  : this.fromCoin.mintAddress,
                TOKENS.USDC.mintAddress,
                undefined
              )
              const lpList_usdc_2 = getCropperPoolListByTokenMintAddresses(
                TOKENS.USDC.mintAddress,
                this.toCoin.mintAddress === WRAPPED_SOL.mintAddress ? NATIVE_SOL.mintAddress : this.toCoin.mintAddress,
                undefined
              )

              if (lpList_usdc_1.length > 0 && lpList_usdc_2.length > 0) {
                this.available_dex.push(ENDPOINT_MULTI_USDC)
              }

              if (this.available_dex.length > 0) {
                break
              }

              // mono-step swap using raydium
              const rayLPList = getRaydiumPoolListByTokenMintAddresses(
                this.fromCoin.mintAddress === WRAPPED_SOL.mintAddress
                  ? NATIVE_SOL.mintAddress
                  : this.fromCoin.mintAddress,
                this.toCoin.mintAddress === WRAPPED_SOL.mintAddress ? NATIVE_SOL.mintAddress : this.toCoin.mintAddress,
                typeof InputAmmIdOrMarket === 'string' ? InputAmmIdOrMarket : undefined
              )

              if (rayLPList.length > 0) {
                this.available_dex.push(ENDPOINT_RAY)
                break
              }

              // mono-step swap using serum market
              let marketAddress = ''
              for (const address of Object.keys(this.swap.markets)) {
                if (isOfficalMarket(address)) {
                  const info = cloneDeep(this.swap.markets[address])
                  let fromMint = this.fromCoin.mintAddress
                  let toMint = this.toCoin.mintAddress
                  if (fromMint === NATIVE_SOL.mintAddress) {
                    fromMint = WRAPPED_SOL.mintAddress
                  }
                  if (toMint === NATIVE_SOL.mintAddress) {
                    toMint = WRAPPED_SOL.mintAddress
                  }
                  if (
                    (info.baseMint.toBase58() === fromMint && info.quoteMint.toBase58() === toMint) ||
                    (info.baseMint.toBase58() === toMint && info.quoteMint.toBase58() === fromMint)
                  ) {
                    marketAddress = address
                    break
                  }
                }
              }

              if (marketAddress && this.marketAddress !== marketAddress) {
                this.isWrap = false
                this.marketAddress = marketAddress
                Market.load(this.$web3, new PublicKey(marketAddress), {}, new PublicKey(SERUM_PROGRAM_ID_V3)).then(
                  (market) => {
                    this.market = market
                    this.getOrderBooks()
                    this.available_dex.push(ENDPOINT_SRM)
                  }
                )
              }

              //two-step swap with CRP
              const lpList_crp_11 = getPoolListByTokenMintAddresses(
                this.fromCoin.mintAddress === WRAPPED_SOL.mintAddress
                  ? NATIVE_SOL.mintAddress
                  : this.fromCoin.mintAddress,
                TOKENS.NNI.mintAddress,
                undefined
              )
              const lpList_crp_12 = getPoolListByTokenMintAddresses(
                TOKENS.NNI.mintAddress,
                this.toCoin.mintAddress === WRAPPED_SOL.mintAddress ? NATIVE_SOL.mintAddress : this.toCoin.mintAddress,
                undefined
              )
              if (lpList_crp_11.length > 0 && lpList_crp_12.length > 0) {
                this.available_dex.push(ENDPOINT_MULTI_CRP_MIXED)
                break
              }

              //two-step swap with USDC
              const lpList_usdc_11 = getPoolListByTokenMintAddresses(
                this.fromCoin.mintAddress === WRAPPED_SOL.mintAddress
                  ? NATIVE_SOL.mintAddress
                  : this.fromCoin.mintAddress,
                TOKENS.USDC.mintAddress,
                undefined
              )
              const lpList_usdc_12 = getPoolListByTokenMintAddresses(
                TOKENS.USDC.mintAddress,
                this.toCoin.mintAddress === WRAPPED_SOL.mintAddress ? NATIVE_SOL.mintAddress : this.toCoin.mintAddress,
                undefined
              )
              if (lpList_usdc_11.length > 0 && lpList_usdc_12.length > 0) {
                this.available_dex.push(ENDPOINT_MULTI_USDC_MIXED)
                break
              }
            } while (false)
          }
          this.updateUrl()
          this.updateAmounts()
        } else {
          this.mainAmmId = undefined
          this.endpoint = ''
          this.marketAddress = ''
          this.market = null
          this.lpMintAddress = ''
          this.isWrap = false
        }
      } catch (e) {
        this.mainAmmId = undefined
        this.endpoint = ''
        this.marketAddress = ''
        this.market = null
        this.lpMintAddress = ''
        this.isWrap = false
      }
      console.log('end findMarket')
    },
    getOrderBooks() {
      console.log('start getOrderBooks')
      this.loading = true
      this.asksAndBidsLoading = true
      this.countdown = this.autoRefreshTime
      const conn = this.$web3
      if (this.marketAddress && get(this.swap.markets, this.marketAddress)) {
        const marketInfo = get(this.swap.markets, this.marketAddress)
        const { bids, asks } = marketInfo
        getMultipleAccounts(conn, [bids, asks], commitment)
          .then((infos) => {
            console.log('getMultipleAccounts->1', infos.length)
            infos.forEach((info) => {
              // @ts-ignore
              const data = info.account.data
              const orderbook = Orderbook.decode(marketInfo, data)
              const { isBids, slab } = orderbook
              if (isBids) {
                this.bids = slab
              } else {
                this.asks = slab
              }
              this.asksAndBidsLoading = false
            })
          })
          .finally(() => {
            this.initialized = true
            this.loading = false
            this.countdown = 0
          })
      } else {
        this.loading = false
      }
      console.log('end getOrderBooks')
    },
    updateAmounts() {
      console.log('start updateAmounts()')
      let max_coinAmount = 0

      try {
        if (this.fromCoinAmount == '') {
          this.best_dex_type = 'Unknown'
        }
        if (this.fromCoin && this.toCoin && this.fromCoinAmount) {
          if (this.isWrap) {
            // wrap & unwrap
            this.toCoinAmount = this.fromCoinAmount
            return
          }
          this.available_dex.forEach((dex_type) => {
            console.log('dex type', dex_type)
            if (dex_type == ENDPOINT_SRM) {
              if (this.marketAddress && this.market && this.asks && this.bids && !this.asksAndBidsLoading) {
                // serum
                const { amountOut, amountOutWithSlippage, priceImpact } = getOutAmount(
                  this.market,
                  this.asks,
                  this.bids,
                  // @ts-ignore
                  this.fromCoin.mintAddress,
                  // @ts-ignore
                  this.toCoin.mintAddress,
                  this.fromCoinAmount,
                  this.setting.slippage
                )

                // @ts-ignore
                const out = new TokenAmount(amountOut, this.toCoin.decimals, false)
                // @ts-ignore
                const outWithSlippage = new TokenAmount(amountOutWithSlippage, this.toCoin.decimals, false)

                if (!out.isNullOrZero()) {
                  // @ts-ignore
                  if (!toCoinWithSlippage || toCoinWithSlippage.wei.isLessThan(outWithSlippage.wei)) {
                    if (max_coinAmount < parseFloat(out.fixed())) {
                      max_coinAmount = parseFloat(out.fixed())
                      this.toCoinAmount = out.fixed()
                      this.toCoinWithSlippage = outWithSlippage.fixed()
                      this.outToPirceValue = +new TokenAmount(
                        parseFloat(this.toCoinAmount) / parseFloat(this.fromCoinAmount),
                        // @ts-ignore
                        this.toCoin.decimals,
                        false
                      ).fixed()
                      this.priceImpact = priceImpact
                      this.endpoint = ENDPOINT_SRM
                      this.best_dex_type = 'dex'
                    }
                  }
                }
              }
            } else if (dex_type == ENDPOINT_CRP || dex_type == ENDPOINT_RAY) {
              console.log('this.fromCoin!.mintAddress', this.fromCoin!.mintAddress)
              console.log('this.toCoin!.mintAddress', this.toCoin!.mintAddress)
              // @ts-ignore
              const poolInfo = (dex_type == ENDPOINT_CRP ? findBestCropperLP : findBestLP)(
                this.$accessor.liquidity.infos,
                this.fromCoin!.mintAddress,
                this.toCoin!.mintAddress,
                this.fromCoinAmount,
                this.setting.slippage
              )

              if (!poolInfo) return

              const { amountOut, amountOutWithSlippage, priceImpact } = getSwapOutAmount(
                poolInfo,
                // @ts-ignore
                this.fromCoin!.mintAddress,
                // @ts-ignore
                this.toCoin!.mintAddress,
                this.fromCoinAmount,
                this.setting.slippage
              )
              if (!amountOut.isNullOrZero()) {
                if (max_coinAmount < parseFloat(amountOut.fixed())) {
                  max_coinAmount = parseFloat(amountOut.fixed())

                  this.toCoinAmount = amountOut.fixed()
                  this.toCoinWithSlippage = amountOutWithSlippage.fixed()
                  this.outToPirceValue = +new TokenAmount(
                    parseFloat(this.toCoinAmount) / parseFloat(this.fromCoinAmount),
                    // @ts-ignore
                    this.toCoin.decimals,
                    false
                  ).fixed()
                  this.priceImpact = priceImpact
                  this.endpoint = dex_type

                  this.best_dex_type = 'single'
                  this.mainAmmId = poolInfo.ammId
                }
              }
            } else if (dex_type == ENDPOINT_MULTI_CRP || dex_type == ENDPOINT_MULTI_CRP_MIXED) {
              let midTokenMint = TOKENS.NNI.mintAddress
              this.midTokenMint = midTokenMint
              // @ts-ignore
              const fromPoolInfo = (dex_type == ENDPOINT_MULTI_CRP ? findBestCropperLP : findBestLP)(
                this.$accessor.liquidity.infos,
                this.fromCoin!.mintAddress,
                midTokenMint,
                this.fromCoinAmount,
                this.setting.slippage
              )

              if (!fromPoolInfo) return

              let { amountOut, amountOutWithSlippage, priceImpact } = getSwapOutAmount(
                fromPoolInfo,
                // @ts-ignore
                this.fromCoin!.mintAddress,
                midTokenMint,
                this.fromCoinAmount,
                this.setting.slippage
              )

              // @ts-ignore
              const toPoolInfo = (dex_type == ENDPOINT_MULTI_CRP ? findBestCropperLP : findBestLP)(
                this.$accessor.liquidity.infos,
                midTokenMint,
                this.toCoin!.mintAddress,
                amountOut.fixed(),
                this.setting.slippage
              )

              if (!toPoolInfo) return

              let final = getSwapOutAmount(
                toPoolInfo,
                midTokenMint,
                // @ts-ignore
                this.toCoin.mintAddress,
                amountOut.fixed(),
                this.setting.slippage
              )

              if (!final.amountOut.isNullOrZero()) {
                if (max_coinAmount < parseFloat(final.amountOut.fixed())) {
                  max_coinAmount = parseFloat(final.amountOut.fixed())
                  this.toCoinAmount = final.amountOut.fixed()
                  this.toCoinWithSlippage = final.amountOutWithSlippage.fixed()
                  this.midAmountWithSlippage = amountOutWithSlippage.fixed()
                  this.midAmount = amountOut.fixed()
                  this.outToPirceValue = +new TokenAmount(
                    parseFloat(this.toCoinAmount) / parseFloat(this.fromCoinAmount),
                    // @ts-ignore
                    this.toCoin.decimals,
                    false
                  ).fixed()

                  this.priceImpact = final.priceImpact
                  this.endpoint = ENDPOINT_MULTI_CRP

                  this.best_dex_type = 'multi'
                  this.midTokenSymbol = 'CRP'

                  this.sub_endpoint_1 = getPoolLocation(fromPoolInfo.version)
                  this.sub_endpoint_2 = getPoolLocation(toPoolInfo.version)
                  this.mainAmmId = fromPoolInfo.ammId
                  this.extAmmId = toPoolInfo.ammId
                }
              }
            } else if (dex_type == ENDPOINT_MULTI_USDC || dex_type == ENDPOINT_MULTI_USDC_MIXED) {
              let midTokenMint = TOKENS.USDC.mintAddress
              this.midTokenMint = midTokenMint

              // @ts-ignore
              const fromPoolInfo = (dex_type == ENDPOINT_MULTI_USDC ? findBestCropperLP : findBestLP)(
                this.$accessor.liquidity.infos,
                this.fromCoin!.mintAddress,
                midTokenMint,
                this.fromCoinAmount,
                this.setting.slippage
              )

              if (!fromPoolInfo) return

              let { amountOut, amountOutWithSlippage, priceImpact } = getSwapOutAmount(
                fromPoolInfo,
                // @ts-ignore
                this.fromCoin.mintAddress,
                midTokenMint,
                this.fromCoinAmount,
                this.setting.slippage
              )

              // @ts-ignore
              const toPoolInfo = (dex_type == ENDPOINT_MULTI_USDC ? findBestCropperLP : findBestLP)(
                this.$accessor.liquidity.infos,
                midTokenMint,
                this.toCoin!.mintAddress,
                amountOut.fixed(),
                this.setting.slippage
              )

              if (!toPoolInfo) return

              let final = getSwapOutAmount(
                toPoolInfo,
                midTokenMint,
                // @ts-ignore
                this.toCoin.mintAddress,
                amountOut.fixed(),
                this.setting.slippage
              )

              if (!final.amountOut.isNullOrZero()) {
                if (max_coinAmount < parseFloat(final.amountOut.fixed())) {
                  max_coinAmount = parseFloat(final.amountOut.fixed())
                  this.toCoinAmount = final.amountOut.fixed()
                  this.toCoinWithSlippage = final.amountOutWithSlippage.fixed()
                  this.midAmountWithSlippage = amountOutWithSlippage.fixed()
                  this.outToPirceValue = +new TokenAmount(
                    parseFloat(this.toCoinAmount) / parseFloat(this.fromCoinAmount),
                    // @ts-ignore
                    this.toCoin.decimals,
                    false
                  ).fixed()
                  this.priceImpact = final.priceImpact
                  this.endpoint = ENDPOINT_MULTI_USDC

                  this.best_dex_type = 'multi'
                  this.midTokenSymbol = 'USDC'

                  this.sub_endpoint_1 = getPoolLocation(fromPoolInfo.version)
                  this.sub_endpoint_2 = getPoolLocation(toPoolInfo.version)

                  this.mainAmmId = fromPoolInfo.ammId
                  this.extAmmId = toPoolInfo.ammId
                }
              }
            }
          })
        }
      } catch {}

      if (max_coinAmount === 0) {
        this.toCoinAmount = ''
        this.toCoinWithSlippage = ''
        this.outToPirceValue = 0
        this.priceImpact = 0
        this.endpoint = ''
        this.midTokenSymbol = undefined
      }
      console.log('end updateAmounts()')
    },
    setMarketTimer() {
      this.marketTimer = setInterval(() => {
        if (!this.loading) {
          if (this.countdown < this.autoRefreshTime) {
            this.countdown += 1
            if (this.countdown === this.autoRefreshTime) {
              this.getOrderBooks()
              this.$accessor.wallet.getTokenAccounts()
              if (this.$accessor.liquidity.initialized && this.$accessor.liquidity.loading == false) {
                this.$accessor.liquidity.requestInfos()
              }
              this.countdown = 0
            }
          }
        }
      }, 1000)
    },
    needCreateTokens() {
      if (this.fromCoin !== null && this.toCoin !== null) {
        let fromMint = this.fromCoin.mintAddress
        let midMint = this.midTokenMint
        let toMint = this.toCoin.mintAddress
        if (fromMint === NATIVE_SOL.mintAddress) fromMint = WRAPPED_SOL.mintAddress
        if (midMint === NATIVE_SOL.mintAddress) midMint = WRAPPED_SOL.mintAddress
        if (toMint === NATIVE_SOL.mintAddress) toMint = WRAPPED_SOL.mintAddress
        return !(
          get(this.wallet.tokenAccounts, `${fromMint}.tokenAccountAddress`) &&
          get(this.wallet.tokenAccounts, `${midMint}.tokenAccountAddress`) &&
          get(this.wallet.tokenAccounts, `${toMint}.tokenAccountAddress`)
        )
      }
      return false
    },

    needWrapSol() {
      if (this.fromCoin !== null) {
        if ([NATIVE_SOL.mintAddress, WRAPPED_SOL.mintAddress].includes(this.fromCoin.mintAddress)) {
          let amount = get(this.wallet.tokenAccounts, `${WRAPPED_SOL.mintAddress}.balance`)
          amount = Math.ceil((amount ? Number(amount.fixed()) : 0) * 10 ** 9)
          const fromCoinAmountData = Math.ceil(Number(this.fromCoinAmount) * 10 ** 9)
          if (fromCoinAmountData > amount) return fromCoinAmountData - amount
        }
      }
      return 0
    },

    unwrap() {
      const key = getUnixTs().toString()
      this.$notify.info({
        key,
        message: 'Making transaction...',
        description: '',
        duration: 0
      })

      unwrapWsol(
        this.$web3,
        // @ts-ignore
        this.$wallet,
        get(this.wallet.tokenAccounts, `${WRAPPED_SOL.mintAddress}.tokenAccountAddress`)
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

          const description = `Unwrap WSOL`
          this.$accessor.transaction.sub({ txid, description })
        })
        .catch((error) => {
          this.$notify.error({
            key,
            message: 'Unwrap WSOL failed',
            description: error.message
          })
        })
    },

    placeOrder() {
      this.swaping = true
      const key = getUnixTs().toString()
      this.$notify.info({
        key,
        message: 'Making transaction...',
        description: '',
        duration: 0
      })
      if (this.isWrap) {
        wrap(
          this.$axios,
          this.$web3,
          // @ts-ignore
          this.$wallet,
          // @ts-ignore
          this.fromCoin.mintAddress,
          // @ts-ignore
          this.toCoin.mintAddress,
          // @ts-ignore
          get(this.wallet.tokenAccounts, `${this.fromCoin.mintAddress}.tokenAccountAddress`),
          // @ts-ignore
          get(this.wallet.tokenAccounts, `${this.toCoin.mintAddress}.tokenAccountAddress`),
          this.fromCoinAmount
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
                      attrs: {
                        href: `${this.url.explorer}/tx/${txid}`,
                        target: '_blank'
                      }
                    },
                    'here'
                  )
                ])
            })
            const description = `Unwrap ${this.fromCoinAmount} ${this.fromCoin?.symbol} to ${this.toCoinAmount} ${this.toCoin?.symbol}`
            this.$accessor.transaction.sub({ txid, description })
          })
          .catch((error) => {
            this.$notify.error({
              key,
              message: 'Swap failed',
              description: error.message
            })
          })
          .finally(() => {
            this.swaping = false
            this.flush()
          })
      } else if (this.endpoint === ENDPOINT_CRP || this.endpoint === ENDPOINT_RAY) {
        const poolInfo = Object.values(this.$accessor.liquidity.infos).find((p: any) => p.ammId === this.mainAmmId)
        swap(
          this.$web3,
          // @ts-ignore
          this.$wallet,
          poolInfo,
          // @ts-ignore
          this.fromCoin.mintAddress,
          // @ts-ignore
          this.toCoin.mintAddress,
          // @ts-ignore
          get(this.wallet.tokenAccounts, `${this.fromCoin.mintAddress}.tokenAccountAddress`),
          // @ts-ignore
          get(this.wallet.tokenAccounts, `${this.toCoin.mintAddress}.tokenAccountAddress`),
          this.fromCoinAmount,
          this.toCoinWithSlippage,
          get(this.wallet.tokenAccounts, `${WRAPPED_SOL.mintAddress}.tokenAccountAddress`)
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
                      attrs: {
                        href: `${this.url.explorer}/tx/${txid}`,
                        target: '_blank'
                      }
                    },
                    'here'
                  )
                ])
            })
            const description = `Swap ${this.fromCoinAmount} ${this.fromCoin?.symbol} to ${this.toCoinAmount} ${this.toCoin?.symbol}`
            this.$accessor.transaction.sub({ txid, description })
          })
          .catch((error) => {
            this.$notify.error({
              key,
              message: 'Swap failed',
              description: error.message
            })
          })
          .finally(() => {
            this.swaping = false
            this.flush()
          })
      } else if (this.endpoint === ENDPOINT_MULTI_CRP || this.endpoint === ENDPOINT_MULTI_USDC) {
        if (this.needCreateTokens() || this.needWrapSol()) {
          let fromMint = this.fromCoin?.mintAddress
          let midMint = this.midTokenMint
          let toMint = this.toCoin?.mintAddress
          if (fromMint === NATIVE_SOL.mintAddress) fromMint = WRAPPED_SOL.mintAddress
          if (midMint === NATIVE_SOL.mintAddress) midMint = WRAPPED_SOL.mintAddress
          if (toMint === NATIVE_SOL.mintAddress) toMint = WRAPPED_SOL.mintAddress
          prepareTwoStepSwap(
            this.$web3,
            // @ts-ignore
            this.$wallet,
            // @ts-ignore
            fromMint,
            // @ts-ignore
            get(this.wallet.tokenAccounts, `${fromMint}.tokenAccountAddress`),
            // @ts-ignore
            midMint,
            get(this.wallet.tokenAccounts, `${midMint}.tokenAccountAddress`),
            // @ts-ignore
            toMint,
            // @ts-ignore
            get(this.wallet.tokenAccounts, `${toMint}.tokenAccountAddress`),
            this.needWrapSol()
          )
            .then((txid: string) => {
              this.$notify.info({
                key,
                message: 'Transaction has been sent',
                description: (h: any) =>
                  h('div', [
                    'Confirmation is in progress.  Check your transaction on ',
                    h(
                      'a',
                      {
                        attrs: {
                          href: `${this.url.explorer}/tx/${txid}`,
                          target: '_blank'
                        }
                      },
                      'here'
                    )
                  ])
              })
              const description = `Create Tokens`
              this.$accessor.transaction.sub({ txid, description })
            })
            .catch((error: Error) => {
              this.$notify.error({
                key,
                message: 'Create Tokens failed',
                description: error.message
              })
            })
            .finally(() => {
              this.swaping = false
              this.flush()
            })
        } else {
          const fromPoolInfo = Object.values(this.$accessor.liquidity.infos).find(
            (p: any) => p.ammId === this.mainAmmId
          )
          const toPoolInfo = Object.values(this.$accessor.liquidity.infos).find((p: any) => p.ammId === this.extAmmId)
          const midTokenSymbol = this.endpoint === ENDPOINT_MULTI_CRP ? TOKENS.NNI.symbol : TOKENS.USDC.symbol

          let fromMint = this.fromCoin?.mintAddress
          let midMint = this.midTokenMint
          let toMint = this.toCoin?.mintAddress

          if (fromMint === NATIVE_SOL.mintAddress) fromMint = WRAPPED_SOL.mintAddress
          if (midMint === NATIVE_SOL.mintAddress) midMint = WRAPPED_SOL.mintAddress
          if (toMint === NATIVE_SOL.mintAddress) toMint = WRAPPED_SOL.mintAddress

          twoStepSwap(
            this.$web3,
            // @ts-ignore
            this.$wallet,
            fromPoolInfo,
            toPoolInfo,
            // @ts-ignore
            this.fromCoin.mintAddress,
            // @ts-ignore
            this.midTokenMint,
            // @ts-ignore
            this.toCoin.mintAddress,
            // @ts-ignore
            get(this.wallet.tokenAccounts, `${fromMint}.tokenAccountAddress`),
            // @ts-ignore
            get(this.wallet.tokenAccounts, `${midMint}.tokenAccountAddress`),
            // @ts-ignore
            get(this.wallet.tokenAccounts, `${toMint}.tokenAccountAddress`),
            this.fromCoinAmount,
            this.midAmountWithSlippage,
            get(this.wallet.tokenAccounts, `${WRAPPED_SOL.mintAddress}.tokenAccountAddress`)
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
                        attrs: {
                          href: `${this.url.explorer}/tx/${txid}`,
                          target: '_blank'
                        }
                      },
                      'here'
                    )
                  ])
              })
              const description = `Swap ${this.fromCoinAmount} ${this.fromCoin?.symbol} to ${this.toCoinAmount} ${this.toCoin?.symbol}`
              this.$accessor.transaction.sub({ txid, description })
              this.flush()
            })
            .catch((error) => {
              this.$notify.error({
                key,
                message: 'Swap failed',
                description: error.message
              })
            })
            .finally(() => {
              this.swaping = false
              this.flush()
            })
        }
      } else {
        place(
          this.$web3,
          // @ts-ignore
          this.$wallet,
          this.market,
          this.asks,
          this.bids,
          // @ts-ignore
          this.fromCoin.mintAddress,
          // @ts-ignore
          this.toCoin.mintAddress,
          // @ts-ignore
          get(this.wallet.tokenAccounts, `${this.fromCoin.mintAddress}.tokenAccountAddress`),
          // @ts-ignore
          get(this.wallet.tokenAccounts, `${this.toCoin.mintAddress}.tokenAccountAddress`),
          this.fromCoinAmount,
          this.setting.slippage
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
                      attrs: {
                        href: `${this.url.explorer}/tx/${txid}`,
                        target: '_blank'
                      }
                    },
                    'here'
                  )
                ])
            })
            const description = `Swap ${this.fromCoinAmount} ${this.fromCoin?.symbol} to ${this.toCoinAmount} ${this.toCoin?.symbol}`
            this.$accessor.transaction.sub({ txid, description })
            this.flush()
          })
          .catch((error) => {
            this.$notify.error({
              key,
              message: 'Swap failed',
              description: error.message
            })
          })
          .finally(() => {
            this.swaping = false
            this.flush()
          })
      }
    },
    async updateUrl() {
      if (this.$route.path !== '/swap/') {
        return
      }
      const { from, to } = this.$route.query
      // if (this.ammId) {
      //   await this.$router.push({
      //     path: '/swap/',
      //     query: {
      //       ammId: this.ammId
      //     }
      //   })
      // } else
      if (this.fromCoin && this.toCoin) {
        if (this.fromCoin.mintAddress !== from || this.toCoin.mintAddress !== to) {
          await this.$router.push({
            path: '/swap/',
            query: {
              from: this.fromCoin.mintAddress,
              to: this.toCoin.mintAddress
            }
          })
        }
      } else if (!(this.$route.query && Object.keys(this.$route.query).length === 0)) {
        await this.$router.push({
          path: '/swap/'
        })
      }
    },
    closeAllModal(showName: string) {
      if (showName !== 'coinSelectShow') {
        this.coinSelectShow = false
      }
      if (showName !== 'ammIdSelectShow') {
        this.ammIdSelectShow = false
      }
      if (showName !== 'userCheckUnofficialShow') {
        this.userCheckUnofficialShow = false
      }
      if (showName !== 'ammIdOrMarketSearchShow') {
        this.ammIdOrMarketSearchShow = false
      }
    },
    async fetchUnsettledByMarket() {
      if (this.isFetchingUnsettled) return
      if (!this.$web3 || !this.$wallet || !this.market) return
      this.isFetchingUnsettled = true
      try {
        const info = await checkUnsettledInfo(this.$web3, this.$wallet, this.market)
        if (!info) throw new Error('not enough data')
        this.baseSymbol = info.baseSymbol ?? ''
        this.baseUnsettledAmount = info.baseUnsettledAmount
        this.quoteSymbol = info.quoteSymbol ?? ''
        this.quoteUnsettledAmount = info.quoteUnsettledAmount
        this.unsettledOpenOrders = info.openOrders // have to establish an extra state, to store this value
        this.flush()
      } catch (e) {
      } finally {
        this.isFetchingUnsettled = false
      }
    },
    settleFunds(from: 'base' | 'quote') {
      const key = getUnixTs().toString()
      this.$notify.info({
        key,
        message: 'Making transaction...',
        description: '',
        duration: 0
      })
      let baseMint = (this.market as Market).baseMintAddress.toBase58()
      let quoteMint = (this.market as Market).quoteMintAddress.toBase58()
      let baseWallet = get(this.wallet.tokenAccounts, `${baseMint}.tokenAccountAddress`)
      let quoteWallet = get(this.wallet.tokenAccounts, `${quoteMint}.tokenAccountAddress`)
      if (from === 'quote') {
        ;[baseWallet, quoteWallet] = [quoteWallet, baseWallet]
        ;[baseMint, quoteMint] = [quoteMint, baseMint]
      }
      if (from === 'quote') {
        this.isSettlingQuote = true
      } else {
        this.isSettlingBase = true
      }
      settleFund(
        this.$web3,
        this.market,
        this.unsettledOpenOrders,
        this.$wallet,
        baseMint,
        quoteMint,
        baseWallet,
        quoteWallet
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
          const description = `Settle`
          this.$accessor.transaction.sub({ txid, description })
        })
        .then(() => {
          this.fetchUnsettledByMarket()
          this.flush()
        })
        .catch((error) => {
          this.$notify.error({
            key,
            message: 'Settle failed',
            description: error.message
          })
          this.isSettlingQuote = false
          this.isSettlingBase = false
        })
    },
    reloadTimer() {
      this.activeSpinning = true
      setTimeout(() => {
        this.activeSpinning = false
      }, 1000)
      this.getOrderBooks()
      this.flush()
      this.$accessor.wallet.getTokenAccounts()
    }
  }
})
</script>

<style lang="less" scoped>
.btn-container {
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 3px;
  height: auto;
}

.swap.container {
  max-width: 1250px;
  width: 100%;
  margin-top: 50px;
  margin-bottom: 20px;
  padding: 15px;
  margin-left: auto;
  margin-right: auto;
  min-height: calc(100vh - 64px - 82px);
  align-items: flex-start !important;
  justify-content: space-between;
  display: flex;

  @media @max-lg-tablet {
    display: block;
  }

  .note-unwrapped-sol {
    max-width: 440px;
    background: @color-blue700;
    border-radius: 18px;
    padding: 8px 18px;
    margin: auto auto 12px auto;
    display: flex;
    align-items: center;

    .note-content {
      display: flex;
      align-items: baseline;

      .note-icon {
        margin-right: 8px;
      }
    }

    .note-btn {
      background: @gradient-color01;
      box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
      border-radius: 48px;
      border: none;
      width: 108px;
      height: 33px;

      &:hover {
        background: @gradient-color02;
      }

      @media @max-lg-tablet {
        margin: 10px auto auto auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .card-swap {
    max-width: 400px;
    min-width: 400px;
  }

  .card-chart {
    width: 100%;
    padding-left: 30px;

    @media @max-lg-tablet {
      padding-left: 0;
      margin-top: 30px;
    }
    .card-chart-container {
      padding: 20px;
      width: 100%;
    }
  }

  .card {
    display: inline-block;
    position: relative;
    z-index: 0;
    border-radius: 18px;
    box-shadow: inset 0 0 28px #2d0b50e1;
    background: rgba(129, 116, 245, 0.5);

    .card-body {
      background: transparent;
      padding: 12px 18px;

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

      .page-title {
        letter-spacing: 0.5px;
        color: #e0f4f6;
      }

      .exchange-info {
        .swap-icon {
          margin-left: 10px;
          cursor: pointer;
        }

        .price-base {
          letter-spacing: 0.5px;
          color: @color-blue100;
        }
      }

      .swap-actions {
        margin-bottom: 8px;

        .swap-status {
          .price-status {
            display: flex;
            align-items: center;

            .status-icon {
              margin-right: 9px;
            }
          }
        }
        .action-group {
          display: flex;

          .action-btn-container {
            position: relative;
            width: 24px;
            height: 24px;
            background: @color-blue600;
            border-radius: 8px;
            margin-right: 8px;

            &:last-child {
              margin-right: 0;
            }

            &.loading .load-icon {
              transform: rotate(360deg);
              transition: all 1s ease-in-out;
            }

            .slippage-container {
              position: absolute;
              top: 30px;
              right: 0;
              background: @gradient-color-primary;
              background-origin: border-box;
              border: 2px solid rgba(255, 255, 255, 0.14);
              box-shadow: 18px 11px 14px rgba(0, 0, 0, 0.25);
              border-radius: 8px;
              padding: 12px;
              width: 178px;
              z-index: 999;

              .slippage-input {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.14);
                box-sizing: border-box;
                border-radius: 6px;
                width: 100%;
                outline: none;
                padding: 5px 12px;

                &::-webkit-outer-spin-button,
                &::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
              }

              &::after {
                content: '%';
                position: absolute;
                top: 18px;
                left: 55px;
                transition: all 0.05s ease-in-out;
              }
            }
          }
        }
      }

      .price-info {
        display: grid;
        grid-auto-rows: auto;
        grid-row-gap: 8px;
        row-gap: 8px;
        padding: 12px;
        background: @color-blue800;
        border-radius: 18px;

        .info-box {
          .name {
            display: flex;
            align-items: center;
            color: @color-blue200;
            margin-bottom: 4px;

            .tooltip-icon {
              margin-left: 5px;
            }
          }

          .value {
            color: @color-blue100;
          }

          .pathway {
            display: flex;

            .coin-box-container {
              background: @gradient-color-outline;
              padding: 2px;
              border-radius: 8px;

              .coin-box {
                display: flex;
                align-items: center;
                height: 100%;
                padding: 8px;
                background: @color-blue800;
                border-radius: 8px;

                img {
                  width: 12px;
                  height: 12px;
                  margin-right: 4px;
                  border-radius: 50%;
                }
              }
            }

            .fst {
              margin: 10px;
            }
          }
        }
      }
    }

    @media @max-lg-tablet {
      min-width: 100%;
    }

    // @media @max-sm-mobile {

    // }

    // @media @max-xs-mobile {

    // }
  }
}

// global stylesheet
.btn-transparent {
  background: transparent;
  border-radius: 8px;
  border: none;
  height: 44px;
  width: 100%;

  &[disabled]:focus,
  &[disabled]:hover {
    background: transparent;
    border: none;
  }
}

.price-impact-orange {
  color: #ffb900 !important;
}

.price-impact-green {
  color: #31b79f !important;
}

.price-impact-red {
  color: #fda095 !important;
}

.swap-vertical {
  display: flex;
  justify-content: center;
  margin-bottom: -8px;

  div {
    background: linear-gradient(rgba(75, 85, 231, 0.65098), rgba(182, 97, 150, 0.74902));
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    transition: 0.3s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

// .not-enough-sol-alert {
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   gap: 8px;
//   margin-top: 4px;
// }
</style>

<style lang="less">
// ant customize
.ant-tooltip-inner {
  width: 160px;
}

.ant-tooltip-arrow {
  display: none;
}
</style>
