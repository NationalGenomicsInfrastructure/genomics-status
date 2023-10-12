const vLanesOrderedMain = ({
    data() {
        return {
            statistics_data: {},
            in_focus: [null, null, null]
        }
    },
    methods: {
        fetchStatistics(key1, key2, key3) {
            let url = '/api/v1/lanes_ordered'
            /* Build the url, where only defined keys should be passed */
            let my_arguments = [key1, key2, key3];
            var nr_of_keys = 0;
            for (let key_nr = 1; key_nr < my_arguments.length+1; key_nr++) {
                let my_key = my_arguments[key_nr-1];
                // Break if my_key is undefined
                if (my_key === undefined) {
                    break;
                } else {
                    nr_of_keys++
                    if (key_nr === 1) {
                        url += '?key' + key_nr + '=' + my_key
                    } else {
                        url += '&key' + key_nr + '=' + my_key
                    }
                }
            }

            axios
                .get(url)
                .then(response => {
                    let data = response.data
                    if (data !== null) {
                        if (nr_of_keys === 0) {
                            /* If no keys are defined, just replace the data */
                            for (let [my_key, value] of Object.entries(data)) {
                                this.statistics_data[my_key] = {
                                    ...this.statistics_data[my_key],
                                    ...value
                                };
                            }
                        } else {
                            /* If one or more keys are defined, merge the data */
                            let obj = this.statistics_data;
                            for (let i = 0; i < nr_of_keys; i++) {
                                if (!(my_arguments[i] in obj)) {
                                    obj[my_arguments[i]] = {};
                                };
                                obj = obj[my_arguments[i]];
                            }
                            Object.assign(obj, data);
                        };
                    };
                })
                .catch(error => {
                    console.log(error)
                })
        },
        async setDefaults() {
            this.in_focus = [null, null, null];
            this.statistics_data = {};
            /* axios.get returns a promise, so await will make sure these are run sequentially */
            await this.fetchStatistics();
            await this.fetchStatistics('ongoing');
            await this.fetchStatistics('pending');
        },
    }
})

const app = Vue.createApp(vLanesOrderedMain)

app.component('v-lanes-ordered', {
    /* Lanes Ordered */
    mounted: function() {
        this.$root.setDefaults();
    },
    template:
        /* Using the html comment tag can enable html syntax highlighting in editors */
        /*html*/`
        <h1>Lanes Ordered</h1>
        <div class="row mb-3">
            <p>
                Showing number of lanes ordered per status, sequencing platform and flowcell type of corresponding projects. <br>
                The data is fetched from statusdb projects database which is mirrored from the LIMS.
            </p>
            <h5>Instructions:</h5>
            <p>
                <ul>
                    <li>Click on the plus signs or the category label to expand a category.</li>
                    <li>Click on the minus sign to collapse a category.</li>                
                    <li>Click on a project to go to the projects' page.</li>
                    <li>Click on the label of an expanded category to display it in the graph.</li> 
                </ul>
                <strong>Note:</strong> The ongoing category includes lanes already sequenced since the status 'ongoing' refers to the status of the project.
            </p>
            <div class="my-3">
                <button class="btn btn-primary btn-lg" @click="this.$root.setDefaults()">Reset Defaults</button>
            </div>
        </div>
        <div class="row">
            <div class="col-6 mb-5">
                <v-lanes-ordered-item :key_array="[]" :current_key="" :key_level="1" :local_data="this.$root.statistics_data"> </v-lanes-ordered-item>
            </div>
            <div class="col-6">
                <v-lanes-ordered-chart></v-lanes-ordered-chart>
            </div>
        </div>
        `
});


