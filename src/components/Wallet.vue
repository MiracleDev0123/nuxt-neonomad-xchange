<template>
  <div class="wallet">
    <div class="wallet-btn">
      <div
        class="btncontainer"
        :class="!wallet.connected ? 'unconnected' : 'connected'"
        v-if="!wallet.connected"
        ghost
        @click="openPopIn"
      >
        <Button class="font-body-small weight-bold">
          <img src="@/assets/icons/wallet.svg" style="margin-right: 10px" />
          {{ windowWidth >= 768 ? 'Connect wallet' : 'Connect' }}
        </Button>
      </div>

      <div
        class="btncontainer"
        :class="!wallet.connected ? 'unconnected' : 'connected'"
        v-else
        ghost
        @click="$accessor.wallet.openModal"
      >
        <Button class="font-body-small weight-bold">
          <img src="@/assets/icons/wallet.svg" style="margin-right: 10px" />
          {{ wallet.address.substr(0, 4) }}
          ...
          {{ wallet.address.substr(wallet.address.length - 4, 4) }}
        </Button>
      </div>

      <Modal
        :title="!wallet.connected ? 'Connect to a wallet' : 'Your wallet'"
        :visible="wallet.modalShow && isModal"
        :footer="null"
        :closable="false"
        class="connect-modal"
        centered
        @cancel="$accessor.wallet.closeModal"
      >
        <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$accessor.wallet.closeModal" />
        <div v-if="!wallet.connected" class="select-wallet">
          <Button v-for="(info, name) in wallets" :key="name" ghost @click="connect(name, info)">
            <img :src="importIcon(`/wallets/${name.replace(' ', '-').toLowerCase()}.png`)" />
            <span>{{ name }}</span>
          </Button>
          <p style="line-height: normal">New here? <a>Get started on NeoNomad</a></p>
        </div>
        <div v-else class="wallet-info">
          <p class="address font-medium">{{ wallet.address }}</p>
          <Button class="btn-gradient font-large weight-bold" @click="disconnect"> Disconnect </Button>
        </div>
      </Modal>
    </div>

    <div v-if="!wallet.connected && popIn" class="wallet-list" v-click-outside="outPopIn">
      <div class="select-wallet-header fcsb-container">
        <span class="font-large weight-bold">Connect wallet</span>
        <img class="close-icon icon-cursor" src="@/assets/icons/close-circle.svg" @click="closePopIn" />
      </div>

      <div v-if="!wallet.connected" class="select-wallet">
        <Button v-for="(info, name) in wallets" :key="name" class="select-wallet-btn" @click="connect(name, info)">
          <img :src="importIcon(`/wallets/${name.replace(' ', '-').toLowerCase()}.png`)" />
          <span>{{ name }}</span>
        </Button>
        <p style="line-height: normal">New here? <a>Get started on NeoNomad</a></p>
      </div>
      <div v-else class="wallet-info">
        <p class="address font-medium">{{ wallet.address }}</p>
        <Button class="btn-gradient font-large weight-bold" @click="disconnect"> Disconnect </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'nuxt-property-decorator'
import { Button, Modal, Icon, Progress } from 'ant-design-vue'
import {
  AccountInfo,
  Context
  // PublicKey
} from '@solana/web3.js'
import importIcon from '@/utils/import-icon'
import logger from '@/utils/logger'
import { commitment } from '@/utils/web3'
import LocalStorage from '@/utils/local-storage'
import type { WalletAdapter } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolongWalletAdapter } from '@solana/wallet-adapter-solong'
import { MathWalletWalletAdapter } from '@solana/wallet-adapter-mathwallet'
import { SolletWalletAdapter } from '@solana/wallet-adapter-sollet'
import { LedgerWalletAdapter, getDerivationPath } from '@solana/wallet-adapter-ledger'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { Coin98WalletAdapter } from '@solana/wallet-adapter-coin98'
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope'
import { SafePalWalletAdapter } from '@solana/wallet-adapter-safepal'
//import { BloctoWalletAdapter } from '@solana/wallet-adapter-blocto'
//import { BitpieWalletAdapter } from '@solana/wallet-adapter-bitpie'
import {
  // getLedgerWallet,
  // getPhantomWallet,
  // getSlopeWallet,
  // getSolflareWallet,
  getSolletExtensionWallet
  // getSolletWallet,
  // getTorusWallet,
} from '@solana/wallet-adapter-wallets'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
// import { TorusWalletAdapter } from '@solana/wallet-adapter-torus'
import { TokenAmount } from '@/utils/safe-math'
import { TOKENS } from '@/utils/tokens'
import {
  setAnchorProvider,
  getFarmState,
  getExtraRewardConfigs,
  getAllPools,
  getPoolUserAccount,
  calculateTiers,
  TIERS_XCRP
} from '@/utils/crp-stake'
const Vco = require('v-click-outside')
const network = WalletAdapterNetwork.Devnet
// declare const window: any

