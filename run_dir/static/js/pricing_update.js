
$( document ).ready(function() {
  /* Translate component ids for products */
  $("div.jquery-component-list-input").each(function(i, e){
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
            modal_product_id: "52", //Should probably be null when we handle that edge case
            modal_type: "Regular"
        }
    },
    methods: {
        showModalFn(event) {
            if (event) {
                this.modal_product_id = event.target.dataset.productId
                this.modal_type = event.target.dataset.type
            }
            var myModal = new bootstrap.Modal(document.getElementById('myModal'))
            myModal.show()
        }
    }
}

const app = Vue.createApp(ProductForm)

app.component('product-form', {
    props: ['product_id'],
    template:
        `<h4> {{ product['Name'] }} </h4>
        <slot></slot>
        `,
    computed: {
        product() {
            return this.$parent.all_products[this.product_id]
        }
    }
})

app.component('modal-component', {
    computed: {
        product() {
            return this.$parent.all_products[this.$parent.modal_product_id]
        },
        ComponentIds() {
            if (this.$parent.modal_type == 'Alternative') {
                return Object.keys(this.product['Alternative Components'])
            } else {
                return Object.keys(this.product['Components'])
            }
        },
        Components() {
            var components = new Array();
            for (i in this.ComponentIds) {
                comp_id = this.ComponentIds[i]
                components.push(this.$parent.all_components[comp_id])
            }
            return components
        }
      },
    template:
        `   <div class="modal-header">
              <h4 class="modal-title">{{this.product['Name']}}</h4>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <h4> Edit {{this.$parent.modal_type}} Components</h4>
              <form>
                <div class="row">
                  <h5>Selected Components</h5>
                  <template v-for="component in this.Components">
                    <span><a class="mr-2" href="#" @click="this.removeComponent"><i class="far fa-times-square fa-lg text-danger" :data-component-id="component['REF_ID']"></i></a>{{component['Product name']}}</span><br>
                  </template>
                </div>
                <div class="row">
                  <h5>All components</h5>
                  <template v-for="(component, component_id) in this.$parent.all_components">
                    <template v-if="component['Status'] != 'Discontinued'">
                        {{ component['Product name']}}<br>
                    </template>
                  </template>
                </div>
              </form>
            </div>
        `,
    methods: {
        removeComponent(event) {
            if (event) {
                comp_id = event.target.dataset.componentId
                if (this.$parent.modal_type == 'Alternative') {
                    delete this.product['Alternative Components'][comp_id]
                } else {
                    delete this.product['Components'][comp_id]
                }
            }
        }
    }
})

app.component('components', {
    template: `
            <div class="input-group">
              <fieldset disabled>
                <input class="form-control" :id="element_id" type="text" :value="ComponentIds">
              </fieldset>
              <button type="button" class="btn btn-primary edit-components" @click="this.showModalFn" :data-product-id="product_id" :data-type="type">Edit</button>
            </div>
            <div class="component-display">
              <template v-for="component in Components">
                {{component["REF_ID"]}}: {{component["Product name"]}}<br>
              </template>
            </div>
               `,
    computed: {
        product() {
            return this.$parent.product
        },
        element_id() {
            if (this.type == 'Alternative') {
                return "products-" + this.product_id + "-alternative_components"
            } else {
                return "products-" + this.product_id + "-components"
            }
        },
        ComponentIds() {
            if (this.type == 'Alternative') {
                return Object.keys(this.product['Alternative Components'])
            } else {
                return Object.keys(this.product['Components'])
            }
        },
        Components() {
            var components = new Array();
            for (i in this.ComponentIds) {
                comp_id = this.ComponentIds[i]
                components.push(this.$parent.$parent.all_components[comp_id])
            }
            return components
        }
    },
    methods: {
        showModalFn(event) {
            this.$parent.$parent.showModalFn(event)
        }
    },
    props: ['product_id', 'type']
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
            return Object.keys(this.product['Alternative Components'])
        },
        altComponents() {
            var components = new Array();
            for (i in this.altComponentIds) {
                comp_id = this.altComponentIds[i]
                components.push(this.$parent.all_components[comp_id])
            }
            return components
        }
    },
    props: ['product_id']
})

app.mount('#product_list')
