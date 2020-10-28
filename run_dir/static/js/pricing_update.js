
$( document ).ready(function() {
  /* Translate component ids for products */
  $("div.component-list-input").each(function(i, e){
      translate_component_ids(e);
  });

});

function translate_component_ids(element) {
    var component_names = new Array();
    if ($(element).attr('data-component-ids') != "[]"){
        components = JSON.parse($(element).attr('data-component-ids'));
        components.forEach(function(component_id){
            component_names.push(global_components_json[component_id]["Product name"]);
        });
        $(element).children('.component-display').html(component_names.join('<br>'));
    }
}

const ProductForm = {
    data() {
        return {
            all_components: global_components_json,
            all_products: global_products_json,
        }
    }
}

const app = Vue.createApp(ProductForm)

app.component('alt-component-item', {
    template: `<template v-for="component in altComponents">
                {{component["Product name"]}}<br>
                </template>`,
    computed: {
        product() {
            return this.$parent.all_products[this.product_id]
        },
        altComponentIds() {
            return this.$parent.all_products[this.product_id]['Alternative Components']
        },
        altComponents() {
            var components = new Array();
            for (comp_id in this.altComponentIds) {
                components.push(this.$parent.all_components[comp_id])
            }
            return components
        }
    },
    props: ['product_id']
})

app.mount('#product_list')