// fix: Failed to resolve directive: ant-portal
Vue.use(Modal)
Vue.use(Vco)

interface WalletInfo {
  // official website
  website: string
  // provider url for web wallet
  providerUrl?: string
  // chrome extension install url
  chromeUrl?: string
  // firefox extension install url
  firefoxUrl?: string
  // isExtension: boolean
  getAdapter: (providerUrl?: string) => WalletAdapter
}

@Component({
  components: {
    Button,
    Modal,
    Icon,
    Progress
  }
})
export default class Wallet extends Vue {
  /* ========== DATA ========== */
  // TrustWallet ezDeFi
  wallets: { [key: string]: WalletInfo } = {
    Phantom: {
      website: 'https://phantom.app',
      chromeUrl: 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa',
      getAdapter() {
        return new PhantomWalletAdapter()
      }
    },
    'Solflare Extension': {
      website: 'https://solflare.com',
      firefoxUrl: 'https://addons.mozilla.org/en-US/firefox/addon/solflare-wallet',
      getAdapter() {
        return new SolflareWalletAdapter()
      }
    },
    'Sollet Web': {
      website: 'https://www.sollet.io',
      providerUrl: 'https://www.sollet.io',
      getAdapter(providerUrl) {
        return new SolletWalletAdapter({ provider: providerUrl })
      }
    },
    'Sollet Extension': {
      website: '',
      chromeUrl: 'https://chrome.google.com/webstore/detail/sollet/fhmfendgdocmcbmfikdcogofphimnkno',
      getAdapter() {
        return getSolletExtensionWallet().adapter()
      }
    },
    Ledger: {
      website: 'https://www.ledger.com',
      getAdapter() {
        return new LedgerWalletAdapter({ derivationPath: getDerivationPath() })
      }
    },
    MathWallet: {
      website: 'https://mathwallet.org',
      chromeUrl: 'https://chrome.google.com/webstore/detail/math-wallet/afbcbjpbpfadlkmhmclhkeeodmamcflc',
      getAdapter() {
        return new MathWalletWalletAdapter()
      }
    },
    Solong: {
      website: 'https://solongwallet.com',
      chromeUrl: 'https://chrome.google.com/webstore/detail/solong/memijejgibaodndkimcclfapfladdchj',
      getAdapter() {
        return new SolongWalletAdapter()
      }
    },
    Coin98: {
      website: 'https://www.coin98.com',
      chromeUrl: 'https://chrome.google.com/webstore/detail/coin98-wallet/aeachknmefphepccionboohckonoeemg',
      getAdapter() {
        return new Coin98WalletAdapter()
      }
    },
    /* Blocto: {
      website: 'https://blocto.portto.io',
      getAdapter() {
        return new BloctoWalletAdapter()
      }
    }, */
    Safepal: {
      website: 'https://safepal.io',
      getAdapter() {
        return new SafePalWalletAdapter()
      }
    },
    Slope: {
      website: 'https://slope.finance',
      chromeUrl: 'https://chrome.google.com/webstore/detail/slope-finance-wallet/pocmplpaccanhmnllbbkpgfliimjljgo',

      //@ts-ignore
      getAdapter() {
        return new SlopeWalletAdapter()
      }
    },
    /*
    Bitpie: {
      website: 'https://bitpie.com',
      getAdapter() {
        return new BitpieWalletAdapter()
      }
    },
    */
    // Torus: {
    //   website: 'https://tor.us',
    //   getAdapter() {
    //     return new TorusWalletAdapter({
    //       options: {
    //         clientId: ''
    //       }
    //     })
    //   }
    // },
    'Solflare Web': {
      website: 'https://solflare.com',
      providerUrl: 'https://solflare.com/access-wallet',
      getAdapter(providerUrl) {
        return new SolletWalletAdapter({ provider: providerUrl })
      }
    }
  }

