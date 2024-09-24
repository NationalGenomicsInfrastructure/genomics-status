
const vElementApp = {
    data() {
        return {
            ngi_run_id: "some_id",
            flowcell: {},
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
        instrument_generated_files () {
            // Check that the key exists
            if (!this.flowcell.hasOwnProperty("instrument_generated_files")) {
                return {};
            } else {
                return this.flowcell["instrument_generated_files"];
            }
        },
        aviti_run_stats() {
            // Check that the key exists
            if (!this.instrument_generated_files.hasOwnProperty("AvitiRunStats.json")) {
                return {};
            } else {
                return this.instrument_generated_files["AvitiRunStats.json"];
            }
        },
        run_parameters() {
            // Check that the key exists
            if (!this.instrument_generated_files.hasOwnProperty("RunParameters.json")) {
                return {};
            } else {
                return this.instrument_generated_files["RunParameters.json"];
            }
        },
        start_time() {
            if (this.run_parameters.hasOwnProperty("Date")) {
                var date = new Date(this.run_parameters["Date"])
                var date_string = date.toLocaleDateString();
                var year = date_string.split("/")[2];
                var month = date_string.split("/")[1];
                var day = date_string.split("/")[0];
                var date_formatted = year + "-" + month + "-" + day;
                return date_formatted + " " + date.toLocaleTimeString();

            } else {
                return "N/A";
            }
        },
        flowcell_id() {
            if (this.run_parameters.hasOwnProperty("FlowcellID")) {
                return this.run_parameters["FlowcellID"];
            } else {
                return "N/A";
            }
        },
        side() {
            if (this.run_parameters.hasOwnProperty("Side")) {
                return this.run_parameters["Side"];
            } else {
                return "N/A";
            }
        },
        instrument_name() {
            if (this.run_parameters.hasOwnProperty("InstrumentName")) {
                return this.run_parameters["InstrumentName"];
            } else {
                return "N/A";
            }
        },
        run_setup() {
            return ` ${this.chemistry_version} ${this.kit_configuration} (${this.cycles}); ${this.throughput_selection}`
        },
        cycles() {
            if (this.run_parameters.hasOwnProperty("Cycles")) {
                var return_str = "";
                if (this.run_parameters["Cycles"].hasOwnProperty("R1")){
                    return_str += "R1: " + this.run_parameters["Cycles"]["R1"];
                }
                if (this.run_parameters["Cycles"].hasOwnProperty("R2")){
                    return_str += ", R2: " + this.run_parameters["Cycles"]["R2"];
                }
                if (this.run_parameters["Cycles"].hasOwnProperty("I1")){
                    return_str += ", I1: " + this.run_parameters["Cycles"]["I1"];
                }
                if (this.run_parameters["Cycles"].hasOwnProperty("I2")){
                    return_str += ", I2: " + this.run_parameters["Cycles"]["I2"];
                }
                return return_str;
            } else {
                return "N/A";
            }
        },
        throughput_selection() {
            if (this.run_parameters.hasOwnProperty("ThroughputSelection")) {
                return this.run_parameters["ThroughputSelection"] + " Throughput";
            } else {
                return "N/A";
            }
        },
        kit_configuration() {
            if (this.run_parameters.hasOwnProperty("KitConfiguration")) {
                return this.run_parameters["KitConfiguration"];
            } else {
                return "N/A";
            }
        },
        preparation_workflow() {
            if (this.run_parameters.hasOwnProperty("PreparationWorkflow")) {
                return this.run_parameters["PreparationWorkflow"];
            } else {
                return "N/A";
            }
        },
        chemistry_version() {
            if (this.run_parameters.hasOwnProperty("ChemistryVersion")) {
                return this.run_parameters["ChemistryVersion"];
            } else {
                return "N/A";
            }
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
                })
                .catch(error => {
                    console.log(error);
                });
        }
    },
    template: `
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
    <v-run-stats></v-run-stats>

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
        <p>To be implemented</p>

      </div>
      <div class="tab-pane fade show" id="tab_fc_project_yields_content">
        <h3>Project Yields</h3>
        <p>To be implemented</p>
      </div>
    </div>

    `
});

app.component('v-run-stats', {
    computed: {
        aviti_run_stats() {
            return this.$root.flowcell["instrument_generated_files"]["AvitiRunStats.json"];
        },
        run_stats() {
            return this.aviti_run_stats["RunStats"];
        },
        run_stats() {
            // Check that the key exists
            if (!this.aviti_run_stats.hasOwnProperty("RunStats")) {
                return {};
            } else {
                return this.aviti_run_stats["RunStats"];
            }
        },
        polony_count() {
            if (this.run_stats.hasOwnProperty("PolonyCount")) {
                return this.run_stats["PolonyCount"];
            } else {
                return "N/A";
            }
        },
        pf_count() {
            if (this.run_stats.hasOwnProperty("PFCount")) {
                return this.run_stats["PFCount"];
            } else {
                return "N/A";
            }
        },
        percent_pf() {
            if (this.run_stats.hasOwnProperty("PercentPF")) {
                return this.run_stats["PercentPF"];
            } else {
                return "N/A";
            }
        },
        total_yield() {
            if (this.run_stats.hasOwnProperty("TotalYield")) {
                return this.run_stats["TotalYield"];
            } else {
                return "N/A";
            }
        },
        index_assignment() {
            if (this.run_stats.hasOwnProperty("IndexAssignment")) {
                return this.run_stats["IndexAssignment"];
            } else {
                return "N/A";
            }
        },
        percent_assigned_reads() {
            if (this.index_assignment.hasOwnProperty("PercentAssignedReads")) {
                return this.index_assignment["PercentAssignedReads"];
            } else {
                return "N/A";
            }
        }
    },
    template: `
        <table class="table table-bordered narrow-headers no-margin right_align_headers">
            <tbody>
                <tr class="darkth">
                    <th>Polony Count</th>
                    <td>{{ polony_count }}</td>
                    <th>PF Count</th>
                    <td>{{ pf_count }}</td>
                    <th>% PF</th>
                    <td>{{ percent_pf }}</td>
                    <th>Total Yield</th>
                    <td>{{ total_yield }}</td>
                    <th>% Assigned Reads</th>
                    <td>{{ percent_assigned_reads }}</td>
                </tr>
            </tbody>
        </table>`
});

app.mount("#element_vue_app");