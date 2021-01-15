app.component('v-pricing-quote', {
    computed: {
      any_quote() {
        return ( this.any_special_addition ||
                 this.any_special_percentage ||
                Object.keys(this.$root.quote_prod_ids).length)
      },
      any_special_addition() {
        return this.$root.quote_special_addition_label !== ''
      },
      any_special_percentage() {
        return this.$root.quote_special_percentage_label !== ''
      },
      product_cost() {
        cost_sum = 0
        cost_academic_sum = 0
        full_cost_sum = 0
        for ([prod_id, prod_count] of Object.entries(this.$root.quote_prod_ids)) {
          cost_sum += prod_count * this.productCost(prod_id)['cost'];
          cost_academic_sum += prod_count * this.productCost(prod_id)['cost_academic'];
          full_cost_sum +=  prod_count * this.productCost(prod_id)['full_cost'];
        }

        return {'cost': cost_sum,
                'cost_academic': cost_academic_sum,
                'full_cost': full_cost_sum}
      },
      quote_cost() {
        product_cost = this.product_cost
        cost_sum = product_cost['cost']
        cost_academic_sum = product_cost['cost_academic']
        full_cost_sum = product_cost['full_cost']

        if (this.any_special_addition) {
          cost_sum += this.$root.quote_special_addition_value
          cost_academic_sum += this.$root.quote_special_addition_value
          full_cost_sum += this.$root.quote_special_addition_value
        }

        if (this.any_special_percentage) {
          cost_sum *= (100 - this.$root.quote_special_percentage_value)/100
          cost_academic_sum *= (100 - this.$root.quote_special_percentage_value)/100
          full_cost_sum *= (100 - this.$root.quote_special_percentage_value)/100
        }

        return {'cost': cost_sum.toFixed(2),
                'cost_academic': cost_academic_sum.toFixed(2),
                'full_cost': full_cost_sum.toFixed(2)}
      },
    },
    created: function() {
        this.$root.fetchPublishedCostCalculator(true),
        this.$root.fetchExchangeRates()
    },
    methods: {
        productCost(prod_id) {
            // Returns a {'cost': cost, 'cost_academic': cost_academic, 'full_cost': full_cost}
            return this.$root.productCost(prod_id)
        },
        toggle_discontinued() {
            this.$root.show_discontinued = !this.$root.show_discontinued
        },
        reset_special_percentage() {
            this.$root.quote_special_percentage_label = ''
            this.$root.quote_special_percentage_value = 0
        },
        reset_special_addition() {
            this.$root.quote_special_addition_label = ''
            this.$root.quote_special_addition_value = 0
        }
    },
    template:
        /*html*/`
        <div class="row">
          <h1 class="col-md-11"><span id="page_title">Project Quote</span></h1>
        </div>
        <template v-if="this.$root.published_data_loading">
          <div>
            Loading!
          </div>
        </template>
        <template v-else>
          <div class="row">
            <div class="col-5 quote_lcol_header">
              <div class="radio" id="price_type_selector">
                <label class="radio-inline py-2 pr-2">
                  <input type="radio" name="price_type" v-model="this.$root.price_type" value="cost_academic" checked> Swedish academia
                </label>
                <label class="radio-inline p-2">
                  <input type="radio" name="price_type" v-model="this.$root.price_type" value="full_cost"> Industry and non-Swedish academia
                </label>
                <label class="radio-inline p-2">
                  <input type="radio" name="price_type" v-model="this.$root.price_type" value="cost"> Internal
                </label>
              </div>
              <div class="row">
                <div class="col-2">
                  <label for='other_cost_value' class="form-label">Other cost</label>
                  <input id='other_cost_value' class="form-control" v-model.number="this.$root.quote_special_addition_value" type="number" >
                </div>
                <div class="col-10">
                  <label for='other_cost_label' class="form-label">Other cost label</label>
                  <input id='other_cost_label' class="form-control" v-model="this.$root.quote_special_addition_label" type="text" >
                </div>
                <div class="mb-3 form-text">Specify a sum (positive or negative) that will be added to the quote cost. Will only be applied if a label is specified.</div>
              </div>
              <div class="row">
                <div class="col-2">
                  <label for='percentage_input' class="form-label">Percentage</label>
                  <input id='percentage_input' class="form-control" type="number" v-model.number="this.$root.quote_special_percentage_value">
                </div>
                <div class="col-10">
                  <label for='percentage_label' class="form-label">Percentage label</label>
                  <input id='percentage_label' class="form-control" type="text" v-model="this.$root.quote_special_percentage_label">
                </div>
                <div class="mb-3 form-text">Specify a percentage (positive or negative) that will be subtracted (default is discount) from the total sum. Will only be applied if a label is specified.</div>
              </div>

              <button class="btn btn-link" id="more_options_btn" type="button" data-toggle="collapse" data-target="#more_options" aria-expanded="false" aria-controls="more_options">
                More Options
              </button>
              <div class="collapse border-top py-3" id="more_options">
                <template v-if="this.$root.show_discontinued">
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
          <template v-if="this.any_quote">
            <div class="row py-2" id="current_quote">
              <div class="col-md-8 col-xl-6 quote_lcol_header">
                <h3>Products</h3>
                <span class="help-block">
                  To use fractions of units, please use full stop and not decimal comma.
                </span>
                <div id='product_warnings'></div>
                <ul class="list-unstyled quote-product-list">
                  <template v-for="(prod_count, prod_id) in this.$root.quote_prod_ids" :key="prod_id">
                    <quote-list-product :product_id="prod_id" :product_count="prod_count"/>
                  </template>
                  <li class="row border-top mr-2">
                    <p class="text-end col-3 offset-9 pt-2 fw-bold">{{product_cost[this.$root.price_type].toFixed(2)}} SEK</p>
                  </li>
                  <template v-if="any_special_addition">
                    <li class="my-1 row d-flex align-items-center">
                      <span class="col-9">
                        <a class="mr-2" href='#' @click="reset_special_addition"><i class="far fa-times-square fa-lg text-danger"></i></a>
                        {{this.$root.quote_special_addition_label}}
                      </span>
                      <span class="col-2 float-right">{{this.$root.quote_special_addition_value}} SEK</span>
                    </li>
                  </template>
                  <template v-if="any_special_percentage">
                    <li class="my-1 row d-flex align-items-center">
                      <span class="col-9">
                        <a class="mr-2" href='#' @click="reset_special_percentage"><i class="far fa-times-square fa-lg text-danger"></i></a>
                        {{this.$root.quote_special_percentage_label}}
                      </span>
                      <span class="col-2 float-right">- {{this.$root.quote_special_percentage_value}} %</span>
                    </li>
                  </template>
                </ul>

              </div>
              <div class="col-md-4 col-xl-6 border-left">
                <h3>Totals</h3>
                <ul class="quote-totals-list list-unstyled">
                  <dl class="quote_totals">
                    <p :class="{'text-muted': (this.$root.price_type != 'cost_academic')}">
                      <dt>Swedish academia:</dt>
                      <dd class="quote_totals_val quote_sweac">{{quote_cost['cost_academic']}} SEK</dd>
                    </p>
                    <p :class="{'text-muted': (this.$root.price_type != 'full_cost')}">
                      <dt>Industry and non-Swedish academia:</dt>
                      <dd class="quote_totals_val quote_full">{{quote_cost['full_cost']}} SEK</dd>
                    </p>
                    <p :class="{'text-muted': (this.$root.price_type != 'cost')}">
                      <dt>Internal projects:</dt>
                      <dd class="quote_totals_val quote_internal">{{quote_cost['cost']}} SEK</dd>
                    </p>
                  </dl>
                </ul>
              </div>
            </div>
          </template>
          <div class="products_chooseable_div">
            <div class="row" id="table_h_and_search">
              <h2 class="col mr-auto">Available Products</h2>
            </div>
            <v-products-table :show_discontinued="this.$root.show_discontinued"/>
          </div>
        </template>
        `
})


app.component('quote-list-product', {
    props: ['product_id'],
    computed: {
        product() {
            return this.$root.all_products[this.product_id]
        },
        productCost() {
            // Returns a {'cost': cost, 'cost_academic': cost_academic, 'full_cost': full_cost}
            return this.$root.productCost(this.product_id)
        },
        cost() {
            return (this.product_count * this.productCost[this.$root.price_type]).toFixed(2)
        },
        product_count() {
            return this.$root.quote_prod_ids[this.product_id]
        }
    },
    methods: {
        remove_from_quote() {
            delete this.$root.quote_prod_ids[this.product_id]
        }
    },
    template: /*html*/`
      <li class="my-1 row d-flex align-items-center">
        <div class="col-auto  pr-0">
          <a href='#' @click="remove_from_quote"><i class="far fa-times-square fa-lg text-danger"></i></a>
        </div>
        <div class="col-1">
          <input class="form-control" v-model="this.$root.quote_prod_ids[product_id]" min=0 :data-product-id="product['REF_ID']">
        </div>
        <span class="col-7 quote_product_name">{{product.Name}}</span>
        <span class="col-2">{{cost}} SEK</span>
      </li>
    `
})

app.mount('#pricing_quote_main')
