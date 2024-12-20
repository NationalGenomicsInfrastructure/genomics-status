const cat_classes = {
    'automatic': {
      'Workset': ['primary', 'calendar-plus', 'btn-primary', 'For workset-related work'],
      'Flowcell': ['success', 'grip-vertical', 'btn-success', 'For flowcell-related work'],
    },
    'manual': {
      'Decision': ['info', 'thumbs-up', 'btn-inf', 'For when an executive decision has been made'],
      'Lab': ['success', 'flask', 'btn-succe', 'For lab-related work'],
      'Bioinformatics': ['warning', 'laptop-code', 'btn-warn', 'For all bioinformatics work'],
      'User Communication': ['usr', 'people-arrows', 'btn-usr', 'For notes influenced by user-contact'],
      'Administration': ['danger', 'folder-open', 'btn-dang', 'For notes involving documentation'],
      'Important': ['imp', 'exclamation-circle', 'btn-imp', 'For when a note needs to be highlighted'],
      'Deviation': ['devi', 'frown', 'btn-devi', 'For notes about a deviation'],
      'Invoicing': ['inv', 'file-invoice-dollar', 'btn-inv', 'For notes about an invoice'],
      'Sticky': ['sticky', 'note-sticky', 'btn-sticky', 'For sticky notes']
    }
  }

