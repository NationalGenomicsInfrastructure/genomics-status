export const vRunningNotesTab = {
    props: ['user', 'partition_id'],
    data() {
        return {
            running_notes: null,
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
        }
    },
    mounted() {
        this.fetchAllRunningNotes(this.partition_id);
    },
    template: /*html*/`
    <form action="" method="POST" id="running_notes_form" role="form">
        <div class="card text-dark info-border mb-3 mt-3">
            <div class="card-header info-bg">Add New Running Note</div>
            <div class="card-body">
                <div class="row">
                    <div class="col form-inline">
                      <label>Choose category:</label>
                      <div class="mt-2" data-toggle="buttons">
                         <button class="btn btn-sm btn-inf mr-2" value="Decision" data-toggle="tooltip" title="For when an executive decision has been made">Decision <span class="fa fa-thumbs-up"></span></button>
                         <button class="btn btn-sm btn-succe mr-2" value="Lab" data-toggle="tooltip" title="For lab-related work">Lab <span class="fa fa-flask"></span></button>
                         <button class="btn btn-sm btn-warn mr-2" value="Bioinformatics" data-toggle="tooltip" title="For all bioinformatics work">Bioinformatics <span class="fa fa-laptop-code"></span></button>
                         <button class="btn btn-sm btn-usr mr-2" value="User Communication" data-toggle="tooltip" title="For notes influenced by user-contact">User Communication <span class="fa fa-people-arrows"></span></button>
                         <button class="btn btn-sm btn-dang mr-2" value="Administration" data-toggle="tooltip" title="For notes involving documentation">Administration <span class="fa fa-folder-open"></span></button>
                         <button class="btn btn-sm btn-imp mr-2" value="Important" data-toggle="tooltip" title="For when a note needs to be highlighted">Important <span class="fa fa-exclamation-circle"></span></button>
                         <button class="btn btn-sm btn-devi mr-2" value="Deviation" data-toggle="tooltip" title="For notes about a deviation">Deviation <span class="fa fa-frown"></span></button>
                         <button class="btn btn-sm btn-inv mr-2" value="Invoice" data-toggle="tooltip" title="For notes about an invoice">Invoicing <span class="fa fa-file-invoice-dollar"></span></button>
                         <button class="btn btn-sm btn-sticky" value="Sticky" data-toggle="tooltip" title="For sticky notes">Sticky <span class="fa fa-note-sticky"></span></button>
                      </div>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6 mt-4">
                        <h4>Write Running Note</h4>
                        <textarea rows="5" class="form-control" id="new_note_text" style="height:97px;"></textarea>
                    </div>
                    <div class="col-md-6 mt-4">
                        <h4>Preview</h4>
                        <div class="card" id="running_note_preview_card">
                            <div class="card-header"><a class="text-decoration-none" href="#">{{ user.name }}</a> - <span class="todays_date">Date</span><span id="preview_category"> - Category</span></div>
                            <div class="card-body" id="running_note_preview_body">
                                <p class="text-muted"><em>Nothing to preview..</em></p>
                            </div>
                        </div>
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
    </form>

    <!-- filter running notes -->
    <div id="running_notes_filter" class="row" style="margin-bottom:12px;">
      <div class="col-3 ml-2">
        <label>Search :</label>
        <input type="text" class="form-control" id="rn_search" />
      </div>
      <div class="col-2">
        <label>Filter :</label>
        <div class="dropdown">
            <button class="btn btn-outline-secondary text-dark dropdown-toggle btn_count" type="button" id="rn_category" data-toggle="dropdown" aria-expanded="false"></button>
            <ul class="dropdown-menu" aria-labelledby="rn_category">
                <li><button class="dropdown-item" type="button">All</button></li>
                <li><div class="dropdown-divider"></div></li>
                <li><button class="dropdown-item" type="button">Workset</button></li>
                <li><button class="dropdown-item" type="button">Flowcell</button></li>
                <li><div class="dropdown-divider"></div></li>
                <li><button class="dropdown-item" type="button">Decision</button></li>
                <li><button class="dropdown-item" type="button">Lab</button></li>
                <li><button class="dropdown-item" type="button">Bioinformatics</button></li>
                <li><button class="dropdown-item" type="button">User Communication</button></li>
                <li><button class="dropdown-item" type="button">Administration</button></li>
                <li><button class="dropdown-item" type="button">Important</button></li>
                <li><button class="dropdown-item" type="button">Invoicing</button></li>
                <li><button class="dropdown-item" type="button">Deviation</button></li>
                <li><button class="dropdown-item" type="button">Sticky</button></li>
            </ul>
        </div>
      </div>
    </div>

    <!-- display running notes -->
    <template v-for="running_note in running_notes">
        <v-running-note-single :running_note_obj="running_note" :sticky="false"/>
    </template>
    `
}


export const vRunningNoteSingle = {
    props: ['running_note_obj', 'sticky'],

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
            if (this.sticky) {
                console.log("Got a sticky one!")
            }
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