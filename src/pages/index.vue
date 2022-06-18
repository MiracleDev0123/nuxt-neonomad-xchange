<template>
  <main class="landing">
    <section class="landing-header">
      <div class="landing-top">
        <img class="cropper-logo" src="@/assets/icons/neonomad.svg" />
        <div class="lunch-btn-group">
          <!-- <a href="https://docs.cropper.finance/cropperfinance/" target="_blank" class="btn-container doc-btn">
            <Button class="btn-outline weight-semi">Documentation</Button>
          </a> -->
          <NuxtLink to="/swap/">
            <Button class="btn-fill weight-semi">Launch App</Button>
          </NuxtLink>
        </div>
      </div>
    </section>
    <!-- <section class="landing-body">
      <video class="landing-video" autoplay muted loop preload="auto">
        <source :src="videoLinks.landing" type="video/mp4" />
      </video>

      <div class="landing-content">
        <Row :gutter="20">
          <Col :span="22" :offset="1">
            <div class="balance-infos">
              <h2 class="weight-semi tvl-value">TVL {{ TVL }}$</h2>
              <div class="token-infos">
                <img src="@/assets/icons/cropper.svg" />
                <label class="font-body-medium weight-semi"><u>CRP Token</u></label>
                <label class="font-body-medium weight-semi">Price: {{ CRPPrice }}$</label>
                <label class="font-body-medium weight-semi">Market Cap: {{ marketCap }}$</label>
              </div>
            </div>
            <div class="cropper-content">
              <label class="display-large weight-xbold"
                >The Ultimate <br />
                Yield Farming <br />
                Protocol
              </label>
              <p class="powered-by font-body-large">Powered by Solana</p>
            </div>
            <div class="read-more">
              <div class="btn-container">
                <a href="https://www.neonomad.finance/" target="_blank" class="btn-outline font-body-medium weight-semi"
                  >Documentation</a
                >
              </div>
            </div>
            <div class="social-links">
              <a class="social-medium" :href="socialLinks.medium" target="_blank">
                <img class="social-icon" src="@/assets/icons/medium-blue.svg" />
                <img class="social-icon" src="@/assets/icons/medium-gradient.svg" />
              </a>
              <a class="social-discord" :href="socialLinks.discord" target="_blank">
                <img class="social-icon" src="@/assets/icons/discord-blue.svg" />
                <img class="social-icon" src="@/assets/icons/discord-gradient.png" />
              </a>
              <a class="social-twitter" :href="socialLinks.twitter" target="_blank">
                <img class="social-icon" src="@/assets/icons/twitter-blue.svg" />
                <img class="social-icon" src="@/assets/icons/twitter-gradient.svg" />
              </a>
              <a class="social-telegram" :href="socialLinks.telegram" target="_blank">
                <img class="social-icon" src="@/assets/icons/telegram-blue.svg" />
                <img class="social-icon" src="@/assets/icons/telegram-gradient.svg" />
              </a>
            </div>
            <a href="#why-cropper"><img class="move-next-section" src="@/assets/icons/arrow-down-transparent.svg" /></a>
          </Col>
        </Row>
      </div>
    </section>

    <section class="why-cropper" id="why-cropper">
      <Row>
        <Col :span="22" :offset="1">
          <h2 class="weight-bold text-center">Why NeoNomad Finance?</h2>
          <div class="intro-box-group">
            <img class="stars-second-bg" src="@/assets/landing/stars-second-bg.svg" />

            <div class="intro-box text-center">
              <img class="card-img" src="@/assets/landing/card-apr.svg" />
              <h4 class="weight-bold">Top Farms APR%</h4>
            </div>
            <div class="intro-box text-center">
              <img class="card-img" src="@/assets/landing/card-community.svg" />
              <h4 class="weight-bold">Community Driven</h4>
            </div>
            <div class="intro-box text-center">
              <img class="card-img" src="@/assets/landing/card-swap.svg" />
              <h4 class="weight-bold">Best Swap Prices</h4>
            </div>
          </div>
        </Col>
      </Row>
    </section>

    <section class="why-cropper-audit">
      <img class="landing-second-img" src="@/assets/landing/landing-second-bg.svg" />

      <div class="audit-group">
        <Row>
          <Col :span="22" :offset="1">
            <div class="audit-box-group">
              <div class="audit-box">
                <h2 class="weight-semi">
                  Farm Program <br />
                  Security Audit
                </h2>
                <a
                  class="read-pdf font-body-large"
                  href="https://github.com/HalbornSecurity/PublicReports/blob/master/Solana%20Program%20Audit/Cropper_Finance_Farm_Solana_Program_Security_Audit_Report_Halborn_Final.pdf"
                  target="_blank"
                >
                  <img class="pdf-icon" src="@/assets/icons/pdf.svg" />
                  Read the Audit
                </a>
              </div>
              <div class="audit-box">
                <h2 class="weight-semi">
                  AMM Program <br />
                  Security Audit
                </h2>
                <a
                  class="read-pdf font-body-large"
                  href="https://github.com/HalbornSecurity/PublicReports/blob/master/Solana%20Program%20Audit/Cropper_Finance_AMM_Program_Security_Audit_Report_Halborn_Final.pdf"
                  target="_blank"
                >
                  <img class="pdf-icon" src="@/assets/icons/pdf.svg" />
                  Read the Audit
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </section>

    <section class="features-headline">
      <Row>
        <Col :span="22" :offset="1">
          <h2 class="weight-bold text-center">The NeoNomad Finance Ecosystem</h2>
          <p class="font-body-large text-center eco-content">
            By farmers, for farmers. With low fees and high-impact APRs, our full line of DeFi services give you
            everything you need in a few clicks.
          </p>
          <Row :gutter="[25, 25]" class="feature-box-group">
            <img class="stars-third-bg" src="@/assets/landing/stars-third-bg.svg" />
            <Col :xs="12" :sm="12" :md="6">
              <div class="feature-box">
                <img class="feature-img" src="@/assets/landing/feature-swap.svg" />
                <h4 class="title weight-bold">Swap</h4>
                <p class="font-body-medium content">Our smart search delivers the fairest swap instantly</p>
                <NuxtLink to="/swap" class="font-body-medium now-btn weight-semi"> Swap Now </NuxtLink>
              </div>
            </Col>
            <Col :xs="12" :sm="12" :md="6">
              <div class="feature-box">
                <img class="feature-img" src="@/assets/landing/feature-farming.svg" />
                <h4 class="title weight-bold">Farming</h4>
                <p class="font-body-medium content">Explore a vast selection of Labelized and Permissionless Farms</p>
                <NuxtLink to="/farms" class="font-body-medium now-btn weight-semi"> Farm Now </NuxtLink>
              </div>
            </Col>
            <Col :xs="12" :sm="12" :md="6">
              <div class="feature-box">
                <img class="feature-img" src="@/assets/landing/feature-staking.svg" />
                <h4 class="title weight-bold">Staking</h4>
                <p class="font-body-medium content">
                  Earn rewards and gain access to exclusive opportunities with our 5 staking tiers
                </p>
                <NuxtLink to="/staking" class="font-body-medium now-btn weight-semi"> Stake Now </NuxtLink>
              </div>
            </Col>
            <Col :xs="12" :sm="12" :md="6">
              <div class="feature-box">
                <img class="feature-img" src="@/assets/landing/feature-fertilizer.svg" />
                <h4 class="title weight-bold">Fertilizer</h4>
                <p class="font-body-medium content">The fertilizer launcher is currently being improved</p>
                <NuxtLink to="/" class="font-body-medium now-btn weight-semi soon"> Coming Soon! </NuxtLink>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </section>

    <section class="how-works">
      <h2 class="weight-bold text-center">How it works</h2>
      <div class="tutorial-container">
        <img class="landing-third-bg" src="@/assets/landing/landing-third-bg.svg" />
        <div class="tutorial-group">
          <Tabs defaultActiveKey="1" @change="switchTab">
            <TabPane tab="For Farmers" key="1">
              <Row :gutter="20">
                <Col :sm="8" :md="8" class="play-list-col">
                  <p class="font-body-large weight-bold">Prepare to harvest</p>
                  <div class="play-list">
                    <Button
                      class="play-list-btn font-body-medium weight-semi"
                      @click="selectVideo(1)"
                      :class="currentPlay === 1 ? 'active' : ''"
                      >1. Buy the token you want to</Button
                    >
                    <Button
                      class="play-list-btn font-body-medium weight-semi"
                      @click="selectVideo(2)"
                      :class="currentPlay === 2 ? 'active' : ''"
                      >2. Stake liquidity</Button
                    >
                    <Button
                      class="play-list-btn font-body-medium weight-semi"
                      @click="selectVideo(3)"
                      :class="currentPlay === 3 ? 'active' : ''"
                      >3. Harvest rewards</Button
                    >
                    <Button
                      class="play-list-btn font-body-medium weight-semi"
                      @click="selectVideo(4)"
                      :class="currentPlay === 4 ? 'active' : ''"
                      >4. Unstake liquidity</Button
                    >
                  </div>
                </Col>
                <Col :sm="16" :md="16" class="video-play-col">
                  <video class="video-player" :src="currentVideo" controls autoplay loop></video>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="For SPL Builders" key="2">
              <Row :gutter="20">
                <Col :xs="24" :sm="24" :md="8">
                  <p class="font-body-large weight-bold">Launch your own farm</p>
                  <div class="play-list">
                    <Button
                      class="play-list-btn font-body-medium weight-semi"
                      @click="selectVideo(5)"
                      :class="currentPlay === 5 ? 'active' : ''"
                      >1. Set up Pool</Button
                    >
                    <Button
                      class="play-list-btn font-body-medium weight-semi"
                      @click="selectVideo(6)"
                      :class="currentPlay === 6 ? 'active' : ''"
                      >2. Launch Farm</Button
                    >
                  </div>
                </Col>
                <Col :sm="16" :md="16" class="video-play-col">
                  <video class="video-player" :src="currentVideo" controls autoplay loop></video>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </section>

    <section class="cropper-feed">
      <h2 class="weight-bold text-center">100,000 Croppers And Counting</h2>
      <p class="font-body-large text-center feed-description">
        Our community is at the heart of everything we do. The first Croppers formed as a collective of serious farmers
        seeking access and decentralization of yield farming. Today, the NeoNomad Finance Community is comprised of DeFi
        enthusiasts of all walks of the chain. Together, we pursue universal access to yield farming, and all the
        harvests that come with it.
      </p>
      <div class="feed-container">
        <Row>
          <Col :span="22" :offset="1">
            <Row :gutter="[20, 20]">
              <Col v-for="twitter in twitterShows" :key="twitter.id" :xs="24" :sm="24" :md="8">
                <div class="feed-twitter">
                  <div class="feed-logo">
                    <img src="@/assets/icons/twitter-white.svg" />
                  </div>
                  <div class="feed-content font-body-medium">
                    {{ twitter.content }}
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <div class="feed-link">
          <a :href="socialLinks.twitter" target="_blank" class="btn-container join-btn-container">
            <Button class="btn-outline font-body-medium weight-semi join-btn">Join the Croppers</Button>
          </a>
        </div>
      </div>
    </section>

    <section class="surrounded-by">
      <h2 class="weight-bold text-center">
        Surrounded by the best <br />
        in the Industry
      </h2>
      <div class="category-group text-center">
        <Button
          class="category-btn font-body-large weight-semi"
          :class="currentCategory === 'backedBy' ? 'active' : ''"
          @click="selectCategory('backedBy')"
        >
          Backed by
        </Button>
        <Button
          class="category-btn font-body-large weight-semi"
          :class="currentCategory === 'advisors' ? 'active' : ''"
          @click="selectCategory('advisors')"
        >
          Advisors
        </Button>
        <Button
          class="category-btn font-body-large weight-semi"
          :class="currentCategory === 'partners' ? 'active' : ''"
          @click="selectCategory('partners')"
        >
          Partners
        </Button>
        <Button
          class="category-btn font-body-large weight-semi"
          :class="currentCategory === 'poweredBy' ? 'active' : ''"
          @click="selectCategory('poweredBy')"
        >
          Powered by
        </Button>
      </div>
      <div class="industry-container">
        <div class="industry-group">
          <Row :gutter="[20, 20]">
            <Col
              v-for="card in currentIndustry"
              :key="card.title"
              :xs="24"
              :sm="24"
              :md="currentIndustry.length >= 4 ? 6 : 24 / currentIndustry.length"
            >
              <div class="industry-card">
                <div class="industry-card-body">
                  <img :src="card.img" :width="card.width" />
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </section> -->
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator'
import { Icon, Popover, Button, Row, Col, Tabs } from 'ant-design-vue'
const { TabPane } = Tabs