export const vRunningNotesTab = {
    props: ['user', 'partition_id', 'all_users', 'note_type'],
    data() {
        return {
            dropdown_position: {},
            form_categories: [],
            form_note_text: '',
            user_suggestions: [],
            running_notes: [],
            submitting: false,
            show_help: false,
            cat_classes: cat_classes
        }
    },
    computed: {
        anySuggestion() {
            return this.user_suggestions.length > 0
        },
        new_note_obj() {
            return {
                note: this.form_note_text,
                user: this.user.user,
                email: this.user.email,
                categories: this.form_categories,
                created_at_utc: new Date().toISOString()
            }
        },
        new_note_is_empty(){
            return this.form_note_text === '' && this.form_categories.length === 0
        },
        suggestion_styling() {
            return {
                position: 'absolute',
                top: this.dropdown_position.top + 'px',
                left: this.dropdown_position.left + 'px',
                width: this.dropdown_position.width + 'px',
                height: this.dropdown_position.height + 'px'
            }   
        },
        visible_user_suggestions() {
            // Only show the first 5 suggestions
            return this.user_suggestions.slice(0, 5)
        }
    },
    methods: {
        check_uri_hash(){
            // If the uri is a link to a specific note, we send that to each note with a props so that the correct one can glow up
            if (window.location.hash) {
                if (window.location.hash.startsWith('#running_note_')) {
                    return window.location.hash
                }
            }
            return null
        },
        openNewNoteForm() {
            let new_note_form = this.$refs.new_note_form;
            let new_note_caret = this.$refs.new_note_caret;

            if (!new_note_form.classList.contains('show')) {
                new_note_form.classList.add('show');
                new_note_caret.classList.remove('fa-caret-right');
                new_note_caret.classList.add('fa-caret-down');
                // focus on the textarea
                this.$refs.form_note_text_field.focus();
            }
        },
        setCurrentPosition() {
            let textarea = this.$refs.form_note_text_field;
            if (textarea === undefined) {
                return {}
            }
            this.dropdown_position = this.$root.getDropdownPositionHelper(textarea, 100);
        },
        submitRunningNote() {
            this.submitting = true;
            if (this.form_note_text === '') {
                alert("Error: No running note entered.");
                this.submitting = false
                return
            }
            if (this.form_categories.length === 0) {
                if (!confirm("Are you sure that you want to submit without choosing a category?")) {
                    this.submitting = false
                    return
                }
            }

            if(["flowcell", "workset", "flowcell_ont"].includes(this.note_type)){
                if((this.note_type==="flowcell" || this.note_type==="flowcell_ont") && !this.form_categories.includes("Flowcell")){
                  this.form_categories.push("Flowcell")
                }
                else if(this.note_type==="workset" && !this.form_categories.includes("Workset")){
                  this.form_categories.push("Workset")
                }
            }

            let post_body = {
                note: this.form_note_text,
                categories: this.form_categories,
                note_type: this.note_type
            }


            axios
                .post('/api/v1/running_notes/' + this.partition_id, post_body)
                .then(response => {
                    alert("TODO: fetch new running notes automatically")
                    this.fetchAllRunningNotes(this.partition_id)
                    this.form_note_text = ''
                    this.form_categories = []
                    this.submitting = false
                })
                .catch(error => {
                    alert('Unable to submit running note, please try again or contact a system administrator.')
                    this.submitting = false
                })
        },
        suggestTaggedUsers(event) {
            this.setCurrentPosition();
            let form_note_text_field = this.$refs.form_note_text_field;
            let cursor_position = form_note_text_field.selectionStart;
            let text_before_cursor = form_note_text_field.value.substring(0, cursor_position);
            let current_word = text_before_cursor.split(' ').pop();

            if (current_word.startsWith('@')) {
                current_word = current_word.substring(1).toLowerCase();
                let user_suggestions = this.all_users.filter(user => user.includes(current_word));
                this.user_suggestions = user_suggestions;
            } else {
                this.user_suggestions = [];
            }
        },
        tagUser(user) {
            /* 
               Let's think about the different cases.
               space or newline before the @ is always the case.
               but there could either be a space after the @ or not. 
            */

            let form_note_text_field = this.$refs.form_note_text_field;
            let cursor_position = form_note_text_field.selectionStart;
            let text_before_cursor = form_note_text_field.value.substring(0, cursor_position);
            let text_after_cursor = form_note_text_field.value.substring(cursor_position);
            let current_word = text_before_cursor.split(' ').pop()
            let current_word_after = '';
            if (text_after_cursor.charAt(0) == ' ') {
                /* Avoid double spaces when tagging in the middle of the text */
                text_after_cursor = text_after_cursor.substring(1);
            } else {
                /* If there is no space after the @, we need to remove the first word of the text after the cursor */
                current_word_after = text_after_cursor.split(' ')[0];
            }
            /* Create a new text by replacing the word where the @ was found with the @user */
            let new_text = text_before_cursor.substring(0, text_before_cursor.length - current_word.length) + '@' + user + ' ' + text_after_cursor.substring(current_word_after.length);
            this.form_note_text = new_text;
            this.user_suggestions = [];
            form_note_text_field.focus();
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
                this.openNewNoteForm();
            }
        },
        toggleFormCategory(category) {
            if (this.form_categories.includes(category)) {
                this.form_categories = this.form_categories.filter(item => item !== category);
            } else {
                this.form_categories.push(category);
            }
        },

        /* Toggle Markdown Help visibility*/
        showMarkdownHelp() {
            this.show_help = !this.show_help;
        },
    },
    mounted() {
        if ( !( ["flowcell", "workset", "flowcell_ont", "project"].includes(this.note_type))) {
            alert("Error: Invalid note type given, will not fetch notes")
            return
        }
    },
    template: /*html*/`
    <div class="card text-dark info-border mb-3 mt-3">
        <div class="card-header info-bg pt-3" @click="toggleNewNoteForm()"><h5><i ref="new_note_caret" class="fas fa-caret-right fa-lg pr-2"></i>Add New Running Note</h5></div>
        <form ref="new_note_form" class="card-body collapse">
            <fieldset v-bind:disabled="submitting">
            <div class="row">
                <div class="col form-inline">
                    <label>Choose category:</label>
                    <div class="mt-2" data-toggle="buttons">
                        <button v-for="(config, key) in cat_classes['manual']" :class="['btn', 'btn-sm', config[2], 'mr-2']" :value="key" data-toggle="tooltip" :title="config[3]" @click.prevent="toggleFormCategory(key)">{{ key }}
                            <span :class="'fa fa-' + config[1]"></span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6 mt-4">
                    <h4>Write Running Note</h4>
                    <textarea id='form_note_text_field' rows="5" class="form-control" list="user_suggestions" v-model="form_note_text" style="height:97px;" ref='form_note_text_field' @keyup="suggestTaggedUsers" @click="suggestTaggedUsers"></textarea>
                    <div :style="suggestion_styling">
                        <ul class="dropdown-menu" :class="{ 'show': anySuggestion}" style='position: static;'>
                            <li v-for="user in visible_user_suggestions">
                                <button class="dropdown-item" type="button" @click="tagUser(user)">{{user}}</button>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="col-md-6 mt-4">
                    <h4>Preview</h4>
                    <template v-if="new_note_is_empty">
                        <p class="text-muted"><em>Nothing to preview.</em></p>
                    </template>
                    <template v-else>
                        <v-running-note-single :running_note_obj="new_note_obj" :compact="false"/>
                    </template>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 text-right">
                    <button type="button" class="btn btn-link" @click=showMarkdownHelp>Markdown Help</button>
                    <template v-if="submitting">
                        <button class="btn btn-primary" type="button" disabled>
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Saving Running Note...
                        </button>
                    </template>
                    <template v-else>
                       <button type="submit" class="btn btn-primary" id="save_note_button" @click.prevent="submitRunningNote">Submit Running Note</button>
                    </template>
                </div>
            </div>
            <div class="row justify-content-md-center" v-show="show_help">
              <div class="col-md-9 mt-4">
                <div class="card">
                    <div class="card-header" id="markdown_help">
                        <h3 class="card-title">Running Notes - Markdown Help</h3>
                    </div>
                    <div class="card-body">
                        <p><strong>Remember:</strong> <u>Two</u> line breaks are required to split a line in two!</p>
                        <table class="table table-bordered">
                            <tbody>
                                <tr class="darkth">
                                    <th>You Write</th>
                                    <th>Running Note Shows</th>
                                </tr>
                                <tr>
                                    <td>Some *italic* text</td>
                                    <td class="mkdown">Some <em>italic</em> text</td>
                                </tr>
                                <tr>
                                    <td>Some **bold** text</td>
                                    <td class="mkdown">Some <strong>bold</strong> text</td>
                                </tr>
                                <tr>
                                    <td>Some ***bold italic*** text</td>
                                    <td class="mkdown">Some <strong><em>bold italic</em></strong> text</td>
                                </tr>
                                <tr>
                                    <td>* Bullet pointed<br>* List of items<br>&nbsp;* With nested<br>* Items</td>
                                    <td class="mkdown">
                                        <ul>
                                            <li>Bullet pointed</li>
                                            <li>List of items
                                                <ul>
                                                    <li>With nested</li>
                                                </ul>
                                            </li>
                                            <li>Items</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <td>1. Numbered list<br>1. Of items</td>
                                    <td class="mkdown">
                                        <ol>
                                            <li>Numbered list</li>
                                            <li>Of items</li>
                                        </ol>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Links [are easy](https://genomics-status.scilifelab.se/)!</td>
                                    <td class="mkdown">Links <a href="https://genomics-status.scilifelab.se/">are easy</a>!</td>
                                </tr>
                                <tr>
                                    <td>You can do e-mail addresses too: &lt;genomics_support@scilifelab.se&gt;</td>
                                    <td>You can do e-mail addresses too: <a href="mailto:genomics_support@scilifelab.se">genomics_support@scilifelab.se</a></td>
                                </tr>
                                <tr>
                                    <td>Markdown even has a logo: ![Awesome Logo](https://genomics-status.scilifelab.se/static/img/markdown.png)</td>
                                    <td class="mkdown">Markdown even has a logo: <img src="/static/img/markdown.png" title="Awesome Logo"></td>
                                </tr>
                                <tr>
                                    <td>You can put things like flow cell IDs in \`back ticks\`</td>
                                    <td class="mkdown">You can put things like flow cell IDs in <code>back ticks</code></td>
                                </tr>
                                <tr>
                                    <td>\`\`\`<br>Larger chunks of code-like stuff<br>can go in 'code-fences' of<br>three back ticks<br>\`\`\`</td>
                                    <td class="mkdown">
                                        <pre><code>Larger chunks for code-like stuff<br>can go in 'code-fences' of<br>three back ticks</code></pre>
                                    </td>
                                </tr>
                                <tr>
                                    <td>&gt; You can quote someone<br>&gt; with greater than symbols</td>
                                    <td class="mkdown"><blockquote>You can quote someone with greater than symbols</blockquote></td>
                                </tr>
                                <tr>
                                    <td>Split up content<br>***<br>with three or more asterisks</td>
                                    <td>Split up content<hr>with three or more asterisks</td>
                                </tr>
                                <tr>
                                    <td># Headings<br>## Use these<br>### Symbols</td>
                                    <td>
                                        <h1>Headings</h1>
                                        <h2>Use these</h2>
                                        <h3>Symbols</h3>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <p>For further reference, see the <a href="http://daringfireball.net/projects/markdown/syntax" target="_blank">syntax document</a>.
                            Live editing tools such as <a href="http://dillinger.io/" target="_blank">dillinger.io</a> may also be of use.</p>
                    </div>
                </div>
               </div>
            </div>
            </fieldset>
        </form>
    </div>



    <!-- display running notes -->
    <p>This is the notes</p>
    <v-running-notes-list :user="this.user" :running_notes="running_notes" :partition_id="this.partition_id"/>
    `
}


