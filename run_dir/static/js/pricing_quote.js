app.component('v-pricing-quote', {
    /* Main component of the pricing quote page.
     *
     * Add products from the table to create a quote and switch between price types.
     */
    props: ['origin', 'is_pricing_admin'],
    data() {
      return {
        md_message: '',
        md_src_message: '',
        proj_data: {},
        cLabel_index: 0,
        active_cost_labels: {},
        template_text_data: {},
        applProj: false,
        noQCProj: false,
        saved_agreement_data: {}
      }
    },
    computed: {
        any_quote() {
            return (this.any_special_addition ||
                    this.any_special_percentage ||
                    Object.keys(this.$root.quote_prod_ids).length)
        },
        any_special_addition() {
            for ([index, label] of Object.entries(this.$root.quote_special_additions)){
              if(label.name!== ''){
                this.active_cost_labels[index] = label
              }
            }
            return Object.keys(this.active_cost_labels).length > 0
        },
        any_special_percentage() {
            return this.$root.quote_special_percentage_label !== ''
        },
        product_cost_sum() {
            /* calculate the cost of the products independent of any special items */
            cost_sum = 0
            cost_academic_sum = 0
            full_cost_sum = 0
            for ([prod_id, prod_count] of Object.entries(this.$root.quote_prod_ids)) {
                cost_sum += prod_count * this.$root.productCost(prod_id)['cost']
                cost_academic_sum += prod_count * this.$root.productCost(prod_id)['cost_academic']
                full_cost_sum +=  prod_count * this.$root.productCost(prod_id)['full_cost']
            }

            return {'cost': cost_sum,
                    'cost_academic': cost_academic_sum,
                    'full_cost': full_cost_sum}
        },
        quote_cost() {
            product_cost = this.product_cost_sum
            cost_sum = product_cost['cost']
            cost_academic_sum = product_cost['cost_academic']
            full_cost_sum = product_cost['full_cost']

            if (this.any_special_addition) {
              for ([index, label] of Object.entries(this.active_cost_labels)){
                if(label.value !== ''){
                  cost_sum += label.value
                  cost_academic_sum += label.value
                  full_cost_sum += label.value
                }
              }
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
        compiledMarkdown() {
          msg_display = this.md_src_message
          first_page_text = this.template_text_data.first_page_text
          if(this.applProj){
            msg_display += '\n\n'+ first_page_text['specific_conditions']['application_conditions']
          }
          if(this.noQCProj){
            msg_display += '\n\n'+ first_page_text['specific_conditions']['no-qc_conditions']
          }
          if(this.$root.price_type==='full_cost'){
            msg_display += '\n\n'+ first_page_text['specific_conditions']['full_cost_conditions']
          }
          return marked(msg_display, { sanitize: true })
        },
        has_admin_control(){
          return (this.origin === 'Agreement') && (this.is_pricing_admin==='True')
        }
    },
    created: function() {
        this.$root.fetchPublishedCostCalculator(true),
        this.$root.fetchExchangeRates(),
        this.fetch_latest_agreement_doc()
    },
    mounted: function () {
        this.init_text()
        this.get_project_specific_data()
    },
    watch: {
        md_src_message() {
            this.add_to_md_text()
        }
    },
    methods: {
        get_project_specific_data() {
          if(this.origin === 'Agreement'){
            proj_id = document.querySelector('#pricing_quote_main').dataset.project
            axios
                .get('/api/v1/project_summary/'+proj_id)
                .then(response => {
                    pdata = response.data
                    this.proj_data['ngi_project_id'] = proj_id + ', '+pdata['project_name']+ ' ('+pdata['order_details']['title']+')'
                    this.proj_data['user_and_affiliation'] = pdata['project_pi_name']+ ' / ' + pdata['affiliation']
                    this.proj_data['project_id'] = proj_id
                    if(pdata['type']==='Application'){
                      this.applProj = true
                    }
                    if(pdata['library_prep_option']==='No QC'){
                      this.noQCProj = true
                    }
                    this.add_to_md_text()
                })
                .catch(error => {
                    this.$root.error_messages.push('Unable to fetch project data, please try again or contact a system administrator.')
                })
                this.get_saved_agreement_data(proj_id)
            }
        },
        get_saved_agreement_data(proj_id){
          axios
              .get('/api/v1/get_agreement_doc/'+proj_id)
              .then(response => {
                  this.saved_agreement_data = response.data
              })
              .catch(error => {
                  this.$root.error_messages.push('Unable to fetch agreement data, please try again or contact a system administrator.')
              })
        },
        toggle_discontinued() {
            this.$root.show_discontinued = !this.$root.show_discontinued
        },
        reset_special_percentage() {
            this.$root.quote_special_percentage_label = ''
            this.$root.quote_special_percentage_value = 0
        },
        timestamp_to_date(timestamp) {
          let date = new Date(parseInt(timestamp))
          return date.toDateString() + ', ' + date.toLocaleTimeString(date)
        },
        load_saved_agreement(){
          //Reset fields
          this.applProj = false
          this.noQCProj = false
          this.$root.quote_special_additions = {}
          this.active_cost_labels = {}
          this.$root.quote_special_percentage_value = 0.0
          this.$root.quote_special_percentage_label = ''

          var query_timestamp_radio = document.querySelector("input[name=saved_agreements_radio]:checked")
          var timestamp_val = query_timestamp_radio ? query_timestamp_radio.value : ""
          if(timestamp_val!==""){
            var sel_data = this.saved_agreement_data['saved_agreements'][timestamp_val]
            this.$root.price_type = sel_data['price_type']
            if('special_addition' in sel_data){
              this.$root.quote_special_additions = sel_data['special_addition']
            }
            if('special_percentage' in sel_data){
              this.$root.quote_special_percentage_label = sel_data['special_percentage']['name']
              this.$root.quote_special_percentage_value = sel_data['special_percentage']['value']
            }
            this.md_src_message = sel_data['agreement_summary']
            if('agreement_conditions' in sel_data){
              if(sel_data['agreement_conditions'].includes('application_conditions')){
                this.applProj = true
              }
              if(sel_data['agreement_conditions'].includes('no-qc_conditions')){
                this.noQCProj = true
              }
            }
            //Make sure selected fields are displayed
            this.add_to_md_text()
            this.$root.quote_prod_ids = sel_data['products_included']
            this.$root.fetchExchangeRates(sel_data['exchange_rate_issued_date'])
          }
        },
        mark_agreement_signed(){
          var query_timestamp_radio = document.querySelector("input[name=saved_agreements_radio]:checked")
          var timestamp_val = query_timestamp_radio ? query_timestamp_radio.value : ""
          if(timestamp_val!==""){
            proj_id = this.proj_data['project_id']
            axios.post('/api/v1/mark_agreement_signed', {
                proj_id: proj_id,
                timestamp: timestamp_val
            }).then(response => {
                this.get_saved_agreement_data(proj_id)
            })
            .catch(error => {
                this.$root.error_messages.push('Unable to mark agreement signed, please try again or contact a system administrator.')
            })
          }
        },
        fetch_latest_agreement_doc: function(){
          axios
              .get('/api/v1/get_agreement_template_text')
              .then(response => {
                  this.template_text_data = response.data
              })
              .catch(error => {
                  this.$root.error_messages.push('Unable to fetch agreement template data, please try again or contact a system administrator.')
              })
        },
        add_cost_label: function(){
          this.$root.quote_special_additions[this.cLabel_index] = { name: '', value: 0 }
          this.cLabel_index++
        },
        remove_cost_label: function(index){
          delete this.$root.quote_special_additions[index]
          if(this.active_cost_labels.hasOwnProperty(index)){
            delete this.active_cost_labels[index]
          }
        },
        init_text: function(){
          this.md_src_message = '1. **Library preparation**:  (accredited method)\n'+
                                '1. **Sequencing**:  (accredited method)\n'+
                                '1. **Data processing**: Demultiplexing, quality control and raw data delivery on Uppmax/GRUS (accredited method)\n'+
                                '1. **Data analysis**: None'
        },
        add_to_md_text: function(){
          this.md_message = this.compiledMarkdown
        },
        submit_quote_form: function(agreement_data){
          /* Submitting it in a form to get the generated quote doc to open in a new page/tab */
          var newForm = $('<form>', {
            'action': '/generate_quote',
            'target': '_blank',
            'method': 'post',
            'enctype':'text/plain',
            'id': 'my_form'
          }).append($('<input>', {
                'name': 'data',
                'value': JSON.stringify(agreement_data),
                'type': 'hidden'
              }))
          newForm.hide()
          newForm.appendTo("body")
          newForm.submit()
        },
        generate_quote:  function (type) {
          agreement_data = {}
          agreement_data['type'] = type
          product_list = {}
          for (prod_id in this.$root.quote_prod_ids){
            product = this.$root.all_products[prod_id]
            prod_cost = (this.$root.productCost(prod_id)[this.$root.price_type] * this.$root.quote_prod_ids[prod_id]).toFixed(2)
            if(product['Category'] in product_list){
              product_list[product['Category']] = (parseFloat(product_list[product['Category']]) + parseFloat(prod_cost)).toFixed(2)
            }
            else{
              product_list[product['Category']] = prod_cost
            }
          }
          for (category in product_list){
            product_list[category] = Math.round(parseFloat(product_list[category]))
          }
          agreement_data['price_breakup'] = product_list
          agreement_data['total_products_cost'] = Math.round(this.product_cost_sum[this.$root.price_type])
          agreement_data['total_cost'] = Math.round(this.quote_cost[this.$root.price_type])
          agreement_data['price_type'] = this.$root.price_type
          if (this.any_special_addition){
            agreement_data['special_addition'] =  this.active_cost_labels
          }
          if (this.any_special_percentage){
            agreement_data['special_percentage'] = {'name': this.$root.quote_special_percentage_label,
                                                     'value':  this.$root.quote_special_percentage_value}
          }
          if(this.message !== ''){
            agreement_data['agreement_summary'] = this.md_src_message
          }
          agreement_data['agreement_conditions'] = []
          if(this.applProj){
            agreement_data['agreement_conditions'].push('application_conditions')
          }
          if(this.noQCProj){
            agreement_data['agreement_conditions'].push('no-qc_conditions')
          }
          agreement_data['template_text'] = this.template_text_data
          agreement_data['origin'] = this.origin
          if(this.origin === 'Agreement'){
            timestamp = Date.now()
            this.proj_data['agreement_number'] = this.proj_data['project_id'] + '_'+ timestamp
            agreement_data['project_data'] = this.proj_data
            agreement_data['products_included'] = this.$root.quote_prod_ids
          }
          agreement_data['exchange_rate_issued_date'] = this.$root.exch_rate_issued_at
          this.submit_quote_form(agreement_data)
          if(type === 'save'){
            setTimeout(()=>{ this.get_saved_agreement_data(this.proj_data['project_id']) },1000)
          }
        }
    },
    template:
        /*html*/`
        <div class="row" v-if="origin === 'Quote'">
          <h1 class="col-md-11 mb-3"><span id="page_title">Cost Calculator</span></h1>
        </div>
        <div class="row row-cols-lg-auto mb-3">
          <div class="col-1">
            <button type="submit" class="btn btn-secondary" id="generate_quote_btn" v-on:click="generate_quote('preview')">Generate {{ this.origin }} Preview</button>
          </div>
          <div class="col-1" v-if="this.has_admin_control">
            <button type="submit" class="btn btn-primary" id="generate_quote_btn" v-on:click="generate_quote('save')">Save and Generate {{ this.origin }}</button>
          </div>
        </div>
        <template v-if="this.$root.published_data_loading">
          <v-pricing-data-loading/>
        </template>
        <template v-else>
          <template v-if="this.$root.any_errors">
            <v-pricing-error-display/>
          </template>
          <div class="row" v-if="this.saved_agreement_data['saved_agreements']">
            <h4 v-if="this.saved_agreement_data">Saved Agreements</h4>
            <div class="col-4 ml-2 py-3">
              <template v-for="(agreement, timestamp) in this.saved_agreement_data['saved_agreements']" :key="timestamp">
                    <div class="form-check m-2">
                      <input class="form-check-input" type="radio" name="saved_agreements_radio" :id="timestamp" :value="timestamp">
                      <label class="form-check-label" :for="timestamp">
                      {{ timestamp_to_date(timestamp) }}, {{ agreement['created_by']}}
                      <p v-if="this.saved_agreement_data['signed']===timestamp" aria-hidden="true" class="m-2 text-danger far fa-file-signature fa-lg"> Signed</p>
                      </label>
                    </div>
              </template>
            </div>
            <div class="col-2 align-self-center">
              <button class="btn btn-primary m-1" @click="load_saved_agreement">Load</button>
              <button class="btn btn-danger m-1" @click="mark_agreement_signed">Mark Signed</button>
            </div>
          </div>
          <div class="row">
            <div class="col-5 quote_lcol_header">
              <div class="form-radio" id="price_type_selector">
                <input class="form-check-input" type="radio" name="price_type" v-model="this.$root.price_type" value="cost_academic" id="price_type_sweac" @change="add_to_md_text">
                <label class="form-check-label pl-1 pr-3" for="price_type_sweac">
                  Swedish academia
                </label>
                <input class="form-check-input" type="radio" name="price_type" v-model="this.$root.price_type" value="full_cost" id="price_type_industry" @change="add_to_md_text">
                <label class="form-check-label pl-1 pr-3" for="price_type_industry">
                  Industry and non-Swedish academia
                </label>
                <input class="form-check-input" type="radio" name="price_type" v-model="this.$root.price_type" value="cost" id="price_type_internal" @change="add_to_md_text">
                <label class="form-check-label pl-1 pr-3" for="price_type_internal">
                  Internal
                </label>
              </div>
              <div class="row">
                <div class="col-3 pt-2 d-flex align-items-center">
                  <button class="btn btn-sm btn-outline-primary" @click="add_cost_label"><i class="fa fa-plus fa-lg" aria-hidden="true"></i> Add Extra Cost</button>
                </div>
                <div class="col-9 pt-2">
                  <div class="form-text">Specify a sum (positive or negative) that will be added to the quote cost. Will only be applied if a label is specified.</div>
                </div>
              </div>
              <div class="row" v-for="(label, index) in this.$root.quote_special_additions" :key="index" :id="'cLabelRow_'+index">
                <div class="col-2">
                  <label :for="'cost_label_val_'+ index" class="form-label">Cost </label>
                  <input :id="'cost_label_val'+ index" class="form-control" v-model.number="label.value" type="number" >
                </div>
                <div class="col-10">
                  <label :for="'cost_label_'+ index" class="form-label">Label</label>
                  <div class="row">
                    <div class="col-11">
                      <input :id="'cost_label_'+ index" class="form-control" v-model="label.name" type="text" >
                    </div>
                    <div class="col-1 d-flex align-items-center">
                      <i class="far fa-times-square fa-lg text-danger" aria-hidden="true" @click.self="remove_cost_label(index)"></i>
                    </div>
                  </div>
                </div>
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
              <v-exchange-rates :mutable="true" :issued_at="this.$root.exch_rate_issued_at"/>
            </div>
          </div>
          <div class="p-2"> <h4>Enter markdown text for document</h4> </div>
          <div class="row m-2">
            <label class="form-check-label p-1" for="template_text_btn_group"> Add project template text for: </label>
            <div class="col">
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" id="appCheck" v-model="applProj" @change="add_to_md_text">
                <label class="form-check-label" for="appCheck">Applications</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" id="noQCCheck" v-model="noQCProj" @change="add_to_md_text">
                <label class="form-check-label" for="noQCCheck">No-QC</label>
              </div>
            </div>
          </div>
          <div class="row p-3">
            <div class="col-6">
              <div id="pricing_freeformtext_editor">
                <textarea v-model="this.md_src_message" class="md_textarea"></textarea>
              </div>
            </div>
            <div class="col-6">
              <div class="md_display_box border" v-html="md_message"></div>
            </div>
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
                    <v-quote-list-product :product_id="prod_id" :product_count="prod_count"/>
                  </template>
                  <li class="row border-top mr-2">
                    <p class="text-end col-3 offset-9 pt-2 fw-bold">{{product_cost_sum[this.$root.price_type].toFixed(2)}} SEK</p>
                  </li>
                  <template v-if="any_special_addition">
                    <li class="my-1 row d-flex align-items-center" v-for="(label, index) in this.active_cost_labels" :key="index" >
                      <span class="col-9">
                        <a class="mr-2" href='#' @click="remove_cost_label(index)"><i class="far fa-times-square fa-lg text-danger"></i></a>
                        {{ label.name }}
                      </span>
                      <span class="col-2 float-right">{{ label.value }} SEK</span>
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
            <v-products-table :show_discontinued="this.$root.show_discontinued" :quotable="true"/>
          </div>
        </template>
        `
})


app.component('v-quote-list-product', {
    /* Display products which are added to the quote */
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
        <div class="col-2">
          <input class="form-control" v-model="this.$root.quote_prod_ids[product_id]" min=0 :data-product-id="product['REF_ID']" type=number>
        </div>
        <span class="col-7 quote_product_name">{{product.Name}}</span>
        <span class="col-2">{{cost}} SEK</span>
      </li>
    `
})

app.mount('#pricing_quote_main')