@Component({
  components: {
    Icon,
    Popover,
    Button,
    Row,
    Col,
    Tabs,
    TabPane
  },
  layout: 'home',
  async asyncData({ redirect }) {
    redirect('/swap/')
  }
})
export default class Landing extends Vue {
  isPopupOpen = false
  TVL = 0 as any
  totalvolume = 0
  timer: number | undefined = undefined
  isFarmer: boolean = true
  isBacked: boolean = false
  isAdvisors: boolean = true
  isPartners: boolean = false
  isPowered: boolean = false
  isDirect: boolean = false
  twitterFeeds: any[] = []
  twitterShows: any[] = []
  CRPPrice: any = 0
  marketCap: any = 0
  currentCategory: string = 'backedBy'
  surroundedList = {
    advisors: [
      {
        title: 'Dexlab',
        img: 'industry/dexlab.svg',
        width: 'unset'
      },
      {
        title: 'Solanium',
        img: 'industry/solanium.svg',
        width: 'unset'
      },
      {
        title: 'Halborn',
        img: 'industry/halborn.svg',
        width: 'unset'
      },
      {
        title: 'SKYVision Capital',
        img: 'industry/svc.svg',
        width: 'unset'
      }
    ],
    backedBy: [
      {
        title: 'SKYVision Capital',
        img: 'industry/svc.svg',
        width: 'unset'
      },
      {
        title: 'MEXC Global',
        img: 'industry/mexc.svg',
        width: 'unset'
      },
      {
        title: 'Gate.io',
        img: 'industry/gateio.svg',
        width: 'unset'
      },
      {
        title: 'Negocia Capital',
        img: 'industry/negocia.svg',
        width: 'unset'
      },
      {
        title: 'Solanium Ventures',
        img: 'industry/solaniumV.svg',
        width: 'unset'
      },
      {
        title: 'Newave Capital',
        img: 'industry/newave.svg',
        width: 'unset'
      },
      {
        title: 'DeltaHub Capital',
        img: 'industry/deltahub.svg',
        width: 'unset'
      },
      {
        title: 'AngelONE',
        img: 'industry/angelone.svg',
        width: 'unset'
      },
      {
        title: 'Cropperbros',
        img: 'industry/cropperbros.svg',
        width: '150px'
      },
      {
        title: 'Basics Capital',
        img: 'industry/basics.svg',
        width: 'unset'
      },
      {
        title: 'AVA Capital',
        img: 'industry/ava.svg',
        width: 'unset'
      },
      {
        title: 'M6',
        img: 'industry/m6.svg',
        width: 'unset'
      },
      {
        title: 'OIG',
        img: 'industry/oig.svg',
        width: 'unset'
      },
      {
        title: 'EX Capital',
        img: 'industry/ex.svg',
        width: 'unset'
      },
      {
        title: 'CryptoJ',
        img: 'industry/cryptoj.svg',
        width: 'unset'
      }
    ],
    partners: [
      {
        title: 'GenesysGo',
        img: 'industry/genesysgo.svg',
        width: '150px'
      },
      {
        title: 'Sonar',
        img: 'industry/sonar.svg',
        width: '150px'
      },
      {
        title: 'MEXC Global',
        img: 'industry/mexc.svg',
        width: 'unset'
      },
      {
        title: 'Gate.io',
        img: 'industry/gateio.svg',
        width: 'unset'
      },
      {
        title: 'Dexlab',
        img: 'industry/dexlab.svg',
        width: 'unset'
      }
    ],
    poweredBy: [
      {
        title: 'Solana',
        img: 'industry/solana.svg',
        width: '200px'
      },
      {
        title: 'Serum',
        img: 'industry/serum.svg',
        width: '200px'
      }
    ]
  }
  currentIndustry: any = this.surroundedList.backedBy
  socialLinks = {
    twitter: 'https://www.neonomad.finance/',
    discord: 'https://www.neonomad.finance/',
    medium: 'https://www.neonomad.finance/',
    telegram: 'https://www.neonomad.finance/'
  }
  videoLinks = {
    landing: 'https://cropper.finance/distant/landing/landing.mp4',
    swap: 'https://cropper.finance/distant/industry/SwapvideoforGIF.mp4',
    stake: 'https://cropper.finance/distant/industry/FarmingvideoforGIF.mp4',
    harvest: 'https://cropper.finance/distant/industry/HarvestvideoforGIF.mp4',
    unstake: 'https://cropper.finance/distant/industry/UnstackLPvideoforGIF.mp4',
    pool: 'https://cropper.finance/distant/industry/poolcreationvideoforGIIF.mp4',
    farm: 'https://cropper.finance/distant/industry/createfarmvideo.mp4'
  }
  currentPlay: number = 1
  currentVideo: string = this.videoLinks.swap