app.component('v-lanes-ordered-item', {
    props: ['key_array', 'current_key', 'key_level', 'local_data'],
    computed: {
        /* local data keys without the key 'value' sorted with highext value first*/
        local_data_keys() {
            return Object.keys(this.local_data)
                .filter(key => key !== 'value')
                .sort((a, b) => this.local_data[b]['value'] - this.local_data[a]['value']);
        }
    },
    methods: {
        collapse(key) {
            /* Change focus to the parent */
            this.$root.in_focus = this.key_array.slice(0, this.key_level - 1);
            /* Delete the children from the data tree */
            this.dumpData(key);
        },
        dumpData(key) {
            let key1 = this.key_array[0];
            let key2 = this.key_array[1];
            let key3 = this.key_array[2];

            // A function to delete everything except 'value' from a dictionary
            function dumpDataHelper(dictionary) {
                for (let [my_key, value] of Object.entries(dictionary)) {
                    if (my_key !== 'value') {
                        delete dictionary[my_key]
                    }
                }
            }
            switch (this.key_level) {
                case 1: {
                    // Delete everything except 'value' from statistics_data
                    dumpDataHelper(this.$root.statistics_data[key])
                    break;
                }
                case 2: {
                    dumpDataHelper(this.$root.statistics_data[key1][key])
                    break;
                }
                case 3: {
                    dumpDataHelper(this.$root.statistics_data[key1][key2][key])
                    break;
                }
            }
        },
        fetchData(key) {
            let args = this.key_array.slice(0, this.key_level - 1);
            args.push(key);
            this.$root.fetchStatistics(...args);
            this.$root.in_focus = args;
        },
        focus_on(key) {
            let args = this.key_array.slice(0, this.key_level);
            args.push(key);
            this.$root.in_focus = args;
        },
        has_leaves(category) {
            return (Object.keys(this.local_data[category]).length > 1) && (this.key_level < 5)
        }
    },
    template:
        /*html*/`
        <template v-for="category in this.local_data_keys" :key="category">
            <div :class="has_leaves(category) ? 'ml-4 mb-4' : 'ml-4'">
                <h3 class="mb-2">
                    <v-template v-if="key_level == 4">
                        <a :href="'project/' + category" target="_blank">{{category}}</a> {{this.local_data[category]['value']}}
                    </v-template>
                    <v-template v-else>
                        <v-template v-if="has_leaves(category)">
                            <!-- If the category is expanded, show a collapse button -->
                            <a href="#" @click="collapse(category)">
                                <i class="fas fa-xs fa-minus mr-2"></i>
                            </a>
                            <!-- Clicking the category will only change focus of graph-->
                            <a href="#" @click="focus_on(category)">
                                {{category}}
                            </a>
                        </v-template>
                        <v-template v-else>
                            <a href="#" @click="fetchData(category)">
                                <i class="fas fa-xs fa-plus mr-2"></i>{{category}}
                            </a>
                        </v-template>
                    <span class="ml-3">{{this.local_data[category]['value']}}</span>
                    </v-template>
                </h3>
                <template v-if="(Object.keys(this.local_data[category]).length > 1) && (key_level < 5)">
                    <v-lanes-ordered-item :key_array="this.key_array.concat(category)" :current_key="category" :key_level="key_level+1" :local_data="local_data[category]"></v-lanes-ordered-item>
                </template>
            </div>
        </template>
        `
})


app.component('v-lanes-ordered-chart', {
    computed: {
        key_array() {
            return this.$root.in_focus;
        },
        local_data() {
            let value = this.$root.statistics_data;
            for (let key of this.key_array) {
                if ((key === null) || !(key in value)) {
                    break;
                }
                value = value[key];
            }
            return value;
        },
        /* local data keys without the key 'value' sorted with highest value first */
        local_data_keys() {
            return Object.keys(this.local_data)
                .filter(key => key !== 'value')
                .sort((a, b) => this.local_data[b]['value'] - this.local_data[a]['value']);
        },
        local_data_values() {
            return this.local_data_keys.map(key => this.local_data[key].value);
        },
        in_focus_pretty() {
            if (this.key_array[0] === null) {
                return 'Default (ongoing, pending and reception control)';
            }
            return this.key_array.filter(key => key !== null).join(' > ');
        }
    },
    updated() {
        if (Object.keys(this.local_data).length !== 0){
            if (this.chart) {
                this.chart.destroy();
            }
            ctx = this.$refs.canvas.getContext('2d');
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: this.local_data_keys,
                    datasets: [{
                        label: 'Lanes Ordered',
                        data: this.local_data_values,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    tooltips: {
                        callbacks: {
                            label: function(tooltipItem, data) {
                                const label = data.labels[tooltipItem.index] || '';
                                const value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                                return label + ': ' + value;
                            }
                        }
                    }
                }
            });
        }
    },
    // data-dummy is a hack because Vue doesn't update the canvas element otherwise
    template: /*html*/`
        <h2>Showing: {{this.in_focus_pretty}}</h2>
        <div :data-dummy="local_data_values">
            <canvas style="height: 50rem;" ref="canvas"></canvas>
        </div>`
});

app.mount('#lanes_ordered_main');