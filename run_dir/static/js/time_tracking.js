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
                'Library Prep Start',
                'Library Prep',
                'Sequencing Start',
                'Sequencing',
                'Data Delivery',
                'Analysis',
                'Processing Time',
                'Total Time'
            ],
            stage_definitions: {
                'Reception Control': ['open_date', 'queued'],
                'Library Prep Start': ['queued', 'library_prep_start'],
                'Library Prep': ['library_prep_start', 'qc_library_finished'],
                'Sequencing Start': ['qc_library_finished', 'sequencing_start_date'],
                'Sequencing': ['sequencing_start_date', 'all_samples_sequenced'],
                'Data Delivery': ['all_samples_sequenced', 'all_raw_data_delivered'],
                'Analysis': ['all_raw_data_delivered', 'best_practice_analysis_completed'],
                'Processing Time': ['queued', 'all_samples_sequenced'],
                'Total Time': ['queued', 'all_raw_data_delivered']
            }
        }
    },
    methods: {
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
                
                // Extract Production and Application data with Finished/Other subcategories
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
        setDefaults() {
            // Set default date range to last 6 months
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 180);
            
            this.end_date = end.toISOString().split('T')[0];
            this.start_date = start.toISOString().split('T')[0];
            
            this.fetchData();
        },
        updateChart() {
            if (this.plot_mode === 'methods') {
                this.renderMethodsChart();
            } else {
                this.renderStagesChart();
            }
        },
        renderMethodsChart() {
            // Render Production - Finished library chart
            const prodFinishedCtx = document.getElementById('productionFinishedChart');
            if (prodFinishedCtx) {
                this.destroyChart('production_finished_chart');
                this.renderMethodsChartForType(prodFinishedCtx, this.production_finished_data, 'production_finished_chart', 'Production - Finished library (by user)');
            }
            
            // Render Production - Other chart
            const prodOtherCtx = document.getElementById('productionOtherChart');
            if (prodOtherCtx) {
                this.destroyChart('production_other_chart');
                this.renderMethodsChartForType(prodOtherCtx, this.production_other_data, 'production_other_chart', 'Production - Other library methods');
            }
            
            // Render Application - Finished library chart
            const appFinishedCtx = document.getElementById('applicationFinishedChart');
            if (appFinishedCtx) {
                this.destroyChart('application_finished_chart');
                this.renderMethodsChartForType(appFinishedCtx, this.application_finished_data, 'application_finished_chart', 'Application - Finished library (by user)');
            }
            
            // Render Application - Other chart
            const appOtherCtx = document.getElementById('applicationOtherChart');
            if (appOtherCtx) {
                this.destroyChart('application_other_chart');
                this.renderMethodsChartForType(appOtherCtx, this.application_other_data, 'application_other_chart', 'Application - Other library methods');
            }
        },
        renderMethodsChartForType(ctx, dataSubset, chartInstanceName, typeLabel) {
            const availableMethods = Object.keys(dataSubset).sort();
            
            if (this.plot_style === 'merged') {
                this[chartInstanceName] = this.renderMergedMethodsChart(ctx, dataSubset, availableMethods, typeLabel);
            } else {
                this[chartInstanceName] = this.renderGroupedMethodsChart(ctx, dataSubset, availableMethods, typeLabel);
            }
        },
        renderMergedMethodsChart(ctx, dataSubset, labels, typeLabel) {
            // Show only Total Time for each method
            const datasets = [];
            
            // Collect only "Total Time" durations for each method
            const methodDurations = {};
            const methodProjects = {};
            for (const method of labels) {
                methodDurations[method] = [];
                methodProjects[method] = [];
                const stages = dataSubset[method];
                
                // Only use Total Time data
                if (stages['Total Time']) {
                    const totalTimeData = stages['Total Time'];
                    if (totalTimeData.durations) {
                        methodDurations[method] = totalTimeData.durations;
                        methodProjects[method] = totalTimeData.projects;
                    }
                }
            }
            
            // Create labels with counts
            const labelsWithCounts = labels.map(method => {
                const count = methodDurations[method].filter(d => typeof d === 'number' && !isNaN(d)).length;
                return `${method} (N=${count})`;
            });
            
            // Create boxplot data
            const boxplotData = labels.map(method => {
                const values = methodDurations[method].filter(d => typeof d === 'number' && !isNaN(d));
                if (values.length === 0) return null;
                
                values.sort((a, b) => a - b);
                const q1 = this.percentile(values, 25);
                const median = this.percentile(values, 50);
                const q3 = this.percentile(values, 75);
                const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                
                const { outliers, whiskerMin, whiskerMax } = this.calculateOutliers(values, q1, q3);
                
                return {
                    min: whiskerMin,
                    q1: q1,
                    median: median,
                    mean: mean,
                    q3: q3,
                    max: whiskerMax,
                    outliers: outliers,
                    method: method,
                    projects: methodProjects[method]
                };
            });
            
            const self = this;
            return new Chart(ctx, {
                type: 'boxplot',
                data: {
                    labels: labelsWithCounts,
                    datasets: [{
                        label: 'Duration (days)',
                        data: boxplotData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        meanRadius: 0,  // Hide mean point in plot
                        outlierRadius: 2,
                        outlierBackgroundColor: 'rgba(54, 162, 235, 0.7)',
                        outlierBorderColor: 'rgba(54, 162, 235, 1)',
                        outlierBorderWidth: 1.5
                    }]
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: function(event, elements) {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const method = labels[index];
                            const projects = methodProjects[method];
                            self.selected_projects = projects.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
                            self.modal_title = `${typeLabel} - ${method} - Total Time`;
                            self.modal_stage = 'Total Time';
                            self.show_projects_modal = true;
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${typeLabel} Projects: Duration by Method (Total Time)`
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const dataPoint = context.parsed;
                                    return [
                                        `Min: ${dataPoint.min}`,
                                        `Q1: ${dataPoint.q1}`,
                                        `Median: ${dataPoint.median}`,
                                        `Mean: ${dataPoint.mean?.toFixed(1)}`,
                                        `Q3: ${dataPoint.q3}`,
                                        `Max: ${dataPoint.max}`
                                    ];
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
                                text: 'Method'
                            }
                        }
                    }
                }
            });
        },
        renderGroupedMethodsChart(ctx, dataSubset, labels, typeLabel) {
            // Show separate boxplot for each stage, grouped by method
            const allStages = new Set();
            for (const method in dataSubset) {
                for (const stage in dataSubset[method]) {
                    allStages.add(stage);
                }
            }
            const stages = this.sortStages(Array.from(allStages));
            
            // Create labels without counts (since counts vary by stage in grouped view)
            const methodLabels = labels;
            
            const datasets = stages.map((stage, idx) => {
                
                const boxplotData = labels.map(method => {
                    const stageData = dataSubset[method] && dataSubset[method][stage];
                    if (!stageData || !stageData.durations || stageData.durations.length === 0) return null;
                    
                    const values = stageData.durations.filter(d => typeof d === 'number' && !isNaN(d));
                    if (values.length === 0) return null;
                    const sorted = [...values].sort((a, b) => a - b);
                    const q1 = this.percentile(sorted, 25);
                    const q3 = this.percentile(sorted, 75);
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    
                    const { outliers, whiskerMin, whiskerMax } = this.calculateOutliers(sorted, q1, q3);
                    
                    return {
                        min: whiskerMin,
                        q1: q1,
                        median: this.percentile(sorted, 50),
                        mean: mean,
                        q3: q3,
                        max: whiskerMax,
                        outliers: outliers,
                        method: method,
                        stage: stage,
                        items: values.length  // Store count for tooltip
                    };
                });
                
                const stageColor = this.getStageColor(stage);
                return {
                    label: stage,
                    data: boxplotData,
                    backgroundColor: stageColor,
                    borderColor: stageColor.replace('0.5', '1'),
                    borderWidth: 1,
                    meanRadius: 0,  // Hide mean point in plot
                    outlierRadius: 2,
                    outlierBackgroundColor: stageColor.replace('0.5', '0.7'),
                    outlierBorderColor: stageColor.replace('0.5', '1'),
                    outlierBorderWidth: 1.5
                };
            });
            
            const self = this;
            return new Chart(ctx, {
                type: 'boxplot',
                data: {
                    labels: methodLabels,
                    datasets: datasets
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: function(event, elements) {
                        if (elements.length > 0) {
                            const element = elements[0];
                            const datasetIndex = element.datasetIndex;
                            const index = element.index;
                            const stage = stages[datasetIndex];
                            const method = labels[index];
                            self.showProjectsForBox(method, stage, dataSubset);
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${typeLabel} Projects: Duration by Method (Grouped by Stage)`
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const dataPoint = context.parsed;
                                    const rawData = context.dataset.data[context.dataIndex];
                                    const stage = context.dataset.label;
                                    const count = rawData?.items || 0;
                                    return [
                                        `${stage} (N=${count})`,
                                        `Min: ${dataPoint.min}`,
                                        `Q1: ${dataPoint.q1}`,
                                        `Median: ${dataPoint.median}`,
                                        `Mean: ${dataPoint.mean?.toFixed(1)}`,
                                        `Q3: ${dataPoint.q3}`,
                                        `Max: ${dataPoint.max}`
                                    ];
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
                                text: 'Method'
                            }
                        }
                    }
                }
            });
        },
        renderStagesChart() {
            // Render Production - Finished library chart
            const prodFinishedCtx = document.getElementById('productionFinishedChart');
            if (prodFinishedCtx) {
                this.destroyChart('production_finished_chart');
                this.renderStagesChartForType(prodFinishedCtx, this.production_finished_data, 'production_finished_chart', 'Production - Finished library (by user)');
            }
            
            // Render Production - Other chart
            const prodOtherCtx = document.getElementById('productionOtherChart');
            if (prodOtherCtx) {
                this.destroyChart('production_other_chart');
                this.renderStagesChartForType(prodOtherCtx, this.production_other_data, 'production_other_chart', 'Production - Other library methods');
            }
            
            // Render Application - Finished library chart
            const appFinishedCtx = document.getElementById('applicationFinishedChart');
            if (appFinishedCtx) {
                this.destroyChart('application_finished_chart');
                this.renderStagesChartForType(appFinishedCtx, this.application_finished_data, 'application_finished_chart', 'Application - Finished library (by user)');
            }
            
            // Render Application - Other chart
            const appOtherCtx = document.getElementById('applicationOtherChart');
            if (appOtherCtx) {
                this.destroyChart('application_other_chart');
                this.renderStagesChartForType(appOtherCtx, this.application_other_data, 'application_other_chart', 'Application - Other library methods');
            }
        },
        renderStagesChartForType(ctx, dataSubset, chartInstanceName, typeLabel) {
            if (this.plot_style === 'merged') {
                this[chartInstanceName] = this.renderMergedStagesChart(ctx, dataSubset, typeLabel);
            } else {
                this[chartInstanceName] = this.renderGroupedStagesChart(ctx, dataSubset, typeLabel);
            }
        },
        renderMergedStagesChart(ctx, dataSubset, typeLabel) {
            // Merge all methods for each stage
            const allStages = new Set();
            for (const method in dataSubset) {
                for (const stage in dataSubset[method]) {
                    allStages.add(stage);
                }
            }
            const stages = this.sortStages(Array.from(allStages));
            
            // Collect all durations for each stage across all methods
            const stageDurations = {};
            const stageProjects = {};
            for (const stage of stages) {
                stageDurations[stage] = [];
                stageProjects[stage] = [];
                for (const method in dataSubset) {
                    if (dataSubset[method][stage]) {
                        const stageData = dataSubset[method][stage];
                        if (stageData.durations) {
                            stageDurations[stage].push(...stageData.durations);
                            stageProjects[stage].push(...stageData.projects);
                        }
                    }
                }
            }
            
            // Create labels with counts
            const labelsWithCounts = stages.map(stage => {
                const count = stageDurations[stage].filter(d => typeof d === 'number' && !isNaN(d)).length;
                return `${stage} (N=${count})`;
            });
            
            // Create boxplot data
            const boxplotData = stages.map(stage => {
                const values = stageDurations[stage].filter(d => typeof d === 'number' && !isNaN(d));
                if (values.length === 0) return null;
                
                values.sort((a, b) => a - b);
                const q1 = this.percentile(values, 25);
                const q3 = this.percentile(values, 75);
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                
                const { outliers, whiskerMin, whiskerMax } = this.calculateOutliers(values, q1, q3);
                
                return {
                    min: whiskerMin,
                    q1: q1,
                    median: this.percentile(values, 50),
                    mean: mean,
                    q3: q3,
                    max: whiskerMax,
                    outliers: outliers,
                    stage: stage,
                    projects: stageProjects[stage]
                };
            });
            
            const self = this;
            return new Chart(ctx, {
                type: 'boxplot',
                data: {
                    labels: labelsWithCounts,
                    datasets: [{
                        label: 'Duration (days)',
                        data: boxplotData,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        meanRadius: 0,  // Hide mean point in plot
                        outlierRadius: 2,
                        outlierBackgroundColor: 'rgba(75, 192, 192, 0.7)',
                        outlierBorderColor: 'rgba(75, 192, 192, 1)',
                        outlierBorderWidth: 1.5
                    }]
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: function(event, elements) {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const stage = stages[index];
                            const projects = stageProjects[stage];
                            self.selected_projects = projects.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
                            self.modal_title = `${typeLabel} - ${stage} - All Methods Combined`;
                            self.modal_stage = stage;
                            self.show_projects_modal = true;
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${typeLabel} Projects: Duration by Stage (All Methods Merged)`
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const dataPoint = context.parsed;
                                    return [
                                        `Min: ${dataPoint.min}`,
                                        `Q1: ${dataPoint.q1}`,
                                        `Median: ${dataPoint.median}`,
                                        `Mean: ${dataPoint.mean?.toFixed(1)}`,
                                        `Q3: ${dataPoint.q3}`,
                                        `Max: ${dataPoint.max}`
                                    ];
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
                                text: 'Stage'
                            }
                        }
                    }
                }
            });
        },
        renderGroupedStagesChart(ctx, dataSubset, typeLabel) {
            // Show separate boxplot for each method, grouped by stage
            const allStages = new Set();
            for (const method in dataSubset) {
                for (const stage in dataSubset[method]) {
                    allStages.add(stage);
                }
            }
            const stages = this.sortStages(Array.from(allStages));
            const availableMethods = Object.keys(dataSubset).sort();
            
            // Create labels without counts (since counts vary by method in grouped view)
            const labels = stages;
            
            const datasets = availableMethods.map((method, idx) => {
                
                const boxplotData = stages.map(stage => {
                    const stageData = dataSubset[method] && dataSubset[method][stage];
                    if (!stageData || !stageData.durations || stageData.durations.length === 0) return null;
                    
                    const values = stageData.durations.filter(d => typeof d === 'number' && !isNaN(d));
                    if (values.length === 0) return null;
                    const sorted = [...values].sort((a, b) => a - b);
                    const q1 = this.percentile(sorted, 25);
                    const q3 = this.percentile(sorted, 75);
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    
                    const { outliers, whiskerMin, whiskerMax } = this.calculateOutliers(sorted, q1, q3);
                    
                    return {
                        min: whiskerMin,
                        q1: q1,
                        median: this.percentile(sorted, 50),
                        mean: mean,
                        q3: q3,
                        max: whiskerMax,
                        outliers: outliers,
                        method: method,
                        stage: stage,
                        items: values.length  // Store count for tooltip
                    };
                });
                
                const methodColor = CHART_COLORS[idx % CHART_COLORS.length];
                return {
                    label: method,
                    data: boxplotData,
                    backgroundColor: methodColor,
                    borderColor: methodColor.replace('0.5', '1'),
                    borderWidth: 1,
                    meanRadius: 0,  // Hide mean point in plot
                    outlierRadius: 2,
                    outlierBackgroundColor: methodColor.replace('0.5', '0.7'),
                    outlierBorderColor: methodColor.replace('0.5', '1'),
                    outlierBorderWidth: 1.5
                };
            });
            
            const self = this;
            return new Chart(ctx, {
                type: 'boxplot',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: function(event, elements) {
                        if (elements.length > 0) {
                            const element = elements[0];
                            const datasetIndex = element.datasetIndex;
                            const index = element.index;
                            const method = availableMethods[datasetIndex];
                            const stage = stages[index];
                            self.showProjectsForBox(method, stage, dataSubset);
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${typeLabel} Projects: Duration by Stage (Grouped by Method)`
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const dataPoint = context.parsed;
                                    const rawData = context.dataset.data[context.dataIndex];
                                    const method = context.dataset.label;
                                    const count = rawData?.items || 0;
                                    return [
                                        `${method} (N=${count})`,
                                        `Min: ${dataPoint.min}`,
                                        `Q1: ${dataPoint.q1}`,
                                        `Median: ${dataPoint.median}`,
                                        `Mean: ${dataPoint.mean?.toFixed(1)}`,
                                        `Q3: ${dataPoint.q3}`,
                                        `Max: ${dataPoint.max}`
                                    ];
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
                                text: 'Stage'
                            }
                        }
                    }
                }
            });
        },
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
        changePlotMode(mode) {
            this.plot_mode = mode;
            this.updateChart();
        },
        changePlotStyle(style) {
            this.plot_style = style;
            this.updateChart();
        },
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
        calculateStageDuration(project, stage) {
            // Calculate duration for any stage given a project
            const stageDef = this.stage_definitions[stage];
            if (!stageDef) return null;
            
            const [startField, endField] = stageDef;
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
        closeProjectsModal() {
            this.show_projects_modal = false;
            this.selected_projects = [];
        }
    }
});

