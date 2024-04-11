export default {
    name: 'v-project-details',
    props: ['project_id'],
    data() {
        return {
            project_data: {},
        }
    },
    methods: {
        fetchProjectDetails() {
            axios
            .get(`/api/v1/project_summary/${this.project_id}`)
            .then(response => {
                this.project_data = response.data;
            })
            .catch(error => {
                this.error_messages.push('Error fetching project details');
                console.log(error);
            });
        }
    },
    template: 
    /*html*/`
        <div class="row">
            <div class="col-12">
               <h1>
                    <span id="project_name">{{project_id}}, {{project_data.project_name}}</span>
                    <span class="text-muted ml-4"><a class="badge rounded-pill bg-secondary text-decoration-none" :href="'https://ngisweden.scilifelab.se/orders/order/' + project_data['portal_id']" target="_blank">{{project_data['customer_project_reference']}}</a></span>
                    <small><span class="badge" id="project_status_alert"></span></small>

                    <a href="#" class="btn btn-outline-dark btn-xs float-right mt-4" id="show_order_timeline">
                        <span id="show_orderdates_btn" style="display:none;">Show</span>
                        <span id="hide_orderdates_btn">Hide</span> order dates on timeline
                    </a>
                </h1>
                <h2><span class="badge bg-secondary w-100 mt-3">{{project_data.status}}status</span></h2>
            </div>
            <div class="col-4">
                <h4>Library preparation</h4>
                <dl class="row">
                    <dt class="col-5 text-right">Number of samples:</dt>                    <dd class="col-7 mb-0">{{ project_data.sample_units_ordered }}</dd>
                    <dt class="col-5 text-right">Sample type:</dt>                          <dd class="col-7 mb-0">{{ project_data.sample_type }}</dd>
                    <dt class="col-5 text-right">Library construction method:</dt>          <dd class="col-7 mb-0">{{ project_data.library_construction_method }}</dd>
                    <dt class="col-5 text-right">Library prep option:</dt>                  <dd class="col-7 mb-0">{{ project_data.library_prep_option }}</dd>
                    <dt class="col-5 text-right">Library type (ready-made libraries):</dt>  <dd class="col-7 mb-0">{{ project_data['library_type_(ready-made_libraries)'] }}</dd>
                </dl>
                <h4>Sequencing</h4>
                <dl class="row">
                    <dt class="col-5 text-right">Number of lanes ordered:</dt>  <dd class="col-7 mb-0">{{ project_data.lanes_ordered }}</dd>
                    <dt class="col-5 text-right">Sequencing platform:</dt>      <dd class="col-7 mb-0">{{ project_data.sequencing_platform }}</dd>
                    <dt class="col-5 text-right">Flowcell:</dt>                 <dd class="col-7 mb-0">{{ project_data.flowcell }}</dd>
                    <dt class="col-5 text-right">Flowcell option:</dt>          <dd class="col-7 mb-0">{{ project_data.flowcell_option }}</dd>
                    <dt class="col-5 text-right">Sequencing setup:</dt>         <dd class="col-7 mb-0">{{ project_data.sequencing_setup }}</dd>
                    <dt class="col-5 text-right">Custom primer:</dt>            <dd class="col-7 mb-0">{{ project_data.custom_primer }}</dd>
                    <dt class="col-5 text-right">Low diversity:</dt>            <dd class="col-7 mb-0">{{ project_data.low_diversity }}</dd>
                    <dt class="col-5 text-right">PhiX %:</dt>                   <dd class="col-7 mb-0">{{ project_data.phix_percentage }}</dd>
                </dl>
            </div>
            <div class="col-4">
                <h4>Bioinformatics</h4>
                <dl class="row">
                    <dt class="col-5 text-right">Reference genome</dt>       <dd class="col-7 mb-0">{{ project_data.reference_genome }}</dd>
                    <dt class="col-5 text-right">Organism</dt>               <dd class="col-7 mb-0">{{ project_data.organism }}</dd>
                    <dt class="col-5 text-right">Best practice analysis</dt> <dd class="col-7 mb-0">{{ project_data.best_practice_bioinformatics }}</dd>
                </dl>
                <h4>Links</h4>
                <h3><span class="badge bg-secondary w-100 text-muted"><h3><a class="text-decoration-none" target="_blank" :href="'https://ngisweden.scilifelab.se/orders/order/' + project_data['portal_id']" target="_blank">Order portal</a></h3></span>
                
            </div>
            <div class="col-4">
                <h2>Project comment</h2>
                <p>{{ project_data.project_comment }}</p>
            </div>
            <h2>Status</h2>
            <div class="col-4">
                <h4>Reception Control</h4>
            </div>
            <div class="col-4">
                <h4>Library QC</h4>
            </div>
            <div class="col-4">
                <h4>Sequencing and Bioinformatics</h4>
            </div>
            <p>Project details: {{ project_data }}</p>
        </div>
    `,
    mounted() {
        this.fetchProjectDetails();
    }
}