  // mounted() {
  //   this.getTvl()
  //   this.getTwitterFeeds()
  // }

  // beforeDestroy() {
  //   window.clearInterval(this.timer)
  // }

  // changeToFarmer() {
  //   this.isFarmer = !this.isFarmer
  // }

  // changeToIndustry(num: number) {
  //   switch (num) {
  //     case 1:
  //       this.isBacked = true
  //       this.isAdvisors = false
  //       this.isPartners = false
  //       this.isPowered = false
  //       break
  //     case 2:
  //       this.isBacked = false
  //       this.isAdvisors = true
  //       this.isPartners = false
  //       this.isPowered = false
  //       break
  //     case 3:
  //       this.isBacked = false
  //       this.isAdvisors = false
  //       this.isPartners = true
  //       this.isPowered = false
  //       break
  //     case 4:
  //       this.isBacked = false
  //       this.isAdvisors = false
  //       this.isPartners = false
  //       this.isPowered = true
  //       break
  //   }
  // }

  // changeToDirect() {
  //   this.isDirect = !this.isDirect
  // }

  // selectCategory(category: string) {
  //   this.currentCategory = category
  //   if (category === 'advisors') this.currentIndustry = this.surroundedList.advisors
  //   else if (category === 'backedBy') this.currentIndustry = this.surroundedList.backedBy
  //   else if (category === 'partners') this.currentIndustry = this.surroundedList.partners
  //   else if (category === 'poweredBy') this.currentIndustry = this.surroundedList.poweredBy
  // }

