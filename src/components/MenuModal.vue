<template>
  <Modal
    :visible="show"
    :footer="null"
    :mask-closable="true"
    :closable="false"
    :width="375"
    class="menu-modal"
    @cancel="$emit('onCancel')"
    centered
  >
    <img class="modal-close" src="@/assets/icons/close-circle.svg" @click="$emit('onCancel')" />
    <div class="menu-container">
      <Menu v-model="currentRoute" :mode="'vertical'" :theme="'light'" @click="changeRoute">
        <MenuItem v-for="(extra, name) in navs" :key="name.toLowerCase()" :class="name === banURL ? 'disable' : ''">
          <a v-if="extra" :href="url[name]" target="_blank">
            {{ name.replace('-', ' ') }}
          </a>
          <div v-else class="menu-icon-group">
            <span class="font-medium weight-semi"> {{ name.replace('-', ' ') }} </span>
          </div>
          <div v-if="name === banURL" class="soon">Soon</div>
        </MenuItem>
      </Menu>
    </div>
  </Modal>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { Menu, Modal } from 'ant-design-vue'

const MenuItem = Menu.Item
Vue.use(Modal)

@Component({
  components: {
    Modal,
    Menu,
    MenuItem
  },
  props: {
    show: {
      type: Boolean,
      default: false
    }
  }
})
export default class MenuModal extends Vue {
  navs = {
    staking: false,
    nomadpad: false,
    swap: false,
    pools: false,
    farms: false
  }
  banURL = 'fertilizer'

  get isMobile() {
    return this.$accessor.isMobile
  }

  get url() {
    return this.$accessor.url
  }

  get currentRoute() {
    return [this.$accessor.route.name]
  }

  set currentRoute(route) {}

  changeRoute({ key }: { key: string }): void {
    const { from, to, ammId } = this.$route.query
    if (key != this.banURL) {
      if (['swap', 'liquidity'].includes(key) && (ammId || (from && to))) {
        if (from && to) {
          this.$router.push({
            path: `/${key}/`,
            query: {
              from,
              to
            }
          })
        } else {
          this.$router.push({ path: `/${key}/` })
        }
      } else if (!(this as any).navs[key]) {
        this.$router.push({ path: `/${key}/` })
      }
      // to close menu on mobile mode
      this.$emit('onSelect')
      this.$emit('onCancel')
    } else {
      console.log(this.banURL + 'will be soon!')
    }
  }
}
</script>

<style lang="less" scoped>
.modal-close {
  left: 20px;
  top: 0;
}

.menu-container {
  padding: 20px;
}

.ant-menu {
  text-transform: capitalize;
  background: transparent;
  text-align: center;
  border: none;

  .ant-menu-item {
    .soon {
      display: none;
      width: fit-content;
      margin: auto;
      padding: 5px 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      border-radius: 6px;
      font-size: 14px;
      line-height: 17px;
      background: rgba(255, 255, 255, 0.3);
    }

    &.disable {
      &:hover,
      &:active {
        color: unset !important;
      }

      &:hover .menu-icon-group {
        opacity: 0.5;
      }

      &:hover .soon {
        display: block;
      }
    }
  }
}

.ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected {
  background: transparent;
}
</style>

<style lang="less">
.menu-modal .ant-modal {
  @media @max-md-tablet {
    width: 100% !important;
    max-width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: @color-blue800;
    opacity: 0.9;
    border-radius: 0;
    border: none;

    .ant-modal-content {
      box-shadow: none;
    }
  }
}
</style>