  connectingWallet = {
    name: null as string | null,
    adapter: null as WalletAdapter | null
  }

  // autoConnect
  lastWalletName = LocalStorage.get('WALLET_NAME')

  sonarUrl: any = ''

  // auto refresh
  walletTimer: number | undefined = undefined
  priceTimer: number | undefined = undefined
  liquidityTimer: number | undefined = undefined
  farmTimer: number | undefined = undefined
  idoTimer: number | undefined = undefined
  crpbalance: any = undefined
  // web3 listener
  tierloaded: boolean = false
  walletListenerId = null as number | null

  debugCount = 0

  // menu
  popIn = false as boolean
  isModal = true as boolean
  showTierInfo = false as boolean

  // tier
  userStaked = 0 as number
  pctToNexttiers = 0 as number
  userTier = 0 as number
  currentTiers = 0 as number
  nextTiers = 1 as number

  // window
  windowWidth = window.innerWidth as any

  /* ========== COMPUTED ========== */
  get wallet() {
    return this.$accessor.wallet
  }

  get price() {
    return this.$accessor.price
  }

  get liquidity() {
    return this.$accessor.liquidity
  }

  get farm() {
    return this.$accessor.farm
  }

  get ido() {
    return this.$accessor.ido
  }

  // history
  get historyList() {
    const rawList = Object.entries(this.$accessor.transaction.history[this.$accessor.wallet.address] ?? {}).map(
      ([txid, txInfo]) => ({
        ...(txInfo as any),
        txid
      })
    )
    return rawList.sort((a, b) => {
      return (b.time || b.t) - (a.time || a.t)
    })
  }

  /* ========== LIFECYCLE ========== */
  async beforeMount() {
    await this.$accessor.token.loadTokens()
    await this.$accessor.price.requestPrices()
    await this.$accessor.liquidity.requestInfos()
    await this.$accessor.swap.getMarkets()
    await this.$accessor.farm.requestInfos()

    this.setWalletTimer()
    this.setPriceTimer()
    this.setLiquidityTimer()
    this.setFarmTimer()
    this.setIdoTimer()
  }

