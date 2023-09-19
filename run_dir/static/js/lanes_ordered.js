const vLanesOrderedMain = ({
    data() {
        return {
            fetched_keys: {},
            statistics_data: {}
        }
    },
    methods: {
        fetchStatistics(key1, key2, key3) {
            url = '/api/v1/lanes_ordered'
            /* Iterate over the key arguments and abort at first null occurence */
            var my_arguments = [key1, key2, key3];
            for (var i = 0; i < my_arguments.length; i++) {
                var my_key = my_arguments[i];
                var key_nr = i + 1;
                // Break if my_key is undefined
                if (my_key === undefined) {
                    var nr_of_keys = key_nr - 1;
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
                    data = response.data
                    if (data !== null) {
                        switch (nr_of_keys) {
                            case 0: {
                                this.statistics_data = data
                                break;
                            }
                            case 1: {
                                this.statistics_data[key1] = {
                                    ...this.statistics_data[key1],
                                    ...data
                                }
                                break;
                            }
                        }
                    }
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch statistics, please try again or contact a system administrator.')
                })
        },
        fetchStatisticsDummy() {
            this.fetchStatistics();
            /* this.fetchStatistics('aborted'); */
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
        <h4>Lanes Ordered inside Vue</h4>
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
    template:
        /*html*/`
        <li class="ml-3" v-for="category in this.local_data_keys" :key="category">
            {{category}}: {{this.local_data[category]['value']}} <br/>
            <template v-if="(Object.keys(this.local_data[category]).length > 1) && (key_level < 3)">
                <v-lanes-ordered-item :key_array="this.key_array.concat(category)" :current_key="category" :key_level="key_level++" :local_data="local_data[category]"></v-lanes-ordered-item>
            </template>
        </li>

        `
})

app.mount('#lanes_ordered_main');