import { vRunningNotesList, vRunningNoteSingle } from './running_notes_component.js'

const vIndex = {}

const app = Vue.createApp(vIndex)
app.component('v-running-notes-list', vRunningNotesList)
app.component('v-running-note-single', vRunningNoteSingle)
app.mount('#vue_index_main')