  mounted() {
    this.autoConnect()
    this.getTiersInfo()

    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
    })
  }

  beforeDestroy() {
    window.clearInterval(this.walletTimer)
    window.clearInterval(this.priceTimer)
    window.clearInterval(this.liquidityTimer)
    window.clearInterval(this.farmTimer)
    window.clearInterval(this.idoTimer)
    window.removeEventListener('resize', this.onResize)
  }

  /* ========== WATCH ========== */
  @Watch('wallet.conneected', { immediate: true, deep: true }) handler(connected: any) {
    this.getTiersInfo()
  }
  /* ========== METHODS ========== */
  importIcon = importIcon

  autoConnect() {
    const name = this.lastWalletName
    if (name && !this.$accessor.wallet.connected) {
      const info = this.wallets[name]
      if (info) {
        this.connect(name, info)
      }
    }
  }

  async getTiersInfo() {
    setAnchorProvider(this.$web3, this.$wallet)

    if (!this.$accessor.token.initialized || !this.$wallet?.connected) {
      return
    }

    let crpbalanceDatas = this.wallet.tokenAccounts[TOKENS['NNI'].mintAddress]

    if (crpbalanceDatas) {
      this.crpbalance = crpbalanceDatas.balance.fixed() * 1
    }

    let tiers_info = {
      tiers: 0,
      xCRP: 0
    }

    try {
      const farm_state = await getFarmState()
      const extraRewardConfigs = await getExtraRewardConfigs()

      const pools = await getAllPools()
      const current_pool = pools[0]
      const userAccount = await getPoolUserAccount(this.$wallet, current_pool.publicKey)

      //@ts-ignore
      this.userStaked = Number(new TokenAmount(userAccount.amount, TOKENS['NNI'].decimals).fixed(3))

      tiers_info = calculateTiers(this.userStaked, userAccount.lockDuration.toNumber())
    } catch {}

    this.$accessor.wallet.setStakingTiers(tiers_info)

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

    this.tierloaded = true
  }

  onConnect() {
    const { name, adapter } = this.connectingWallet

    this.$accessor.wallet.closeModal().then(() => {
      if (adapter && adapter.publicKey) {
        // mock wallet
        // const address = new PublicKey('')
        // Vue.prototype.$wallet = {
        //   connected: true,
        //   publicKey: address,
        //   signTransaction: (transaction: any) => {
        //     console.log(transaction)
        //   }
        // }
        // this.$accessor.wallet.setConnected(address.toBase58())

        Vue.prototype.$wallet = adapter
        this.$accessor.wallet.setConnected(adapter.publicKey.toBase58())

        this.subWallet()
        this.$notify.success({
          message: 'Wallet connected',
          description: `Connected with ${name}`
          // icon: (h: any) => {
          //   return h(
          //     'anticon',
          //     {
          //       props: {
          //         type: 'info-circle',
          //         theme: 'filled'
          //       },
          //     },
          //   );
          // },
        })

        LocalStorage.set('WALLET_NAME', name)
      }
    })

    this.isModal = true
  }

  onDisconnect() {
    this.disconnect()
  }

  disconnect() {
    this.connectingWallet = {
      name: null,
      adapter: null
    }

    try {
      Vue.prototype.$wallet.disconnect()
    } catch (error) {}

    Vue.prototype.$wallet = null

    this.unsubWallet()

    this.$accessor.wallet.setDisconnected()
    this.$notify.warning({
      message: 'Wallet disconnected',
      description: ''
    })

    this.isModal = false
  }

  onWalletError(error: Error) {
    const { name } = this.connectingWallet

    if (name) {
      const info = this.wallets[name]

      if (info) {
        const { website, chromeUrl, firefoxUrl } = info

        if (['WalletNotFoundError', 'WalletNotInstalledError', 'WalletNotReadyError'].includes(error.name)) {
          const errorName = error.name
            .replace('Error', '')
            .split(/(?=[A-Z])/g)
            .join(' ')

          this.$notify.error({
            message: errorName,
            description: (h: any) => {
              const msg = [
                `Please install and initialize ${name} wallet extension first, `,
                h('a', { attrs: { href: website, target: '_blank' } }, 'click here to visit official website')
              ]

              if (chromeUrl || firefoxUrl) {
                const installUrl = /Firefox/.test(navigator.userAgent) ? firefoxUrl : chromeUrl
                if (installUrl) {
                  msg.push(' or ')
                  msg.push(h('a', { attrs: { href: installUrl, target: '_blank' } }, 'click here to install extension'))
                }
              }

              return h('div', msg)
            }
          })

          return
        }
      }
    }

    if (['SecurityError'].includes(error.name)) {
      this.onConnect()
      return
    }

    this.$notify.error({
      message: 'Connect wallet failed',
      description: `${error.name}`
    })
  }

  connect(name: string, wallet: WalletInfo) {
    const { providerUrl } = wallet

    const adapter = wallet.getAdapter(providerUrl)

    if (adapter) {
      // adapter.on('ready', onReady)
      adapter.on('connect', this.onConnect)
      adapter.on('disconnect', this.onDisconnect)
      adapter.on('error', this.onWalletError)

      this.connectingWallet = {
        name,
        adapter
      }

      adapter.connect()

      return () => {
        // adapter.off('ready', onReady)
        adapter.off('connect', this.onConnect)
        adapter.off('disconnect', this.onDisconnect)
        adapter.off('error', this.onWalletError)
      }
    }
  }

  onWalletChange(_accountInfo: AccountInfo<Buffer>, context: Context): void {
    logger('onAccountChange')

    const { slot } = context

    if (slot !== this.wallet.lastSubBlock) {
      this.$accessor.wallet.setLastSubBlock(slot)
      this.$accessor.wallet.getTokenAccounts()
      this.$accessor.farm.getStakeAccounts()
      this.$accessor.ido.requestInfos()
      this.getTiersInfo()
    }
  }

  subWallet() {
    const wallet = this.$wallet
    if (wallet && wallet.publicKey) {
      this.walletListenerId = this.$web3.onAccountChange(wallet.publicKey, this.onWalletChange, commitment)

      this.$accessor.wallet.getTokenAccounts()
      this.$accessor.farm.getStakeAccounts()
      this.$accessor.ido.requestInfos()
    }
  }

  unsubWallet() {
    if (this.walletListenerId) {
      this.$web3.removeAccountChangeListener(this.walletListenerId)
    }
  }

  debug() {
    if (this.debugCount < 10) {
      this.debugCount += 1
    } else {
      this.$router.push({ path: '/debug/' })
      this.debugCount = 0
    }
  }

  setWalletTimer() {
    this.walletTimer = window.setInterval(async () => {
      if (this.wallet.connected && !this.wallet.loading) {
        // vuex is connected but $wallet not, meaning window closed
        if (this.$wallet && this.$wallet.connected) {
          if (this.wallet.countdown < this.wallet.autoRefreshTime) {
            this.$accessor.wallet.setCountdown(this.$accessor.wallet.countdown + 1)
            if (this.wallet.countdown === this.wallet.autoRefreshTime) {
              await this.$accessor.wallet.getTokenAccounts()
            }
          }
        } else {
          this.disconnect()
        }
      }
      if (!this.tierloaded) {
        await this.getTiersInfo()
      }
      this.sonarUrl = 'https://sonar.watch/dashboard/' + this.wallet.address
    }, 1000)
  }

  setPriceTimer() {
    this.priceTimer = window.setInterval(async () => {
      if (!this.price.loading) {
        if (this.price.countdown < this.price.autoRefreshTime) {
          this.$accessor.price.setCountdown(this.$accessor.price.countdown + 1)
          if (this.price.countdown === this.price.autoRefreshTime) {
            await this.$accessor.price.requestPrices()
          }
        }
      }
    }, 1000)
  }

  setLiquidityTimer() {
    this.liquidityTimer = window.setInterval(async () => {
      if (!this.liquidity.loading) {
        if (this.liquidity.countdown < this.liquidity.autoRefreshTime) {
          this.$accessor.liquidity.setCountdown(this.$accessor.liquidity.countdown + 1)
          if (this.liquidity.countdown === this.liquidity.autoRefreshTime) {
            await this.$accessor.liquidity.requestInfos()
          }
        }
      }
    }, 1000)
  }

  setFarmTimer() {
    this.farmTimer = window.setInterval(async () => {
      if (!this.farm.loading) {
        if (this.farm.countdown < this.farm.autoRefreshTime) {
          this.$accessor.farm.setCountdown(this.$accessor.farm.countdown + 1)
          if (this.farm.countdown === this.farm.autoRefreshTime) {
            await this.$accessor.farm.requestInfos()
          }
        }
      }
    }, 1000)
  }

  setIdoTimer() {
    this.idoTimer = window.setInterval(async () => {
      if (!this.ido.loading) {
        if (this.ido.countdown < this.ido.autoRefreshTime) {
          this.$accessor.ido.setCountdown(this.$accessor.ido.countdown + 1)
          if (this.ido.countdown === this.ido.autoRefreshTime) {
            await this.$accessor.ido.requestInfos()
          }
        }
      }
    }, 1000)
  }

  openPopIn() {
    this.popIn = true
  }

  closePopIn() {
    this.popIn = false
  }

  outPopIn() {
    this.popIn = false
  }

  onResize() {
    this.windowWidth = window.innerWidth
  }
}
</script>

