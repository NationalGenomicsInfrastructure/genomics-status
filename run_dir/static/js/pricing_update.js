
$( document ).ready(function() {
  /* Translate component ids for products */
  $("div.component-list-input").each(function(i, e){
      translate_component_ids(e);
  });

  /* Plain javascript style and no jquery since it's from bootstrap docs */
  var componentsModal = document.getElementById('componentsModal')
  componentsModal.addEventListener('show.bs.modal', function (event) {
    // Button that triggered the modal
    var button = event.relatedTarget
    // Extract info from data-* attributes
    var product_id = button.getAttribute('data-product')

    var product = global_products_json[product_id]
    // If necessary, you could initiate an AJAX request here
    // and then do the updating in a callback.
    //
    // Update the modal's content.
    var modalTitle = componentsModal.querySelector('.modal-title')

    modalTitle.textContent = 'Edit components for ' + product.REF_ID
  })
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

const all_products_reactive = Vue.reactive(global_products_json)
const all_components_reactive = Vue.reactive(global_components_json)

const ProductForm = {
    data() {
        return {
            all_components: all_components_reactive,
            all_products: all_products_reactive,
            modal_product_id: "52" //Should probably be null when we handle that edge case
        }
    },
    methods: {
        showModalFn(event) {
            if (event) {
                this.modal_product_id = event.target.dataset.productId
            }
            var myModal = new bootstrap.Modal(document.getElementById('myModal'))
            myModal.show()
        }
    }
}

const app = Vue.createApp(ProductForm)

app.component('modal-component', {
    computed: {
        product() {
            return this.$parent.all_products[this.$parent.modal_product_id]
        },
        altComponentIds() {
            return this.product['Alternative Components']
        },
        altComponents() {
            var components = new Array();
            for (comp_id in this.altComponentIds) {
                components.push(this.$parent.all_components[comp_id])
            }
            return components
        }
      },
    template:
        `   <div class="modal-header">
              <h4 class="modal-title">Edit components for {{this.product.REF_ID}}</h4>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="row">
                  <h5>Selected Components</h5>
                  <p>{{this.altComponentIds}}</p>
                </div>
                <div class="row">
                  <h5>All components</h5>
                  <template v-for="(component, component_id) in this.$parent.all_components">
                    {{ component['Product name']}}<br>
                  </template>
                </div>
              </form>
            </div>
        `
})

app.component('alt-component-item', {
    template: `<template v-for="component in altComponents">
                 {{component["Product name"]}}<br>
               </template>`,
    computed: {
        product() {
            return this.$parent.all_products[this.product_id]
        },
        altComponentIds() {
            return this.product['Alternative Components']
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
