<template>
  <div>
    <div>
      <p v-if="inputTokenInfo && outputTokenInfo" class="market-symbols">
        {{ `${outputTokenInfo.symbol.toUpperCase()}/${inputTokenInfo.symbol.toUpperCase()}` }}
      </p>
      <div class="market-data">
        <p v-if="priceData.length > 0" class="market-price">{{ priceData[priceData.length - 1].toFixed(5) }}</p>
        <p :class="[chartChange > 0 ? 'market-rate' : 'market-rate market-rate-negative']">
          {{ chartChange.toFixed(2) }}%
        </p>
      </div>
      <div>
        {{ day }}
      </div>
    </div>
    <BarChart :data="priceData" :labels="labels" />
    <div class="date-select">
      <div :class="[daysToShow == 1 ? 'date-select-option active' : 'date-select-option']" @click="setDaysToShow(1)">
        24H
      </div>
      <div :class="[daysToShow == 7 ? 'date-select-option active' : 'date-select-option']" @click="setDaysToShow(7)">
        7D
      </div>
      <div :class="[daysToShow == 30 ? 'date-select-option active' : 'date-select-option']" @click="setDaysToShow(30)">
        30D
      </div>
    </div>
    <div class="token-infos">
      <div v-if="inputTokenInfo" class="coin-info">
        <div class="coin-symbol-info">
          <img :src="inputTokenInfo.image.small" width="32" height="32" alt="inputTokenInfo.name" />
          <div>
            <p class="coin-symbol">{{ inputTokenInfo.symbol.toUpperCase() }}</p>
            <p>{{ inputTokenInfo.name }}</p>
          </div>
        </div>
        <div class="coin-price-info">
          <div class="coin-price">${{ inputTokenInfo.market_data.current_price.usd.toFixed(5) }}</div>
          <div
            :class="[
              inputTokenInfo.market_data.price_change_percentage_24h > 0 ? 'coin-rate' : 'coin-rate coin-rate-negative'
            ]"
          >
            {{ inputTokenInfo.market_data.price_change_percentage_24h.toFixed(2) }}%
          </div>
        </div>
      </div>
      <div v-if="outputTokenInfo" class="coin-info">
        <div class="coin-symbol-info">
          <img :src="outputTokenInfo.image.small" width="32" height="32" alt="outputTokenInfo.name" />
          <div>
            <p class="coin-symbol">{{ outputTokenInfo.symbol.toUpperCase() }}</p>
            <p>{{ outputTokenInfo.name }}</p>
          </div>
        </div>
        <div class="coin-price-info">
          <div class="coin-price">${{ outputTokenInfo.market_data.current_price.usd.toFixed(5) }}</div>
          <div
            :class="[
              outputTokenInfo.market_data.price_change_percentage_24h > 0 ? 'coin-rate' : 'coin-rate coin-rate-negative'
            ]"
          >
            {{ outputTokenInfo.market_data.price_change_percentage_24h.toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue } from 'nuxt-property-decorator'
import BarChart from '@/components/BarChart.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default Vue.extend({
  components: {
    BarChart
  },
  data() {
    return {
      baseTokenId: 'usd-coin',
      quoteTokenId: 'neonomad-finance',
      daysToShow: 1,
      priceData: [] as any[],
      inputTokenInfo: null as any,
      outputTokenInfo: null as any,
      labels: [] as any[],
      chartChange: 0,
      day: ''
    }
  },
  mounted() {
    this.getChartData()
    this.getInputTokenInfo()
    this.getOutputTokenInfo()
  },
  methods: {
    setDaysToShow(days: number) {
      this.daysToShow = days
      this.getChartData()
      this.getInputTokenInfo()
      this.getOutputTokenInfo()
    },
    async getInputTokenInfo() {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${this.baseTokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
      `
      )
      const data = await response.json()
      this.inputTokenInfo = data
    },
    async getOutputTokenInfo() {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${this.quoteTokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
      `
      )
      const data = await response.json()
      this.outputTokenInfo = data
    },
    async getChartData() {
      const inputResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${this.baseTokenId}/ohlc?vs_currency=usd&days=${this.daysToShow}`
      )
      const outputResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${this.quoteTokenId}/ohlc?vs_currency=usd&days=${this.daysToShow}`
      )
      const inputData = await inputResponse.json()
      const outputData = await outputResponse.json()

      let data: any[] = []
      if (Array.isArray(inputData)) {
        data = data.concat(inputData)
      }
      if (Array.isArray(outputData)) {
        data = data.concat(outputData)
      }

      const formattedData = data.reduce((a, c) => {
        const found = a.find((price: { time: any }) => price.time === c[0])
        if (found) {
          if (['usd-coin', 'tether'].includes(this.quoteTokenId)) {
            found.price = found.inputPrice / c[4]
          } else {
            found.price = c[4] / found.inputPrice
          }
        } else {
          a.push({ time: c[0], inputPrice: c[4] })
        }
        return a
      }, [])
      formattedData[formattedData.length - 1].time = Date.now()

      let prices: any[] = []
      let times: any = []

      formattedData.forEach((data: any) => {
        prices.push(data.price)
        times.push(dayjs(data.time).format('DD MMM YY, h:mma'))
      })

      this.priceData = prices
      this.labels = times
      this.chartChange = formattedData.length
        ? ((formattedData[formattedData.length - 1]['price'] - formattedData[0]['price']) / formattedData[0]['price']) *
          100
        : 0

      this.day = formattedData.length
        ? dayjs(formattedData[formattedData.length - 1]['time']).format('DD MMM YY, h:mma')
        : ''
    }
  }
})
</script>

<style lang="less" scoped>
.market-symbols {
  font-size: 18px;
}

.market-data {
  display: flex;
  align-items: flex-end;

  .market-price {
    font-size: 24px;
    font-weight: bold;
  }

  .market-rate {
    margin-left: 10px;
    color: @color-new;
    padding-bottom: 3px;

    &-negative {
      color: @color-red600;
    }
  }
}

.date-select {
  display: flex;
  justify-content: flex-end;

  .date-select-option {
    padding: 5px;
    cursor: pointer;
    color: @color-blue200;

    &.active {
      color: @color-yellow600;
      font-weight: bold;
    }
  }
}

.token-infos {
  margin-top: 50px;
  border-top: 1px solid @color-blue500;
}
.coin-info {
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid @color-blue500;

  .coin-symbol-info {
    display: flex;
    align-items: center;

    img {
      margin-right: 10px;
    }

    .coin-symbol {
      font-weight: bold;
      margin-bottom: -3px !important;
    }
  }

  .coin-price-info {
    display: flex;
    align-items: center;

    .coin-price {
      min-width: 150px;
    }

    .coin-rate {
      text-align: right;
      min-width: 50px;
      color: @color-new;

      &-negative {
        color: @color-red600;
      }
    }
  }
}
</style>