<style lang="less" scoped>
.wallet {
  display: flex;

  .tier-container {
    position: relative;
    margin-right: 18px;

    @media @max-sl-mobile {
      display: none !important;
    }

    .tier-profile {
      display: flex;
      background: linear-gradient(215.52deg, #273592 0.03%, #23adb4 99.97%);
      padding: 2px;
      height: 30px;
      width: 30px;
      border-radius: 50%;
      margin-right: 4px;

      .tier-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
    }

    .tier-info {
      .tier-id {
        color: @color-blue100;
        margin-right: 8px;
      }
    }

    .tier-info-menu {
      position: absolute;
      top: 50px;
      background: @gradient-color-primary;
      background-origin: border-box;
      border: 2px solid rgba(255, 255, 255, 0.14);
      box-shadow: 18px 11px 14px rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      min-width: 188px;
      z-index: 999;

      .collapse-item {
        padding: 8px 16px;
        border-bottom: 1px solid #c4c4c420;

        &:last-child {
          border-bottom: 0;
        }

        a {
          color: #fff;
        }

        .tier-progress {
          position: relative;

          .tier-progress-label {
            margin-bottom: 4px;
          }

          .tier-progress-info-container {
            position: relative;
            padding: 0 4px;

            .tier-progress-end {
              width: 2px;
              height: 14px;
              background: @color-petrol500;
              box-shadow: 0 2px 3px rgba(0, 0, 0, 0.55);
              margin: -20px 0 4px 0;
            }
          }
        }
      }
    }
  }

  .wallet-list {
    position: absolute;
    right: 64px;
    margin-top: 70px;
    z-index: 999;
    background: @color-blue700;
    border: 3px solid @color-blue500;
    box-shadow: 0 40px 70px rgba(0, 0, 0, 0.3);
    border-radius: 18px;
    padding: 18px;
    width: 283px;

    @media @max-lg-tablet {
      right: 32px;
    }

    @media @max-sl-mobile {
      right: 20px;
    }

    .select-wallet {
      max-height: 460px;
      overflow-y: scroll;
      padding: 0 6px;

      @media @max-lg-tablet {
        max-height: 378px;
      }

      .select-wallet-btn {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border: none;
        background: transparent;
        border-radius: 16px;
        padding: 8px 16px;
        width: 100%;
        height: 45px;
        text-align: left;
        margin-bottom: 18px;

        img {
          height: 30px;
          width: 30px;
          border-radius: 50%;
          margin-right: 18px;
        }

        &:hover {
          background: @color-blue500;
        }
      }
    }

    .select-wallet::-webkit-scrollbar {
      display: block !important; /* Chrome Safari */
    }

    .select-wallet-header {
      padding: 18px 0;

      .close-icon {
        width: 32px;
        height: 32px;
      }
    }

    .wallet-info {
      text-align: center;
    }

    .wallet-info .address {
      border-radius: 7px;
      padding-top: 15px;
      padding-bottom: 15px;
      font-size: 17px;
    }
  }

  .wallet-btn {
    display: inline-flex;
    align-items: center;

    .btncontainer {
      background: linear-gradient(rgba(75, 85, 231, 0.65098), rgba(182, 97, 150, 0.74902));
      background-origin: border-box;
      display: flex;
      align-items: center;
      text-align: center;
      position: relative;
      margin: auto;
      padding: 3px;
      border-radius: 8px;
      height: 45px;

      button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #2e166400;
        border-radius: 48px;
        border: none;
        height: 100%;
        width: 100%;
        color: white !important;
        padding: 0 10px;
      }

      @media @max-md-tablet {
        height: 32px;
      }
    }

    .sonar-container {
      .sonar-dashboard {
        background: rgba(255, 255, 255, 0.3);
        border: 1px solid #fff;
        border-radius: 6px;
        padding: 5px 10px;
        font-size: 14px;
        line-height: 17px;
        font-weight: 400;
        color: #fff;
        position: absolute;
        right: 32px;
        margin-top: 10px;
        display: none;
      }

      .btncontainer.sonar {
        margin-left: 20px !important;
        width: 50px;
        height: 50px;

        @media @max-lg-tablet {
          margin-left: 10px !important;
          width: 46px;
          height: 46px;
        }

        &:hover ~ .sonar-dashboard {
          display: block;
        }

        button {
          display: flex;
          align-items: center;
          justify-content: center;

          img {
            height: 26px;
          }
        }
      }

      @media @max-lg-tablet {
        display: none;
      }
    }
  }
}
</style>

<style lang="less">
.connect-modal {
  .ant-modal-body {
    text-align: center;

    .select-wallet {
      button {
        border: none;
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 30px;
        width: 100%;
        height: 48px;
        text-align: left;
        margin-bottom: 10px;

        img {
          height: 32px;
          width: 32px;
          border-radius: 50%;
        }
      }
    }

    .wallet-info {
      margin-top: 32px;

      .btn-gradient {
        background: @gradient-color01;
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
        border-radius: 38px;
        padding: 10px 18px;
        margin: 18px 0;
        height: auto;
        border: none;

        &:hover {
          background: @gradient-color02;
        }
      }
    }
  }
}

.wallet {
  // ant progress
  .ant-progress {
    width: 196px;
  }
}
</style>
