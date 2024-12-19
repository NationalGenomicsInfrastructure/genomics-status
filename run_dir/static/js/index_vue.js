import { vRunningNotesListDecoupled, vRunningNoteSingle } from './running_notes_component.js'

const vIndex = {}

const app = Vue.createApp(vIndex)
app.component('v-running-notes-list-decoupled', vRunningNotesListDecoupled)
app.component('v-running-note-single', vRunningNoteSingle)
app.mount('#vue_index_main')
