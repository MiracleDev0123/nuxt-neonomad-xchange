<template>
  <div class="container" :class="'user-list'">
    <div class="card">
      <div class="card-body" style="grid-row-gap: 0; row-gap: 0; padding-bottom: 15px">
        <div class="page-head fcsb-container">
          <span class="title">Farm Analyzer</span>
        </div>

        <Input v-model="farmId" size="large" class="input-search" placeholder="input farm id">
          <Icon slot="prefix" type="search" />
        </Input>
        <Button size="large" ghost @click="searchFarm"> Analyzer </Button>

        <div v-if="farmFound">
          name : {{ foundFarm.name }}<br />
          lp token name : {{ foundFarm.lp.symbol }}<br />
          lp token decimals : {{ foundFarm.lp.decimals }}<br />
          lp token balance : {{ foundFarm.lp.balance.wei.toNumber() / Math.pow(10, foundFarm.lp.decimals) }}<br />
          reward token name : {{ foundFarm.reward.symbol }}<br />
          reward token decimals : {{ foundFarm.reward.decimals }}<br />
          reward token balance : {{ foundFarm.reward.balance.wei.toNumber() / Math.pow(10, foundFarm.reward.decimals)
          }}<br />
          start time : {{ getDateTime(foundFarm.poolInfo.start_timestamp.toNumber()) }}<br />
          end time : {{ getDateTime(foundFarm.poolInfo.end_timestamp.toNumber()) }}<br />
          last updated time : {{ getDateTime(foundFarm.poolInfo.last_timestamp.toNumber()) }}<br />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { Steps, Row, Col, Button, Tooltip, Icon, DatePicker, Input } from 'ant-design-vue'
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
  foundFarm: any = undefined
  farmFound: boolean = false
  mounted() {}

  async searchFarm() {
    for (const [poolId, farmInfo] of Object.entries(this.$accessor.farm.infos)) {
      if (poolId === this.farmId) {
        this.foundFarm = farmInfo
        this.farmFound = true
        return
      }
    }
    this.farmFound = false
  }
  getDateTime(timestamp: number) {
    var d = new Date(timestamp * 1000)
    return d.toString()
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
