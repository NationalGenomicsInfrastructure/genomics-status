import { vPricingMain } from './pricing_main_components.js'
import { vPricingQuote } from './pricing_quote_components.js'


const quote_app = Vue.createApp(vPricingMain)

quote_app.component('v-pricing-quote', vPricingQuote)
quote_app.config.globalProperties.Origin = "Quote";
quote_app.mount('#pricing_quote_main')