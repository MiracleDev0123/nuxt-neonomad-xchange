<template>
  <Footer>
    <div class="footer-body">
      <div class="logo">
        <a href="/"><img src="@/assets/icons/neonomad.svg" /></a>
      </div>
      <div class="icon_list noMobile">
        <a class="social-discord" :href="linkUrl.discord" target="_blank">
          <img class="social-icon" src="@/assets/icons/discord-blue.svg" />
          <img class="social-icon" src="@/assets/icons/discord-gradient.png" />
        </a>
        <a class="social-twitter" :href="linkUrl.twitter" target="_blank">
          <img class="social-icon" src="@/assets/icons/twitter-blue.svg" />
          <img class="social-icon" src="@/assets/icons/twitter-gradient.png" />
        </a>
        <a class="social-telegram" :href="linkUrl.telegram" target="_blank">
          <img class="social-icon" src="@/assets/icons/telegram-blue.svg" />
          <img class="social-icon" src="@/assets/icons/telegram-gradient.png" />
        </a>
      </div>
    </div>
    <div class="footer-line"></div>
    <div class="footer-refer">
      <label class="font-small decentralized">NeoNomad DeFi Powered by <a href="https://solana.com/" > Solana</a></label>
    </div>
  </Footer>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'

import { Layout } from 'ant-design-vue'

const { Footer } = Layout

@Component({
  components: {
    Footer
  }
})
export default class Foot extends Vue {
  navOpened = false
  linkUrl = {
    home: 'https://www.neonomad.finance/',
    app: '/nomadpad/',
    twitter: 'https://twitter.com/NeoNomadFinance',
    discord: 'https://discord.gg/Fj77EYcTNH',
    reddit: 'https://www.reddit.com/r/NeoNomadFinance/',
    telegram: 'https://t.me/neonomadfinance',
    
  }
  displayfilters = false

  get isMobile() {
    return this.$accessor.isMobile
  }

  beforeMount() {
    this.$accessor.queryIsMobile()
  }
}
</script>

<style lang="less" scoped>
.footer-body {
  display: flex;
  justify-content: space-between;

  @media @max-sl-mobile {
    display: unset;
  }

  .logo {
    img {
      height: 60px;
    }

    @media @max-sl-mobile {
      margin-bottom: 30px;
    }
  }

  .icon_list {
    &.noMobile {
      display: flex;
      align-items: center;

      .social-telegram .social-icon {
        margin-right: 0;
      }

      .social-medium,
      .social-discord,
      .social-twitter,
      .social-telegram {
        .social-icon {
          height: 18px;
        }

        .social-icon:last-child {
          display: none;
        }

        &:hover .social-icon:last-child {
          display: unset;
        }

        &:hover .social-icon:first-child {
          display: none;
        }
      }
    }

    &.noDesktop {
      display: none;
      @media @max-sl-mobile {
        display: inline-block;
      }
    }

    a {
      margin-right: 38px;
      color: #ccd1f1;

      @media @max-sl-mobile {
        display: block;
      }

      &:last-child {
        margin-right: 0;
      }
    }

    label {
      color: #fff !important;
      font-size: 22px;
    }

    .telegramButton > img {
      margin-left: 12px;
      transform: 0;
    }

    .telegramButton-active > img {
      transform: rotate(180deg);
      transition: transform 0.3s;
    }
  }
}

.telegram {
  &.noDesktop {
    display: none;

    &.visible {
      height: 250px;
      display: block;
      padding-top: 18px;
    }

    .telegram-group {
      display: flex;
      justify-content: space-between;

      @media @max-sl-mobile {
        display: block;
      }

      a {
        color: #fff;

        @media @max-sl-mobile {
          display: block;
          width: 50%;
          float: left;
          margin-bottom: 18px;
        }
      }
    }
  }
}

.footer-line {
  height: 1px;
  background: #fff;
  opacity: 0.2;
  margin: 28px 0 16px 0;
}

.footer-refer {
  position: relative;
  z-index: 2;
  text-align: center;
  color: @color-blue200;

  @media @max-sl-mobile {
    text-align: left;
  }
}
</style>