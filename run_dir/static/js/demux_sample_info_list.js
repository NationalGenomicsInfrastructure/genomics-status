const vDemuxSampleInfoList = {
    data() {
        return {
            flowcell_list: [],
            showAllFlowcells: false,
            loadingFlowcells: false,
        }
    },
    methods: {
        fetchFlowcellList() {
            // Fetch the list of flowcells (recent or all based on showAllFlowcells)
            this.loadingFlowcells = true;

            const url = this.showAllFlowcells 
                ? '/api/v1/demux_sample_info_list?all=true' 
                : '/api/v1/demux_sample_info_list';

            axios.get(url)
                .then(response => {
                    this.flowcell_list = response.data.flowcells || [];
                    this.loadingFlowcells = false;
                })
                .catch(error => {
                    console.error('Error fetching flowcell list:', error);
                    this.loadingFlowcells = false;
                });
        },
        toggleShowAllFlowcells() {
            // Toggle between showing recent (6 months) and all flowcells
            this.showAllFlowcells = !this.showAllFlowcells;
            this.fetchFlowcellList();
        },
    },
    mounted() {
        // Fetch the flowcell list when component mounts
        this.fetchFlowcellList();
    },
    template: 
        /*html*/`
        <div id="y_flowcells_table_div">
            <h1>
                <span>Y Flowcells</span>
                <span v-if="showAllFlowcells" class="ms-3">
                    <small class="text-muted">Showing all flowcells</small>
                    <button
                        class="btn btn-outline-dark ml-1"
                        @click="toggleShowAllFlowcells"
                        :disabled="loadingFlowcells">
                        Show last 6 months only
                    </button>
                </span>
                <span v-else class="ms-3">
                    <small class="text-muted ml-2">Showing flowcells from the last 6 months</small>
                    <button
                        class="btn btn-outline-dark ml-2"
                        @click="toggleShowAllFlowcells"
                        :disabled="loadingFlowcells">
                        Show all
                    </button>
                </span>
            </h1>

            <!-- Loading state -->
            <div v-if="loadingFlowcells" class="text-center py-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading flowcells...</p>
            </div>

            <!-- Flowcell list -->
            <table v-else-if="flowcell_list.length > 0" class="table table-striped table-bordered" id="y_flowcells_table">
                <thead>
                    <tr class="sticky darkth">
                        <th>Flowcell ID</th>
                        <th>Start date</th>
                        <th>Run Mode</th>
                        <th>Run Setup</th>
                        <th>Status</th>
                        <th>Lanes / Projects</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="fc in flowcell_list"
                        :key="fc.flowcell_id">
                        <td>
                            <a :href="'/demux_sample_info_editor?flowcell=' + encodeURIComponent(fc.flowcell_id)"
                               class="text-decoration-none"
                               style="cursor: pointer; color: #0d6efd;">
                                {{ fc.runfolder_id || fc.flowcell_id }}
                            </a>
                            <!-- Status icons -->
                            <template v-if="fc.sequencing_finished">
                                <i v-if="fc.has_demux_info"
                                    class="fa fa-check ml-2"
                                    title="Sequencing finished"
                                    aria-hidden="true"></i>
                                <span v-else class="badge rounded-pill bg-warning text-dark ml-2">
                                    <i class="fa fa-check px-1"
                                        title="Sequencing finished but no demux info"
                                        aria-hidden="true"></i>
                                </span>
                            </template>
                            <template v-else-if="fc.sequencing_started">
                                <i v-if="fc.has_demux_info"
                                    class="fa fa-hourglass-half ml-2"
                                    title="Sequencing in progress"
                                    aria-hidden="true"></i>
                                <span v-else class="badge rounded-pill bg-warning text-dark ml-2">
                                    <i class="fa fa-hourglass-half px-1"
                                        title="Sequencing in progress but no demux info"
                                        aria-hidden="true"></i>
                                </span>
                            </template>
                            <i v-else-if="fc.has_demux_info && !fc.sequencing_started"
                               class="fa fa-spinner ml-2"
                               title="Awaiting event data"
                               aria-hidden="true"></i>
                        </td>
                        <td>
                            <span v-if="fc.sequencing_started_timestamp">{{ fc.sequencing_started_timestamp.split('T')[0] }}</span>
                            <span v-else class="text-muted">-</span>
                        </td>
                        <td>
                            <span v-if="fc.run_mode">{{ fc.run_mode }}</span>
                            <span v-else class="text-muted">-</span>
                        </td>
                        <td>
                            <span v-if="fc.run_setup">{{ fc.run_setup }}</span>
                            <span v-else class="text-muted">-</span>
                        </td>
                        <td class="text-nowrap">
                            <!-- Demux Info -->
                            <i v-if="fc.has_demux_info"
                               class="fa fa-list-alt"
                               style="font-size: 1.15em; margin-right: 0.4em;"
                               title="Has demux info"
                               aria-hidden="true"></i>
                            <i v-else
                               class="fa fa-list-alt"
                               style="opacity: 0.2; font-size: 1.15em; margin-right: 0.4em;"
                               title="No demux info"
                               aria-hidden="true"></i>

                            <!-- Sequencing Finished -->
                            <i v-if="fc.sequencing_finished"
                               class="fa fa-check-circle"
                               style="font-size: 1.15em; margin-right: 0.4em;"
                               :title="'Sequencing finished' + (fc.sequencing_finished_timestamp ? ': ' + fc.sequencing_finished_timestamp.split('T')[0] : '')"
                               aria-hidden="true"></i>
                            <i v-else
                               class="fa fa-check-circle"
                               style="opacity: 0.2; font-size: 1.15em; margin-right: 0.4em;"
                               title="Sequencing not finished"
                               aria-hidden="true"></i>

                            <!-- Transferred to HPC -->
                            <i v-if="fc.transferred_to_hpc"
                               class="fa fa-cloud-upload"
                               style="font-size: 1.15em;"
                               :title="'Transferred to HPC' + (fc.transferred_to_hpc_timestamp ? ': ' + fc.transferred_to_hpc_timestamp.split('T')[0] : '')"
                               aria-hidden="true"></i>
                            <i v-else
                               class="fa fa-cloud-upload"
                               style="opacity: 0.2; font-size: 1.15em;"
                               title="Not transferred to HPC"
                               aria-hidden="true"></i>
                        </td>
                        <td>
                            <div v-if="fc.lane_info && Object.keys(fc.lane_info).length > 0">
                                <div v-for="(laneData, laneNum) in fc.lane_info" :key="laneNum" class="mb-2">
                                    <div v-if="laneData.projects && laneData.projects.length > 0">
                                        <div v-for="(project, idx) in laneData.projects" :key="project.project_id">
                                            <span v-if="idx === 0" style="display: inline-block; width: 1.5em;">{{ laneNum }}:</span>
                                            <span v-else style="display: inline-block; width: 1.5em;"></span>
                                            <a :href="'/project/' + project.project_id"
                                               class="text-decoration-none"
                                               :title="project.project_name">{{ project.project_name }}</a>
                                        </div>
                                    </div>
                                    <div v-else>
                                        <strong style="display: inline-block; width: 4.5em;">Lane {{ laneNum }}:</strong>
                                        <span class="text-muted">No projects</span>
                                    </div>
                                </div>
                            </div>
                            <span v-else class="text-muted">-</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- No flowcells found -->
            <div v-else class="alert alert-info">
                No flowcells found in the database.
            </div>
        </div>
    `
};

// Mount the Vue app
const app = Vue.createApp({
    components: {
        'v-demux-sample-info-list': vDemuxSampleInfoList
    }
});

app.mount("#demux_sample_info_list_main");
