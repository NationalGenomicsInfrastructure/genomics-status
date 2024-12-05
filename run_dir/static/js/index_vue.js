import { vRunningNotesTab, vRunningNoteSingle } from './running_notes_component.js'

const vIndex = {
    data() {
        return {
            sticky_running_notes: {},
        }
    },
    methods: {
        async fetchStickyRunningNotes(project_id) {
            let post_body;
            post_body = {project_ids: [project_id]};

            axios
                .post('/api/v1/latest_sticky_run_note', post_body)
                .then(response => {
                    let data = response.data
                    if (data !== null) {
                        this.sticky_running_notes = Object.assign({}, this.sticky_running_notes, data);
                    }
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch sticky running notes, please try again or contact a system administrator.')
                })
        }
    },
    mounted() {
        this.fetchStickyRunningNotes('P27552');
    },
    template: /*html*/`
        <div>
            <h3>Latest Running Notes</h3>
            <template v-for="running_note in sticky_running_notes">
                <v-running-note-single :running_note_obj="running_note" :compact="true" :partition_id="P27552"/>
            </template
        </div>
    `,
}

const app = Vue.createApp(vIndex)
app.component('v-running-note-single', vRunningNoteSingle)
app.mount('#vue_index_main')