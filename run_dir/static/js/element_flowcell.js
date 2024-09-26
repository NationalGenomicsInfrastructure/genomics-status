
const vElementApp = {
    data() {
        return {
            ngi_run_id: "some_id",
            flowcell: {},
            flowcell_fetched: false,
        }
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
            return this.$root.getValue(this.flowcell, "instrument_generated_files", {});
        },
        aviti_run_stats() {
            return this.$root.getValue(this.instrument_generated_files, "AvitiRunStats.json", {});
        },
        run_parameters() {
            return this.$root.getValue(this.instrument_generated_files, "RunParameters.json", {});
        },
        start_time() {
            const dateStr = this.$root.getValue(this.run_parameters, "Date", null);
            if (dateStr) {
                const date = new Date(dateStr);
                const date_string = date.toLocaleDateString();
                const [month, day, year] = date_string.split("/");
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
    template: `
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
            return this.$root.getValue(this.$root.flowcell["instrument_generated_files"], "AvitiRunStats.json", {});
        },
        run_stats() {
            return this.$root.getValue(this.aviti_run_stats, "RunStats", {});
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
        </table>`
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
        }
    },
    template: `
        <div v-for="lane in lane_stats">
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
                        <th>% Assigned Reads</th> <td>{{ lane["PercentAssignedReads"] }}</td>
                    </tr>
                </tbody>
            </table>
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