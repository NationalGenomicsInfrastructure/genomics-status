import { vRunningNotesTab, vRunningNoteSingle } from './running_notes_component.js'

const vIndex = {
    data() {
        return {
            running_notes: {},
        }
    },
    computed: {
        numberOfFetchedRunningNotes() {
            return Object.keys(this.running_notes).length;
        },
    },
    methods: {
        async fetchRunningNotes(skip = 0) {
            axios
                .get(`/api/v1/latest_running_notes_all?skip=${skip}&limit=5`)
                .then(response => {
                    let data = response.data;
                    if (data !== null) {
                        this.running_notes = Object.assign({}, this.running_notes, data);
                    }
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch running notes, please try again or contact a system administrator.');
                });
        }
    },
    mounted() {
        this.fetchRunningNotes(0);
    },
    template: /*html*/`
        <div>
            <h3>Latest Running Notes <small>Showing ({{numberOfFetchedRunningNotes}})</small></h3>
            <template v-for="running_note in running_notes">
                <v-running-note-single :running_note_obj="running_note" :compact="false" :partition_id="P27552"/>
            </template>
            <button class="btn btn-primary mb-3" @click="fetchRunningNotes(skip=numberOfFetchedRunningNotes)">Load More</button>
        </div>
    `,
}

const app = Vue.createApp(vIndex)
app.component('v-running-note-single', vRunningNoteSingle)
app.mount('#vue_index_main')