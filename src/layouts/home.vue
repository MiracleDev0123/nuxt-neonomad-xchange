<template>
  <div class="home-container-background">
    <Nuxt />
    <Foot />
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'

@Component({})
export default class Home extends Vue {}
</script>

<style lang="less">
.home-container-background {
  background-color: @color-blue800;
}
</style>
