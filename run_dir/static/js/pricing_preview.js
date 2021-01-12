app.component('pricing-preview', {
    data: function() {
        return {
          show_discontinued: false
        }
    },
    methods: {
        toggle_discontinued() {
            this.reset_listjs()
            this.show_discontinued = !this.show_discontinued

            this.$nextTick(() => {
              this.init_listjs()
            })
        }
    },
    template:
        /*html*/`
        <div class="row">
          <h1 class="col-md-11"><span id="page_title">Pricing Preview</span></h1>
        </div>
        <template v-if="this.$root.data_loading">
          <div>
            Loading!
          </div>
        </template>
        <template v-else>
          <div class="row">
            <div class="col-5 quote_lcol_header">

              <button class="btn btn-link" id="more_options_btn" type="button" data-toggle="collapse" data-target="#more_options" aria-expanded="false" aria-controls="more_options">
                More Options
              </button>
              <div class="collapse border-top py-3" id="more_options">
                <template v-if="show_discontinued">
                  <button type="button" class="btn btn-success" id="toggle_discontinued" @click="toggle_discontinued">Hide Discontinued Products <i class="fas fa-book-heart fa-lg pl-2"></i></button>
                </template>
                <template v-else>
                  <button type="button" class="btn btn-warning" id="toggle_discontinued" @click="toggle_discontinued">Show Discontinued Products <i class="fas fa-exclamation-triangle fa-lg pl-2"></i></button>
                </template>
              </div>
            </div>
            <div class="col-4 offset-2">
              <exchange-rates :mutable="true" :issued_at="this.$root.exch_rate_issued_at"/>
            </div>
          </div>
          <div id="alerts_go_here">
          </div>
          <div class="products_chooseable_div">
            <div class="row" id="table_h_and_search">
              <h2 class="col mr-auto">Current Draft</h2>
            </div>
            <v-products-table :show_discontinued="this.$root.show_discontinued"/>
          </div>
        </template>
        `
})

app.mount('#pricing_preview_main')
