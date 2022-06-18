<template>
  <div class="container create-pool">
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'nuxt-property-decorator'

@Component({
  head: {
    title: 'CropperFinance Create Pool'
  },
  components: {
  }
})
export default class CreatePool extends Vue {

  mounted() {
    this.$router.push({ path: `/pools/#createpool` })
  }

}
</script>
