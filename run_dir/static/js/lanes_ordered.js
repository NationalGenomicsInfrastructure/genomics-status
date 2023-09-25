const vLanesOrderedMain = ({
    data() {
        return {
            fetched_keys: {},
            statistics_data: {}
        }
    },
    methods: {
        fetchStatistics(key1, key2, key3) {
            let url = '/api/v1/lanes_ordered'
            /* Iterate over the key arguments and abort at first null occurence */
            let my_arguments = [key1, key2, key3];
            for (var i = 0; i < my_arguments.length; i++) {
                let my_key = my_arguments[i];
                let key_nr = i + 1;
                // Break if my_key is undefined
                var nr_of_keys = key_nr;
                if (my_key === undefined) {
                    var nr_of_keys = nr_of_keys - 1;
                    break;
                } else {
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
                        switch (nr_of_keys) {
                            case 0: {
                                for (let [my_key, value] of Object.entries(data)) {
                                    this.statistics_data[my_key] = {
                                        ...this.statistics_data[my_key],
                                        ...value
                                    };
                                }
                                break;
                            }
                            default: {
                                let obj = this.statistics_data;
                                for (let i = 1; i <= nr_of_keys; i++) {
                                    obj = obj[my_arguments[i - 1]];
                                }
                                Object.assign(obj, data)
                                break;
                            }
                        }
                    }
                })
                .catch(error => {
                    console.log(error)
                })
        },
        fetchStatisticsDummy() {
            this.fetchStatistics();
            this.fetchStatistics('ongoing');
            this.fetchStatistics('pending');
        },
    }
})

const app = Vue.createApp(vLanesOrderedMain)

app.component('v-lanes-ordered', {
    /* Lanes Ordered */
    mounted: function() {
        this.$root.fetchStatisticsDummy();
    },
    template:
        /* Using the html comment tag can enable html syntax highlighting in editors */
        /*html*/`
        <h2>Lanes Ordered</h3>
        <v-lanes-ordered-item :key_array="[]" :current_key="" :key_level="1" :local_data="this.$root.statistics_data"> </v-lanes-ordered-item>
        `
});


app.component('v-lanes-ordered-item', {
    props: ['key_array', 'current_key', 'key_level', 'local_data'],
    computed: {
        /* local data keys without the key 'value' */
        local_data_keys() {
            return Object.keys(this.local_data).filter(key => key !== 'value')
        }
    },
    methods: {
        fetchData(key) {
            let args = [];
            for (let i = 0; i < this.key_level - 1; i++) {
                args.push(this.key_array[i]);
            }
            args.push(key);
            this.$root.fetchStatistics(...args);
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
                    console.log('Dumping data for key: ' + key)
                    // Delete everything except 'value' from statistics_data
                    dumpDataHelper(this.$root.statistics_data[key])
                    break;
                }
                case 2: {
                    console.log('Dumping data for key1: ' + key1 + ' and ' + key)
                    dumpDataHelper(this.$root.statistics_data[key1][key])
                    break;
                }
                case 3: {
                    console.log('Dumping data for key1: ' + key1 + ' and key2: ' + key2 + ' and ' + key)
                    dumpDataHelper(this.$root.statistics_data[key1][key2][key])
                    break;
                }
            }
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
                <v-template v-if="has_leaves(category)">
                    <a href="#" @click="dumpData(category)">
                    <i class="fas fa-xs fa-minus mr-2"></i>{{category}}
                    </a>
                </v-template>
                <v-template v-else>
                    <a href="#" @click="fetchData(category)">
                    <i class="fas fa-xs fa-plus mr-2"></i>{{category}}
                    </a>
                </v-template>
                <span class="ml-3">{{this.local_data[category]['value']}}</span>
                </h3>
                <template v-if="(Object.keys(this.local_data[category]).length > 1) && (key_level < 6)">
                    <v-lanes-ordered-item :key_array="this.key_array.concat(category)" :current_key="category" :key_level="key_level+1" :local_data="local_data[category]"></v-lanes-ordered-item>
                </template>
            </div>
        </template>

        `
})

app.mount('#lanes_ordered_main');