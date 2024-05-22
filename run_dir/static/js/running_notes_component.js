export const vRunningNotesTab = {
    props: ['user', 'partition_id'],
    data() {
        return {
            category_filter: 'All',
            form_categories: [],
            form_note_text: '',
            running_notes: [],
            search_term: ''
        }
    },
    computed: {
        visible_running_notes() {
            let running_notes_tmp = Object.entries(this.running_notes)

            if (this.search_term !== '') {
                running_notes_tmp = running_notes_tmp.filter(([running_note_key, running_note]) => {
                    return (running_note.note.toLowerCase().includes(this.search_term.toLowerCase())) ||
                                (running_note.user.toLowerCase().includes(this.search_term.toLowerCase())) ||
                                (running_note.categories.join(' ').toLowerCase().includes(this.search_term.toLowerCase()))
                })
            }

            // Filter by category
            if (this.category_filter !== 'All') {
                running_notes_tmp = running_notes_tmp.filter(([running_note_key, running_note]) => {
                    return running_note.categories.includes(this.category_filter)
                })
            }

            return Object.fromEntries(running_notes_tmp)
        },
        new_note_obj() {
            return {
                note: this.form_note_text,
                user: this.user.name,
                categories: this.form_categories,
                created_at_utc: new Date().toISOString()
            }
        }
    },
    methods: {
        async fetchAllRunningNotes(partition_id) {
            axios
                .get('/api/v1/running_notes/' + partition_id)
                .then(response => {
                    let data = response.data
                    if (data !== null) {
                        this.running_notes = data;
                    }
                })
                .catch(error => {
                    this.$root.error_messages.push('Unable to fetch running notes, please try again or contact a system administrator.')
                })
        },
        toggleNewNoteForm() {
            let new_note_form = this.$refs.new_note_form;
            let new_note_caret = this.$refs.new_note_caret;

            // Remove the show class if it exists
            if (new_note_form.classList.contains('show')) {
                new_note_form.classList.remove('show');
                new_note_caret.classList.remove('fa-caret-down');
                new_note_caret.classList.add('fa-caret-right');
            } else {
                new_note_form.classList.add('show');
                new_note_caret.classList.remove('fa-caret-right');
                new_note_caret.classList.add('fa-caret-down');
            }
        },
        setFilter(filter) {
            this.category_filter = filter
        },
        toggleFormCategory(category) {
            if (this.form_categories.includes(category)) {
                this.form_categories = this.form_categories.filter(item => item !== category);
            } else {
                this.form_categories.push(category);
            }
        }
    },
    mounted() {
        this.fetchAllRunningNotes(this.partition_id);
    },
    template: /*html*/`
    <div class="card text-dark info-border mb-3 mt-3">
        <div class="card-header info-bg pt-3" @click="toggleNewNoteForm()"><h5><i ref="new_note_caret" class="fas fa-caret-right fa-lg pr-2"></i>Add New Running Note</h5></div>
        <div ref="new_note_form" class="card-body collapse">
            <div class="row">
                <div class="col form-inline">
                    <label>Choose category:</label>
                    <div class="mt-2" data-toggle="buttons">
                        <button class="btn btn-sm btn-inf mr-2" value="Decision" data-toggle="tooltip" title="For when an executive decision has been made" @click="toggleFormCategory('Decision')">Decision <span class="fa fa-thumbs-up"></span></button>
                        <button class="btn btn-sm btn-succe mr-2" value="Lab" data-toggle="tooltip" title="For lab-related work" @click="toggleFormCategory('Lab')">Lab <span class="fa fa-flask"></span></button>
                        <button class="btn btn-sm btn-warn mr-2" value="Bioinformatics" data-toggle="tooltip" title="For all bioinformatics work" @click="toggleFormCategory('Bioinformatics')">Bioinformatics <span class="fa fa-laptop-code"></span></button>
                        <button class="btn btn-sm btn-usr mr-2" value="User Communication" data-toggle="tooltip" title="For notes influenced by user-contact" @click="toggleFormCategory('User Communication')">User Communication <span class="fa fa-people-arrows"></span></button>
                        <button class="btn btn-sm btn-dang mr-2" value="Administration" data-toggle="tooltip" title="For notes involving documentation" @click="toggleFormCategory('Administration')">Administration <span class="fa fa-folder-open"></span></button>
                        <button class="btn btn-sm btn-imp mr-2" value="Important" data-toggle="tooltip" title="For when a note needs to be highlighted" @click="toggleFormCategory('Important')">Important <span class="fa fa-exclamation-circle"></span></button>
                        <button class="btn btn-sm btn-devi mr-2" value="Deviation" data-toggle="tooltip" title="For notes about a deviation" @click="toggleFormCategory('Deviation')">Deviation <span class="fa fa-frown"></span></button>
                        <button class="btn btn-sm btn-inv mr-2" value="Invoice" data-toggle="tooltip" title="For notes about an invoice" @click="toggleFormCategory('Invoice')">Invoicing <span class="fa fa-file-invoice-dollar"></span></button>
                        <button class="btn btn-sm btn-sticky" value="Sticky" data-toggle="tooltip" title="For sticky notes" @click="toggleFormCategory('Sticky')">Sticky <span class="fa fa-note-sticky"></span></button>
                    </div>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6 mt-4">
                    <h4>Write Running Note</h4>
                    <textarea rows="5" class="form-control" v-model="form_note_text" style="height:97px;"></textarea>
                </div>
                <div class="col-md-6 mt-4">
                    <h4>Preview</h4>
                    <template v-if="form_note_text !== ''">
                        <v-running-note-single :running_note_obj="new_note_obj"/>
                    </template>
                    <template v-else>
                        <p class="text-muted"><em>Nothing to preview.</em></p>
                    </template>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 text-right">
                    <button type="button" class="btn btn-link" data-toggle="modal" data-target="#markdown_help">Markdown Help</button>
                    <button type="submit" class="btn btn-primary" id="save_note_button">Submit Running Note</button>
                </div>
            </div>
        </div>
    </div>

    <!-- filter running notes -->
    <div id="running_notes_filter" class="row" style="margin-bottom:12px;">
      <div class="col-3 ml-2">
        <label>Search :</label>
        <input type="text" v-model="search_term" class="form-control" ref="note_search"/>
      </div>
      <div class="col-2">
        <label>Filter :</label>

        <div class="dropdown">
            <button class="btn btn-outline-secondary text-dark dropdown-toggle btn_count" type="button" id="rn_category" data-toggle="dropdown" aria-expanded="false"></button>
            <ul class="dropdown-menu" aria-labelledby="rn_category">
                <li><button class="dropdown-item" type="button" @click="setFilter('All')">All</button></li>
                <li><div class="dropdown-divider"></div></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Workset')">Workset</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Flowcell')">Flowcell</button></li>

                <li><div class="dropdown-divider"></div></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Decision')">Decision</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Lab')">Lab</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Bioinformatics')">Bioinformatics</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('User Communication')">User Communication</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Administration')">Administration</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Important')">Important</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Invoicing')">Invoicing</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Deviation')">Deviation</button></li>
                <li><button class="dropdown-item" type="button" @click="setFilter('Sticky')">Sticky</button></li>
            </ul>
        </div>
      </div>
    </div>

    <!-- display running notes -->
    <template v-for="running_note in visible_running_notes">
        <v-running-note-single :running_note_obj="running_note"/>
    </template>
    `
}


