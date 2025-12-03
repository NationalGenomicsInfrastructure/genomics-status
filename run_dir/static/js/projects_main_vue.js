import {vProjectCards, vProjectDataField, vProjectDetails, vProjectPeopleAssignments} from './projects_components.js'
import { getDropdownPosition } from './smart_suggestion.js';
import { vRunningNotesTab, vRunningNoteSingle } from './running_notes_component.js'


const vProjectsStatus = {
    data() {
        return {
            /* Common data */
            project_details: {},
            project_samples: {},
            sticky_running_notes: {},
            error_messages: [],
            websocket_message:'',
            websocket: null,
            /* Used for tagging running notes. */
            all_users: {},
            current_user: null,
            /* Used to determine behaviour of the app depending on if it's a single project or multiple projects */
            single_project_mode: false,
            /* Only used on project cards page */
            sortBy: 'status',
            card_columns: ['library_construction_method'],
            descending: true,
            search_value: '',
            statuses_ordered: ['Pending', 'Reception Control', 'Ongoing'],
            open_modal_card: null,
            // Filters
            all_filters: {
                'application': {
                    'title': 'Application',
                    'key': 'application',
                    'secondary_key': null,
                    'filter_values': [],
                    'include_all': true,
                    'is_list': false
                },
                'lab_responsible': {
                    'title': 'Lab Responsible',
                    'key': 'lab_responsible',
                    'secondary_key': null,
                    'filter_values': [],
                    'include_all': true,
                    'is_list': false
                },
                'library_construction_method': {
                    'title': 'Library Construction Method',
                    'key': 'library_construction_method',
                    'secondary_key': null,
                    'filter_values': [],
                    'include_all': true,
                    'is_list': false
                },
                'status': {
                    'title': 'Status',
                    'key': 'status',
                    'secondary_key': 'status_fields',
                    'filter_values': [],
                    'include_all': true,
                    'is_list': false
                },
                'type': {
                    'title': 'Type',
                    'key': 'type',
                    'secondary_key': null,
                    'filter_values': [],
                    'include_all': true,
                    'is_list': false
                },
                'people_assigned': {
                    'title': 'People Assigned',
                    'key': 'people_assigned',
                    'secondary_key': null,
                    'filter_values': [],
                    'include_all': true,
                    'is_list': true
                },
                'project_coordinator': {
                    'title': 'Project Coordinator',
                    'key': 'project_coordinator',
                    'secondary_key': null,
                    'filter_values': [],
                    'include_all': true,
                    'is_list': false
                },
                'sequencing_platform': {
                    'title': 'Sequencing Platform',
                    'key': 'sequencing_platform',
                    'secondary_key': null,
                    'filter_values': [],
                    'include_all': true,
                    'is_list': false
                }
            }
        }
    },
    mounted() {
        // Fetch once for all child components
        this.fetchAllUsers();
        this.fetchCurrentUser();
    },
    computed: {
        /* Only used on project cards page */
        visibleProjects() {
            /* Filters and sorts the projects.
               Searching is applied here as well. */
            if (Object.keys(this.project_details).length == 0) {
                // No need to filter if there are no projects
                return this.project_details
            }

            let tempProjects = Object.entries(this.project_details)

            // Filter on all filters
            for (let filter in this.all_filters) {
                let filter_values = this.all_filters[filter]['filter_values']
                let include_all = this.all_filters[filter]['include_all']
                let is_list = this.all_filters[filter]['is_list']

                if (include_all == false) {
                    tempProjects = tempProjects.filter(([project_id, project]) => {
                        let key = this.all_filters[filter]['key']
                        let secondary_key = this.all_filters[filter]['secondary_key']
                        let project_value = null

                        // Allowing nested keys up to a depth of 2
                        if (secondary_key == null) {
                            project_value = project[key]
                        } else {
                            project_value = project[secondary_key][key]
                        }

                        // Special case for undefined
                        if (filter_values.includes('undefined')) {
                            if (project_value == undefined) {
                                return true
                            }
                        }
                        // Special case for lists, e.g. people_assigned
                        if (is_list) {
                            if (project_value == undefined) {
                                return filter_values.includes('undefined')
                            }
                            for (let value of project_value) {
                                if (filter_values.includes(value)) {
                                    return true
                                }
                            }
                            return false
                        } else {
                            return filter_values.includes(project_value)
                        }
                    })
                }
            }

            // Search filter
            if (this.search_value != '' && this.search_value) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return JSON.stringify(project)
                    .toUpperCase()
                    .includes(this.search_value.toUpperCase())
                })
            }

            if (this.sortBy == 'most_recent_date') {
                tempProjects = this.sortOnMostRecentDate(tempProjects)
            } else if (this.sortBy == 'project_id') {
                // Sort on project_id
                tempProjects = tempProjects.sort((a, b) => {
                    if (a[0] > b[0]) {
                        return 1
                    } else if (a[0] < b[0]) {
                        return -1
                    }
                    return 0
                })
            } else if (this.sortBy == 'status') {
                // Sort on status according to statuses_ordered
                tempProjects = tempProjects.sort((a, b) => {
                    let proj_a = this.project_details[a[0]];
                    let proj_b = this.project_details[b[0]];
                    let status_a = proj_a['status_fields']['status'];
                    let status_b = proj_b['status_fields']['status'];
                    let index_a = this.statuses_ordered.indexOf(status_a);
                    let index_b = this.statuses_ordered.indexOf(status_b);

                    if (index_a === -1) index_a = this.statuses_ordered.length; // If status is not found, place it at the end
                    if (index_b === -1) index_b = this.statuses_ordered.length;

                    if (index_a > index_b) {
                        return 1
                    } else if (index_a < index_b) {
                        return -1
                    }
                    return 0
                })
            }

            if (this.descending == true) {
                tempProjects = tempProjects.reverse()
            }

            return Object.fromEntries(tempProjects)
        },
        allColumnValues() {
            /* Returns a dictionary with card column as key and the project_ids as values */
            let columnValues = {}
            for (let project_id in this.visibleProjects) {
                let project = this.visibleProjects[project_id]
                let columnValue;
                if (this.card_columns.length == 2) {
                    columnValue = project[this.card_columns[0]][this.card_columns[1]]
                } else {
                    columnValue = project[this.card_columns[0]]
                }
                if (columnValue in columnValues) {
                    columnValues[columnValue].push(project_id)
                } else {
                    columnValues[columnValue] = [project_id]
                }
            }
            let sortedKeys = [];
            if (Object.values(this.card_columns)[0] == 'status_fields') {
                sortedKeys = ['Pending', 'Reception Control', 'Ongoing'];

                // Add any additional status fields (shouldn't be any)
                for (let key of Object.keys(columnValues)) {
                    if (!(key in sortedKeys)) {
                        sortedKeys.push(key)
                    }
                }
            } else {
                sortedKeys = Object.keys(columnValues).sort((a, b) => {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
            }

            let sorted_columnValues = {};
            sortedKeys.forEach(key => {
                sorted_columnValues[key] = columnValues[key] || [];
            });
            return sorted_columnValues
        },
        currentActiveFilters() {
            // List the currently active filters for display purposes
            let activeFilters = {}
            for (let filter_key in this.all_filters) {
                let filter_values = this.all_filters[filter_key]['filter_values']
                let include_all = this.all_filters[filter_key]['include_all']
                // We might need to handle an edge case where the filter_values are empty
                if (include_all == false) {
                    for (let value of filter_values) {
                        // Check if filter is added to the activeFilters
                        if (activeFilters[filter_key] == undefined) {
                            activeFilters[filter_key] = [value]
                        } else {
                            activeFilters[filter_key].push([value])
                        }
                    }
                }
            }
            return activeFilters
        },
        sorting_icon() {
            if (this.descending) {
                return 'fa-arrow-down-wide-short'
            } else {
                return 'fa-arrow-up-wide-short '
            }
        }
    },
    methods: {
        fetchProjectDetails(project_id) {
            axios
                .get(`/api/v1/project_summary/${project_id}?view_with_sources=True`)
                .then(response => {
                    if (response.data !== null) {
                        if (this.project_details[project_id] == undefined) {
                            this.project_details[project_id] = response.data;
                        } else {
                            Object.assign(this.project_details[project_id], response.data);
                        }
                        //Fetch link only if this.project_details[project_id] has a value
                        this.fetchProjectLinks(project_id);
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching project details for project ' + project_id + '. Please try again or contact a system administrator.');
                    console.log(error);
                });
            axios
                .get(`/api/v1/project/${project_id}`)
                .then(response => {
                    if (response.data !== null) {
                        this.project_samples[project_id] = response.data;
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching sample details for project ' + project_id + '. Please try again or contact a system administrator.');
                    console.log(error);
                });
            this.fetchStickyRunningNotes(project_id);
        },
        async fetchProjectLinks(project_id) {
            axios
            .get(`/api/v1/links/${project_id}`)
            .then(response => {
                if (response.data !== null) {
                    this.project_details[project_id]['links'] = response.data;
                }
            })
            .catch(error => {
                this.error_messages.push('Error fetching links for project ' + project_id + '. Please try again or contact a system administrator.');
                console.log(error);
            });
        },
        async fetchStickyRunningNotes(project_id) {
            let post_body;
            if (project_id !== undefined) {
                post_body = {project_ids: [project_id]};
            } else {
                post_body = {project_ids: Object.keys(this.project_details)};
            }
            const sleep = (delay) => new Promise((resolve) => setTimeout(resolve,delay))

            if (Object.keys(this.project_details).length === 0){
                // Wait for projects to be fetched even though the request should already have returned
                await sleep(1000);
            }
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
        },
        async addPersonToProject(project_id, person_id) {
            axios
                .put(`/api/v1/project/${project_id}/people/${person_id}`)
                .then(response => {
                    let data = response.data
                    if ((data !== null) && (data[project_id] !== null)) {
                        this.project_details[project_id]['people_assigned'] = data[project_id];
                    }
                })
                .catch(error => {
                    console.log(error)
                    this.error_messages.push('Unable to assign person to project, please try again or contact a system administrator.')
                }
            )
        },
        async removePersonFromProject(project_id, person_id) {
            axios
                .delete(`/api/v1/project/${project_id}/people/${person_id}`)
                .then(response => {
                    let data = response.data
                    if ((data !== null) && (data[project_id] !== null)) {
                        this.project_details[project_id]['people_assigned'] = data[project_id];
                    }
                })
                .catch(error => {
                    console.log(error)
                    this.error_messages.push('Unable to remove person from project, please try again or contact a system administrator.')
                }
            )
        },
        setupWebsocket() {
            /* This is still a proof of concept */
            // Taken from https://stackoverflow.com/a/10418013
            let loc = window.location, new_uri;
            if (loc.protocol === "https:") {
                new_uri = "wss:";
            } else {
                new_uri = "ws:";
            }
            new_uri += "//" + loc.host;
            new_uri += "/api/v1/project_websocket";
            this.websocket = new WebSocket(new_uri);

            this.websocket.onmessage = (event) => {
                console.log(event.data);
                this.websocket_message = event.data;
            };
        },
        /* Only used on project cards page */
        fetchProjects() {
            axios
                .get('/api/v1/projects?list=pending,open&type=All')
                .then(response => {
                    let data = response.data
                    if (data !== null) {
                        this.project_details = data
                    }
                    // These are dependent on the projects being fetched
                    this.fetchStickyRunningNotes()
                })
                .catch(error => {
                    console.log(error)
                    this.error_messages.push('Unable to fetch projects, please try again or contact a system administrator.')
                })
        },
        fetchAllUsers() {
            axios
                .get('/api/v1/user_management/users')
                .then(response => {
                    let data = response.data
                    if (data !== null) {
                        this.all_users = data
                    }
                })
                .catch(error => {
                    console.log(error)
                    this.error_messages.push('Unable to fetch users, please try again or contact a system administrator.')
                })
        },
        fetchCurrentUser() {
            axios
                .get('/api/v1/current_user')
                .then(response => {
                    let data = response.data
                    if (data !== null) {
                        this.current_user = data
                    }
                })
                .catch(error => {
                    console.log(error)
                    this.$root.error_messages.push('Unable to fetch current user, please try again or contact a system administrator.')
                })
        },
        // Helper methods
        allValues(filter_name){
            return this.itemCounts(this.project_details, filter_name)
        },
        allVisibleValues(filter_name){
            return this.itemCounts(this.visibleProjects, filter_name)
        },
        getDropdownPositionHelper(input, dropdownHeight) {
            return getDropdownPosition(input, dropdownHeight)
        },
        itemCounts(list, filter_name) {
            /* 
                Returns a dictionary with the counts of each unique item in the list 
                key is either a string with a key or an array with two keys
            */
            let items = []
            let filter_key = this.all_filters[filter_name]['key']
            let secondary_key = this.all_filters[filter_name]['secondary_key']

            if (Object.keys(list).length == 0) {
                return {}
            }

            for (let item in list) {
                let value = null
                if (secondary_key != null) {
                    value = list[item][secondary_key][filter_key]
                } else {
                    value = list[item][filter_key]
                }

                // Check if value is a list
                if (Array.isArray(value)) {
                    for (let sub_value of value) {
                        items.push(sub_value)
                    }
                } else {
                    items.push(value)
                }
            }

            let counts = {}
            for (let item of items) {
                if (item in counts) {
                    counts[item] += 1
                } else {
                    counts[item] = 1
                }
            }
            // Convert the itemCounts object to an array of [key, value] pairs
            let sortedCounts = Object.entries(counts);

            // Sort the array by the keys (i.e., the first element of each pair)
            sortedCounts.sort((a, b) => a[0].localeCompare(b[0]));

            // Convert the array back to an object
            counts = Object.fromEntries(sortedCounts);
            return counts
        },
        mostRecentDate(project) {
            let mostRecentKeyArray = this.mostRecentDateArray(project)
            return mostRecentKeyArray[1]
        },
        mostRecentDateArray(project) {
            if ('summary_dates' in project == false) {
                return []
            };
            let summaryDates = project['summary_dates'];
            if (Object.keys(summaryDates).length == 0) {
                return []
            };

            let mostRecentKey = Object.keys(summaryDates).reduce((a, b) => summaryDates[a] > summaryDates[b] ? a : b);
            return [mostRecentKey, summaryDates[mostRecentKey]]
        },
        nrVisibleWith(filter_name, filter_value){
            if (filter_value in this.allVisibleValues(filter_name)) {
                return this.allVisibleValues(filter_name)[filter_value]
            } else {
                return 0
            }
        },
        projectTypeColor(project) {
            let type = project['type']
            if (type == 'Application') {
                return 'success'
            } else if (type == 'Production') {
                return 'primary'
            } else if (type == 'Facility') {
                return 'info'
            } else if (type == 'Single-Cell') {
                return 'warning'
            } else {
                return 'secondary'
            }
        },
        projectStatusColor(project) {
            let status = project['status_fields']['status']
            if (status == 'Pending') {
                return 'secondary'
            } else if (status == 'Reception Control') {
                return 'info'
            } else if (status == 'Ongoing') {
                return 'primary'
            }
            return 'warning'
        },
        sortOnMostRecentDate(projects_to_be_sorted) {
            // Sort by most recent date            
            projects_to_be_sorted = projects_to_be_sorted.sort((a, b) => {
                let proj_a = this.project_details[a[0]]
                let proj_b = this.project_details[b[0]]

                if (this.sortBy == 'most_recent_date') {
                    /* First deal with missing dates */
                    if ((this.mostRecentDate(proj_a) == undefined) && (this.mostRecentDate(proj_b) == undefined)) {
                        return 0
                    }
                    if (this.mostRecentDate(proj_a) == undefined) {
                        // Missing dates will be the most recent
                        return 1
                    } else if (this.mostRecentDate(proj_b) == undefined){
                        return -1
                    }
                    /* Then deal with actual dates */
                    if (this.mostRecentDate(proj_a) > this.mostRecentDate(proj_b)) {
                        return 1
                    } else if (this.mostRecentDate(proj_a) < this.mostRecentDate(proj_b)) {
                        return -1
                    }
                    return 0
                };
            })
            return projects_to_be_sorted
        },
        toggleSorting() {
            this.descending = !this.descending
        }
    }
}

const app = Vue.createApp(vProjectsStatus)
app.component('v-project-data-field-tooltip', vProjectDataField)
app.component('v-projects-cards', vProjectCards)
app.component('v-project-details', vProjectDetails)
app.component('v-running-note-single', vRunningNoteSingle)
app.component('v-running-notes-tab', vRunningNotesTab)
app.component('v-project-people-assignments', vProjectPeopleAssignments)
app.mount('#v_projects_main')