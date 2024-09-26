
const vElementApp = {
    data() {
        return {
            ngi_run_id: "some_id",
            flowcell: {},
            flowcell_fetched: false,
        }
    },
    computed: {
        instrument_generated_files() {
            return this.getValue(this.flowcell, "instrument_generated_files", {});
        },
        aviti_run_stats() {
            return this.getValue(this.instrument_generated_files, "AvitiRunStats.json", {});
        },
        run_stats() {
            return this.getValue(this.aviti_run_stats, "RunStats", {});
        },
    },
    methods: {
        getValue(obj, key, defaultValue = "N/A") {
            if (obj === null || obj == undefined || obj === "N/A") {
                return defaultValue;
            }
            return obj.hasOwnProperty(key) ? obj[key] : defaultValue;
        },
        formatNumberBases(number) {
            if (number === "N/A") {
                return "N/A";
            } else if (number < 1000000) {
                return number + " bp";
            } else if (number < 1000000000) {
                return (number / 1000000).toFixed(2) + " Mbp";
            } else {
                return (number / 1000000000).toFixed(2) + " Gbp";
            }
        }
    }
}

const app = Vue.createApp(vElementApp);


app.component('v-element-flowcell', {
    props: ['ngi_run_id'],
    computed: {
        flowcell() {
            return this.$root.flowcell;
        },
        instrument_generated_files() {
            return this.$root.instrument_generated_files;
        },
        aviti_run_stats() {
            return this.$root.aviti_run_stats;
        },
        run_parameters() {
            return this.$root.getValue(this.instrument_generated_files, "RunParameters.json", {});
        },
        start_time() {
            const dateStr = this.$root.getValue(this.run_parameters, "Date", null);
            if (dateStr) {
                const date = new Date(dateStr);
                const date_string = date.toLocaleDateString();
                const [day, month, year] = date_string.split("/");
                const date_formatted = `${year}-${month}-${day}`;
                return `${date_formatted} ${date.toLocaleTimeString()}`;
            } else {
                return "N/A";
            }
        },
        flowcell_id() {
            return this.$root.getValue(this.run_parameters, "FlowcellID");
        },
        side() {
            return this.$root.getValue(this.run_parameters, "Side");
        },
        instrument_name() {
            return this.$root.getValue(this.run_parameters, "InstrumentName");
        },
        run_setup() {
            return `${this.chemistry_version} ${this.kit_configuration} (${this.cycles}); ${this.throughput_selection}`;
        },
        cycles() {
            const cycles = this.$root.getValue(this.run_parameters, "Cycles", {});
            if (cycles === "N/A") {
                return "N/A";
            }
            let return_str = "";
            if (cycles.hasOwnProperty("R1")) {
                return_str += "R1: " + cycles["R1"];
            }
            if (cycles.hasOwnProperty("R2")) {
                return_str += ", R2: " + cycles["R2"];
            }
            if (cycles.hasOwnProperty("I1")) {
                return_str += ", I1: " + cycles["I1"];
            }
            if (cycles.hasOwnProperty("I2")) {
                return_str += ", I2: " + cycles["I2"];
            }
            return return_str;
        },
        throughput_selection() {
            return this.$root.getValue(this.run_parameters, "ThroughputSelection", "N/A") + " Throughput";
        },
        kit_configuration() {
            return this.$root.getValue(this.run_parameters, "KitConfiguration");
        },
        preparation_workflow() {
            return this.$root.getValue(this.run_parameters, "PreparationWorkflow");
        },
        chemistry_version() {
            return this.$root.getValue(this.run_parameters, "ChemistryVersion");
        }
    },
    mounted() {
        this.getFlowcell();
    },
    methods: {
        getFlowcell() {
            axios.get("/api/v1/element_flowcell/" + this.ngi_run_id)
                .then(response => {
                    this.$root.flowcell = response.data;
                    this.$root.flowcell_fetched = true;
                })
                .catch(error => {
                    console.log(error);
                });
        },

    },
    template: /*html*/`
    <div v-if="!this.$root.flowcell_fetched">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ml-2">Loading...</span>
    </div>
    <div v-else>
        <div class="row">
            <h1>Element BioSciences (AVITI) run <span id="page_title">{{ flowcell["NGI_run_id"]}}</span></h1>
            <div class="col-3">
                <table class="table table-bordered narrow-headers" id="element_fc_info">
                    <tr class="darkth">
                        <th>NGI Run ID</th>
                        <td>{{ flowcell["NGI_run_id"] }}</td>
                    </tr>
                    <tr class="darkth">
                        <th>Start time</th>
                        <td>{{ this.start_time }}</td>
                    </tr>
                    <tr class="darkth">
                        <th>Flowcell ID</th>
                        <td>{{ flowcell_id }}</td>
                    </tr>
                    <tr class="darkth">
                        <th>Side</th>
                        <td>{{ side }}</td>
                    </tr>
                    <tr class="darkth">
                        <th>Instrument</th>
                        <td>{{ instrument_name }}</td>
                    </tr>
                    <tr class="darkth">
                        <th>Run setup</th>
                        <td>{{ run_setup }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <h2>Summary Run Stats</h2>
        <v-element-run-stats></v-element-run-stats>

        <div class="tabbable mb-3">
        <ul class="nav nav-tabs">
            <li class="nav-item">
            <!--href="tab_details_content"-->
            <a class="nav-link active" href="#tab_flowcell_information" role="tab" data-toggle="tab">Flowcell Information</a>
            </li>
            <li class="nav-item">
            <a class="nav-link" href="#tab_fc_project_yields_content" role="tab" data-toggle="tab">Project Yields</a>
            </li>
        </ul>
        </div>

        <div class="tab-content">
        <div class="tab-pane fade show active" id="tab_flowcell_information">
            <h3>Lane Information</h3>
            <v-element-lane-stats></v-element-lane-stats>
        </div>
        <div class="tab-pane fade show" id="tab_fc_project_yields_content">
            <h3>Project Yields</h3>
            <p>To be implemented</p>
        </div>
        </div>
    </div>

    `
});