/* The component responsible for showing a list of running notes and filtering/searching */
export const vRunningNotesList = {
    name: 'v-running-notes-list',
    props: {
        user: null,
        partition_id: null,
        dynamic: false, // If false, no older running notes will be fetched
    },
    data() {
        return {
            running_notes: {},
            projects_metadata: {},
            filter_choice: 'all',
            include_production: true,
            include_application: true,
            include_internal: true,
            include_control: true,
            assigned_lab_responsible: true,
            assigned_bioinfo_responsible: true,
            assigned_project_coordinator: true,
            assigned_bp_responsible: true,
            include_self_written: false,
            include_tagged: true,
            search_term: '',
            cat_classes: cat_classes,
            category_filter: 'All',
        }
    },
    computed: {
        current_user_email() {
            return this.user.email;
        },
        current_user_name() {
            return this.user.user;
        },
        // Filters
        filterAll() {
            // Do not apply any filter
            return this.filter_choice === 'all';
        },
        filterOnAssigned() {
            return this.filter_choice === 'assigned';
        },
        filterOnTagged() {
            return this.filter_choice === 'tagged';
        },
        filterOnType() {
            return this.filter_choice === 'type';
        },
        numberOfFetchedRunningNotes() {
            return Object.keys(this.running_notes).length;
        },
        numberOfVisibleRunningNotes() {
            return this.visibleRunningNotes.length;
        },
        userTaggedName() {
            return this.current_user_email.split('@')[0];
        },
        visibleRunningNotes() {
            var runningNotesArray = Object.values(this.running_notes);

            if (this.filterAll) {
                // do nothing
            } else if (this.filterOnTagged) {
                runningNotesArray = runningNotesArray.filter(running_note => {
                    // Filter based on who created the running note
                    let self_written_bool = (this.include_self_written && running_note.email === this.current_user_email)
                    // Filter on who is tagged in the running note
                    let user_tagged_bool = (this.include_tagged && this.userTaggedName in this.taggedUsersFromRunningNote(running_note))

                    // Keep running notes if either of the above is true
                    return self_written_bool || user_tagged_bool;
                })
            } else {
                // Filter based on projects, filter the projects first
                let projects_to_include = [];
                if (this.filterOnType) {
                    for (let project in this.projects_metadata) {
                        if (this.include_production && this.projects_metadata[project].type === 'Production') {
                            projects_to_include.push(project);
                            continue
                        }
                        if (this.include_application && this.projects_metadata[project].type === 'Application') {
                            projects_to_include.push(project);
                            continue
                        }
                        if (this.include_other_types) {
                            projects_to_include.push(project);
                            continue
                        }
                    }
                } else if (this.filterOnAssigned) {
                    for (let project in this.projects_metadata) {
                        if (this.assigned_lab_responsible && this.projects_metadata[project].lab_responsible === this.current_user_name) {
                            projects_to_include.push(project);
                            continue;
                        }
                        if (this.assigned_bioinfo_responsible && this.projects_metadata[project].bioinfo_responsible === this.current_user_name) {
                            projects_to_include.push(project);
                            continue;
                        }
                        if (this.assigned_project_coordinator && this.projects_metadata[project].project_coordinator === this.current_user_name) {
                            projects_to_include.push(project);
                            continue;
                        }
                        if (this.assigned_bp_responsible && this.projects_metadata[project].bp_responsible === this.current_user_name) {
                            projects_to_include.push(project);
                            continue;
                        }
                    }
                }

                runningNotesArray = runningNotesArray.filter(running_note => {
                    return projects_to_include.includes(running_note.parent);
                });
            }

            // Apply searching here
            if (this.search_term !== '') {
                runningNotesArray = runningNotesArray.filter(running_note => {
                    return (running_note.note.toLowerCase().includes(this.search_term.toLowerCase())) ||
                                (running_note.user.toLowerCase().includes(this.search_term.toLowerCase())) ||
                                (running_note.categories.join(' ').toLowerCase().includes(this.search_term.toLowerCase()))
                })
            }

            // Filter by category
            if (this.category_filter !== 'All') {
                runningNotesArray = runningNotesArray.filter(running_note => {
                    return running_note.categories.includes(this.category_filter)
                })
            }

            return runningNotesArray
        }
    },
    methods: {
        async fetchAllRunningNotes(skip = 0) {
            axios
                .get(`/api/v1/latest_running_notes_with_meta?skip=${skip}&limit=20`)
                .then(response => {
                    let data = response.data;
                    if (data !== null) {
                        this.running_notes = Object.assign({}, this.running_notes, data.running_notes);
                        this.projects_metadata = Object.assign({}, this.projects_metadata, data.projects_metadata);
                    }
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch running notes, please try again or contact a system administrator.');
                });
        },
        fetchPartitionRunningNotes(partition_id) {
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
        setFilter(filter) {
            this.category_filter = filter
        },
        taggedUsersFromRunningNote(running_note) {
            const regex = /@([a-zA-Z0-9.-]+)/g;
            const matches = running_note.note.matchAll(regex);

            const tagged_users = Array.from(matches, match => match[1])
            return tagged_users;

        },
        labelColor(category) {
            if (category === 'All') {
                return 'badge bg-secondary'
            }
            if(Object.values(cat_classes).some(subCat => subCat.hasOwnProperty(category))){
                const subCat = Object.values(cat_classes).find(subCat => subCat.hasOwnProperty(category));
                return 'badge bg-'+subCat[category][0];
            }
            return ''
        },
        countCards(category) {
            if(category === 'All') {
                return Object.values(this.running_notes).length
            }
            return Object.values(this.running_notes).filter(running_note => running_note.categories.includes(category)).length
        }
    },
    mounted() {
        if (this.partition_id !== null) {
            console.log("Fetching partition running notes for partition_id: " + this.partition_id);
            this.fetchPartitionRunningNotes(this.partition_id);
        } else {
            this.fetchAllRunningNotes(0);
        }
    },
    template: /*html*/`
        <div>
            <div class="row">
                <h3 class="col">Latest Running Notes <small>Showing {{numberOfVisibleRunningNotes}} of {{numberOfFetchedRunningNotes}}</small></h3>
                <div class="col-auto">
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary text-dark dropdown-toggle btn_count" type="button" id="rn_category" data-toggle="dropdown" aria-expanded="false">
                            <span class="mr-2">Category:</span>
                            <span :class="['mr-2', labelColor(category_filter)]">{{countCards(category_filter) }}</span> {{category_filter}}
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="rn_category">
                            <li><button class="dropdown-item" type="button" @click="setFilter('All')"><span :class="['mr-2', labelColor('All')]">{{countCards('All') }}</span>All</button></li>
                            <li v-show="countCards('All')>0"><div class="dropdown-divider"></div></li>
                            <li v-for="item in Object.keys(cat_classes['automatic'])" :key="item" v-show="countCards(item)>0">
                                <button class="dropdown-item" type="button" @click="setFilter(item)">
                                    <span :class="['mr-2', labelColor(item)]">{{ countCards(item) }}</span>
                                    {{ item }}
                                </button>
                            </li>

                            <li v-show="countCards('All')>0"><div class="dropdown-divider"></div></li>
                            <li v-for="item in Object.keys(cat_classes['manual'])" :key="item" v-show="countCards(item)>0">
                                <button class="dropdown-item" type="button" @click="setFilter(item)">
                                    <span :class="['mr-2', labelColor(item)]">{{ countCards(item) }}</span>
                                    {{ item }}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="col-3">
                    <input type="text" v-model="search_term" class="form-control" ref="note_search" id="noteSearchInput" placeholder="Search"/>
                </div>
            </div>

            <div class="row mb-4 mt-2">
                <div class="col-lg-4">
                    <div class="btn-group mb-2" role="group" aria-label="Basic radio toggle button group">
                        <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" value="all" v-model="filter_choice">
                        <label class="btn btn-outline-primary" for="btnradio1">All</label>
                        <template v-if="this.partition_id === null">
                            <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" value="type" v-model="filter_choice">
                            <label class="btn btn-outline-primary" for="btnradio2">Project Type</label>

                            <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off" value="assigned" v-model="filter_choice">
                            <label class="btn btn-outline-primary" for="btnradio3">Assigned</label>
                        </template>

                        <input type="radio" class="btn-check" name="btnradio" id="btnradio4" autocomplete="off" value="tagged" v-model="filter_choice">
                        <label class="btn btn-outline-primary" for="btnradio4">@</label>
                    </div>
                </div>

                <template v-if="filterOnType">
                    <div class="col-lg-8">
                        <div class="row">
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="productionSwitch" v-model="include_production">
                                <label class="form-check-label" for="productionSwitch">Production</label>
                            </div>
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="applicationSwitch" v-model="include_application">
                                <label class="form-check-label" for="applicationSwitch">Application</label>
                            </div>
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="controlSwitch" v-model="include_controls">
                                <label class="form-check-label" for="controlSwitch">Control</label>
                            </div>
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="internalTypeSwitch" v-model="include_internal">
                                <label class="form-check-label" for="internalTypeSwitch">Internal</label>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else-if="filterOnAssigned" class="mt-0">
                    <div class="col-lg-8">
                        <div class="row">
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="labSwitch" v-model="assigned_lab_responsible">
                                <label class="form-check-label" for="labSwitch">Lab Responsible</label>
                            </div>
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="bioinfoSwitch" v-model="assigned_bioinfo_responsible">
                                <label class="form-check-label" for="bioinfoSwitch">Bioinfo Responsible</label>
                            </div>
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="pcSwitch" v-model="assigned_project_coordinator">
                                <label class="form-check-label" for="pcSwitch">Project Coordinator</label>
                            </div>
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="bpSwitch" v-model="assigned_bp_responsible">
                                <label class="form-check-label" for="bpSwitch">BP Responsible</label>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else-if="filterOnTagged" class="mt-0">
                    <div class="col-lg-8">
                        <div class="row">
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="taggedSwitch" v-model="include_tagged">
                                <label class="form-check-label" for="taggedSwitch">@{{this.userTaggedName}}</label>
                            </div>
                            <div class="form-check form-switch mt-2 mb-2 col-3">
                                <input class="form-check-input" type="checkbox" id="selfWrittenSwitch" v-model="include_self_written">
                                <label class="form-check-label" for="selfWrittenSwitch">Written by you</label>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <template v-for="running_note in visibleRunningNotes">
                <v-running-note-single :running_note_obj="running_note" :compact="false" :partition_id="running_note.parent"/>
            </template>
        </div>

        <div class="d-flex justify-content-center w-100">
            <template v-if="numberOfVisibleRunningNotes == 0">
                <p class="text-muted">No running notes matched your selected filters.</p>
            </template>
        </div>
        <div class="d-flex justify-content-center w-100">
            <button class="btn btn-primary mb-3" @click="fetchAllRunningNotes(skip=numberOfFetchedRunningNotes)">Load More Notes</button>
        </div>
    `,
}

export const vRunningNoteSingle = {
    props: ['running_note_obj', 'compact', "partition_id", "uri_hash"],
    data: function() {
        return {
            glowingCard: false
        }
    },
    mounted() {
        if (this.uri_hash === '#' + this.note_id) {
            this.make_selected_card_glow()
        }
    },
    computed: {
        categories() {
            return this.getRunningNoteProperty('categories').map(category => category.trim())
        },
        categories_labels() {
            if (this.categories == undefined) {
                return ''
            }
            return this.generateCategoryLabel(this.categories)
        },
        mark_card_important() {
            return this.categories.includes('Important') ? 'card-important' : ''
        },
        created_at_utc() {
            return this.getRunningNoteProperty('created_at_utc')
        },
        formattedTimeStamp() {
            let date = new Date(this.created_at_utc);
            return date.toDateString() + ', ' + date.toLocaleTimeString(date);
        },
        timestampAge() {
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
            return make_markdown(this.note)
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
        note_hash(){
            return (new Date(this.created_at_utc).getTime());
        },
        note_id() {
            return 'running_note_'+this.partition_id+'_'+this.note_hash;
        },
        email() {
            return this.getRunningNoteProperty('email')
        },
        note() {
            return this.getRunningNoteProperty('note')
        },
        user() {
            return this.getRunningNoteProperty('user')
        },
        href(){
            return '/project_new/' + this.partition_id + '#' + this.note_id
        },
    },    
    methods: {
        generateCategoryLabel(categories){
           let cat_label = '';
           Object.values(categories).forEach(function(val){
             if (Object.values(cat_classes).some(subCat => subCat.hasOwnProperty(val))){
                const subCat = Object.values(cat_classes).find(subCat => subCat.hasOwnProperty(val));
                 cat_label += '<span class="badge bg-'+subCat[val][0]+'">'+val+'&nbsp;'+'<span class="fa fa-'+ subCat[val][1] +'">'+"</span></span> ";
             }
           });
           return cat_label;
        },
        getRunningNoteProperty(key){
            if (this.running_note !== undefined) {
                if (key in this.running_note) {
                    return this.running_note[key]
                }
            }
            return undefined
        },
        makeSelectedCardGlow(event) {
            this.$nextTick(() => {
                this.$refs.card_div.scrollIntoView({ block: "center" });
                this.glowingCard = true;
                setTimeout(() => {
                    this.glowingCard = false;
                }, 3000);
            });
        }
    },
    template:
    /*html*/`
    <div class="pb-3">
        <div :class="['card', {glow: glowingCard}]" ref="card_div">
            <div class="card-header" :class="mark_card_important" :id="note_id">
                <a class="text-decoration-none" :href="'mailto:' + this.email">{{this.user}}</a>
                <template v-if="!compact">
                - <a @click.prevent="makeSelectedCardGlow" class="text-decoration-none" :href=this.href>
                    <span class="todays_date">{{ formattedTimeStamp }}</span>
                </a>
                </template>
                <span> - {{timestampAge}}</span>
                <template v-if="categories">
                - <span v-html="categories_labels"/>
                </template>
            </div>
            <div class="card-body">
                <div class="running-note-body" v-html="formatted_note"/>
            </div>
        </div>
    </div>
    `,
}