const app = Vue.createApp(vTimeTrackingMain);

app.component('v-time-tracking', {
    mounted: function() {
        this.$root.setDefaults();
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
                                <li><strong>Library Prep Start:</strong> From <code>queued</code> to <code>library_prep_start</code></li>
                                <li><strong>Library Prep:</strong> From <code>library_prep_start</code> to <code>qc_library_finished</code></li>
                                <li><strong>Sequencing Start:</strong> From <code>qc_library_finished</code> to <code>sequencing_start_date</code></li>
                                <li><strong>Sequencing:</strong> From <code>sequencing_start_date</code> to <code>all_samples_sequenced</code></li>
                                <li><strong>Data Delivery:</strong> From <code>all_samples_sequenced</code> to <code>all_raw_data_delivered</code></li>
                                <li><strong>Analysis:</strong> From <code>all_raw_data_delivered</code> to <code>best_practice_analysis_completed</code></li>
                                <li><strong>Processing Time:</strong> From <code>queued</code> to <code>all_samples_sequenced</code></li>
                                <li><strong>Total Time:</strong> From <code>queued</code> to <code>all_raw_data_delivered</code></li>
                            </ul>
                            <small class="text-muted">Note: Projects are only included in a stage if both the start and end dates are available.</small>
                        </div>
                    </div>
                </div>
                <p>
                    <strong>Stages include:</strong> Reception Control, Library Prep Start, Library Prep, Sequencing Start, 
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
                                       v-model="this.$root.start_date">
                            </div>
                            <div class="col-md-3">
                                <label for="end_date">End Date <small class="text-muted">(Delivery Date)</small>:</label>
                                <input type="date" 
                                       id="end_date" 
                                       class="form-control" 
                                       v-model="this.$root.end_date">
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-primary" 
                                        @click="this.$root.fetchData()" 
                                        :disabled="this.$root.loading">
                                    <span v-if="this.$root.loading">Loading...</span>
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
                                           :checked="this.$root.plot_mode === 'methods'"
                                           @change="this.$root.changePlotMode('methods')">
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
                                           :checked="this.$root.plot_mode === 'stages'"
                                           @change="this.$root.changePlotMode('stages')">
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
                                           :checked="this.$root.plot_style === 'merged'"
                                           @change="this.$root.changePlotStyle('merged')">
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
                                           :checked="this.$root.plot_style === 'grouped'"
                                           @change="this.$root.changePlotStyle('grouped')">
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
        <div v-if="this.$root.show_projects_modal" class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Projects: {{ this.$root.modal_title }}</h5>
                        <button type="button" class="btn-close" @click="this.$root.closeProjectsModal()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <p class="text-muted mb-0">
                                Showing {{ this.$root.selected_projects.length }} project(s) in this selection
                            </p>
                            <div class="btn-group btn-group-sm" role="group">
                                <input type="radio" class="btn-check" id="modal_view_durations" value="durations" 
                                    v-model="this.$root.modal_view_mode" autocomplete="off">
                                <label class="btn btn-outline-primary" for="modal_view_durations">Days Taken</label>
                                
                                <input type="radio" class="btn-check" id="modal_view_dates" value="dates" 
                                    v-model="this.$root.modal_view_mode" autocomplete="off">
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
                                        <th>Units Ordered</th>
                                        <th v-for="stage in this.$root.stage_order" :key="stage" 
                                            :class="{'fw-bold': stage === this.$root.modal_stage}">
                                            {{ stage }}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="project in this.$root.selected_projects" :key="project.project_id">
                                        <td>
                                            <a :href="'/project/' + project.project_id" target="_blank">
                                                {{ project.project_id }}
                                            </a>
                                        </td>
                                        <td>{{ project.project_name }}</td>
                                        <td><small>{{ project.library_construction }}</small></td>
                                        <td><small>{{ project.sequencing_platform }}</small></td>
                                        <td class="text-center">{{ project.sequence_units_ordered }}</td>
                                        <td v-for="stage in this.$root.stage_order" :key="stage" 
                                            class="text-end"
                                            :class="{'fw-bold': stage === this.$root.modal_stage}">
                                            <span v-if="this.$root.modal_view_mode === 'durations'">
                                                {{ this.$root.calculateStageDuration(project, stage) ?? '-' }}
                                            </span>
                                            <span v-else>
                                                <small>{{ this.$root.getStageEndDate(project, stage) || '-' }}</small>
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="this.$root.closeProjectsModal()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `
});

app.mount('#time_tracking_main');
