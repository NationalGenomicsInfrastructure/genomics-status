// Chart color palette
const CHART_COLORS = [
    'rgba(255, 99, 132, 0.5)',
    'rgba(54, 162, 235, 0.5)',
    'rgba(255, 206, 86, 0.5)',
    'rgba(75, 192, 192, 0.5)',
    'rgba(153, 102, 255, 0.5)',
    'rgba(255, 159, 64, 0.5)',
    'rgba(199, 199, 199, 0.5)',
    'rgba(83, 102, 255, 0.5)'
];

const vTimeTrackingMain = ({
    data() {
        return {
            tracking_data: {},
            production_finished_data: {},
            production_other_data: {},
            application_finished_data: {},
            application_other_data: {},
            start_date: '',
            end_date: '',
            loading: false,
            plot_mode: 'methods', // 'methods' or 'stages'
            plot_style: 'grouped', // 'merged' or 'grouped'
            production_finished_chart: null,
            production_other_chart: null,
            application_finished_chart: null,
            application_other_chart: null,
            selected_projects: [],
            show_projects_modal: false,
            modal_title: '',
            modal_stage: '',
            modal_view_mode: 'durations',
            stage_order: [
                'Reception Control',
                'Library Prep Queue',
                'Library Prep',
                'Sequencing Queue',
                'Sequencing',
                'Data Delivery',
                'Analysis',
                'Processing Time',
                'Total Time'
            ],
            date_order: [
                'open_date',
                'queued',
                'library_prep_start',
                'qc_library_finished',
                'sequencing_start_date',
                'all_samples_sequenced',
                'all_raw_data_delivered',
                'best_practice_analysis_completed',
                'close_date'
            ],
            stage_definitions: {}
        }
    },
    methods: {
        // ====================
        // Lifecycle & Initialization
        // ====================
        formatDateFieldLabel(dateField) {
            // Convert snake_case date field names to readable labels
            // Replace underscores with spaces and capitalize each word
            return dateField
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        },
        setDefaults() {
            // Set default date range to last 6 months
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 180);

            this.end_date = end.toISOString().split('T')[0];
            this.start_date = start.toISOString().split('T')[0];

            this.fetchData();
        },
        async fetchData() {
            this.loading = true;
            let url = '/api/v1/time_tracking';
            let params = [];
            
            if (this.start_date) {
                params.push('start_date=' + this.start_date);
            }
            if (this.end_date) {
                params.push('end_date=' + this.end_date);
            }
            
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            
            try {
                const response = await axios.get(url);
                this.tracking_data = response.data;
                this.stage_definitions = response.data._metadata.stage_definitions || {};                // Extract Production and Application data with Finished/Other subcategories
                const productionData = this.tracking_data.Production || {};
                const applicationData = this.tracking_data.Application || {};
                
                this.production_finished_data = productionData.Finished || {};
                this.production_other_data = productionData.Other || {};
                this.application_finished_data = applicationData.Finished || {};
                this.application_other_data = applicationData.Other || {};
                
                this.updateChart();
            } catch (error) {
                console.error('Error fetching data:', error);
                alert('Error fetching data. Please try again.');
            } finally {
                this.loading = false;
            }
        },
        // ====================
        // UI Event Handlers
        // ====================
        changePlotMode(mode) {
            this.plot_mode = mode;
            this.updateChart();
        },
        changePlotStyle(style) {
            this.plot_style = style;
            this.updateChart();
        },
        updateChart() {
            const plotBy = this.plot_mode; // 'methods' or 'stages'
            this.renderAllCharts((ctx, data, name, label) =>
                this.renderChartForType(ctx, data, name, label, plotBy));
        },
        // ====================
        // Chart Rendering
        // ====================
        renderAllCharts(renderFunction) {
            const charts = [
                {
                    canvasId: 'productionFinishedChart',
                    chartName: 'production_finished_chart',
                    data: this.production_finished_data,
                    label: 'Production - Finished library (by user)'
                },
                {
                    canvasId: 'productionOtherChart',
                    chartName: 'production_other_chart',
                    data: this.production_other_data,
                    label: 'Production - Other library methods'
                },
                {
                    canvasId: 'applicationFinishedChart',
                    chartName: 'application_finished_chart',
                    data: this.application_finished_data,
                    label: 'Application - Finished library (by user)'
                },
                {
                    canvasId: 'applicationOtherChart',
                    chartName: 'application_other_chart',
                    data: this.application_other_data,
                    label: 'Application - Other library methods'
                }
            ];

            charts.forEach(chart => {
                const ctx = document.getElementById(chart.canvasId);
                if (ctx) {
                    this.destroyChart(chart.chartName);
                    renderFunction.call(this, ctx, chart.data, chart.chartName, chart.label);
                }
            });

            this.charts_loading = false;
        },
        renderChartForType(ctx, dataSubset, chartInstanceName, typeLabel, plotBy) {
            const isMerged = this.plot_style === 'merged';
            const self = this;

            // Extract appropriate labels and axis info based on plotBy
            const isMethodView = plotBy === 'methods';
            const axisLabel = isMethodView ? 'Method' : 'Stage';

            let labels, chartLabels, datasets;

            // Determine labels based on view type
            if (isMethodView) {
                labels = Object.keys(dataSubset).sort();
            } else {
                const allStages = new Set();
                for (const method in dataSubset) {
                    for (const stage in dataSubset[method]) {
                        allStages.add(stage);
                    }
                }
                labels = this.sortStages(Array.from(allStages));
            }

            if (isMerged) {
                // Merged mode: Aggregate data across dimension
                const itemDurations = {};
                const itemProjects = {};

                if (isMethodView) {
                    // Methods view: Show only Total Time for each method
                    for (const method of labels) {
                        itemDurations[method] = [];
                        itemProjects[method] = [];
                        const stages = dataSubset[method];

                        if (stages['Total Time'] && stages['Total Time'].durations) {
                            itemDurations[method] = stages['Total Time'].durations;
                            itemProjects[method] = stages['Total Time'].projects;
                        }
                    }
                } else {
                    // Stages view: Collect all durations for each stage across all methods
                    for (const stage of labels) {
                        itemDurations[stage] = [];
                        itemProjects[stage] = [];
                        for (const method in dataSubset) {
                            if (dataSubset[method][stage]) {
                                const stageData = dataSubset[method][stage];
                                if (stageData.durations) {
                                    itemDurations[stage].push(...stageData.durations);
                                    itemProjects[stage].push(...stageData.projects);
                                }
                            }
                        }
                    }
                }

                chartLabels = labels.map(item => {
                    const count = itemDurations[item].filter(d => typeof d === 'number' && !isNaN(d)).length;
                    return `${item} (N=${count})`;
                });

                const boxplotData = labels.map(item => {
                    const values = itemDurations[item].filter(d => typeof d === 'number' && !isNaN(d));
                    if (values.length === 0) return null;

                    values.sort((a, b) => a - b);
                    const q1 = this.percentile(values, 25);
                    const q3 = this.percentile(values, 75);
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const { outliers, whiskerMin, whiskerMax } = this.calculateOutliers(values, q1, q3);

                    const result = {
                        min: whiskerMin,
                        q1: q1,
                        median: this.percentile(values, 50),
                        mean: mean,
                        q3: q3,
                        max: whiskerMax,
                        outliers: outliers,
                        projects: itemProjects[item]
                    };

                    if (isMethodView) {
                        result.method = item;
                    } else {
                        result.stage = item;
                    }

                    return result;
                });

                const colors = isMethodView
                    ? ['rgba(54, 162, 235, 0.5)', 'rgba(54, 162, 235, 1)', 'rgba(54, 162, 235, 0.7)']
                    : ['rgba(75, 192, 192, 0.5)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 0.7)'];

                datasets = [{
                    label: 'Duration (days)',
                    data: boxplotData,
                    backgroundColor: colors[0],
                    borderColor: colors[1],
                    borderWidth: 1,
                    meanRadius: 0,
                    outlierRadius: 2,
                    outlierBackgroundColor: colors[2],
                    outlierBorderColor: colors[1],
                    outlierBorderWidth: 1.5
                }];
            } else {
                // Grouped mode: Show separate datasets for cross-dimension
                chartLabels = labels;

                if (isMethodView) {
                    // Methods view: Show separate boxplot for each stage
                    const allStages = new Set();
                    for (const method in dataSubset) {
                        for (const stage in dataSubset[method]) {
                            allStages.add(stage);
                        }
                    }
                    const stages = this.sortStages(Array.from(allStages));
                    datasets = this.createGroupedDatasets(stages, labels, dataSubset, true);
                } else {
                    // Stages view: Show separate boxplot for each method
                    const availableMethods = Object.keys(dataSubset).sort();
                    datasets = this.createGroupedDatasets(availableMethods, labels, dataSubset, false);
                }
            }

            this[chartInstanceName] = new Chart(ctx, {
                type: 'boxplot',
                data: {
                    labels: chartLabels,
                    datasets: datasets
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: function(event, elements) {
                        if (elements.length > 0) {
                            if (isMerged) {
                                const index = elements[0].index;
                                const item = labels[index];
                                const boxData = datasets[0].data[index];
                                self.selected_projects = boxData.projects.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));

                                if (isMethodView) {
                                    self.modal_title = `${typeLabel} - ${item} - Total Time`;
                                    self.modal_stage = 'Total Time';
                                } else {
                                    self.modal_title = `${typeLabel} - ${item} - All Methods Combined`;
                                    self.modal_stage = item;
                                }
                                self.show_projects_modal = true;
                            } else {
                                const element = elements[0];
                                if (isMethodView) {
                                    const stages = self.sortStages(Array.from(new Set(
                                        Object.values(dataSubset).flatMap(m => Object.keys(m))
                                    )));
                                    const stage = stages[element.datasetIndex];
                                    const method = labels[element.index];
                                    self.showProjectsForBox(method, stage, dataSubset);
                                } else {
                                    const availableMethods = Object.keys(dataSubset).sort();
                                    const method = availableMethods[element.datasetIndex];
                                    const stage = labels[element.index];
                                    self.showProjectsForBox(method, stage, dataSubset);
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: isMerged
                                ? (isMethodView
                                    ? `${typeLabel} Projects: Duration by Method (Total Time)`
                                    : `${typeLabel} Projects: Duration by Stage (All Methods Merged)`)
                                : (isMethodView
                                    ? `${typeLabel} Projects: Duration by Method (Grouped by Stage)`
                                    : `${typeLabel} Projects: Duration by Stage (Grouped by Method)`)
                        },
                        legend: {
                            display: !isMerged,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const dataPoint = context.parsed;
                                    const lines = [
                                        `Min: ${dataPoint.min}`,
                                        `Q1: ${dataPoint.q1}`,
                                        `Median: ${dataPoint.median}`,
                                        `Mean: ${dataPoint.mean?.toFixed(1)}`,
                                        `Q3: ${dataPoint.q3}`,
                                        `Max: ${dataPoint.max}`
                                    ];

                                    if (!isMerged) {
                                        const rawData = context.dataset.data[context.dataIndex];
                                        const label = context.dataset.label;
                                        const count = rawData?.items || 0;
                                        lines.unshift(`${label} (N=${count})`);
                                    }

                                    return lines;
                                },
                                footer: function() {
                                    return 'Click to view projects';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            suggestedMax: this.calculateYAxisMax(dataSubset),
                            title: {
                                display: true,
                                text: 'Duration (days)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: axisLabel
                            }
                        }
                    }
                }
            });
        },
        createGroupedDatasets(items, labels, dataSubset, isMethodView) {
            // Create datasets for grouped view by iterating over items (stages or methods)
            // and creating boxplot data for each label (methods or stages)
            return items.map((item, idx) => {
                const boxplotData = labels.map(label => {
                    // Get data based on view type
                    const stageData = isMethodView
                        ? dataSubset[label] && dataSubset[label][item]  // method is label, stage is item
                        : dataSubset[item] && dataSubset[item][label];  // method is item, stage is label

                    if (!stageData || !stageData.durations || stageData.durations.length === 0) return null;

                    const values = stageData.durations.filter(d => typeof d === 'number' && !isNaN(d));
                    if (values.length === 0) return null;

                    const sorted = [...values].sort((a, b) => a - b);
                    const q1 = this.percentile(sorted, 25);
                    const median = this.percentile(sorted, 50);
                    const q3 = this.percentile(sorted, 75);
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const { outliers, whiskerMin, whiskerMax } = this.calculateOutliers(sorted, q1, q3);

                    return {
                        min: whiskerMin,
                        q1: q1,
                        median: median,
                        mean: mean,
                        q3: q3,
                        max: whiskerMax,
                        outliers: outliers,
                        method: isMethodView ? label : item,
                        stage: isMethodView ? item : label,
                        items: values.length
                    };
                });

                // Choose color based on view type
                const color = isMethodView
                    ? this.getStageColor(item)
                    : CHART_COLORS[idx % CHART_COLORS.length];

                return {
                    label: item,
                    data: boxplotData,
                    backgroundColor: color,
                    borderColor: color.replace('0.5', '1'),
                    borderWidth: 1,
                    meanRadius: 0,
                    outlierRadius: 2,
                    outlierBackgroundColor: color.replace('0.5', '0.7'),
                    outlierBorderColor: color.replace('0.5', '1'),
                    outlierBorderWidth: 1.5
                };
            });
        },
        destroyChart(chartName) {
            // Safely destroy a chart instance
            if (this[chartName]) {
                try {
                    this[chartName].destroy();
                } catch (e) {
                    console.warn(`Failed to destroy chart ${chartName}:`, e);
                }
                this[chartName] = null;
            }
        },
        // ====================
        // Statistical & Calculation Utilities
        // ====================
        calculateOutliers(values, q1, q3) {
            // Calculate outliers using IQR method
            const iqr = q3 - q1;
            const lowerFence = q1 - 1.5 * iqr;
            const upperFence = q3 + 1.5 * iqr;
            
            const outliers = [];
            const nonOutliers = [];
            
            for (const val of values) {
                if (val < lowerFence || val > upperFence) {
                    outliers.push(val);
                } else {
                    nonOutliers.push(val);
                }
            }
            
            // Calculate min/max from non-outliers (for whiskers)
            let whiskerMin = nonOutliers.length > 0 ? Math.min(...nonOutliers) : values[0];
            let whiskerMax = nonOutliers.length > 0 ? Math.max(...nonOutliers) : values[values.length - 1];
            
            return { outliers, whiskerMin, whiskerMax };
        },
        percentile(arr, p) {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const index = (p / 100) * (sorted.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index - lower;

            if (lower === upper) {
                return sorted[lower];
            }
            return sorted[lower] * (1 - weight) + sorted[upper] * weight;
        },
        calculateYAxisMax(dataSubset) {
            // Calculate the maximum value for this specific dataset to set a reasonable y-axis scale
            let maxValue = 0;
            
            // Check only the provided data subset
            for (const method in dataSubset) {
                const stages = dataSubset[method];
                for (const stage in stages) {
                    const stageData = stages[stage];
                    if (stageData.durations && stageData.durations.length > 0) {
                        const stageMax = Math.max(...stageData.durations);
                        maxValue = Math.max(maxValue, stageMax);
                    }
                }
            }
            
            // Add 15% padding for visual breathing room
            return maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100;
        },
        // ====================
        // Data Utilities
        // ====================
        getStageColor(stage) {
            // Get consistent color for a stage based on its position in stage_order
            const stageIndex = this.stage_order.indexOf(stage);
            const colorIndex = stageIndex >= 0 ? stageIndex : this.stage_order.length;
            return CHART_COLORS[colorIndex % CHART_COLORS.length];
        },
        sortStages(stages) {
            // Sort stages according to the defined order (non-mutating)
            return [...stages].sort((a, b) => {
                const indexA = this.stage_order.indexOf(a);
                const indexB = this.stage_order.indexOf(b);
                // If stage not in order list, put it at the end
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        },
        calculateStageDuration(project, stage) {
            // Calculate duration for any stage given a project
            const stageDef = this.stage_definitions[stage];
            if (!stageDef) return null;
            
            let startField = stageDef[0];
            const endField = stageDef[1];

            // Handle Sequencing Queue special case: startField might be an array
            // Try each field in the array until we find one with a value
            if (Array.isArray(startField)) {
                let foundField = null;
                for (const field of startField) {
                    if (project[field]) {
                        foundField = field;
                        break;
                    }
                }
                startField = foundField;
            }

            const startDate = project[startField];
            const endDate = project[endField];
            
            if (!startDate || !endDate) return null;
            
            try {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24));
                return duration >= 0 ? duration : null;
            } catch (e) {
                return null;
            }
        },
        getStageEndDate(project, stage) {
            // Get the end date for a stage
            const stageDef = this.stage_definitions[stage];
            if (!stageDef) return null;
            
            const [startField, endField] = stageDef;
            return project[endField] || null;
        },
        getDateFieldValue(project, dateField) {
            // Get the value of a date field from a project
            return project[dateField] || null;
        },
        // ====================
        // Modal Handlers
        // ====================
        showProjectsForBox(method, stage, dataSubset) {
            // Get projects for the clicked box
            const stageData = dataSubset[method]?.[stage];
            if (stageData && stageData.projects) {
                this.selected_projects = stageData.projects.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
                this.modal_title = `${method} - ${stage}`;
                this.modal_stage = stage;
                this.show_projects_modal = true;
            }
        },
        closeProjectsModal() {
            this.show_projects_modal = false;
            this.selected_projects = [];
        }
    },
    mounted() {
        this.setDefaults();
    },
    template:
        /*html*/`
        <h1>Time Tracking</h1>

        <div class="row mb-4">
            <div class="col-md-12">
                <p>
                    Analyze project duration across different stages and methods. Select a time period to see boxplots
                    of how long projects take at each stage or for each method.
                </p>
                <div class="row">
                    <div class="col-md-6">
                        <div class="alert alert-info">
                            <strong>Data Selection:</strong>
                            <ul class="mb-0">
                                <li>Projects are filtered by their <strong>delivery date</strong> (all_raw_data_delivered)</li>
                                <li>Control and Internal projects are automatically excluded</li>
                                <li>Projects are split into <strong>Production</strong> and <strong>Application</strong> types</li>
                                <li>Each type is further split by library construction method:
                                    <ul>
                                        <li><strong>Finished library (by user)</strong> - Projects with library prepared by user</li>
                                        <li><strong>Other library methods</strong> - All other library construction methods</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-secondary">
                            <strong>How Stage Durations are Calculated:</strong>
                            <ul class="mb-0">
                                <li><strong>Reception Control:</strong> From <code>open_date</code> to <code>queued</code></li>
                                <li><strong>Library Prep Queue:</strong> From <code>queued</code> to <code>library_prep_start</code></li>
                                <li><strong>Library Prep:</strong> From <code>library_prep_start</code> to <code>qc_library_finished</code></li>
                                <li><strong>Sequencing Queue:</strong> From <code>qc_library_finished</code> to <code>sequencing_start_date</code></li>
                                <li><strong>Sequencing:</strong> From <code>sequencing_start_date</code> to <code>all_samples_sequenced</code></li>
                                <li><strong>Data Delivery:</strong> From <code>all_samples_sequenced</code> to <code>all_raw_data_delivered</code></li>
                                <li><strong>Analysis:</strong> From <code>all_samples_sequenced</code> to <code>best_practice_analysis_completed</code></li>
                                <li><strong>Processing Time:</strong> From <code>queued</code> to <code>all_raw_data_delivered</code></li>
                                <li><strong>Total Time:</strong> From <code>open_date</code> to <code>all_raw_data_delivered</code></li>
                            </ul>
                            <small class="text-muted">Note: Projects are only included in a stage if both the start and end dates are available.</small>
                        </div>
                    </div>
                </div>
                <p>
                    <strong>Stages include:</strong> Reception Control, Library Prep Queue, Library Prep, Sequencing Queue,
                    Sequencing, Data Delivery, Analysis, Processing Time, and Total Time.
                </p>
                <p>
                    <strong>💡 Tip:</strong> Click on any box in the chart to view a detailed table of all projects that contributed to that box.
                </p>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Filters</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <label for="start_date">Start Date <small class="text-muted">(Delivery Date)</small>:</label>
                                <input type="date"
                                       id="start_date"
                                       class="form-control"
                                       v-model="start_date">
                            </div>
                            <div class="col-md-3">
                                <label for="end_date">End Date <small class="text-muted">(Delivery Date)</small>:</label>
                                <input type="date"
                                       id="end_date"
                                       class="form-control"
                                       v-model="end_date">
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-primary"
                                        @click="fetchData()"
                                        :disabled="loading">
                                    <span v-if="loading">Loading...</span>
                                    <span v-else>Update</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Display Options</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <label class="fw-bold">Plot Type:</label>
                                <div class="form-check">
                                    <input class="form-check-input"
                                           type="radio"
                                           name="plotMode"
                                           id="plotMethods"
                                           value="methods"
                                           :checked="plot_mode === 'methods'"
                                           @change="changePlotMode('methods')">
                                    <label class="form-check-label" for="plotMethods">
                                        Show Methods
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input"
                                           type="radio"
                                           name="plotMode"
                                           id="plotStages"
                                           value="stages"
                                           :checked="plot_mode === 'stages'"
                                           @change="changePlotMode('stages')">
                                    <label class="form-check-label" for="plotStages">
                                        Show Stages
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="fw-bold">Plot Style:</label>
                                <div class="form-check">
                                    <input class="form-check-input"
                                           type="radio"
                                           name="plotStyle"
                                           id="plotMerged"
                                           value="merged"
                                           :checked="plot_style === 'merged'"
                                           @change="changePlotStyle('merged')">
                                    <label class="form-check-label" for="plotMerged">
                                        Merged
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input"
                                           type="radio"
                                           name="plotStyle"
                                           id="plotGrouped"
                                           value="grouped"
                                           :checked="plot_style === 'grouped'"
                                           @change="changePlotStyle('grouped')">
                                    <label class="form-check-label" for="plotGrouped">
                                        Grouped
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Production Projects - Finished library (by user)</h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 675px; position: relative;">
                            <canvas id="productionFinishedChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Production Projects - Other library methods</h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 675px; position: relative;">
                            <canvas id="productionOtherChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Application Projects - Finished library (by user)</h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 675px; position: relative;">
                            <canvas id="applicationFinishedChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Application Projects - Other library methods</h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 675px; position: relative;">
                            <canvas id="applicationOtherChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Projects Modal -->
        <div v-if="show_projects_modal" class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Projects: {{ modal_title }}</h5>
                        <button type="button" class="btn-close" @click="closeProjectsModal()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <p class="text-muted mb-0">
                                Showing {{ selected_projects.length }} project(s) in this selection
                            </p>
                            <div class="btn-group btn-group-sm" role="group">
                                <input type="radio" class="btn-check" id="modal_view_durations" value="durations"
                                    v-model="modal_view_mode" autocomplete="off">
                                <label class="btn btn-outline-primary" for="modal_view_durations">Days Taken</label>

                                <input type="radio" class="btn-check" id="modal_view_dates" value="dates"
                                    v-model="modal_view_mode" autocomplete="off">
                                <label class="btn btn-outline-primary" for="modal_view_dates">Dates</label>
                            </div>
                        </div>
                        <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                            <table class="table table-sm table-striped table-hover">
                                <thead class="sticky-top bg-light">
                                    <tr>
                                        <th>Project ID</th>
                                        <th>Project Name</th>
                                        <th>Library Construction</th>
                                        <th>Sequencing Platform</th>
                                        <th>Units/Lanes Ordered</th>
                                        <th v-if="modal_view_mode === 'durations'"
                                            v-for="stage in stage_order" :key="stage"
                                            :class="{'fw-bold': stage === modal_stage}">
                                            {{ stage }}
                                        </th>
                                        <th v-if="modal_view_mode === 'dates'"
                                            v-for="dateField in date_order" :key="dateField">
                                            {{ formatDateFieldLabel(dateField) }}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="project in selected_projects" :key="project.project_id">
                                        <td>
                                            <a :href="'/project/' + project.project_id" target="_blank">
                                                {{ project.project_id }}
                                            </a>
                                        </td>
                                        <td>{{ project.project_name }}</td>
                                        <td><small>{{ project.library_construction }}</small></td>
                                        <td><small>{{ project.sequencing_platform }}</small></td>
                                        <td class="text-center">{{ project.sequence_units_ordered }}</td>
                                        <td v-if="modal_view_mode === 'durations'"
                                            v-for="stage in stage_order" :key="stage"
                                            class="text-end"
                                            :class="{'fw-bold': stage === modal_stage}">
                                            {{ calculateStageDuration(project, stage) ?? '-' }}
                                        </td>
                                        <td v-if="modal_view_mode === 'dates'"
                                            v-for="dateField in date_order" :key="dateField"
                                            class="text-end">
                                            <small>{{ getDateFieldValue(project, dateField) || '-' }}</small>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeProjectsModal()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `
});

const app = Vue.createApp(vTimeTrackingMain);
app.mount('#time_tracking_main');
