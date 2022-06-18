<template>
  <div class="chart-container">
    <Area
      :chart-options="chartOptions"
      :chart-data="chartData"
      :chart-id="chartId"
      :dataset-id-key="datasetIdKey"
      :plugins="plugins"
      :css-classes="cssClasses"
      :styles="styles"
      :width="width"
      :height="height"
    />
  </div>
</template>

<script>
import { Line } from 'vue-chartjs/legacy'
import { Chart as ChartJS, Title, Tooltip, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, LineElement, PointElement, CategoryScale, LinearScale)

export default {
  name: 'BarChart',
  components: { Area: Line },
  computed: {
    chartData() {
      return {
        labels: this.labels,
        datasets: [
          {
            borderColor: '#fff',
            pointBackgroundColor: 'white',
            pointBorderColor: '#3e0775',
            borderWidth: 1,
            lineTension: 0.3,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            data: this.data
          }
        ]
      }
    }
  },
  props: {
    chartId: {
      type: String,
      default: 'swap-chart'
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    width: {
      type: Number,
      default: 400
    },
    height: {
      type: Number,
      default: 250
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => {}
    },
    plugins: {
      type: Object,
      default: () => {}
    },
    data: {
      type: Array,
      default: () => []
    },
    labels: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      gradient: null,
      chartOptions: {
        scales: {
          x: {
            ticks: {
              display: false
            },
            grid: {
              display: false
            }
          },
          y: {
            ticks: {
              display: false
            },
            grid: {
              display: false
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    }
  }
}
</script>

<style lang="less" scoped>
.chart-container {
  margin-top: 20px;
  background: #26276775;
  border-radius: 15px;
}
</style>