  // selectVideo(id: number) {
  //   this.currentPlay = id
  //   if (id === 1) this.currentVideo = this.videoLinks.swap
  //   else if (id === 2) this.currentVideo = this.videoLinks.stake
  //   else if (id === 3) this.currentVideo = this.videoLinks.harvest
  //   else if (id === 4) this.currentVideo = this.videoLinks.unstake
  //   else if (id === 5) this.currentVideo = this.videoLinks.pool
  //   else if (id === 6) this.currentVideo = this.videoLinks.farm
  // }

  // async getMarketCap(price: any) {
  //   let responseData: any = []
  //   try {
  //     responseData = await fetch('https://api.cropper.finance/supply/').then((res) => res.json())
  //   } catch (err) {
  //     console.log(err)
  //   } finally {
  //     this.marketCap = Math.round(responseData * price)
  //     this.marketCap = this.marketCap.toLocaleString('en-US')
  //   }
  // }

  // async getTvl() {
  //   let cur_date = new Date().getTime()
  //   if (window.localStorage.TVL_last_updated) {
  //     const last_updated = parseInt(window.localStorage.TVL_last_updated)
  //     if (cur_date - last_updated <= 600000) {
  //       this.TVL = window.localStorage.TVL
  //       this.TVL = this.TVL.toLocaleString('en-US')
  //       return
  //     }
  //   }