app.component('v-element-run-stats', {
    computed: {
        aviti_run_stats() {
            return this.$root.aviti_run_stats;
        },
        run_stats() {
            return this.$root.run_stats;
        },
        polony_count() {
            return this.$root.getValue(this.run_stats, "PolonyCount");
        },
        pf_count() {
            return this.$root.getValue(this.run_stats, "PFCount");
        },
        percent_pf() {
            return this.$root.getValue(this.run_stats, "PercentPF");
        },
        total_yield() {
            return this.$root.getValue(this.run_stats, "TotalYield");
        },
        total_yield_formatted() {
            return this.$root.formatNumberBases(this.$root.getValue(this.run_stats, "TotalYield"));
        },
        index_assignment() {
            return this.$root.getValue(this.run_stats, "IndexAssignment", {});
        },
        percent_assigned_reads() {
            return this.$root.getValue(this.index_assignment, "PercentAssignedReads");
        }
    },
    template: `
        <table class="table table-bordered narrow-headers no-margin right_align_headers">
            <tbody>
                <tr class="darkth">
                    <th>Total Yield</th>
                    <v-element-tooltip :title=total_yield>
                        <td>{{ total_yield_formatted }}</td>
                    </v-element-tooltip>
                    <th>Polony Count</th>
                    <td>{{ polony_count }}</td>
                    <th>PF Count</th>
                    <td>{{ pf_count }}</td>
                    <th>% PF</th>
                    <td>{{ percent_pf }}</td>
                    <th>% Assigned Reads</th>
                    <td>{{ percent_assigned_reads }}</td>
                </tr>
            </tbody>
        </table>
        
        <v-element-summary-graph></v-element-summary-graph>
        `
});

