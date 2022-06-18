<template>
  <div class="fertilizer container">
    <div class="card">
      <div class="card-body">
        <div class="fertilizers-container">
          <div class="fertilizer-head fcsb-container">
            <h3 class="title weight-bold">Nomadpad</h3>
            <div class="information">
              <div class="tvl-info">
                <p class="font-large weight-semi">TVL : ${{ TVL.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}</p>
              </div>

              <div class="action-btn-group">
                <div class="reload-btn icon-cursor" :class="activeSpinning ? 'active' : ''" @click="reloadTimer">
                  <img src="@/assets/icons/reload.svg" />
                </div>
              </div>
            </div>
          </div>

          <div class="fertilizer-option-bar fcsb-container">
            <div class="option-tab-group">
              <div class="option-tab">
                <Button
                  class="font-large weight-semi icon-cursor"
                  :class="filterProject === filterOptions.upcoming ? 'active-tab' : ''"
                  @click="
                    () => {
                      this.filterProject = filterOptions.upcoming
                    }
                  "
                  >Upcoming Projects</Button
                >
                <div v-if="filterProject === filterOptions.upcoming" class="active-underline"></div>
              </div>
              <div class="option-tab">
                <Button
                  class="font-large weight-semi icon-cursor"
                  :class="filterProject === filterOptions.funded ? 'active-tab' : ''"
                  @click="
                    () => {
                      this.filterProject = filterOptions.funded
                    }
                  "
                >
                  Funded projects
                </Button>
                <div v-if="filterProject === filterOptions.funded" class="active-underline"></div>
              </div>
            </div>

            <div
              class="option-tab-group option-tab-collapse icon-cursor"
              @click="
                () => {
                  this.showTabMenu = !this.showTabMenu
                }
              "
            >
              <label class="font-large weight-semi icon-cursor">
                {{
                  filterProject === filterOptions.upcoming
                    ? filterOptions.upcoming
                    : filterProject === filterOptions.funded
                    ? filterOptions.funded
                    : ''
                }}
              </label>
              <img
                class="arrow-icon"
                :class="showTabMenu ? 'arrow-up' : 'arrow-down'"
                src="@/assets/icons/arrow-down-white.svg"
              />

              <div
                v-if="showTabMenu"
                class="option-sort-collapse collapse-left"
                v-click-outside="
                  () => {
                    this.showTabMenu = false
                  }
                "
              >
                <div
                  class="collapse-item text-center font-medium weight-semi icon-cursor"
                  :class="filterProject === filterOptions.upcoming ? 'active-item' : ''"
                  @click="
                    () => {
                      this.filterProject = filterOptions.upcoming
                    }
                  "
                >
                  Upcoming
                </div>
                <div
                  class="collapse-item text-center font-medium weight-semi icon-cursor"
                  :class="filterProject === filterOptions.funded ? 'active-item' : ''"
                  @click="
                    () => {
                      this.filterProject = filterOptions.funded
                    }
                  "
                >
                  Funded
                </div>
              </div>
            </div>

            <div class="option-filter-group">
              <div class="option-filter option-filter-fixed fcc-container icon-cursor">
                <img
                  src="@/assets/icons/search.svg"
                  @click="
                    () => {
                      this.showSearchMenu = !this.showSearchMenu
                    }
                  "
                />
              </div>

              <div
                v-if="showSearchMenu"
                class="option-search-collapse"
                v-click-outside="
                  () => {
                    this.showSearchMenu = false
                  }
                "
              >
                <div class="collapse-item-header fcsb-container">
                  <label class="font-large weight-bold">Search</label>
                  <img
                    class="icon-cursor"
                    src="@/assets/icons/close-circle.svg"
                    @click="
                      () => {
                        this.showSearchMenu = false
                      }
                    "
                  />
                </div>
                <div class="collapse-item-body">
                  <input ref="userInput" v-model="searchName" class="font-medium" placeholder="Search" />
                </div>
              </div>

              <div
                class="option-filter option-sort fcc-container icon-cursor"
                @click="
                  () => {
                    this.showFilterMenu = !this.showFilterMenu
                  }
                "
              >
                <span class="option-sort-item fcc-container font-body-medium weight-semi">
                  <label>Sort by:</label>
                  <span class="sort-detail">
                    <span v-if="filterProject === filterOptions.upcoming">
                      {{
                        sortUpcoming === filterOptions.all
                          ? filterOptions.all
                          : sortUpcoming === filterOptions.whitelist
                          ? filterOptions.whitelist
                          : sortUpcoming === filterOptions.sales
                          ? filterOptions.sales
                          : sortUpcoming === filterOptions.distribution
                          ? filterOptions.distribution
                          : sortUpcoming === filterOptions.preparation
                          ? filterOptions.preparation
                          : filterOptions.all
                      }}
                    </span>
                    <span v-else>
                      {{
                        sortFunded === sortOptions.investors
                          ? sortOptions.investors + (sortAsc ? ' (High > Low)' : ' (Low > High)')
                          : sortFunded === sortOptions.total_raised
                          ? sortOptions.total_raised + (sortAsc ? ' (High > Low)' : ' (Low > High)')
                          : sortFunded === sortOptions.token_price
                          ? sortOptions.token_price + (sortAsc ? ' (High > Low)' : ' (Low > High)')
                          : sortFunded === sortOptions.ath
                          ? sortOptions.ath + (sortAsc ? ' (High > Low)' : ' (Low > High)')
                          : sortFunded === sortOptions.end_date
                          ? sortOptions.end_date + (sortAsc ? ' (High > Low)' : ' (Low > High)')
                          : ''
                      }}
                    </span>
                    <img
                      class="arrow-icon"
                      :class="showFilterMenu ? 'arrow-up' : 'arrow-down'"
                      src="@/assets/icons/arrow-down-white.svg"
                    />
                  </span>
                </span>
              </div>

              <div class="option-filter option-filter-collapse option-filter-fixed fcc-container icon-cursor">
                <img
                  src="@/assets/icons/filter.svg"
                  @click="
                    () => {
                      this.showFilterMenu = !this.showFilterMenu
                    }
                  "
                />
              </div>

              <div
                v-if="showFilterMenu"
                v-click-outside="
                  () => {
                    this.showFilterMenu = false
                  }
                "
              >
                <div v-if="filterProject === filterOptions.upcoming" class="option-sort-collapse collapse-right">
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortUpcoming === filterOptions.all ? 'active-item' : ''"
                    @click="sortByStatus(filterOptions.all)"
                  >
                    {{ filterOptions.all }}
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortUpcoming === filterOptions.whitelist ? 'active-item' : ''"
                    @click="sortByStatus(filterOptions.whitelist)"
                  >
                    {{ filterOptions.whitelist }}
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortUpcoming === filterOptions.sales ? 'active-item' : ''"
                    @click="sortByStatus(filterOptions.sales)"
                  >
                    {{ filterOptions.sales }}
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortUpcoming === filterOptions.distribution ? 'active-item' : ''"
                    @click="sortByStatus(filterOptions.distribution)"
                  >
                    {{ filterOptions.distribution }}
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortUpcoming === filterOptions.preparation ? 'active-item' : ''"
                    @click="sortByStatus(filterOptions.preparation)"
                  >
                    {{ filterOptions.preparation }}
                  </div>
                </div>
                <div v-else-if="filterProject === filterOptions.funded" class="option-sort-collapse collapse-right">
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortFunded === sortOptions.investors && !sortAsc ? 'active-item' : ''"
                    @click="sortByColumnMenu(sortOptions.investors, false)"
                  >
                    {{ sortOptions.investors }} (Low > High)
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortFunded === sortOptions.investors && sortAsc ? 'active-item' : ''"
                    @click="sortByColumnMenu(sortOptions.investors, true)"
                  >
                    {{ sortOptions.investors }} (High > Low)
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortFunded === sortOptions.total_raised && !sortAsc ? 'active-item' : ''"
                    @click="sortByColumnMenu(sortOptions.total_raised, false)"
                  >
                    {{ sortOptions.total_raised }} (Low > High)
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortFunded === sortOptions.total_raised && sortAsc ? 'active-item' : ''"
                    @click="sortByColumnMenu(sortOptions.total_raised, true)"
                  >
                    {{ sortOptions.total_raised }} (High > Low)
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortFunded === sortOptions.ath && !sortAsc ? 'active-item' : ''"
                    @click="sortByColumnMenu(sortOptions.ath, false)"
                  >
                    {{ sortOptions.ath }} (Low > High)
                  </div>
                  <div
                    class="collapse-item text-center texts weight-bold icon-cursor"
                    :class="sortFunded === sortOptions.ath && sortAsc ? 'active-item' : ''"
                    @click="sortByColumnMenu(sortOptions.ath, true)"
                  >
                    {{ sortOptions.ath }} (High > Low)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="fertilizer-content">
            <Row v-if="filterProject != filterOptions.funded" :gutter="[18, 28]">
              <Col
                v-for="(fertilizer, idx) in fertilizerItems"
                :key="fertilizer.key"
                :lg="idx === 0 ? 12 : 6"
                :md="idx === 0 ? 16 : 8"
                :sm="24"
              >
                <div class="fertilizer-project-table" :class="idx === 0 ? 'first' : ''">
                  <div class="project-banner">
                    <img class="banner" :src="fertilizer.picture" />
                    <div
                      class="project-status"
                      :class="
                        fertilizer.status === filterOptions.upcoming
                          ? 'upcoming'
                          : fertilizer.status === filterOptions.whitelist
                          ? 'whitelist'
                          : fertilizer.status === filterOptions.sales
                          ? 'sales'
                          : fertilizer.status === filterOptions.distribution
                          ? 'distribution'
                          : fertilizer.status === filterOptions.preparation
                          ? 'preparation'
                          : ''
                      "
                    >
                      <span class="font-xsmall weight-bold">
                        {{
                          fertilizer.status === filterOptions.sales && currentTimestamp > fertilizer.sales_start_date
                            ? 'Open Sales'
                            : fertilizer.status
                        }}
                      </span>
                    </div>
                  </div>

                  <div class="project-details">
                    <div class="project-desc" :class="idx === 0 ? 'project-desc-whitelist fssb-container' : ''">
                      <div class="project-title">
                        <h4 class="title weight-bold spacing-medium">{{ fertilizer.title }}</h4>
                        <span class="short-desc font-medium weight-semi spacing-small">{{
                          fertilizer.short_desc
                        }}</span>
                      </div>

                      <div class="project-info fcsb-container">
                        <div class="project-balance">
                          <span class="label font-small weight-semi spacing-large">Total raise</span>
                          <span class="value font-medium weight-semi spacing-small fcs-container">
                            <CoinIcon class="coin-icon" :mint-address="fertilizer.price_token_mint" />
                            {{ fertilizer.hard_cap }} {{ fertilizer.price_token }}
                            <!-- TBA -->
                          </span>
                        </div>
                        <div class="project-balance">
                          <div v-if="fertilizer.subscribers">
                            <span class="label font-small weight-semi spacing-large">Subscribers</span>
                            <span class="value font-medium weight-semi spacing-small fcs-container">{{
                              fertilizer.subscribers
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-if="idx === 0" class="project-info whitelist-countdown fcc-container text-center">
                      <Countdown
                        v-if="fertilizer.distribution_start_date > currentTimestamp"
                        :title="
                          fertilizer.status === filterOptions.whitelist
                            ? 'The Whitelist ends in'
                            : fertilizer.status === filterOptions.sales &&
                              currentTimestamp < fertilizer.sales_start_date
                            ? 'Sales starts in'
                            : fertilizer.status === filterOptions.sales &&
                              currentTimestamp > fertilizer.sales_start_date
                            ? 'End of the sales in'
                            : fertilizer.status === filterOptions.distribution
                            ? 'Distribution starts in'
                            : fertilizer.status === filterOptions.preparation
                            ? 'Whitelist starts in'
                            : ''
                        "
                        :value="
                          fertilizer.status === filterOptions.whitelist
                            ? fertilizer.whitelist_end_date
                            : fertilizer.status === filterOptions.sales &&
                              currentTimestamp < fertilizer.sales_start_date
                            ? fertilizer.sales_start_date
                            : fertilizer.status === filterOptions.sales &&
                              currentTimestamp > fertilizer.sales_start_date
                            ? fertilizer.sales_end_date
                            : fertilizer.status === filterOptions.distribution
                            ? fertilizer.distribution_start_date
                            : fertilizer.status === filterOptions.preparation
                            ? fertilizer.whitelist_start_date
                            : 0
                        "
                        format="DD:HH:mm:ss"
                      />
                    </div>

                    <div v-else class="project-info fcs-container">
                      <div
                        v-if="
                          fertilizer.sales_start_date ||
                          fertilizer.sales_end_date ||
                          fertilizer.distribution_start_date ||
                          fertilizer.distribution_end_date ||
                          fertilizer.whitelist_start_date ||
                          fertilizer.whitelist_end_date
                        "
                      >
                        <div
                          v-if="
                            fertilizer.status === filterOptions.sales && currentTimestamp > fertilizer.sales_start_date
                          "
                          class="project-status open"
                        >
                          <span class="font-xsmall weight-bold">Open Now</span>
                        </div>
                        <div v-else-if="fertilizer.distribution_start_date > currentTimestamp" class="project-balance">
                          <span class="label font-small weight-semi spacing-large">
                            {{
                              fertilizer.status === filterOptions.preparation
                                ? 'Whitelist starts in'
                                : fertilizer.status === filterOptions.whitelist
                                ? 'Whitelist ends in'
                                : fertilizer.status === filterOptions.sales
                                ? 'Sales starts in'
                                : fertilizer.status === filterOptions.distribution
                                ? 'Distribution starts in'
                                : ''
                            }}
                          </span>
                          <span
                            class="value fcs-container"
                            v-if="fertilizer.distribution_start_date > currentTimestamp"
                          >
                            <Countdown
                              :value="
                                fertilizer.status === filterOptions.preparation
                                  ? fertilizer.whitelist_start_date
                                  : fertilizer.status === filterOptions.whitelist
                                  ? fertilizer.whitelist_end_date
                                  : fertilizer.status === filterOptions.sales
                                  ? fertilizer.sales_start_date
                                  : fertilizer.status === filterOptions.distribution
                                  ? fertilizer.distribution_start_date
                                  : 0
                              "
                              format="DD:HH:mm:ss"
                            />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="btn-container">
                      <Button
                        @click="goToProject(fertilizer)"
                        v-if="fertilizer.status === filterOptions.whitelist"
                        class="btn-transparent font-medium weight-semi fcc-container spacing-small"
                        >Subscription</Button
                      >
                      <Button
                        @click="goToProject(fertilizer)"
                        v-else
                        class="btn-transparent font-medium weight-semi fcc-container spacing-small"
                        >Research Now</Button
                      >
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <div v-else>
              <div class="fertilizer-funded-table isDesktop">
                <Row class="fertilizer-funded-table-header">
                  <Col class="header-column font-small weight-bold text-left" span="6"> Project name </Col>
                  <Col class="header-column font-small weight-bold" span="3">
                    <div class="header-column-title" @click="sortByColumn(sortOptions.investors)">
                      Investors
                      <img
                        v-if="sortFunded === sortOptions.investors"
                        src="@/assets/icons/arrow-down-green.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.investors && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                      <img
                        v-else
                        src="@/assets/icons/arrow-down-white.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.investors && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                    </div>
                  </Col>
                  <Col class="header-column font-small weight-bold" span="4">
                    <div class="header-column-title" @click="sortByColumn(sortOptions.total_raised)">
                      Total raise
                      <img
                        v-if="sortFunded === sortOptions.total_raised"
                        src="@/assets/icons/arrow-down-green.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.total_raised && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                      <img
                        v-else
                        src="@/assets/icons/arrow-down-white.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.total_raised && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                    </div>
                  </Col>
                  <Col class="header-column font-small weight-bold" span="3">
                    <div class="header-column-title" @click="sortByColumn(sortOptions.token_price)">
                      Token price
                      <img
                        v-if="sortFunded === sortOptions.token_price"
                        src="@/assets/icons/arrow-down-green.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.token_price && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                      <img
                        v-else
                        src="@/assets/icons/arrow-down-white.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.token_price && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                    </div>
                  </Col>
                  <Col class="header-column font-small weight-bold" span="3">
                    <div class="header-column-title" @click="sortByColumn(sortOptions.ath)">
                      ATH Since IDO
                      <img
                        v-if="sortFunded === sortOptions.ath"
                        src="@/assets/icons/arrow-down-green.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.ath && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                      <img
                        v-else
                        src="@/assets/icons/arrow-down-white.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.ath && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                    </div>
                  </Col>
                  <Col class="header-column font-small weight-bold" span="4">
                    <div class="header-column-title" @click="sortByColumn(sortOptions.end_date)">
                      Ended in UTC
                      <img
                        v-if="sortFunded === sortOptions.end_date"
                        src="@/assets/icons/arrow-down-green.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.end_date && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                      <img
                        v-else
                        src="@/assets/icons/arrow-down-white.svg"
                        class="arrow-icon"
                        :class="sortFunded === sortOptions.end_date && sortAsc ? 'arrow-down' : 'arrow-up'"
                      />
                    </div>
                  </Col>
                </Row>

                <div class="fertilizer-funded-table-body">
                  <Row
                    class="fertilizer-funded-table-item"
                    v-for="(fertilizer, idx) in fertilizerItems"
                    :key="fertilizer.key"
                  >
                    <Col class="state" span="6">
                      <div class="project-name fcs-container">
                        <img class="logo" :src="fertilizer.picture" />
                        <div class="title">
                          <span class="font-medium weight-semi">{{ fertilizer.title }}</span>
                          <span class="short-desc bodXS weight-semi">{{ fertilizer.short_desc }}</span>
                        </div>
                      </div>
                    </Col>

                    <Col class="state font-medium weight-semi" span="3">
                      {{ fertilizer.investors }}
                    </Col>

                    <Col class="state font-medium weight-semi" span="4">
                      ${{ new TokenAmount(fertilizer.hard_cap, 2, false).format() }}
                    </Col>
                    <Col class="state font-medium weight-semi" span="3">
                      ${{ new TokenAmount(fertilizer.token_price, 3, false).format() }}
                    </Col>
                    <Col class="state font-medium weight-semi" span="3">
                      <div class="project-ath fcc-container">
                        <Tooltip placement="bottomLeft">
                          <template slot="title">
                            <span class="font-small weight-semi">If you invested 100$ you would have 1000$</span>
                          </template>
                          <div class="info-icon">
                            <img src="@/assets/icons/info.svg" />
                          </div>
                        </Tooltip>
                        <span class="value font-medium weight-semi spacing-small">+{{ fertilizer.ath }}%</span>
                      </div>
                    </Col>
                    <Col class="state font-medium weight-semi" span="4">
                      {{ moment(fertilizer.distribution_end_date).format('MMMM Do YYYY') }}
                    </Col>
                    <Col class="state" span="1">
                      <div class="show-more icon-cursor" @click="showMore(idx)">
                        <img src="@/assets/icons/dot3.svg" />
                        <div
                          v-if="showMoreMenu[idx]"
                          class="option-sort-collapse collapse-right"
                          v-click-outside="hideMore"
                        >
                          <div
                            @click="goToProject(fertilizer)"
                            class="collapse-item text-center font-medium weight-semi icon-cursor"
                          >
                            <a> See project </a>
                          </div>
                          <div class="collapse-item text-center font-medium weight-semi icon-cursor">
                            <a> Stake </a>
                          </div>
                          <div class="collapse-item text-center font-medium weight-semi icon-cursor">
                            <a> Swap </a>
                          </div>
                          <div class="collapse-item text-center font-medium weight-semi icon-cursor">
                            <a class="social-link fcc-container" href="#" target="_blank">
                              Share
                              <img class="social-icon" src="@/assets/icons/share.svg" />
                            </a>
                          </div>
                          <div class="collapse-item text-center font-medium weight-semi icon-cursor">
                            <a class="social-link fcc-container" href="#" target="_blank">
                              Twitter
                              <img class="social-icon" src="@/assets/icons/twitter-white.svg" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>

              <div class="fertilizer-funded-table isTablet">
                <Collapse v-model="showCollapse" accordion>
                  <CollapsePanel
                    v-for="(fertilizer) in fertilizerItems"
                    :key="fertilizer.key"
                    v-show="true"
                    :show-arrow="true"
                  >
                    <Row slot="header" class="collapse-header">
                      <Col class="state" span="8">
                        <div class="project-name fcs-container">
                          <img class="logo" :src="fertilizer.picture" />
                          <div class="title">
                            <span class="font-medium weight-semi">{{ fertilizer.title }}</span>
                            <span class="short-desc bodXS weight-semi">{{ fertilizer.short_desc }}</span>
                          </div>
                        </div>
                      </Col>

                      <Col class="state text-center" span="5">
                        <span class="label font-small weight-bold">Investors</span>
                        <span class="font-medium weight-semi">{{ fertilizer.investors }} </span>
                      </Col>

                      <Col class="state font-medium weight-semi text-center" span="5">
                        <span class="label font-small weight-bold">Total raise</span>
                        ${{ new TokenAmount(fertilizer.hard_cap, 2, false).format() }}
                      </Col>

                      <Col class="state font-medium weight-semi text-center" span="5">
                        <span class="label font-small weight-bold">Token price</span>
                        ${{ new TokenAmount(fertilizer.token_price, 3, false).format() }}
                      </Col>

                      <Button class="detail-btn font-small weight-semi">
                        <img
                          class="arrow-icon"
                          :class="fertilizer.key != showCollapse ? 'arrow-up' : 'arrow-down'"
                          src="@/assets/icons/arrow-down-white.svg"
                        />
                      </Button>
                    </Row>

                    <Row class="collapse-row" :gutter="[18, 18]">
                      <Col :span="12">
                        <div class="fssb-container">
                          <div class="state">
                            <span class="label font-small weight-bold">ATH Since IDO</span>
                            <div class="project-ath fcc-container">
                              <Tooltip placement="bottomLeft">
                                <template slot="title">
                                  <span class="font-small weight-semi">If you invested 100$ you would have 1000$</span>
                                </template>
                                <div class="info-icon">
                                  <img src="@/assets/icons/info.svg" />
                                </div>
                              </Tooltip>
                              <span class="value font-medium weight-semi spacing-small">+{{ fertilizer.ath }}%</span>
                            </div>
                          </div>

                          <div class="state text-center" span="5">
                            <span class="label font-small weight-bold">Ended in UTC</span>
                            <span class="font-medium weight-semi">{{
                              moment(fertilizer.distribution_end_date).format('MMMM Do YYYY')
                            }}</span>
                          </div>
                        </div>
                      </Col>

                      <Col class="btn-group" :span="12">
                        <div class="fce-container">
                          <div class="btn-container">
                            <Button @click="goToProject(fertilizer)" class="btn-primary font-small weight-bold">
                              See project
                            </Button>
                          </div>

                          <div class="btn-container">
                            <Button class="btn-primary font-small weight-bold"> Stake </Button>
                          </div>

                          <div class="btn-container">
                            <Button class="btn-primary font-small weight-bold"> Swap </Button>
                          </div>
                        </div>
                      </Col>

                      <Col class="btn-group" :span="24">
                        <div class="fcc-container">
                          <a
                            class="social-link fcc-container font-xsmall weight-semi icon-cursor"
                            href="#"
                            target="_blank"
                          >
                            Share
                            <img class="social-icon" src="@/assets/icons/share.svg" />
                          </a>
                          <a
                            class="social-link fcc-container font-xsmall weight-semi icon-cursor"
                            href="#"
                            target="_blank"
                          >
                            Twitter
                            <img class="social-icon" src="@/assets/icons/twitter-white.svg" />
                          </a>
                        </div>
                      </Col>
                    </Row>
                  </CollapsePanel>
                </Collapse>
              </div>

              <div class="fertilizer-funded-table isMobile">
                <Collapse v-model="showCollapse" accordion>
                  <CollapsePanel
                    v-for="(fertilizer) in fertilizerItems"
                    :key="fertilizer.key"
                    v-show="true"
                    :show-arrow="true"
                  >
                    <Row slot="header" class="collapse-header">
                      <Col class="state" span="23">
                        <div class="project-name fcs-container">
                          <img class="logo" :src="fertilizer.picture" />
                          <div class="title">
                            <span class="font-medium weight-semi">{{ fertilizer.title }}</span>
                            <span class="short-desc bodXS weight-semi">{{ fertilizer.short_desc }}</span>
                          </div>
                        </div>
                      </Col>

                      <Button class="detail-btn font-small weight-semi">
                        <img
                          class="arrow-icon"
                          :class="fertilizer.key != showCollapse ? 'arrow-up' : 'arrow-down'"
                          src="@/assets/icons/arrow-down-white.svg"
                        />
                      </Button>
                    </Row>

                    <Row class="collapse-row" :gutter="[18, 18]">
                      <Col :span="24">
                        <div class="fcsb-container">
                          <div class="state">
                            <span class="label font-small weight-bold">Total raise</span>
                            <span class="font-medium weight-semi"
                              >${{ new TokenAmount(fertilizer.hard_cap, 2, false).format() }}</span
                            >
                          </div>

                          <div class="state">
                            <span class="label font-small weight-bold">Investors</span>
                            <span class="font-medium weight-semi">{{ fertilizer.investors }}</span>
                          </div>
                        </div>
                      </Col>

                      <Col :span="24">
                        <div class="fcsb-container">
                          <div class="state">
                            <span class="label font-small weight-bold">Token price</span>
                            <span class="font-medium weight-semi spacing-small"
                              >${{ new TokenAmount(fertilizer.token_price, 3, false).format() }}</span
                            >
                          </div>

                          <div class="state">
                            <span class="label font-small weight-bold">ATH Since IDO</span>
                            <div class="project-ath fcc-container">
                              <Tooltip placement="bottomLeft">
                                <template slot="title">
                                  <span class="font-small weight-semi">If you invested 100$ you would have 1000$</span>
                                </template>
                                <div class="info-icon">
                                  <img src="@/assets/icons/info.svg" />
                                </div>
                              </Tooltip>
                              <span class="value font-medium weight-semi spacing-small">+{{ fertilizer.ath }}%</span>
                            </div>
                          </div>
                        </div>
                      </Col>

                      <Col :span="24">
                        <div class="fcsb-container">
                          <div class="state" span="5">
                            <span class="label font-small weight-bold">Ended in UTC</span>
                            <span class="font-medium weight-semi">{{
                              moment(fertilizer.distribution_end_date).format('MMMM Do YYYY')
                            }}</span>
                          </div>
                        </div>
                      </Col>

                      <Col class="btn-group" :span="24">
                        <div class="btn-group-item fcc-container">
                          <div class="btn-container">
                            <Button @click="goToProject(fertilizer)" class="btn-primary font-small weight-bold">
                              See project
                            </Button>
                          </div>

                          <div class="btn-container">
                            <Button class="btn-primary font-small weight-bold"> Stake </Button>
                          </div>

                          <div class="btn-container">
                            <Button class="btn-primary font-small weight-bold"> Swap </Button>
                          </div>
                        </div>

                        <div class="btn-group-item fcc-container">
                          <a
                            class="social-link fcc-container font-xsmall weight-semi icon-cursor"
                            href="#"
                            target="_blank"
                          >
                            Share
                            <img class="social-icon" src="@/assets/icons/share.svg" />
                          </a>
                          <a
                            class="social-link fcc-container font-xsmall weight-semi icon-cursor"
                            href="#"
                            target="_blank"
                          >
                            Twitter
                            <img class="social-icon" src="@/assets/icons/twitter-white.svg" />
                          </a>
                        </div>
                      </Col>
                    </Row>
                  </CollapsePanel>
                </Collapse>
              </div>
            </div>
          </div>

          <!-- <div v-if="initialized"></div>

        <div v-else class="fcc-container">
          <Spin :spinning="true">
            <Icon slot="indicator" type="loading" style="font-size: 24px" spin />
          </Spin>
        </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import importIcon from '@/utils/import-icon'
import { Collapse, Row, Col, Pagination, Button, Statistic, Tooltip } from 'ant-design-vue'
import { get, cloneDeep } from 'lodash-es'
import { TokenAmount } from '@/utils/safe-math'
import { getUnixTs } from '@/utils'
import moment from 'moment'
import { TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token'
import { TOKENS, NATIVE_SOL, getTokenByMintAddress } from '@/utils/tokens'
import {
  setAnchorProvider,
  getLaunchpad,
  getProjectFormatted,
  getAllProjects,
  LaunchpadProgram
} from '@/utils/crp-launchpad'
import { initialize } from '@/utils/market'
import { getMintDecimals } from '@/utils/web3'
import { PublicKey } from '@solana/web3.js'
const Vco = require('v-click-outside')
Vue.use(Vco)
const CollapsePanel = Collapse.Panel
const Countdown = Statistic.Countdown

export default Vue.extend({
  // async asyncData({ redirect }) {
  //   redirect('/nomadpad/_project')
  // },
  components: {
    // Spin,
    // Icon,
    Collapse,
    CollapsePanel,
    Row,
    Col,
    Button,
    Countdown,
    Tooltip
  },
  data() {
    return {
      searchName: '',
      coinPicUrl: '',
      initialized: false as boolean,
      labelizedAmms: {} as any,
      currentPage: 1,
      coinName: '',
      mintAddress: '',
      poolLoaded: false,
      autoRefreshTime: 60 as number,
      countdown: 0,
      showCollapse: [] as any[],
      timer: null as any,
      loading: false as boolean,
      nbFarmsLoaded: 0 as number,
      poolType: true as boolean,
      TVL: 0,
      activeSpinning: false as boolean,
      showTabMenu: false as boolean,
      showSearchMenu: false as boolean,
      showFilterMenu: false as boolean,
      showMoreMenu: [] as boolean[],
      currentShowMore: -1 as number,
      sortUpcoming: 'All' as string,
      sortFunded: 'Investors' as string,
      sortAsc: false as boolean,
      filterOptions: {
        all: 'All',
        whitelist: 'Whitelist Open',
        sales: 'Sales',
        distribution: 'Distribution',
        upcoming: 'Upcoming',
        preparation: 'Preparation',
        funded: 'Funded'
      },
      registerdList: {},
      sortOptions: {
        investors: 'Investors',
        total_raised: 'Total raise',
        token_price: 'Token price',
        ath: 'ATH Since IDO',
        end_date: 'Ended in UTC'
      },
      filterProject: 'Upcoming' as string,
      fertilizerItems: [] as any[],
      projects: [] as any,
      fertilizerData: [] as any,
      currentTimestamp: 0
    }
  },
  head: {
    title: 'NeoNomad Finance - Nomadpad'
  },
  computed: {
    ...mapState(['app', 'wallet', 'farm', 'url', 'price', 'liquidity'])
  },
  async mounted() {
    this.getTvl()
    this.initialize()
  },

  watch: {
    showCollapse: {
      immediate: true,
      handler() {
        // if (this.showCollapse.length > 0) {
        //   this.showCollapse.splice(0, this.showCollapse.length)
        // }
      },
      deep: true
    },
    searchName: {
      handler(newSearchName: string) {
        this.filterFertilizer(newSearchName, this.filterProject)
      },
      deep: true
    },
    filterProject: {
      handler(newFilterProject: string) {
        this.sortUpcoming = this.filterOptions.all
        this.sortFunded = this.sortOptions.investors
        this.sortAsc = false
        this.showFilterMenu = false
        this.filterFertilizer(this.searchName, newFilterProject)
      },
      deep: true
    },
    'wallet.connected': {
      handler(connected: any) {
        if (connected) {
          this.initialize()
        }
      },
      deep: true
    }
  },
  methods: {
    importIcon,
    TokenAmount,
    async getTvl() {
      let cur_date = new Date().getTime()
      if (window.localStorage.TVL_last_updated) {
        const last_updated = parseInt(window.localStorage.TVL_last_updated)
        if (cur_date - last_updated <= 600000) {
          this.TVL = window.localStorage.TVL
          return
        }
      }

      let responseData: any = []
      let tvl = 0
      this.TVL = Math.round(tvl)

      window.localStorage.TVL_last_updated = new Date().getTime()
      window.localStorage.TVL = this.TVL
    },
    async initialize() {
      setAnchorProvider(this.$web3, this.$wallet)

      this.$accessor.token.loadTokens()

      let timer = setInterval(async () => {
        if (this.nbFarmsLoaded == Object.keys(this.labelizedAmms).length) {
          this.initialized = true
        }
      }, 1000)

      this.timer = setInterval(async () => {
        clearInterval(this.timer)
        this.setTimer()
      }, 1000)

      await this.constructFertilizerData()

      this.currentTimestamp = moment().valueOf()
      this.updateFertilizer()
    },

    async constructFertilizerData() {
      // let registerdList
      // try {
      //   registerdList = await fetch('https://flow.cropper.finance/registers/').then((res) => res.json())
      // } catch {
      // } finally {
      // }

      let responseData

      try {
        responseData = await getAllProjects()
      } catch {
        // dummy data
      } finally {
      }

      this.fertilizerData = []
      let key = 0
      console.log('responseData', responseData)
      for (const item of responseData) {
        let project = {
          status: 'Whitelist Open',
          key: 'k' + key,
          picture: '/Crypto_Nomad_Logo_-_White.svg',
          title: 'NeoNomad Finance',
          short_desc: '',
          slug: 'neo_namad',
          hard_cap: '198000',
          subscribers: 0,
          mint: item.account.projectMint.toBase58(),
          whitelist_end_date: 1643500800000,
          whitelist_start_date: 0,
          distribution_end_date: 0,
          distribution_start_date: 0,
          date_preparation: 0,
          sales_end_date: 0,
          sales_start_date: 0,
          token_price: 0,
          price_token: '',
          price_token_mint: ''
        }

        let scValues: any = await getProjectFormatted(item.account.projectMint.toBase58())

        const decimals_mint = await getMintDecimals(LaunchpadProgram.provider.connection, item.account.projectMint)
        const decimals_sale = await getMintDecimals(LaunchpadProgram.provider.connection, item.account.saleMint)
        if (decimals_mint != undefined && decimals_sale != undefined) {
          const amp_mint = Math.pow(10, decimals_mint)
          const amp_sale = Math.pow(10, decimals_sale)
          scValues.total_deposit_amount /= amp_mint
          scValues.total_paid_amount /= amp_sale
          scValues.total_claimed_amount /= amp_mint
        }
        project.hard_cap = (scValues.total_deposit_amount * scValues.token_price).toString()

        if (!scValues) {
          continue
        }

        var curdate = (new Date() as any) * 1

        project.distribution_end_date = (moment(scValues.date_distribution).unix() + 86400 * 2) * 1000
        project.distribution_start_date = moment(scValues.date_distribution).unix() * 1000
        project.date_preparation = moment(scValues.date_preparation).unix() * 1000
        project.sales_end_date = moment(scValues.date_sale_end).unix() * 1000
        project.sales_start_date = moment(scValues.date_sale_start).unix() * 1000
        project.whitelist_end_date = moment(scValues.date_whitelist_end).unix() * 1000
        project.whitelist_start_date = moment(scValues.date_whitelist_start).unix() * 1000

        if (scValues.token_price == undefined) {
          continue
        }

        project.token_price = scValues.token_price

        if (curdate > project.distribution_end_date) {
          project.status = 'Funded'
        } else if (curdate > project.distribution_start_date) {
          project.status = 'Distribution'
        } else if (curdate > project.sales_end_date) {
          project.status = 'Distribution'
        } else if (curdate > project.sales_start_date) {
          project.status = 'Sales'
        } else if (curdate > project.whitelist_end_date) {
          project.status = 'Lottery'
        } else if (curdate > project.whitelist_start_date) {
          project.status = 'Whitelist Open'
        } else {
          project.status = 'Upcoming'
        }
        let token = getTokenByMintAddress(scValues.price_token_mint)

        if (token) {
          project.price_token = token.symbol
          project.price_token_mint = scValues.price_token_mint
        }

        key++
        this.fertilizerData.push(project)
      }
    },

    async flush() {
      clearInterval(this.timer)
      this.poolLoaded = true
      this.countdown = 0
      this.setTimer()
    },
    async delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
    setTimer() {
      this.timer = setInterval(async () => {
        if (!this.loading) {
          if (this.countdown < this.autoRefreshTime) {
            this.countdown += 1
            if (this.countdown === this.autoRefreshTime) {
              await this.flush()
            }
          }
        }
      }, 1000)
    },
    reloadTimer() {
      this.flush()
      this.$accessor.wallet.getTokenAccounts()
      this.activeSpinning = true
      setTimeout(() => {
        this.activeSpinning = false
      }, 1000)
    },
    updateFertilizer() {
      this.filterFertilizer(this.searchName, this.filterProject)
    },
    filterFertilizer(searchName: string, filterProject: string) {
      // filter with tabs
      if (filterProject === this.filterOptions.upcoming) {
        this.fertilizerItems = this.fertilizerData.filter(
          (fertilizer: any) => fertilizer.status != this.filterOptions.funded
        )

        // sort by status on Upcoming Projects
        if (this.sortUpcoming === this.filterOptions.all) {
          this.fertilizerItems = this.fertilizerItems.filter(
            (fertilizer: any) => fertilizer.status != this.filterOptions.funded
          )
        } else if (this.sortUpcoming === this.filterOptions.whitelist) {
          this.fertilizerItems = this.fertilizerItems.filter(
            (fertilizer: any) => fertilizer.status === this.filterOptions.whitelist
          )
        } else if (this.sortUpcoming === this.filterOptions.sales) {
          this.fertilizerItems = this.fertilizerItems.filter(
            (fertilizer: any) => fertilizer.status === this.filterOptions.sales
          )
        } else if (this.sortUpcoming === this.filterOptions.distribution) {
          this.fertilizerItems = this.fertilizerItems.filter(
            (fertilizer: any) => fertilizer.status === this.filterOptions.distribution
          )
        } else if (this.sortUpcoming === this.filterOptions.preparation) {
          this.fertilizerItems = this.fertilizerItems.filter(
            (fertilizer: any) => fertilizer.status === this.filterOptions.preparation
          )
        }
      } else {
        this.fertilizerItems = this.fertilizerData.filter(
          (fertilizer: any) => fertilizer.status === this.filterOptions.funded
        )

        // sort by column on Funded projects
        if (this.sortAsc) {
          if (this.sortFunded == this.sortOptions.investors) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => b.investors - a.investors)
          } else if (this.sortFunded == this.sortOptions.total_raised) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => b.hard_cap - a.hard_cap)
          } else if (this.sortFunded == this.sortOptions.token_price) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => b.token_price - a.token_price)
          } else if (this.sortFunded == this.sortOptions.ath) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => b.ath - a.ath)
          } else if (this.sortFunded == this.sortOptions.end_date) {
            this.fertilizerItems = this.fertilizerItems.sort(
              (a: any, b: any) => b.distribution_end_date - a.distribution_end_date
            )
          }
        } else {
          if (this.sortFunded == this.sortOptions.investors) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => a.investors - b.investors)
          } else if (this.sortFunded == this.sortOptions.total_raised) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => a.hard_cap - b.hard_cap)
          } else if (this.sortFunded == this.sortOptions.token_price) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => a.token_price - b.token_price)
          } else if (this.sortFunded == this.sortOptions.ath) {
            this.fertilizerItems = this.fertilizerItems.sort((a: any, b: any) => a.ath - b.ath)
          } else if (this.sortFunded == this.sortOptions.end_date) {
            this.fertilizerItems = this.fertilizerItems.sort(
              (a: any, b: any) => a.distribution_end_date - b.distribution_end_date
            )
          }
        }
      }

      // search with name
      if (searchName != '') {
        this.fertilizerItems = this.fertilizerItems.filter((fertilizer: any) =>
          fertilizer.title.toLowerCase().includes(searchName.toLowerCase())
        )
      }

      this.showMoreMenu = []
      this.fertilizerItems.forEach((element) => {
        this.showMoreMenu.push(false)
      })
    },
    moment() {
      return moment()
    },
    getCoinPicUrl() {
      let token
      if (this.mintAddress == NATIVE_SOL.mintAddress) {
        token = NATIVE_SOL
      } else {
        token = Object.values(TOKENS).find((item) => item.mintAddress === this.mintAddress)
      }
      if (token) {
        this.coinName = token.symbol.toLowerCase()
        if (token.picUrl) {
          this.coinPicUrl = token.picUrl
        } else {
          this.coinPicUrl = ''
        }
      }
    },
    goToProject(fertilizer: any) {
      localStorage.setItem('fertilizer-project', JSON.stringify(fertilizer))
      this.$router.push({
        path: '/nomadpad/project?project=' + fertilizer.mint
      })
    },
    sortByStatus(option: string) {
      this.sortUpcoming = option
      this.showFilterMenu = false
      this.filterFertilizer(this.searchName, this.filterProject)
    },
    sortByColumn(option: string) {
      if (this.sortFunded === option) this.sortAsc = !this.sortAsc
      this.sortFunded = option
      this.filterFertilizer(this.searchName, this.filterProject)
    },
    sortByColumnMenu(option: string, asc: boolean) {
      this.sortFunded = option
      this.sortAsc = asc
      this.showFilterMenu = false
      this.filterFertilizer(this.searchName, this.filterProject)
    },
    showMore(idx: number) {
      if (idx != this.currentShowMore) {
        this.showMoreMenu = this.showMoreMenu.map((item) => {
          return false
        })
      }
      this.showMoreMenu = this.showMoreMenu.map((item, i) => {
        if (i === idx) {
          this.currentShowMore = idx
          return !item
        }
        return item
      })
    },
    hideMore() {
      if (this.currentShowMore != -1) {
        this.showMoreMenu = this.showMoreMenu.map((item) => {
          return false
        })
        this.currentShowMore = -1
      }
    }
  }
})
</script>