  //   let responseData: any = []
  //   let tvl = 0
  //   this.TVL = Math.round(tvl)

  //   window.localStorage.TVL_last_updated = new Date().getTime()
  //   window.localStorage.TVL = this.TVL

  //   this.TVL = this.TVL.toLocaleString('en-US')
  // }

  // async getTwitterFeeds() {
  //   let responseData: any = []
  //   try {
  //     responseData = await fetch('https://api.cropper.finance/tweets/').then((res) => res.json())
  //   } catch (err) {
  //     console.log(err)
  //   } finally {
  //     this.twitterFeeds = responseData
  //     this.twitterShows = this.twitterFeeds.slice(0, 3)
  //   }
  // }

  // switchTab(activeKey: any) {
  //   console.log(activeKey)
  //   if (activeKey === '1') {
  //     this.currentPlay = 1
  //     this.currentVideo = this.videoLinks.swap
  //   } else if (activeKey === '2') {
  //     this.currentPlay = 5
  //     this.currentVideo = this.videoLinks.pool
  //   }
  // }
}
</script>

<style lang="less" scoped>
// global stylesheet
.btn-container {
  padding: 3px;
  border-radius: 8px;
  height: 54px;
  width: fit-content;
  -webkit-transition: background-color 2s ease-out;
  transition: background-color 2s ease-out;
  display: flex;

  @media @max-sl-mobile {
    height: 60px;
  }
}

.btn-fill {
  background-image: @gradient-color01;
  padding: 18px 30px;
  display: flex;
  align-items: center;
  border-radius: 48px;
  border: none;
  height: 54px;
  -webkit-transition: background-color 0.7s ease-out;
  transition: background-color 0.7s ease-out;

  &:hover {
    background-image: @gradient-color02;
  }

  @media @max-sl-mobile {
    padding: 13px 22.5px;
    height: 44px;
  }
}

.btn-outline {
  padding: 18px 30px;
  height: 100%;
  display: flex;
  align-items: center;
  border-radius: 48px;
  background: @color-blue800;
  border: none;
}

h2 {
  @media @max-sl-mobile {
    font-size: 31px !important;
    line-height: 37.2px !important;
  }
}

h4 {
  @media @max-sl-mobile {
    font-size: 20px !important;
    line-height: 30px !important;
  }
}