app.component('v-element-summary-graph', {
    data() {
        return {
            include_R1: true,
            include_R2: true,
            graph_warnings: [],
        }
    },
    computed: {
        flowcell() {
            return this.$root.flowcell;
        },
        reads() {
            return this.$root.getValue(this.$root.run_stats, "Reads", []);
        },
        R1_read_cycles() {
            let filtered_values = this.reads.filter(read => read['Read'] == 'R1')
            if (filtered_values.length === 0) {
                return [];
            }

            return this.$root.getValue(filtered_values[0], 'Cycles', [])
        },
        R2_read_cycles() {
            let filtered_values = this.reads.filter(read => read['Read'] == 'R2')
            if (filtered_values.length === 0) {
                return [];
            }

            return this.$root.getValue(filtered_values[0], 'Cycles', [])
        },
        categories() {
            // Check if R1 is in end_filter
            var categories_R1 = this.R1_read_cycles.map(cycle => `Cycle ${cycle.Cycle}`);

            var categories_R2 = this.R2_read_cycles.map(cycle => `Cycle ${cycle.Cycle}`);

            if (categories_R1.length !== categories_R2.length) {
                console.log("The lengths of categories_R1 and categories_R2 are different.");
                console.log("Length of categories_R1:", categories_R1.length);
                console.log("Length of categories_R2:", categories_R2.length);
            }
            var categories_differ = false;
            for (let i = 0; i < Math.max(categories_R1.length, categories_R2.length); i++) {
                if (categories_R1[i] !== categories_R2[i]) {
                    categories_differ = true;
                    console.log(`Difference found at index ${i}:`);
                    console.log(`categories_R1[${i}]:`, categories_R1[i]);
                    console.log(`categories_R2[${i}]:`, categories_R2[i]);
                }
            }

            if (categories_differ) {
                this.graph_warnings.push("Warning! R1 and R2 x-axis are note identical, using R1 axis");
            }

            return categories_R1;
        },
    },
    methods: {
        summary_graph() {
            console.log("Creating summary graph");
            if (this.categories.length === 0) {
                return;
            }

            let R1_percentQ30 = [];
            let R1_percentQ40 = [];
            let R1_averageQScore = [];
            let series = [];

            if (this.include_R1) {
                R1_percentQ30 = this.R1_read_cycles.map(cycle => cycle.PercentQ30);
                R1_percentQ40 = this.R1_read_cycles.map(cycle => cycle.PercentQ40);
                R1_averageQScore = this.R1_read_cycles.map(cycle => cycle.AverageQScore);

                series.push({
                    name: 'R1 Percent Q30',
                    data: R1_percentQ30
                })
                series.push(
                {
                    name: 'R1 Percent Q40',
                    data: R1_percentQ40
                })
                series.push(
                {
                    name: 'R1 Average Q Score',
                    data: R1_averageQScore
                })
            }

            let R2_percentQ30 = [];
            let R2_percentQ40 = [];
            let R2_averageQScore = [];

            if (this.include_R2) {
                R2_percentQ30 = this.R2_read_cycles.map(cycle => cycle.PercentQ30);
                R2_percentQ40 = this.R2_read_cycles.map(cycle => cycle.PercentQ40);
                R2_averageQScore = this.R2_read_cycles.map(cycle => cycle.AverageQScore);

                series.push( {
                        name: 'R2 Percent Q30',
                        data: R2_percentQ30
                    })
                series.push( {
                        name: 'R2 Percent Q40',
                        data: R2_percentQ40
                    })
                series.push( {
                        name: 'R2 Average Q Score',
                        data: R2_averageQScore
                    })
            }

            Highcharts.chart('SummaryPlot', {
                chart: {
                    type: 'line'
                },
                title: {
                    text: 'Summary Plot'
                },
                xAxis: {
                    categories: this.categories
                },
                yAxis: {
                    title: {
                        text: 'Values'
                    },
                    min: 0,
                },
                series: series
            });
        },
    },
    mounted() {
        this.$nextTick(function() {
            if (this.$root.flowcell_fetched) { 
                this.summary_graph();
            }
        });
    },
    template: /*html*/`
        <h3>Summary Plot</h3>
        <div v-if="graph_warnings.length > 0" class="alert alert-warning" role="alert">
            <ul>
                <li v-for="warning in graph_warnings">{{ warning }}</li>
            </ul>
        </div>
        <div id="SummaryPlot">
            <p>To be implemented</p>
        </div>`
});