export const vRunningNoteSingle = {
    props: ['running_note_obj'],

    computed: {
        categories() {
            return this.getRunningNoteProperty('categories')
        },
        categories_labels() {
            if (this.categories == undefined) {
                return ''
            }
            // The generate_category_label method is defined in running_notes.js
            return generate_category_label(this.categories)
        },
        created_at_utc() {
            return this.getRunningNoteProperty('created_at_utc')
        },
        formattedTimeStamp() {
            // Get the timestamp from the running note
            let timestamp = this.created_at_utc;

            // Create a new Date object using the timestamp
            let date = new Date(timestamp);

            // Get the current date
            let now = new Date();

            // Calculate the difference in seconds
            let diffInSeconds = Math.floor((now - date) / 1000);

            if (diffInSeconds < 60) {
                return 'Just now';
            }

            let diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) {
                return `${diffInMinutes} minutes ago`;
            }

            let diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours} hours ago`;
            }

            let diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} days ago`;
        },
        formatted_note() {
            if (this.note == undefined) {
                return ''
            }
            return marked.parse(this.note)
        },
        running_note() {
            if (this.running_note_obj == undefined) {
                return undefined
            }
            // Check if running note is an object

            if (typeof this.running_note_obj == 'object') {
                return this.running_note_obj
            }
            let running_note_json = JSON.parse(this.running_note_obj)
            return Object.values(running_note_json)[0];
        },
        note() {
            return this.getRunningNoteProperty('note')
        },
        user() {
            return this.getRunningNoteProperty('user')
        }
    },    
    methods: {
        getRunningNoteProperty(key){
            if (this.running_note !== undefined) {
                if (key in this.running_note) {
                    return this.running_note[key]
                }
            }
            return undefined
        }
    },
    template:
    /*html*/`
    <div class="pb-3">
        <div class="card">
            <div class="card-header bi-project-note-header">
                <span>{{ this.user }}</span> - <span class="todays_date">{{ formattedTimeStamp }}</span>
                <template v-if="categories">
                - <span v-html="categories_labels"/>
                </template>
            </div>
            <div class="card-body bi-project-note-text">
                <div class="running-note-body text-muted" v-html="formatted_note"/>
            </div>
        </div>
    </div>
    `,
}