<style lang="less" scoped>
// global stylesheet
.fertilizer {
  .btn-container {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    padding: 3px;
    height: auto;
  }

  .btn-transparent {
    background: transparent;
    border-radius: 48px;
    border: none;
    height: auto;
    width: 100%;
    padding: 7.5px 0;
  }

  .btn-primary {
    background: @color-blue700;
    border-radius: 48px;
    border: none;
    height: auto;
    width: auto;
    padding: 4.5px 23.5px;
  }

  .option-sort-collapse {
    position: absolute;
    top: 50px;
    background: linear-gradient(rgba(75, 85, 231, 0.65098), rgba(182, 97, 150, 0.74902));
    background-origin: border-box;
    border: 2px solid rgba(255, 255, 255, 0.14);
    box-shadow: 18px 11px 14px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    min-width: 188px;
    z-index: 999;

    &.collapse-left {
      left: 0;
    }

    &.collapse-right {
      right: 0;
    }

    .collapse-item {
      padding: 18px 0;
      border-bottom: 1px solid #c4c4c420;

      &:last-child {
        border-bottom: 0;
      }

      &.active-item {
        color: #e4c139;
      }

      a {
        color: #fff;
      }
    }
  }

  .project-status {
    padding: 4px 8px;
    border-radius: 6px;

    &.upcoming {
      background: #ec08deb3;
    }

    &.whitelist {
      background: #ec08deb3;
    }

    &.sales {
      background: #ec08deb3;
    }

    &.distribution {
      background: #ec08deb3;
      color: @color-neutral900;
    }

    &.preparation {
      background: #ec08deb3;
    }

    &.open {
      background: #ec08deb3;
    }
  }

  .project-name {
    .logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 18px;
    }

    .title {
      text-align: left;

      .short-desc {
        display: block;
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }

  .project-ath {
    .value {
      background: @color-petrol400;
      color: @color-blue800;
      padding: 4px 8px;
      border-radius: 4px;
    }
  }

  .info-icon {
    img {
      width: 12px;
      height: 12px;
      margin-right: 8px;
    }
  }

  .arrow-icon {
    transition: all 0.3s;

    &.arrow-up {
      transform: rotate(180deg);
    }
  }

  .social-link {
    color: #fff;

    .social-icon {
      width: 18px;
      height: 18px;
      margin-left: 8px;
    }
  }

  .detail-btn {
    position: absolute;
    right: 0;
    background: none;
    border: none;
    display: flex;
    align-items: center;
  }

  .isDesktop {
    @media @max-lg-tablet {
      display: none;
    }
  }

  .isTablet {
    display: none;

    @media @max-lg-tablet {
      display: unset;
    }

    @media @max-sl-mobile {
      display: none;
    }
  }

  .isMobile {
    display: none;

    @media @max-sl-mobile {
      display: unset;
    }
  }
}

// class stylesheet
.fertilizers-container {
  box-shadow: inset 0 0 28px #2d0b50e1;
  background: rgba(129, 116, 245, 0.5);
  border-radius: 18px;
  padding: 20px 35px;
  margin-top: 20px;

  @media @max-sl-mobile {
    padding: 15px;
  }
}

.fertilizer.container {
  margin: 38px 0;

  @media @max-sl-mobile {
    margin: 28px 0;
  }

  .card {
    .card-body {
      padding: 0;

      .fertilizer-head {
        @media @max-sl-mobile {
          display: block !important;
        }

        .title {
          text-align: center;
          position: relative;
          float: left;

          @media @max-sl-mobile {
            margin-bottom: 18px !important;
          }
        }

        .information {
          display: flex;
          align-items: center;
          justify-content: space-between;

          @media @max-sl-mobile {
            width: 100%;
          }

          .tvl-info {
            margin-right: 18px;
          }

          .action-btn-group {
            display: flex;
            align-items: center;

            .reload-btn {
              background: linear-gradient(rgba(75, 85, 231, 0.65098), rgba(182, 97, 150, 0.74902));
              border-radius: 8px;
              padding: 6px;
              display: flex;
              align-items: center;
              justify-content: center;

              @media @max-lg-tablet {
                margin-left: 5px;
              }

              img {
                width: 18px;
                height: 18px;
              }

              &.active img {
                transform: rotate(360deg);
                transition: all 1s ease-in-out;
              }
            }
          }
        }
      }

      .fertilizer-option-bar {
        margin: 38px 0;

        @media @max-sl-mobile {
          margin: 28px 0;
        }

        .option-tab-group {
          display: flex;

          @media @max-sl-mobile {
            display: none;
          }

          &.option-tab-collapse {
            display: none;

            @media @max-sl-mobile {
              position: relative;
              display: flex;
              align-items: center;
              padding: 6px 10px;
              border: 2px solid @color-blue500;
              border-radius: 8px;
              background: linear-gradient(rgba(75, 85, 231, 0.95), #b66196);

              label {
                color: #fff;
              }

              .arrow-icon {
                margin-left: 4px;
              }
            }
          }

          .option-tab {
            margin-right: 38px;

            &:last-child {
              margin-right: 0;
            }

            button {
              background: transparent;
              border: none;
              outline: none;
              padding: 0;
              margin-bottom: 8px;

              .deposit-icon {
                margin-right: 8px;
              }
            }

            .active-underline {
              height: 4px;
              border-radius: 10px;
              background: @gradient-color-icon;
            }
          }
        }

        .option-filter-group {
          position: relative;
          display: flex;
          align-items: center;

          .option-filter {
            border-radius: 8px;
            padding: 0 8px;
            height: 40px;
            margin-left: 18px;
            position: relative;
            z-index: 0;
            background: #28068438;

            &::after {
              content: '';
            }

            &::before {
              content: '';
              position: absolute;
              z-index: -1;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: @gradient-color-icon;
              padding: 1px;
              border-radius: 8px;
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
            }

            @media @max-sl-mobile {
              height: 32px;
              padding: 0 4px;
            }

            &:first-child {
              margin-left: 0;
            }

            &.option-filter-fixed {
              width: 40px;

              @media @max-sl-mobile {
                width: 32px;
              }
            }

            &.option-filter-collapse {
              display: none !important;

              @media @max-md-tablet {
                display: flex !important;
              }
            }

            &.option-sort {
              @media @max-md-tablet {
                display: none !important;
              }
            }

            .option-sort-item {
              letter-spacing: 0.15px;

              label {
                color: #eae8f1;
                opacity: 0.5;
                margin-right: 8px;
              }

              .sort-detail {
                display: flex;
                align-items: center;

                .arrow-icon {
                  margin-left: 8px;
                }
              }
            }
          }

          .option-search-collapse {
            position: absolute;
            top: 0;
            left: -209px;
            transition: visibility 0s, opacity 0.5s linear;
            background: linear-gradient(rgb(75, 85, 231), rgb(182, 97, 150));
            border: 2px solid @color-blue500;
            border-radius: 8px;
            padding: 18px;
            z-index: 999;
            width: 250px;

            .collapse-item-header {
              margin-bottom: 10px;
            }

            .collapse-item-body {
              input {
                border: 2px solid @color-blue400;
                border-radius: 8px;
                padding: 8px 18px;
                background-color: transparent;
                color: #ccd1f1;
                width: 100%;

                &:active,
                &:focus,
                &:hover {
                  outline: 0;
                }

                &::placeholder {
                  color: #ccd1f1;
                }
              }
            }
          }
        }
      }

      .fertilizer-content {
        .fertilizer-project-table {
          background: @color-blue700;
          border: 3px solid @color-blue500;
          border-radius: 18px;

          .project-banner {
            position: relative;
            border-bottom: 3px solid @color-blue500;
            height: 190px;

            .banner {
              width: 100%;
              height: 100%;
              border-radius: 18px 18px 0 0;
            }

            .project-status {
              position: absolute;
              top: 9px;
              left: 13px;
            }
          }

          &.first {
            border: 3px solid @color-petrol500;

            .project-banner {
              border-bottom: 3px solid @color-petrol500;
            }
          }

          .project-details {
            padding: 14px;

            .project-title {
              height: 170px;

              @media @max-sl-mobile {
                height: 111px;
              }

              .short-desc {
                display: block;
                margin-top: 4px;
              }
            }

            .project-info {
              margin-top: 18px;
              height: 48px;

              .project-balance {
                @media @max-lg-tablet {
                  height: 48px;
                }

                .label {
                  color: rgba(255, 255, 255, 0.6);
                }

                .value {
                  .coin-icon {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    margin-right: 8px;
                  }
                }
              }

              &.whitelist-countdown {
                // height: 48px;
                height: 114px;
                background: @color-blue800;
                padding: 8px;
                border-radius: 18px;
              }

              &.fcsb-container {
                @media @max-lg-tablet {
                  display: inline-block !important;

                  .project-balance {
                    margin-bottom: 18px;

                    &:last-child {
                      margin-bottom: 0;
                    }
                  }
                }
              }
            }

            .project-desc {
              &.project-desc-whitelist {
                @media @max-sl-mobile {
                  display: inline-block !important;
                }

                .project-title {
                  width: 50%;

                  @media @max-lg-tablet {
                    width: 60%;
                  }

                  @media @max-sl-mobile {
                    width: 100%;
                  }
                }

                .project-info {
                  margin-top: 0;
                  height: auto;
                  width: 50%;

                  @media @max-lg-tablet {
                    width: 40%;
                  }

                  @media @max-sl-mobile {
                    width: 100%;
                    margin-top: 18px;
                  }
                }
              }
            }
          }

          .btn-container {
            margin-top: 18px;
          }
        }

        .fertilizer-funded-table {
          width: 100%;

          .fertilizer-funded-table-header {
            background: #273d9463;
            padding: 0 20px;
            border-radius: 10px;

            &.scrollFixed {
              position: sticky;
              background: @color-blue800;
              top: 70px;
              z-index: 999;
              width: 100%;
              transition: 0.3s all ease-in-out;
            }

            .header-column {
              text-align: center;
              padding: 18px 0;

              .header-column-title {
                cursor: pointer;
                display: flex;
                justify-content: center;

                .arrow-icon {
                  margin-left: 4px;
                }

                .sort-icon-active {
                  color: #13ecab;
                }
              }
            }
          }

          .fertilizer-funded-table-body {
            .fertilizer-funded-table-item {
              display: flex;
              align-items: center;
              background: rgba(23, 32, 88, 0.9);
              border-radius: 8px;
              padding: 18px;
              border: 3px solid transparent;
              margin: 20px 0 0;

              &:hover {
                border-color: @color-blue500;
              }

              &:last-child {
                margin-bottom: 0;
              }

              .state {
                text-align: center;

                .show-more {
                  position: relative;
                  width: 20px;
                  margin: auto;

                  .option-sort-collapse {
                    top: 0;
                    right: 25px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

@media @max-lg-tablet {
  .fertilizer.container {
    .state {
      .label {
        display: block;
        color: @color-neutral400;
      }

      .project-ath .value {
        margin-top: 4px;
      }
    }

    .collapse-row {
      background: @color-blue800;
      border-radius: 8px;
      padding: 18px;

      .btn-group {
        .btn-group-item {
          flex-wrap: wrap;
          &:last-child {
            margin-top: 18px;
          }
        }

        .btn-container {
          margin-top: 10px;
        }

        .btn-container,
        .social-link {
          margin-right: 18px;

          &:last-child {
            margin-right: 0;
          }
        }
      }
    }
  }
}
</style>

<style lang="less">
.fertilizer {
  .ant-collapse {
    background: transparent;
    border: none;

    .ant-collapse-item {
      position: relative;
      background: rgba(23, 32, 88, 0.9);
      border-radius: 8px !important;
      margin-bottom: 8px;
      border-bottom: 0;
      border: 3px solid transparent;

      &:hover {
        border-color: @color-blue500;
      }

      .ant-collapse-header {
        padding: 18px;

        .ant-collapse-arrow {
          display: none;
        }
      }

      .ant-collapse-content {
        border: none;
        background: transparent;

        .ant-collapse-content-box {
          padding: 18px;
        }
      }
    }
  }

  .project-info .project-balance .value .ant-statistic-content-value {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    letter-spacing: 0.15px;
  }
}
</style>
