<template>
  <div class="container" :class="'user-list'">
    <div class="card">
      <div class="card-body" style="grid-row-gap: 0; row-gap: 0; padding-bottom: 15px">
        <div class="page-head fcsb-container">
          <span class="title">User List</span>
        </div>

        <Input v-model="farmId" size="large" class="input-search" placeholder="input farm id">
          <Icon slot="prefix" type="search" />
        </Input>
        <Button size="large" ghost @click="searchFarmUsers"> Search </Button>

        <div v-for="userInfo in userInfos" :key="userInfo.stakeAccountAddress">
          user - {{ userInfo.wallet }} depositBalance -
          {{ userInfo.depositBalance / Math.pow(10, userInfo.decimals) }} &nbsp;&nbsp;{{ userInfo.lpSymbol }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'nuxt-property-decorator'
import { Steps, Row, Col, Button, Tooltip, Icon, DatePicker, Input } from 'ant-design-vue'
import { getFilteredProgramAccounts } from '@/utils/web3'
import { PublicKey } from '@solana/web3.js'
import { FARM_PROGRAM_ID } from '@/utils/ids'
import { UserInfoAccountLayout } from '@/utils/farm'
import { FARMS } from '@/utils/farms'
const Step = Steps.Step

@Component({
  head: {
    title: 'CropperFinance Farm Users'
  },
  components: {
    Steps,
    Row,
    Col,
    Button,
    Step,
    Tooltip,
    Icon,
    DatePicker,
    Input
  }
})
export default class CreateFarm extends Vue {
  userInfos: any = []

  farmId: string = ''

  mounted() {}
  async searchFarmUsers() {
    const connection = this.$web3
    const wallet: any = this.$wallet

    if (wallet && wallet.connected) {
      let foundFarm = FARMS.find((item) => item.poolId === this.farmId)
      const decimals = foundFarm?.lp.decimals
      const lpSymbol = foundFarm?.lp.symbol

      this.userInfos = []
      // stake user info account
      const stakeFilters = [
        {
          memcmp: {
            offset: 32,
            bytes: this.farmId
          }
        },
        {
          dataSize: UserInfoAccountLayout.span
        }
      ]

      getFilteredProgramAccounts(connection, new PublicKey(FARM_PROGRAM_ID), stakeFilters).then((stakeAccountInfos) => {
        console.log('found - ', stakeAccountInfos.length)
        stakeAccountInfos.forEach((stakeAccountInfo) => {
          const stakeAccountAddress = stakeAccountInfo.publicKey.toBase58()
          const { data } = stakeAccountInfo.accountInfo

          const userStakeInfo = UserInfoAccountLayout.decode(data)

          const wallet = userStakeInfo.wallet.toBase58()
          const depositBalance = userStakeInfo.deposit_balance.toNumber()

          this.userInfos.push({
            stakeAccountAddress,
            wallet,
            depositBalance,
            decimals,
            lpSymbol
          })
        })
      })
    }
  }
}
</script>
<style lang="less" scoped>
main {
  background-color: @color-blue800;
  background-image: unset;
  background-size: cover;
  background-position: center bottom;
}

.steps {
  display: inline-block;
  width: 30%;
  border-right: 1px solid #444a58;
  padding-top: 24px;
}

.notstep {
  vertical-align: middle;
  padding: 10px 40px;
}

.user-list {
  max-width: 90%;

  .ant-calendar-date:hover {
    background: @gradient-color-icon;
    background-origin: border-box;
  }

  .create {
    padding: 8px 18px;
    background: @gradient-color-icon;
    background-origin: border-box;
    border: 2px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    display: inline-block;

    button {
      background: unset !important;
      color: #fff;
      border-color: transparent;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 42px;
      letter-spacing: -0.05em;
    }
  }

  .card-body {
    padding: 10px 60px 15px;
  }
}
.create-pool-mobile {
  width: 100%;
}
.coin-select .coin-input button:hover {
  background-color: rgba(0, 0, 0, 0.9471) !important;
}

input {
  background: transparent;
  outline: none;
  border: none;
  border-bottom: 1px #ccc solid;
  width: 90%;
  margin: 0 5%;
}
.item-title {
  text-align: left;
  padding-right: 5%;
}
.item-title-mobile {
  text-align: left;
  padding-right: 5%;
}
div {
  word-break: break-all;
  word-wrap: break-word;
}
.item-msg-mobile {
  padding-left: 10px;
}
.ant-col {
  margin-bottom: 10px;
}
.msgClass div {
  line-height: 30px;
}
</style>
