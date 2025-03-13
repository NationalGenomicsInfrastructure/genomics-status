const vHashtagCSV = {
    data() {
        return {
            antibody_columns: [
                'Antibody 1',
                'Antibody 2',
                'Antibody 3'
            ],
            chosen_project: null,
            assignments: {},
            possible_antibodies: {
                "None": {
                    "Name": "None",
                    "Product nr": "None",
                    "Species": "None",
                    "For 10X method": "None",
                    "Total-Seq version": "None",
                    "URL": "None"
                },
                "155801": {
                    "Name": "TotalSeq™-A0301 anti-mouse Hashtag 1 Antibody",
                    "Product nr": "155801",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0301-anti-mouse-hashtag-1-antibody-16103"
                },
                "155803": {
                    "Name": "TotalSeq™-A0302 anti-mouse Hashtag 2 Antibody",
                    "Product nr": "155803",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0302-anti-mouse-hashtag-2-antibody-16104"
                },
                "155805": {
                    "Name": "TotalSeq™-A0303 anti-mouse Hashtag 3 Antibody",
                    "Product nr": "155805",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0303-anti-mouse-hashtag-3-antibody-16105"
                },
                "155807": {
                    "Name": "TotalSeq™-A0304 anti-mouse Hashtag 4 Antibody",
                    "Product nr": "155807",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0304-anti-mouse-hashtag-4-antibody-16106"
                },
                "155809": {
                    "Name": "TotalSeq™-A0305 anti-mouse Hashtag 5 Antibody",
                    "Product nr": "155809",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0305-anti-mouse-hashtag-5-antibody-16107"
                },
                "155811": {
                    "Name": "TotalSeq™-A0306 anti-mouse Hashtag 6 Antibody",
                    "Product nr": "155811",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0306-anti-mouse-hashtag-6-antibody-16108"
                },
                "682205": {
                    "Name": "TotalSeq™-A0451 anti-Nuclear Pore Complex Proteins Hashtag 1 Antibody",
                    "Product nr": "682205",
                    "Species": "All",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0451-anti-nuclear-pore-complex-proteins-hashtag-1-antibody-19321"
                },
                "682207": {
                    "Name": "TotalSeq™-A0452 anti-Nuclear Pore Complex Proteins Hashtag 2 Antibody",
                    "Product nr": "682207",
                    "Species": "All",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0452-anti-nuclear-pore-complex-proteins-hashtag-2-antibody-19322"
                },
                "682209": {
                    "Name": "TotalSeq™-A0453 anti-Nuclear Pore Complex Proteins Hashtag 3 Antibody",
                    "Product nr": "682209",
                    "Species": "All",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0453-anti-nuclear-pore-complex-proteins-hashtag-3-antibody-19323"
                },
                "682211": {
                    "Name": "TotalSeq™-A0454 anti-Nuclear Pore Complex Proteins Hashtag 4 Antibody",
                    "Product nr": "682211",
                    "Species": "All",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0454-anti-nuclear-pore-complex-proteins-hashtag-4-antibody-19324"
                },
                "682213": {
                    "Name": "TotalSeq™-A0455 anti-Nuclear Pore Complex Proteins Hashtag 5 Antibody",
                    "Product nr": "682213",
                    "Species": "All",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0455-anti-nuclear-pore-complex-proteins-hashtag-5-antibody-19359"
                },
                "682215": {
                    "Name": "TotalSeq™-A0456 anti-Nuclear Pore Complex Proteins Hashtag 6 Antibody",
                    "Product nr": "682215",
                    "Species": "All",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "A",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-a0456-anti-nuclear-pore-complex-proteins-hashtag-6-antibody-19325"
                },
                "394631": {
                    "Name": "TotalSeq™-B0251 anti-human Hashtag 1 Antibody",
                    "Product nr": "394631",
                    "Species": "Human",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0251-anti-human-hashtag-1-antibody-17931"
                },
                "394633": {
                    "Name": "TotalSeq™-B0252 anti-human Hashtag 2 Antibody",
                    "Product nr": "394633",
                    "Species": "Human",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0252-anti-human-hashtag-2-antibody-17932"
                },
                "394635": {
                    "Name": "TotalSeq™-B0253 anti-human Hashtag 3 Antibody",
                    "Product nr": "394635",
                    "Species": "Human",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0253-anti-human-hashtag-3-antibody-17933"
                },
                "394637": {
                    "Name": "TotalSeq™-B0254 anti-human Hashtag 4 Antibody",
                    "Product nr": "394637",
                    "Species": "Human",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0254-anti-human-hashtag-4-antibody-17934"
                },
                "394639": {
                    "Name": "TotalSeq™-B0255 anti-human Hashtag 5 Antibody",
                    "Product nr": "394639",
                    "Species": "Human",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0255-anti-human-hashtag-5-antibody-17935"
                },
                "155831": {
                    "Name": "TotalSeq™-B0301 anti-mouse Hashtag 1 Antibody",
                    "Product nr": "155831",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0301-anti-mouse-hashtag-1-antibody-17771"
                },
                "155833": {
                    "Name": "TotalSeq™-B0302 anti-mouse Hashtag 2 Antibody",
                    "Product nr": "155833",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0302-anti-mouse-hashtag-2-antibody-17772"
                },
                "155835": {
                    "Name": "TotalSeq™-B0303 anti-mouse Hashtag 3 Antibody",
                    "Product nr": "155835",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0303-anti-mouse-hashtag-3-antibody-17773"
                },
                "155837": {
                    "Name": "TotalSeq™-B0304 anti-mouse Hashtag 4 Antibody",
                    "Product nr": "155837",
                    "Species": "Mouse",
                    "For 10X method": "3'GE",
                    "Total-Seq version": "B",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-b0304-anti-mouse-hashtag-4-antibody-17774"
                },
                "394661": {
                    "Name": "TotalSeq™-C0251 anti-human Hashtag 1 Antibody",
                    "Product nr": "394661",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0251-anti-human-hashtag-1-antibody-17162"
                },
                "394663": {
                    "Name": "TotalSeq™-C0252 anti-human Hashtag 2 Antibody",
                    "Product nr": "394663",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0252-anti-human-hashtag-2-antibody-17163"
                },
                "394665": {
                    "Name": "TotalSeq™-C0253 anti-human Hashtag 3 Antibody",
                    "Product nr": "394665",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0253-anti-human-hashtag-3-antibody-17164"
                },
                "394667": {
                    "Name": "TotalSeq™-C0254 anti-human Hashtag 4 Antibody",
                    "Product nr": "394667",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0254-anti-human-hashtag-4-antibody-17165"
                },
                "394669": {
                    "Name": "TotalSeq™-C0255 anti-human Hashtag 5 Antibody",
                    "Product nr": "394669",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0255-anti-human-hashtag-5-antibody-17166"
                },
                "394671": {
                    "Name": "TotalSeq™-C0256 anti-human Hashtag 6 Antibody",
                    "Product nr": "394671",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0256-anti-human-hashtag-6-antibody-18373"
                },
                "394673": {
                    "Name": "TotalSeq™-C0257 anti-human Hashtag 7 Antibody",
                    "Product nr": "394673",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0257-anti-human-hashtag-7-antibody-18374"
                },
                "394675": {
                    "Name": "TotalSeq™-C0258 anti-human Hashtag 8 Antibody",
                    "Product nr": "394675",
                    "Species": "Human",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0258-anti-human-hashtag-8-antibody-18375"
                },
                "155861": {
                    "Name": "TotalSeq™-C0301 anti-mouse Hashtag 1 Antibody",
                    "Product nr": "155861",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0301-anti-mouse-hashtag-1-antibody-17157"
                },
                "155863": {
                    "Name": "TotalSeq™-C0302 anti-mouse Hashtag 2 Antibody",
                    "Product nr": "155863",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0302-anti-mouse-hashtag-2-antibody-17158"
                },
                "155865": {
                    "Name": "TotalSeq™-C0303 anti-mouse Hashtag 3 Antibody",
                    "Product nr": "155865",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0303-anti-mouse-hashtag-3-antibody-17159"
                },
                "155867": {
                    "Name": "TotalSeq™-C0304 anti-mouse Hashtag 4 Antibody",
                    "Product nr": "155867",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0304-anti-mouse-hashtag-4-antibody-17160"
                },
                "155869": {
                    "Name": "TotalSeq™-C0305 anti-mouse Hashtag 5 Antibody",
                    "Product nr": "155869",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0305-anti-mouse-hashtag-5-antibody-17161"
                },
                "155871": {
                    "Name": "TotalSeq™-C0306 anti-mouse Hashtag 6 Antibody",
                    "Product nr": "155871",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0306-anti-mouse-hashtag-6-antibody-18443"
                },
                "155873": {
                    "Name": "TotalSeq™-C0307 anti-mouse Hashtag 7 Antibody",
                    "Product nr": "155873",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0307-anti-mouse-hashtag-7-antibody-18444"
                },
                "155875": {
                    "Name": "TotalSeq™-C0308 anti-mouse Hashtag 8 Antibody",
                    "Product nr": "155875",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0308-anti-mouse-hashtag-8-antibody-18445"
                },
                "155877": {
                    "Name": "TotalSeq™-C0309 anti-mouse Hashtag 9 Antibody",
                    "Product nr": "155877",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0309-anti-mouse-hashtag-9-antibody-18446"
                },
                "155879": {
                    "Name": "TotalSeq™-C0310 anti-mouse Hashtag 10 Antibody",
                    "Product nr": "155879",
                    "Species": "Mouse",
                    "For 10X method": "V(D)J",
                    "Total-Seq version": "C",
                    "URL": "https://www.biolegend.com/en-us/products/totalseq-c0310-anti-mouse-hashtag-10-antibody-18447"
                }
            },            
            project_suggestions: [],
            project_details: {},
            project_samples: {},
            search_term: '',
            error_messages: []
        }
    },
    computed: {
        order_title() {
            if ('order_details' in this.project_details) {
                return this.project_details['order_details']['title'];
            }
            return '';
        },
        possible_antibodies_assigned_first() {
            // Return the possible antibodies with the ones that are already assigned first
            let possible_antibodies = Object.values(this.possible_antibodies);
            let assigned_antibodies_first = [];
            let assigned_antibodies_last = [];
            possible_antibodies.forEach(antibody => {
                if (this.unique_assigned_antibodies.includes(antibody['Product nr'])) {
                    assigned_antibodies_first.push(antibody);
                } else {
                    assigned_antibodies_last.push(antibody);
                }
            });
            return assigned_antibodies_first.concat(assigned_antibodies_last);
        },
        unique_assigned_antibodies() {
            let all_assigned_antibodies = [];
            Object.keys(this.assignments).forEach(sample_id => {
                let sample_assigned_antibodies = Object.values(this.assignments[sample_id]);
                all_assigned_antibodies = all_assigned_antibodies.concat(sample_assigned_antibodies);
            });
            return [...new Set(all_assigned_antibodies)];
        }
    },
    methods: {
        addAntibodyColumn() {
            let column_to_be_added = 'Antibody ' + (this.antibody_columns.length + 1)
            this.antibody_columns.push(column_to_be_added);
            // Add the column to all sample assignments
            Object.keys(this.assignments).forEach(sample_id => {
                this.assignments[sample_id][column_to_be_added] = 'None';
            });
        },
        fetchProjectDetails(project_id) {
            axios
                .get(`/api/v1/project_summary/${project_id}`)
                .then(response => {
                    if (response.data !== null) {
                        this.project_details = response.data;
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
                        this.project_samples = response.data;
                        Object.keys(this.project_samples).forEach(sample_id => {
                            this.assignments[sample_id] = {};

                            this.antibody_columns.forEach(column => {
                                this.assignments[sample_id][column] = 'None';
                            });
                        });
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching sample details for project ' + project_id + '. Please try again or contact a system administrator.');
                    console.log(error);
                });
        },
        removeAntibodyColumn() {
            let column_to_be_removed = this.antibody_columns.pop();
            // Remove the column from all sample assignments
            Object.keys(this.assignments).forEach(sample_id => {
                delete this.assignments[sample_id][column_to_be_removed];
            });
        },
        replicateFirstValue() {
            // Copy the first row of the table to all other rows
            let first_sample = Object.keys(this.project_samples)[0];
            let first_sample_values = this.assignments[first_sample];
            Object.keys(this.assignments).forEach(sample_id => {
                Object.keys(first_sample_values).forEach(antibody_column => {
                    this.assignments[sample_id][antibody_column] = first_sample_values[antibody_column];
                });
            });
        },
        searchProject(search_term) {
            axios
                .get(`/api/v1/project_search/${search_term}`)
                .then(response => {
                    if (response.data !== null) {
                        this.project_suggestions = response.data;
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching project suggestions for search term ' + search_term + '. Please try again or contact a system administrator.');
                    console.log(error);
                });
        },
        selectProject(project_name_string) {
            let project_id = project_name_string.split(', ')[0];
            this.chosen_project = project_id;
            this.search_term = '';
            this.project_suggestions = [];
            this.fetchProjectDetails(project_id);
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Hashtag CSV</h1>
                    <p>
                        This page enables the creation and download of a CSV file with all the hashtag information for a chosen project. 
                        The created csv file can then be parsed by LIMS to assign sample level UDFs with corresponding antibody IDs
                    </p>
                    <div class="card p-3">
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group mb-3">
                                    <label class="form-label" for="project">Choose project</label>
                                    <input type="text" class="form-control" id="project" v-model="search_term" @keyup="searchProject(search_term)" placeholder="Search for project">
                                </div>
                                <div v-for="project in project_suggestions.slice(0, 25)" :key="project.id" class="mb-2 col-5">
                                    <button class="btn btn-primary w-100" @click="selectProject(project.name)">
                                        {{ project.name }}
                                    </button>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="pl-3 py-3">
                                    <template v-if="chosen_project">
                                        <h1 class="mb-3">{{chosen_project}} <small>- <a class="text-decoration-none" :href="'/project/' + chosen_project">project page <i class="fa-solid fa-arrow-up-right-from-square"></i></a></small></h1>
                                        <ul>
                                            <li>{{project_details['project_name']}}</li>
                                            <li>{{project_details['application']}}</li>
                                            <li>{{project_details['library_construction_method']}}</li>
                                            <li>{{project_details['reference_genome']}}</li>
                                            <li>{{order_title}}</li>
                                        </ul>
                                    </template>
                                    <template v-else>
                                        <h1>No project selected</h1>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <template v-if="chosen_project">
                            <div class="my-4">
                                <h1>Create CSV</h1>
                                <div class="mb-3">
                                <button class="btn btn-primary mr-2" @click="this.addAntibodyColumn"><i class="fa-solid fa-plus mr-2"></i>Add Antibydoy Column</button>
                                <button class="btn btn-primary mr-2" @click="this.removeAntibodyColumn"><i class="fa-solid fa-minus mr-2"></i>Remove Antibody Column</button>
                                <button class="btn btn-primary" @click="this.replicateFirstValue"><i class="fa-solid fa-copy mr-2"></i>Replicate first values of first row</button>
                                </div>
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Sample</th>
                                            <th scope="col">User submitted name</th>
                                            <th scope="col" v-for="antibody_column in antibody_columns">
                                                {{antibody_column}}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="sample in project_samples">
                                            <th scope="row">{{sample['scilife_name']}}</th>
                                            <th scope="row">{{sample['customer_name']}}</th>
                                            <td v-for="antibody_column in antibody_columns" :key="antibody_column">
                                                <select class="form-select" aria-label="Default select example" v-model="assignments[sample['scilife_name']][antibody_column]">
                                                    <template v-for="(antibody, key) in possible_antibodies" :key="key">
                                                        <option :value="key">{{ antibody['Name'] }}</option>
                                                    </template>
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button class="btn btn-lg btn-primary float-right mt-4">Download CSV</button>
                            </div>
                        </template>
                        <template v-else>
                            <h1 class="my-4">No project selected</h2>
                        </template>
                    </div>
                    <div class="row mt-5">
                        <h1>Antibodies</h1>
                        <p>Items added to any sample is highlighted in green</p>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Product nr</th>
                                    <th scope="col">Species</th>
                                    <th scope="col">For 10X method</th>
                                    <th scope="col">Total-Seq version</th>
                                    <th scope="col">Amount in stock</th>
                                    <th scope="col">URL</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="antibody in possible_antibodies_assigned_first" :class="{'table-success': unique_assigned_antibodies.includes(antibody['Product nr'])}">
                                    <td>{{ antibody['Name'] }}</td>
                                    <td>{{ antibody['Product nr'] }}</td>
                                    <td>{{ antibody['Species'] }}</td>
                                    <td>{{ antibody['For 10X method'] }}</td>
                                    <td>{{ antibody['Total-Seq version'] }}</td>
                                    <td>{{ antibody['Amount in stock'] }}</td>
                                    <td><a :href="antibody['URL']">{{ antibody['URL'] }}</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`
}


const app = Vue.createApp(vHashtagCSV)
app.mount('#v_hashtag_csv')