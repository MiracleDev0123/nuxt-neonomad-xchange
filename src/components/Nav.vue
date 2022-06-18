<template>
  <div class="menu">
    <Menu v-model="currentRoute" :mode="'horizontal'" :theme="'light'" @click="changeRoute">
      <MenuItem v-for="(extra, name) in navs" :key="name.toLowerCase()" :class="name === banURL ? 'disable' : ''">
        <a v-if="extra" :href="url[name]" target="_blank">
          {{ name.replace('-', ' ') }}
        </a>
        <div v-else class="menu-icon-group">
          <span class="font-body-medium weight-semi"> {{ name.replace('-', ' ') }} </span>
        </div>
        <div v-if="name === banURL" class="soon">Soon</div>
      </MenuItem>
    </Menu>
    <div class="collapse-menu">
      <img class="menu-icon" src="@/assets/icons/menu.svg" @click="() => (menuVisibility = true)" />
      <MenuModal :show="menuVisibility" @onCancel="() => (menuVisibility = false)"></MenuModal>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { Menu } from 'ant-design-vue'

const MenuItem = Menu.Item

@Component({
  components: {
    Menu,
    MenuItem
  }
})
export default class Nav extends Vue {
  navs = {
   // home: false, 
    //trade: true, //working link
    //farm: true, //temp
    //staking: true, //temp
    //whitelist: true, //working link
    //liquidity: false,

    staking: false,
    nomadpad: false,
    swap: false, 
    farms: false,
    pools: false

    // fusion: false,
    // stakingTest: false,
    // migrate: false
    // info: false
  }
  banURL = ''
  menuVisibility = false

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
        // if (ammId) {
        //   this.$router.push({
        //     path: `/${key}/`,
        //     query: {
        //       ammId
        //     }
        //   })
        // } else
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
    } else {
      console.log(this.banURL + 'will be soon!')
    }
  }
}
</script>

<style lang="less">
.menu {
  .collapse-menu {
    display: none;

    @media @max-md-tablet {
      display: block;
    }

    .menu-icon {
      cursor: pointer;
    }
  }
}

.menu-icon-group {
  display: inline-flex;
  align-items: center;

  span {
    display: flex;
    align-items: center;
  }
}

.ant-menu {
  text-transform: capitalize;
  background: transparent;

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

.ant-menu-horizontal {
  line-height: 60px;
  border: none;

  @media @max-md-tablet {
    display: none;
  }

  .ant-menu-item {
    border: none;
    height: 60px;
  }

  .ant-menu-item-selected .menu-icon-group span {
    font-weight: 700 !important;
  }
}

.ant-menu-horizontal > .ant-menu-item:hover,
.ant-menu-horizontal > .ant-menu-submenu:hover,
.ant-menu-horizontal > .ant-menu-item-active,
.ant-menu-horizontal > .ant-menu-submenu-active,
.ant-menu-horizontal > .ant-menu-item-open,
.ant-menu-horizontal > .ant-menu-submenu-open,
.ant-menu-horizontal > .ant-menu-item-selected,
.ant-menu-horizontal > .ant-menu-submenu-selected {
  border: none;
}

@media @max-lg-tablet {
  .ant-menu-item {
    padding: 0 12px;
  }
}
</style>