// class stylesheet
.landing {
  .landing-header {
    position: fixed;
    width: 100%;
    background: @color-blue800;
    top: 0;
    z-index: 999;
    height: 80px;
    opacity: 0.9;

    .landing-top {
      height: 100%;
      padding-left: 64px;
      padding-right: 64px;

      @media @max-lg-tablet {
        padding-left: 32px;
        padding-right: 32px;
      }

      @media @max-sl-mobile {
        padding-left: 20px;
        padding-right: 20px;
      }

      display: flex;
      align-items: center;
      justify-content: space-between;

      .cropper-logo {
        @media @max-sl-mobile {
          width: 92.86px;
          height: 30.86px;
        }
      }

      .lunch-btn-group {
        display: flex;
        justify-content: space-between;

        .doc-btn {
          @media @max-sl-mobile {
            display: none;
          }
        }

        .btn-outline,
        .btn-fill {
          font-size: 18px;
          line-height: 14px;

          @media @max-sl-mobile {
            font-size: 16px;
            line-height: 18px;
          }
        }

        .btn-fill {
          margin-left: 18px;
        }
      }
    }
  }

  .landing-body {
    margin-top: -20px;
    padding: 38px 64px 89px 64px;

    @media @max-lg-tablet {
      padding-left: 32px;
      padding-right: 32px;
    }

    @media @max-sl-mobile {
      padding: 20px 20px 0 20px;
    }

    .landing-video {
      position: absolute;
      right: 0;
      top: 0;
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      background-size: cover;
      overflow: hidden;
    }

    .landing-content {
      margin-top: 120px;

      @media @max-sl-mobile {
        margin-top: 50px;
        text-align: center;
      }

      .balance-infos {
        .tvl-value {
          background: -webkit-linear-gradient(90deg, #22b5b6 6.07%, #280c86 134.97%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .token-infos {
          margin-top: 8px;
          display: flex;
          align-items: center;
          color: #d4d5f2;

          @media @max-sl-mobile {
            justify-content: center;
          }

          img {
            margin-right: 10px;
          }

          label {
            margin-right: 25px;

            &:last-child {
              margin-right: 0;
            }
          }
        }
      }

      .cropper-content {
        margin-top: 68px;

        @media @max-sl-mobile {
          margin-top: 28px;
        }

        .powered-by {
          margin-top: 18px;
          color: #d4d5f2;
        }
      }

      .read-more {
        display: none;

        @media @max-sl-mobile {
          display: block;
        }

        .btn-container {
          border-radius: 8px;
          margin: 28px auto;
          height: 54px;

          .btn-outline {
            border-radius: 8px;
            width: 100%;
            padding: 7.5px 15px;
            justify-content: center;
          }
        }
      }

      .social-links {
        margin-top: 58px;
        margin-bottom: 12px;

        @media @max-sl-mobile {
          display: none;
        }

        .social-telegram .social-icon {
          margin-right: 0;
        }

        .social-medium,
        .social-discord,
        .social-twitter,
        .social-telegram {
          .social-icon {
            height: 24px;
            margin-right: 38px;
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

      .move-next-section {
        display: flex;
        margin: auto;

        @media @max-sl-mobile {
          display: none;
        }
      }
    }
  }

  .why-cropper {
    padding: 98px 64px 0 64px;

    @media @max-lg-tablet {
      padding-left: 32px;
      padding-right: 32px;
    }

    @media @max-sl-mobile {
      padding: 30px 20px 0 20px;
    }

    .intro-box-group {
      position: relative;
      margin-top: 48px;
      margin-bottom: 61px;
      display: flex;
      width: 100%;

      @media @max-sl-mobile {
        margin-top: 30px;
        margin-bottom: 48px;
        display: inline-block;
      }

      .stars-second-bg {
        position: absolute;
        top: calc(50% - 170px);
        left: calc(50% - 170px);

        @media @max-sl-mobile {
          display: none;
        }
      }

      .intro-box {
        height: 220px;
        background: linear-gradient(136.82deg, rgba(34, 181, 182, 0.5) 10.14%, rgba(40, 12, 134, 0.15) 85.36%);
        border-radius: 42px;
        display: inline-grid;
        width: calc((100% - 40px) / 3);
        margin-right: 20px;

        @media @max-sl-mobile {
          padding: 18px 24px;
          height: auto;
          border-radius: 22px;
          display: flex;
          align-items: center;
          width: 100%;
          margin-bottom: 20px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        &:last-child {
          margin-right: 0;
        }

        .card-img {
          margin: auto;

          @media @max-sl-mobile {
            margin: unset;
            margin-right: 18px;
            width: 32px;
          }
        }
      }
    }
  }

  .why-cropper-audit {
    position: relative;

    .landing-second-img {
      width: 100%;

      @media @max-sl-mobile {
        display: none;
      }
    }

    .audit-group {
      position: absolute;
      top: 37px;
      padding: 0 64px;
      width: 100%;

      @media @max-lg-tablet {
        padding: 0 32px;
      }

      @media @max-sl-mobile {
        position: relative;
        top: 0;
        left: 0;
        padding: 0 20px;
      }

      .audit-box-group {
        display: flex;

        @media @max-sl-mobile {
          display: inline-block;
          width: 100%;
        }

        .audit-box {
          padding: 52px 20px 78.45px 65px;
          background: linear-gradient(138.16deg, #22b5b6 -10.71%, rgba(40, 12, 134, 0.25) 111.29%);
          mix-blend-mode: lighten;
          border-radius: 42px;
          width: calc((100% - 20px) / 2);
          margin-right: 20px;
          border: 4px solid transparent;
          background-origin: border-box;

          &:hover {
            mix-blend-mode: normal;
            border: 4px solid @color-petrol500;
          }

          @media @max-lg-tablet {
            padding-left: 37px;
          }

          @media @max-sl-mobile {
            padding: 18px;
            width: 100%;
            background: linear-gradient(136.82deg, rgba(34, 181, 182, 0.5) 10.14%, rgba(40, 12, 134, 0.15) 85.36%);
            background-origin: border-box;
            border-radius: 22px;
            margin-bottom: 25px;

            &:last-child {
              margin-bottom: 0;
            }
          }

          &:last-child {
            margin-right: 0;
          }

          .read-pdf {
            margin-top: 38px;
            display: flex;
            align-items: center;
            color: #fff;

            .pdf-icon {
              margin-right: 18px;
            }
          }
        }
      }
    }
  }

  .features-headline {
    padding: 0 64px 98px 64px;

    @media @max-lg-tablet {
      padding-left: 32px;
      padding-right: 32px;
    }

    @media @max-sl-mobile {
      padding: 70px 20px 80px 20px;
    }

    .eco-content {
      margin: 20px auto;
      width: 60%;
    }

    .feature-box-group {
      margin-top: 48px !important;
      position: relative;

      .stars-third-bg {
        position: absolute;
        left: calc(50% - 350px);
        top: calc(50% - 350px);

        @media @max-sl-mobile {
          display: none;
        }
      }

      .feature-box {
        position: relative;
        background: linear-gradient(136.82deg, rgba(34, 181, 182, 0.5) 10.14%, rgba(40, 12, 134, 0.15) 85.36%);
        border-radius: 42px;
        padding-left: 36px;
        padding-right: 36px;
        height: 472px;
        padding-top: 30px;
        border: 4px solid transparent;
        background-origin: border-box;
        text-align: center;

        @media @max-lg-tablet {
          padding-left: 18px;
          padding-right: 18px;
        }

        @media @max-md-tablet {
          height: 376px;
        }

        @media @max-sl-mobile {
          padding: 18px 8px;
          border-radius: 22px;
          height: 357px;
        }

        &:last-child {
          margin-right: 0;
        }

        .feature-img {
          width: 100%;
          max-width: 214px;

          @media @max-md-tablet {
            max-width: 154px;
          }
        }

        .title {
          margin-top: 18px;
          text-align: left;
        }

        .content {
          margin-top: 5px;
          margin-bottom: 60px !important;
          text-align: left;
          word-break: break-all;

          @media @max-sl-mobile {
            margin-bottom: 18px !important;
          }
        }

        .now-btn {
          color: #fff;
          position: absolute;
          bottom: 50px;
          background: @color-petrol500;
          border-radius: 48px;
          padding: 8px 0;
          width: calc(100% - 72px);
          text-align: center;
          display: none;

          &.soon {
            background: rgba(35, 173, 180, 0.5);
          }

          @media @max-lg-tablet {
            width: calc(100% - 36px);
            bottom: 40px;
          }

          @media @max-sl-mobile {
            width: calc(100% - 16px);
            bottom: 18px;
          }
        }

        &:hover {
          padding-top: 0;
          border: 4px solid @color-petrol500;

          .now-btn {
            display: block;
          }
        }
      }
    }
  }

  .how-works {
    .tutorial-container {
      position: relative;
      height: calc(100vw * 1004 / 1600);

      @media @max-sl-mobile {
        height: auto;
      }

      .landing-third-bg {
        position: absolute;
        top: 0;
        width: 100%;

        @media @max-md-tablet {
          bottom: 0;
        }

        @media @max-sl-mobile {
          display: none;
        }
      }

      .tutorial-group {
        margin-top: 58px;
        width: 100%;

        @media @max-sl-mobile {
          margin-top: 40px;
        }
      }
    }
  }

  .cropper-feed {
    padding: 98px 64px;

    @media @max-lg-tablet {
      padding-left: 32px;
      padding-right: 32px;
    }

    @media @max-sl-mobile {
      padding: 100px 32px 48px 32px;
    }

    .feed-description {
      margin-top: 20px;
      width: 80%;
      margin-left: 10%;
    }

    .feed-container {
      margin-top: 50px;

      .feed-twitter {
        background: linear-gradient(115.9deg, #22b5b6 -40.58%, #280c86 95.48%);
        border-radius: 22px;
        padding: 20px;

        .feed-content {
          word-break: break-all;
          white-space: pre-line;
        }
      }

      .feed-video {
        background: linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
          linear-gradient(278.99deg, rgba(34, 181, 182, 0.6) 0%, rgba(40, 12, 134, 0.6) 100%);
        border: 3px solid #7a88b6;
        border-radius: 22px;
        height: 380px;

        @media @max-sl-mobile {
          height: 208px;
        }
      }

      .feed-medium {
        background: linear-gradient(115.9deg, #22b5b6 -40.58%, #280c86 95.48%);
        border-radius: 22px;
        padding: 22px;

        @media @max-sl-mobile {
          height: 124px;
        }
      }
    }

    .feed-link {
      margin-top: 20px;
      text-align: center;

      .join-btn-container {
        height: 45px;
        margin: auto;

        .join-btn {
          padding: 7.5px 15px;
        }
      }
    }
  }

  .surrounded-by {
    .category-group {
      margin-top: 48px;
      padding: 32px 0;
      border-top: 2px solid rgba(255, 255, 255, 0.2);
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);

      @media @max-sl-mobile {
        margin-top: 18px;
        padding: 12px 0;
      }

      .category-btn {
        padding: 17px 30px;
        background: transparent;
        border: 2px solid transparent;
        height: auto;
        color: #fff;
        margin-right: 38px;

        @media @max-sl-mobile {
          padding: 8px 12px;
          font-size: 13px !important;
          line-height: 19.5px !important;
          margin-right: 0;
        }

        &.active {
          background: @gradient-color-icon;
          background-origin: border-box;
          border: 2px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 4px 5px rgba(0, 0, 0, 0.5);
          border-radius: 8px;
        }

        &:last-child {
          margin-right: 0;
        }
      }
    }

    .industry-container {
      max-width: 952px;
      margin: auto;

      @media @max-lg-tablet {
        padding: 0 32px;
      }

      @media @max-sl-mobile {
        padding: 0 20px;
      }

      .industry-group {
        padding: 90px 0;

        @media @max-sl-mobile {
          padding: 24px 0;
        }

        .industry-card {
          background: @gradient-color-icon;
          height: 130px;
          padding: 2px;
          border-radius: 8px;

          @media @max-sl-mobile {
            height: 80px;
          }

          .industry-card-body {
            width: 100%;
            height: 100%;
            background: @color-blue800;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }
    }
  }
}
</style>
<style lang="less">
// ::-webkit-scrollbar {
//   display: none;
// }

// ant customization
.landing {
  .ant-row {
    @media @max-lg-tablet {
      .ant-col-22 {
        width: 100%;
      }
      .ant-col-offset-1 {
        margin-left: 0;
      }
    }

    @media @max-sl-mobile {
      .ant-col-22 {
        width: 100%;
      }
      .ant-col-offset-1 {
        margin-left: 0;
      }
    }
  }

  .ant-tabs {
    .ant-tabs-bar {
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      padding: 0 calc(64px + 4.166666666666667%);
      margin: 0 0 48px 0;

      @media @max-lg-tablet {
        padding: 0 32px;
        margin: 0 0 32px 0;
      }

      @media @max-md-tablet {
        padding: 0 32px;
        margin: 0 0 16px 0;
      }

      @media @max-sl-mobile {
        padding: 0 20px;
        margin-bottom: 20px;
      }

      .ant-tabs-nav {
        .ant-tabs-tab {
          font-weight: 600;
          font-size: 25px;
          line-height: 37px;
          letter-spacing: 0.25px;
          padding-bottom: 20px;
          margin-right: 65px;

          @media @max-sl-mobile {
            font-size: 20px;
            line-height: 30px;
          }

          &:last-child {
            margin-right: 0;
          }

          &:active,
          &:hover {
            color: @color-petrol500;
          }
        }

        .ant-tabs-tab-active {
          color: @color-petrol500;
        }

        .ant-tabs-ink-bar {
          background: @color-petrol500;
        }
      }
    }

    .ant-tabs-top-content.ant-tabs-content-animated {
      transition: margin-left 0.7s cubic-bezier(0.645, 0.045, 0.355, 1);
    }

    .ant-tabs-top-content > .ant-tabs-tabpane {
      padding: 0 calc(64px + 4.166666666666667%);

      @media @max-lg-tablet {
        padding: 0 32px;
      }

      @media @max-sl-mobile {
        padding: 0 20px;
      }

      .play-list {
        padding-top: 28px;

        .play-list-btn {
          margin-bottom: 18px;
          padding: 15px 0 15px 19px;
          background: @color-blue800;
          border-radius: 8px;
          border: 3px solid @color-blue800;
          color: #fff;
          height: auto;
          width: 100%;
          max-width: 292px;
          text-align: unset;

          @media @max-lg-tablet {
            padding: 15px 10px;
          }

          @media @max-md-tablet {
            padding: 15px 5px;
          }

          &:hover,
          &.active {
            background: @color-blue600;
            border: 3px solid @color-petrol400;
            box-shadow: 0 4px 5px rgba(0, 0, 0, 0.5);
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .video-play-col {
        display: flex;
        border: 3px solid #7a88b6;
        border-radius: 42px;
        background: @color-blue800;
        padding: 0 !important;

        @media @max-sl-mobile {
          margin-top: 20px;
        }

        .video-player {
          border-radius: 42px;
          width: 100%;
        }
      }
    }
  }

  @media @max-md-tablet {
    .balance-infos {
      margin-top: 40px;
    }
  }
}
</style>