app.component('v-element-lane-stats', {
    computed: {
        instrument_generated_files() {
            return this.$root.getValue(this.$root.flowcell, "instrument_generated_files", {});
        },
        aviti_run_stats() {
            return this.$root.getValue(this.instrument_generated_files, "AvitiRunStats.json", {});
        },
        lane_stats() {
            return this.$root.getValue(this.aviti_run_stats, "LaneStats", {});
        },
        lanes() {
            return this.$root.getValue(this.lane_stats, "Lanes", []);
        },
    },
    methods: {
        total_lane_yield(lane) {
            return this.$root.formatNumberBases(this.$root.getValue(lane, "TotalYield"));
        },
        total_lane_yield_formatted(lane) {
            return this.$root.formatNumberBases(this.$root.getValue(lane, "TotalYield"));
        },
        index_assignments(lane) {
            return this.$root.getValue(lane, "IndexAssignment", {});
        },
        percent_assigned_reads(lane) {
            return this.$root.getValue(this.index_assignments(lane), "PercentAssignedReads", {});
        },
        index_samples(lane) {
            return this.$root.getValue(this.index_assignments(lane), "IndexSamples", {});
        },
        unassigned_sequences(lane) {
            return this.$root.getValue(this.index_assignments(lane), "UnassignedSequences", {});
        }
    },
    template: /*html*/`
        <div v-for="lane in lane_stats" class="mb-3">
            <h2>Lane {{ lane["Lane"] }}</h2>
            <table class="table table-bordered narrow-headers no-margin right_align_headers">
                <tbody>
                    <tr class="darkth">
                        <th>Total Yield</th>
                        <v-element-tooltip :title=lane["TotalYield"]>
                        <td>
                            {{ total_lane_yield_formatted(lane) }}
                        </td>
                        </v-element-tooltip>
                        <th>Polony Count</th> <td>{{ lane["PolonyCount"] }}</td>
                        <th>PF Count</th> <td>{{ lane["PFCount"] }}</td>
                        <th>% PF</th> <td>{{ lane["PercentPF"] }}</td>
                        <th>% Assigned Reads</th> <td>{{ percent_assigned_reads(lane) }}</td>
                    </tr>
                </tbody>
            </table>

            <h3>Index Assignments</h3>
            <table class="table table-bordered narrow-headers no-margin right_align_headers">
                <thead>
                    <tr class="darkth">
                        <th>Project Name</th>
                        <th>Sample Name</th>
                        <th>% Assigned Reads</th>
                        <th>% Assigned With Mismatches</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="sample in index_samples(lane)">
                        <td>{{ sample["ProjectName"] }}</td>
                        <td>{{ sample["SampleName"] }}</td>
                        <td>{{ sample["PercentAssignedReads"] }}</td>
                        <td>{{ sample["PercentMismatch"] }}</td>
                    </tr>
                </tbody>
            </table>
            <button class="btn btn-info my-2" type="button" data-toggle="collapse" :data-target="'#collapseUndeterminedLane'+ lane['Lane']" aria-expanded="false" :aria-controls="'#collapseUndeterminedLane'+ lane['Lane']">
                Show undetermined
            </button>

            <div class="collapse mt-3" :id="'collapseUndeterminedLane'+ lane['Lane']">
                <div class="row">
                <div class="card card-body">
                    <div class="col-3">
                        <table class="table table-bordered narrow-headers no-margin right_align_headers">
                            <thead>
                                <tr class="darkth">
                                    <th>Sequence</th>
                                    <th>% Occurence</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="unassigned_item in unassigned_sequences(lane)">
                                    <td>{{ unassigned_item["I1"] }}+{{ unassigned_item["I2"]}}</td>
                                    <td>{{ unassigned_item["PercentOcurrence"] }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `

});

app.component('v-element-tooltip', {
    props: ['title'],
    mounted() {
        this.$nextTick(function() {
            this.tooltip = new bootstrap.Tooltip(this.$el)
        })
    },
    template: `
        <span
            data-toggle="tooltip"
            data-placement="top"
            :title=title
        >
            <slot></slot>
        </span>
    `
});

app.mount("#element_vue_app");