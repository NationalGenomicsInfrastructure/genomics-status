const vDemuxSampleInfoEditor = {
    data() {
        const config = window.STATUS_CONFIG || {};
        const defaultVisibleColumns = ['sample_id', 'last_modified', 'sample_type', 'index_1', 'index_2', 'umi_config', 'recipe', 'override_cycles'];
        return {
            limsUrl: config.lims_url || '',
            flowcell_id: '',
            demux_data: null,
            editedData: {},  // Stores edited settings per sample: { lane: { uuid: settings_object } }
            error_messages: [],
            loading: false,
            saving: false,
            viewMode: 'calculated',  // 'uploaded', 'calculated', 'grouped_named_index'
            selectedVersion: null,
            availableColumns: [
                { key: 'lane', label: 'Lane' },
                { key: 'sample_id', label: 'Sample ID' },
                { key: 'sample_name', label: 'Sample Name' },
                { key: 'sample_project', label: 'Sample Project' },
                { key: 'project_name', label: 'Project Name' },
                { key: 'project_id', label: 'Project ID' },
                { key: 'sample_ref', label: 'Sample Ref' },
                { key: 'sample_type', label: 'Sample Type' },
                { key: 'config_sources', label: 'Config Sources (Stage 1: Classification)' },
                { key: 'index_1', label: 'Index 1' },
                { key: 'index_2', label: 'Index 2' },
                { key: 'index_length', label: 'Index Length' },
                { key: 'umi_length', label: 'UMI Length' },
                { key: 'umi_config', label: 'UMI Config' },
                { key: 'named_index', label: 'Named Index' },
                { key: 'recipe', label: 'Recipe' },
                { key: 'operator', label: 'Operator' },
                { key: 'description', label: 'Description' },
                { key: 'control', label: 'Control' },
                { key: 'mask_short_reads', label: 'Mask Short Reads' },
                { key: 'minimum_trimmed_read_length', label: 'Min Trimmed Length' },
                { key: 'override_cycles', label: 'Override Cycles' },
                { key: 'last_modified', label: 'Last Modified' }
            ],
            visibleColumns: defaultVisibleColumns,
            defaultVisibleColumns: defaultVisibleColumns,
            showBulkEditModal: false,
            columnConfigCollapsed: true,
            groupByNamedIndex: false,
            groupByProjectFirst: false,
            saveComment: '',
            bulkEditAction: 'reverse_complement_index1',
            bulkEditProject: '',
            bulkEditLane: 'all',
            showEditModal: false,
            editModalSample: null,
            editModalLane: null,
            editModalUuid: null,
            editModalIsNew: false,
            editFormData: {},
            fieldHistory: {},
            showFieldHistory: false,
            samplePresets: null,  // Sample classification presets
            selectedPreset: '',  // Currently selected preset
            sampleClassificationConfig: null,  // Full sample classification configuration
            showConfigModal: false,
            configModalSources: [],
            configModalSample: null,
            expandedConfigSources: [],  // Track which config sources are expanded
            showCustomConfigModal: false,
            customConfigEditMode: false,  // Track if editing existing config
            customConfigEditIndex: null,  // Track which config is being edited
            customConfigFormData: {
                name: '',
                target_type: 'project',  // 'project', 'lane', or 'project_lane'
                target_project: '',
                target_lane: '',
                trim_umi: null,
                create_fastq_for_index_reads: null,
                barcode_mismatches_index1: null,
                barcode_mismatches_index2: null,
                // Stage 2: samplesheet_generation_rules
                enable_stage2_rules: false,
                stage2_trim_umi_action: 'keep',  // 'keep', 'exclude'
                stage2_trim_umi_conditions: {
                    sample_type: '',
                    umi_config: ''
                },
                stage2_create_fastq_action: 'keep',
                stage2_create_fastq_conditions: {
                    sample_type: '',
                    umi_config: ''
                }
            },
            customConfigsCollapsed: true  // Track custom configs section collapse state
        }
    },
    computed: {
        uploadedSamplesByLane() {
            if (!this.demux_data || !this.demux_data.uploaded_lims_info) {
                return {};
            }

            const grouped = {};
            this.demux_data.uploaded_lims_info.forEach(sample => {
                const lane = sample.lane;
                if (!grouped[lane]) {
                    grouped[lane] = [];
                }
                grouped[lane].push(sample);
            });

            // Sort lanes numerically
            return Object.keys(grouped)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .reduce((acc, lane) => {
                    acc[lane] = grouped[lane];
                    return acc;
                }, {});
        },
        versionTimestamps() {
            if (!this.demux_data || !this.demux_data.calculated || !this.demux_data.calculated.version_history) {
                return [];
            }
            return Object.keys(this.demux_data.calculated.version_history).sort().reverse();
        },
        currentVersion() {
            if (!this.selectedVersion && this.versionTimestamps.length > 0) {
                return this.versionTimestamps[0];
            }
            return this.selectedVersion;
        },
        versionInfo() {
            if (!this.demux_data || !this.currentVersion) {
                return null;
            }
            return this.demux_data.calculated.version_history[this.currentVersion];
        },
        calculatedData() {
            if (!this.demux_data || !this.demux_data.calculated) {
                return {};
            }
        },
        calculatedLanes() {
            if (!this.demux_data || !this.demux_data.calculated || !this.demux_data.calculated.lanes) {
                return {};
            }
            return this.demux_data.calculated.lanes;
        },
        calculatedSamplesFlat() {
            // Flatten calculated sample_rows with their latest settings for table display
            // If there are edits, merge them with original data
            const result = {};

            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                result[lane] = [];

                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    // Get the latest settings version
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];

                    // Check if there's an edited version for this sample
                    const editedSettings = this.editedData[lane]?.[uuid] || {};

                    // Extract per_sample_fields and other_details from original settings
                    const per_sample_fields = latestSettings.per_sample_fields || {};
                    const other_details = latestSettings.other_details || {};

                    result[lane].push({
                        uuid: uuid,
                        lane: per_sample_fields.Lane,
                        sample_id: editedSettings.sample_id !== undefined ? editedSettings.sample_id : per_sample_fields.Sample_ID,
                        sample_name: editedSettings.sample_name !== undefined ? editedSettings.sample_name : per_sample_fields.Sample_Name,
                        sample_project: editedSettings.sample_project !== undefined ? editedSettings.sample_project : per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: editedSettings.sample_ref !== undefined ? editedSettings.sample_ref : other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: editedSettings.index_1 !== undefined ? editedSettings.index_1 : per_sample_fields.index,
                        index_2: editedSettings.index_2 !== undefined ? editedSettings.index_2 : per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: editedSettings.named_index !== undefined ? editedSettings.named_index : other_details.named_index,
                        recipe: editedSettings.recipe !== undefined ? editedSettings.recipe : other_details.recipe,
                        operator: editedSettings.operator !== undefined ? editedSettings.operator : other_details.operator,
                        description: editedSettings.description !== undefined ? editedSettings.description : sample.description,
                        control: editedSettings.control !== undefined ? editedSettings.control : sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: editedSettings.override_cycles !== undefined ? editedSettings.override_cycles : per_sample_fields.OverrideCycles
                    });
                });
            });

            return result;
        },
        calculatedSamplesByLaneAndProject() {
            // Group samples by lane and then by project
            const result = {};

            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                result[lane] = {};

                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    // Get the latest settings version
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];

                    // Check if there's an edited version for this sample
                    const editedSettings = this.editedData[lane]?.[uuid] || {};

                    // Extract per_sample_fields and other_details from original settings
                    const per_sample_fields = latestSettings.per_sample_fields || {};
                    const other_details = latestSettings.other_details || {};

                    const projectName = sample.project_name || 'Unknown Project';

                    if (!result[lane][projectName]) {
                        result[lane][projectName] = [];
                    }

                    result[lane][projectName].push({
                        uuid: uuid,
                        lane: per_sample_fields.Lane,
                        sample_id: editedSettings.sample_id !== undefined ? editedSettings.sample_id : per_sample_fields.Sample_ID,
                        sample_name: editedSettings.sample_name !== undefined ? editedSettings.sample_name : per_sample_fields.Sample_Name,
                        sample_project: editedSettings.sample_project !== undefined ? editedSettings.sample_project : per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: editedSettings.sample_ref !== undefined ? editedSettings.sample_ref : other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: editedSettings.index_1 !== undefined ? editedSettings.index_1 : per_sample_fields.index,
                        index_2: editedSettings.index_2 !== undefined ? editedSettings.index_2 : per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: editedSettings.named_index !== undefined ? editedSettings.named_index : other_details.named_index,
                        recipe: editedSettings.recipe !== undefined ? editedSettings.recipe : other_details.recipe,
                        operator: editedSettings.operator !== undefined ? editedSettings.operator : other_details.operator,
                        description: editedSettings.description !== undefined ? editedSettings.description : sample.description,
                        control: editedSettings.control !== undefined ? editedSettings.control : sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: editedSettings.override_cycles !== undefined ? editedSettings.override_cycles : per_sample_fields.OverrideCycles
                    });
                });
            });

            return result;
        },
        calculatedSamplesByLaneProjectAndNamedIndex() {
        // Group samples by lane, then by project, then optionally by named index
            const result = {};

            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                result[lane] = {};

                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    // Get the latest settings version
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];

                    // Check if there's an edited version for this sample
                    const editedSettings = this.editedData[lane]?.[uuid] || {};

                    // Extract per_sample_fields and other_details from original settings
                    const per_sample_fields = latestSettings.per_sample_fields || {};
                    const other_details = latestSettings.other_details || {};

                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = (editedSettings.named_index !== undefined ? editedSettings.named_index : other_details.named_index) || 'No Named Index';

                    if (!result[lane][projectName]) {
                        result[lane][projectName] = {};
                    }

                    // Group by named index if enabled, otherwise use a default key
                    const groupKey = this.groupByNamedIndex ? namedIndex : '_all_';

                    if (!result[lane][projectName][groupKey]) {
                        result[lane][projectName][groupKey] = [];
                    }

                    result[lane][projectName][groupKey].push({
                        uuid: uuid,
                        lane: per_sample_fields.Lane,
                        sample_id: editedSettings.sample_id !== undefined ? editedSettings.sample_id : per_sample_fields.Sample_ID,
                        sample_name: editedSettings.sample_name !== undefined ? editedSettings.sample_name : per_sample_fields.Sample_Name,
                        sample_project: editedSettings.sample_project !== undefined ? editedSettings.sample_project : per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: editedSettings.sample_ref !== undefined ? editedSettings.sample_ref : other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: editedSettings.index_1 !== undefined ? editedSettings.index_1 : per_sample_fields.index,
                        index_2: editedSettings.index_2 !== undefined ? editedSettings.index_2 : per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: editedSettings.named_index !== undefined ? editedSettings.named_index : other_details.named_index,
                        recipe: editedSettings.recipe !== undefined ? editedSettings.recipe : other_details.recipe,
                        operator: editedSettings.operator !== undefined ? editedSettings.operator : other_details.operator,
                        description: editedSettings.description !== undefined ? editedSettings.description : sample.description,
                        control: editedSettings.control !== undefined ? editedSettings.control : sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: editedSettings.override_cycles !== undefined ? editedSettings.override_cycles : per_sample_fields.OverrideCycles
                    });
                });
            });

            return result;
        },
        calculatedSamplesByProjectLaneAndNamedIndex() {
            // Group samples by project first, then by lane, then optionally by named index
            const result = {};

            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    // Get the latest settings version
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];

                    // Check if there's an edited version for this sample
                    const editedSettings = this.editedData[lane]?.[uuid] || {};

                    // Extract per_sample_fields and other_details from original settings
                    const per_sample_fields = latestSettings.per_sample_fields || {};
                    const other_details = latestSettings.other_details || {};

                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = (editedSettings.named_index !== undefined ? editedSettings.named_index : other_details.named_index) || 'No Named Index';

                    if (!result[projectName]) {
                        result[projectName] = {};
                    }

                    if (!result[projectName][lane]) {
                        result[projectName][lane] = {};
                    }

                    // Group by named index if enabled, otherwise use a default key
                    const groupKey = this.groupByNamedIndex ? namedIndex : '_all_';

                    if (!result[projectName][lane][groupKey]) {
                        result[projectName][lane][groupKey] = [];
                    }

                    result[projectName][lane][groupKey].push({
                        uuid: uuid,
                        lane: per_sample_fields.Lane,
                        sample_id: editedSettings.sample_id !== undefined ? editedSettings.sample_id : per_sample_fields.Sample_ID,
                        sample_name: editedSettings.sample_name !== undefined ? editedSettings.sample_name : per_sample_fields.Sample_Name,
                        sample_project: editedSettings.sample_project !== undefined ? editedSettings.sample_project : per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: editedSettings.sample_ref !== undefined ? editedSettings.sample_ref : other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: editedSettings.index_1 !== undefined ? editedSettings.index_1 : per_sample_fields.index,
                        index_2: editedSettings.index_2 !== undefined ? editedSettings.index_2 : per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: editedSettings.named_index !== undefined ? editedSettings.named_index : other_details.named_index,
                        recipe: editedSettings.recipe !== undefined ? editedSettings.recipe : other_details.recipe,
                        operator: editedSettings.operator !== undefined ? editedSettings.operator : other_details.operator,
                        description: editedSettings.description !== undefined ? editedSettings.description : sample.description,
                        control: editedSettings.control !== undefined ? editedSettings.control : sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: editedSettings.override_cycles !== undefined ? editedSettings.override_cycles : per_sample_fields.OverrideCycles
                    });
                });
            });

            return result;
        },
        columnLabel() {
            // Create a map of column keys to labels for quick lookup
            return this.availableColumns.reduce((acc, col) => {
                acc[col.key] = col.label;
                return acc;
            }, {});
        },
        hasChanges() {
            // Check if there are any unsaved changes
            return Object.keys(this.editedData).some(lane => {
                return Object.keys(this.editedData[lane] || {}).length > 0;
            });
        },
        availableProjects() {
            // Get unique list of projects from calculated sample_rows
            const projects = new Set();
            Object.values(this.calculatedLanes).forEach(laneData => {
                Object.values(laneData.sample_rows).forEach(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    if (sampleProject) {
                        projects.add(sampleProject);
                    }
                });
            });
            return Array.from(projects).sort();
        },
        availableLanes() {
            // Get list of lanes
            return Object.keys(this.calculatedLanes).sort((a, b) => parseInt(a) - parseInt(b));
        },
        projectLanes() {
            // Get lanes that contain the selected project
            if (!this.bulkEditProject) return [];

            const lanes = [];
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                const hasProject = Object.values(laneData.sample_rows).some(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    return latestSettings.per_sample_fields?.Sample_Project === this.bulkEditProject;
                });
                if (hasProject) {
                    lanes.push(lane);
                }
            });
            return lanes.sort((a, b) => parseInt(a) - parseInt(b));
        },
        isSingleLaneProject() {
            return this.projectLanes.length === 1;
        },
        nextSampleId() {
            // Calculate the next sample ID for the selected project
            if (!this.bulkEditProject) return '';

            // Find all sample IDs for this project across all lanes
            const sampleIds = [];
            Object.values(this.calculatedLanes).forEach(laneData => {
                Object.values(laneData.sample_rows).forEach(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    if (latestSettings.per_sample_fields?.Sample_Project === this.bulkEditProject) {
                        sampleIds.push(latestSettings.per_sample_fields?.Sample_ID);
                    }
                });
            });

            if (sampleIds.length === 0) return 'P000_001'; // Fallback if no samples found

            // Extract the project prefix from existing sample IDs (part before first underscore)
            let projectPrefix = '';
            let maxNumber = 0;

            sampleIds.forEach(sampleId => {
                // Extract the prefix and number part
                const underscoreIndex = sampleId.indexOf('_');
                if (underscoreIndex > 0) {
                    const prefix = sampleId.substring(0, underscoreIndex);
                    const numPart = sampleId.substring(underscoreIndex + 1);
                    const num = parseInt(numPart);

                    // Use the first valid prefix we find
                    if (!projectPrefix) {
                        projectPrefix = prefix;
                    }

                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            });

            if (!projectPrefix) return 'P000_001'; // Fallback
            if (maxNumber === 0) return projectPrefix + '_001';

            // Calculate next number: increment leading digit, reset rest to 001
            const maxStr = maxNumber.toString();
            const leadingDigit = parseInt(maxStr[0]);
            const nextLeadingDigit = leadingDigit + 1;
            const nextNumber = nextLeadingDigit.toString() + '001';

            return projectPrefix + '_' + nextNumber;
        },
        samplesheets() {
            // Return pre-generated samplesheets from the server
            if (!this.demux_data || !this.demux_data.samplesheets) return [];
            return this.demux_data.samplesheets;
        },
        customConfigTargetSamples() {
            // Get samples that match the custom config target criteria
            if (!this.demux_data) return [];

            // For "lane" type, we don't need target_project
            const needsProject = this.customConfigFormData.target_type !== 'lane';
            if (needsProject && !this.customConfigFormData.target_project) return [];

            const matchingSamples = [];
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                // Check if lane matches (if target_type includes lane filtering)
                const laneMatches = this.customConfigFormData.target_type === 'project' ||
                    this.customConfigFormData.target_lane === lane;

                if (!laneMatches) return;

                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;

                    // For "lane" type, include all projects; otherwise check for matching project
                    const projectMatches = this.customConfigFormData.target_type === 'lane' ||
                        sampleProject === this.customConfigFormData.target_project;

                    if (projectMatches) {
                        matchingSamples.push({
                            lane,
                            uuid,
                            sample_id: latestSettings.per_sample_fields?.Sample_ID,
                            sample,
                            latestSettings
                        });
                    }
                });
            });

            return matchingSamples;
        },
        sortedConfigModalSettings() {
            // Return settings sorted by timestamp in descending order (newest first)
            if (!this.configModalSample.settings) {
                return [];
            }
            return Object.entries(this.configModalSample.settings)
                .sort((a, b) => b[0].localeCompare(a[0])); // ISO timestamps sort lexicographically
        }
    },
    methods: {
        fetchSamplePresets() {
            // Fetch sample classification presets from the API
            if (this.samplePresets) return; // Already loaded

            axios.get('/api/v1/sample_classification_presets')
                .then(response => {
                    this.samplePresets = response.data;
                })
                .catch(error => {
                    console.error('Failed to load sample presets:', error);
                });
        },
        fetchSampleClassificationConfig() {
            // Fetch full sample classification configuration from the API
            if (this.sampleClassificationConfig) return; // Already loaded

            axios.get('/api/v1/sample_classification_config')
                .then(response => {
                    this.sampleClassificationConfig = response.data;
                })
                .catch(error => {
                    console.error('Failed to load sample classification config:', error);
                });
        },
        openConfigModal(sample, lane) {
            // Open modal to show config sources and their details
            const configSources = this.getConfigSources(sample);
            this.configModalSources = configSources;
            this.configModalSample = sample;
            this.expandedConfigSources = [];  // All cards collapsed by default
            this.showConfigModal = true;

            // Fetch config if not already loaded
            this.fetchSampleClassificationConfig();
        },
        closeConfigModal() {
            this.showConfigModal = false;
            this.configModalSources = [];
            this.configModalSample = null;
            this.expandedConfigSources = [];
        },
        openCustomConfigModal(configToEdit = null, configIndex = null) {
            // Open modal to create or edit custom configuration
            if (configToEdit) {
                // Edit mode - populate form with existing config
                this.customConfigEditMode = true;
                this.customConfigEditIndex = configIndex;
                this.customConfigFormData = {
                    name: configToEdit.name,
                    target_type: configToEdit.target_type,
                    target_project: configToEdit.target_project,
                    target_lane: configToEdit.target_lane || '',
                    trim_umi: configToEdit.raw_samplesheet_settings?.TrimUMI ?? null,
                    create_fastq_for_index_reads: configToEdit.raw_samplesheet_settings?.CreateFastqForIndexReads ?? null,
                    barcode_mismatches_index1: configToEdit.raw_samplesheet_settings?.BarcodeMismatchesIndex1 ?? null,
                    barcode_mismatches_index2: configToEdit.raw_samplesheet_settings?.BarcodeMismatchesIndex2 ?? null,
                    // Stage 2: Load existing rules if present
                    enable_stage2_rules: !!(configToEdit.samplesheet_generation_rules && Object.keys(configToEdit.samplesheet_generation_rules).length > 0),
                    stage2_trim_umi_action: 'keep',
                    stage2_trim_umi_conditions: { sample_type: '', umi_config: '' },
                    stage2_create_fastq_action: 'keep',
                    stage2_create_fastq_conditions: { sample_type: '', umi_config: '' }
                };
                
                // Parse existing Stage 2 rules if they exist
                if (configToEdit.samplesheet_generation_rules) {
                    const rules = configToEdit.samplesheet_generation_rules;
                    if (rules.TrimUMI && rules.TrimUMI.length > 0) {
                        const rule = rules.TrimUMI[0];
                        this.customConfigFormData.stage2_trim_umi_action = rule.value === 'EXCLUDE' ? 'exclude' : 'keep';
                        if (rule.conditions) {
                            this.customConfigFormData.stage2_trim_umi_conditions = {
                                sample_type: rule.conditions.sample_type || '',
                                umi_config: rule.conditions.umi_config || ''
                            };
                        }
                    }
                    if (rules.CreateFastqForIndexReads && rules.CreateFastqForIndexReads.length > 0) {
                        const rule = rules.CreateFastqForIndexReads[0];
                        this.customConfigFormData.stage2_create_fastq_action = rule.value === 'EXCLUDE' ? 'exclude' : 'keep';
                        if (rule.conditions) {
                            this.customConfigFormData.stage2_create_fastq_conditions = {
                                sample_type: rule.conditions.sample_type || '',
                                umi_config: rule.conditions.umi_config || ''
                            };
                        }
                    }
                }
            } else {
                // Create mode - reset form
                this.customConfigEditMode = false;
                this.customConfigEditIndex = null;
                this.customConfigFormData = {
                    name: '',
                    target_type: 'project',
                    target_project: '',
                    target_lane: '',
                    trim_umi: null,
                    create_fastq_for_index_reads: null,
                    barcode_mismatches_index1: null,
                    barcode_mismatches_index2: null,
                    // Stage 2: Reset rules
                    enable_stage2_rules: false,
                    stage2_trim_umi_action: 'keep',
                    stage2_trim_umi_conditions: { sample_type: '', umi_config: '' },
                    stage2_create_fastq_action: 'keep',
                    stage2_create_fastq_conditions: { sample_type: '', umi_config: '' }
                };
            }
            this.showCustomConfigModal = true;
        },
        closeCustomConfigModal() {
            this.showCustomConfigModal = false;
            // Reset the form state to prevent issues when reopening
            this.customConfigEditMode = false;
            this.customConfigEditIndex = null;
            this.customConfigFormData = {
                name: '',
                target_type: 'project',
                target_project: '',
                target_lane: '',
                trim_umi: null,
                create_fastq_for_index_reads: null,
                barcode_mismatches_index1: null,
                barcode_mismatches_index2: null
            };
        },
        saveCustomConfig() {
            // Validate inputs
            if (!this.customConfigFormData.name) {
                alert('Please provide a name for this custom configuration.');
                return;
            }
            // Target project is only required for 'project' and 'project_lane' types
            if ((this.customConfigFormData.target_type === 'project' || this.customConfigFormData.target_type === 'project_lane')
                && !this.customConfigFormData.target_project) {
                alert('Please select a target project.');
                return;
            }
            if ((this.customConfigFormData.target_type === 'lane' || this.customConfigFormData.target_type === 'project_lane')
                && !this.customConfigFormData.target_lane) {
                alert('Please select a target lane.');
                return;
            }

            // Check if at least one setting is configured (Stage 1 or Stage 2)
            const hasStage1Settings = this.customConfigFormData.trim_umi !== null ||
                this.customConfigFormData.create_fastq_for_index_reads !== null ||
                this.customConfigFormData.barcode_mismatches_index1 !== null ||
                this.customConfigFormData.barcode_mismatches_index2 !== null;
                
            const hasStage2Rules = this.customConfigFormData.enable_stage2_rules && (
                this.customConfigFormData.stage2_trim_umi_action === 'exclude' ||
                this.customConfigFormData.stage2_create_fastq_action === 'exclude'
            );

            if (!hasStage1Settings && !hasStage2Rules) {
                alert('Please configure at least one Stage 1 setting or Stage 2 rule.');
                return;
            }

            // Build the custom config object
            const customConfig = {
                name: this.customConfigFormData.name,
                target_type: this.customConfigFormData.target_type,
                raw_samplesheet_settings: {},
                edit_mode: this.customConfigEditMode,
                edit_index: this.customConfigEditIndex
            };

            // Add target_project only if it's provided (not needed for "lane" type)
            if (this.customConfigFormData.target_project) {
                customConfig.target_project = this.customConfigFormData.target_project;
            }

            if (this.customConfigFormData.target_type !== 'project') {
                customConfig.target_lane = this.customConfigFormData.target_lane;
            }

            // Add only non-null raw_samplesheet_settings
            if (this.customConfigFormData.trim_umi !== null) {
                customConfig.raw_samplesheet_settings.TrimUMI = this.customConfigFormData.trim_umi;
            }
            if (this.customConfigFormData.create_fastq_for_index_reads !== null) {
                customConfig.raw_samplesheet_settings.CreateFastqForIndexReads = this.customConfigFormData.create_fastq_for_index_reads;
            }
            if (this.customConfigFormData.barcode_mismatches_index1 !== null) {
                customConfig.raw_samplesheet_settings.BarcodeMismatchesIndex1 = this.customConfigFormData.barcode_mismatches_index1;
            }
            if (this.customConfigFormData.barcode_mismatches_index2 !== null) {
                customConfig.raw_samplesheet_settings.BarcodeMismatchesIndex2 = this.customConfigFormData.barcode_mismatches_index2;
            }

            // Build Stage 2: samplesheet_generation_rules
            if (this.customConfigFormData.enable_stage2_rules) {
                customConfig.samplesheet_generation_rules = {};
                
                // TrimUMI rule
                if (this.customConfigFormData.stage2_trim_umi_action === 'exclude') {
                    const conditions = {};
                    if (this.customConfigFormData.stage2_trim_umi_conditions.sample_type) {
                        conditions.sample_type = this.customConfigFormData.stage2_trim_umi_conditions.sample_type;
                    }
                    if (this.customConfigFormData.stage2_trim_umi_conditions.umi_config) {
                        conditions.umi_config = this.customConfigFormData.stage2_trim_umi_conditions.umi_config;
                    }
                    
                    customConfig.samplesheet_generation_rules.TrimUMI = [{
                        name: "custom_exclude_trim_umi",
                        conditions: conditions,
                        action: "set_value",
                        value: "EXCLUDE"
                    }];
                }
                
                // CreateFastqForIndexReads rule
                if (this.customConfigFormData.stage2_create_fastq_action === 'exclude') {
                    const conditions = {};
                    if (this.customConfigFormData.stage2_create_fastq_conditions.sample_type) {
                        conditions.sample_type = this.customConfigFormData.stage2_create_fastq_conditions.sample_type;
                    }
                    if (this.customConfigFormData.stage2_create_fastq_conditions.umi_config) {
                        conditions.umi_config = this.customConfigFormData.stage2_create_fastq_conditions.umi_config;
                    }
                    
                    customConfig.samplesheet_generation_rules.CreateFastqForIndexReads = [{
                        name: "custom_exclude_create_fastq",
                        conditions: conditions,
                        action: "set_value",
                        value: "EXCLUDE"
                    }];
                }
            }

            // Send to backend
            this.error_messages = [];

            const payload = {
                flowcell_id: this.flowcell_id,
                custom_config: customConfig
            };

            axios.post(`/api/v1/demux_sample_info/${this.flowcell_id}/custom_config`, payload)
                .then(response => {
                    // Refresh the data after successful save
                    this.demux_data = response.data;
                    this.closeCustomConfigModal();
                    const action = this.customConfigEditMode ? 'updated' : 'created';
                    alert(`Custom configuration ${action} successfully!`);
                })
                .catch(error => {
                    this.error_messages.push('Error saving custom configuration. Please try again.');
                    console.error(error);
                });
        },
        toggleConfigSource(index) {
            // Toggle the expanded state of a config source
            const idx = this.expandedConfigSources.indexOf(index);
            if (idx > -1) {
                this.expandedConfigSources.splice(idx, 1);
            } else {
                this.expandedConfigSources.push(index);
            }
        },
        isConfigSourceExpanded(index) {
            // Check if a config source is expanded
            return this.expandedConfigSources.includes(index);
        },

        getConfigDetails(configSource) {
            // Parse config source and return the configuration details
            if (!this.sampleClassificationConfig) return null;

            // Handle conditional rules specially
            // Format: "patterns.idt_umi.conditional_rule.TrimUMI:exclude_if_no_umi_detected"
            // Format: "control_patterns.conditional_rule.TrimUMI:exclude_for_controls"
            if (configSource.includes('.conditional_rule.')) {
                const parts = configSource.split('.conditional_rule.');
                if (parts.length !== 2) return null;

                const tierPath = parts[0]; // e.g., "patterns.idt_umi" or "control_patterns"
                const ruleSpec = parts[1]; // e.g., "TrimUMI:exclude_if_no_umi_detected"
                const [settingName, ruleName] = ruleSpec.split(':');

                // Parse the tier path
                const tierParts = tierPath.split('.');
                const category = tierParts[0]; // e.g., "patterns", "other_general_sample_types", "control_patterns"

                let conditionalRules = null;

                if (category === 'control_patterns') {
                    // Control patterns have rules at top level
                    conditionalRules = this.sampleClassificationConfig.control_conditional_rules;
                } else if (category === 'patterns') {
                    const patternKey = tierParts[1];
                    conditionalRules = this.sampleClassificationConfig.patterns?.[patternKey]?.conditional_rules;
                } else if (category === 'other_general_sample_types') {
                    const typeKey = tierParts[1];
                    conditionalRules = this.sampleClassificationConfig.other_general_sample_types?.[typeKey]?.conditional_rules;
                } else if (category === 'library_method_mapping') {
                    const methodKey = tierParts.slice(1).join('.');
                    conditionalRules = this.sampleClassificationConfig.library_method_mapping?.[methodKey]?.conditional_rules;
                } else if (category === 'instrument_type_mapping') {
                    // Handle: "instrument_type_mapping.NovaSeqXPlus.conditional_rule.X"
                    // or "instrument_type_mapping.NovaSeqXPlus.run_modes.10B.conditional_rule.X"
                    const instrumentType = tierParts[1];

                    if (tierParts.length === 2) {
                        // Instrument type level
                        conditionalRules = this.sampleClassificationConfig.instrument_type_mapping?.[instrumentType]?.conditional_rules;
                    } else if (tierParts.length === 4 && tierParts[2] === 'run_modes') {
                        // Run mode level
                        const runMode = tierParts[3];
                        conditionalRules = this.sampleClassificationConfig.instrument_type_mapping?.[instrumentType]?.run_modes?.[runMode]?.conditional_rules;
                    }
                }

                if (conditionalRules && conditionalRules[settingName]) {
                    // Find the specific rule by name
                    const rule = conditionalRules[settingName].find(r => r.name === ruleName);
                    if (rule) {
                        return {
                            _type: 'conditional_rule',
                            setting_name: settingName,
                            rule_name: ruleName,
                            rule: rule,
                            tier_path: tierPath
                        };
                    }
                }

                return null;
            }

            const parts = configSource.split('.');
            if (parts.length < 2) return null;

            const category = parts[0];  // e.g., "patterns", "library_method_mapping", "bcl_convert_settings", "instrument_type_mapping", "custom_config"
            const key = parts.slice(1).join('.');  // e.g., "tenx_single", "raw_samplesheet_settings"

            if (category === 'bcl_convert_settings') {
                return this.sampleClassificationConfig.bcl_convert_settings?.[key];
            } else if (category === 'patterns') {
                return this.sampleClassificationConfig.patterns?.[key];
            } else if (category === 'other_general_sample_types') {
                return this.sampleClassificationConfig.other_general_sample_types?.[key];
            } else if (category === 'library_method_mapping') {
                return this.sampleClassificationConfig.library_method_mapping?.[key];
            } else if (category === 'control_patterns') {
                return { control_patterns: this.sampleClassificationConfig.control_patterns };
            } else if (category === 'instrument_type_mapping') {
                // Handle instrument type configs: "instrument_type_mapping.NovaSeqXPlus" or "instrument_type_mapping.NovaSeqXPlus.run_modes.10B"
                const restParts = parts.slice(1);  // e.g., ["NovaSeqXPlus"] or ["NovaSeqXPlus", "run_modes", "10B"]
                const instrumentType = restParts[0];

                if (!this.sampleClassificationConfig.instrument_type_mapping?.[instrumentType]) {
                    return null;
                }

                if (restParts.length === 1) {
                    // Just the instrument type
                    return this.sampleClassificationConfig.instrument_type_mapping[instrumentType];
                } else if (restParts.length === 3 && restParts[1] === 'run_modes') {
                    // Instrument type with run mode: instrument_type_mapping.NovaSeqXPlus.run_modes.10B
                    const runMode = restParts[2];
                    return this.sampleClassificationConfig.instrument_type_mapping[instrumentType].run_modes?.[runMode];
                }
            } else if (category === 'custom_config') {
                // Handle custom configs: "custom_config.MyCustomConfig"
                const configName = key;
                if (this.demux_data?.custom_configs) {
                    const customConfig = this.demux_data.custom_configs.find(c => c.name === configName);
                    return customConfig || null;
                }
            }

            return null;
        },
        formatConfigValue(value) {
            // Format configuration value for display
            if (value === null || value === undefined) {
                return 'null';
            }

            // Special handling for conditional rule objects
            if (typeof value === 'object' && value._type === 'conditional_rule') {
                const rule = value.rule;
                const parts = [];

                parts.push(`Setting: ${value.setting_name}`);
                parts.push(`Rule: ${value.rule_name}`);
                if (rule.description) {
                    parts.push(`Description: ${rule.description}`);
                }
                parts.push(`Action: ${rule.action}`);
                parts.push(`Value: ${JSON.stringify(rule.value)}`);
                parts.push(`Conditions: ${JSON.stringify(rule.conditions, null, 2)}`);

                return parts.join('\n');
            }

            if (typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }
            return String(value);
        },
        traceConfigValueSource(configKey, path = null) {
            // Trace which config source set a specific value
            // configKey can be 'sample_type', 'umi_config', 'named_indices', or 'raw_samplesheet_settings'
            // path is for nested values like 'raw_samplesheet_settings.BarcodeMismatchesIndex1'

            if (!this.configModalSources || !this.sampleClassificationConfig) return null;

            let lastSource = null;

            // Go through config sources in order
            for (const source of this.configModalSources) {
                // Special handling for conditional rules
                if (source.includes('.conditional_rule.')) {
                    // Extract setting name from conditional rule source
                    // Format: "patterns.idt_umi.conditional_rule.TrimUMI:exclude_if_no_umi_detected"
                    const conditionalRuleParts = source.split('.conditional_rule.');
                    if (conditionalRuleParts.length === 2) {
                        const ruleSpec = conditionalRuleParts[1]; // e.g., "TrimUMI:exclude_if_no_umi_detected"
                        const [settingName] = ruleSpec.split(':');

                        // Check if this conditional rule sets the setting we're looking for
                        if (path) {
                            // For raw_samplesheet_settings.TrimUMI, check if settingName matches
                            const pathParts = path.split('.');
                            if (pathParts[0] === 'raw_samplesheet_settings' && pathParts[1] === settingName) {
                                lastSource = source;
                            }
                        }
                    }
                    continue; // Skip the rest of processing for conditional rules
                }

                const config = this.getConfigDetails(source);
                if (!config) continue;

                if (path) {
                    // For nested paths like raw_samplesheet_settings.BarcodeMismatchesIndex1
                    const [topKey, ...restPath] = path.split('.');
                    let value = config[topKey];
                    for (const key of restPath) {
                        if (value && typeof value === 'object') {
                            value = value[key];
                        } else {
                            value = undefined;
                            break;
                        }
                    }
                    if (value !== undefined && value !== null) {
                        lastSource = source;
                    }
                } else {
                    // For top-level keys
                    if (config[configKey] !== undefined && config[configKey] !== null) {
                        lastSource = source;
                    }
                }
            }

            return lastSource;
        },
        getValueWithSource(configKey, value, path = null) {
            // Get a formatted display of value with its source
            const source = this.traceConfigValueSource(configKey, path);
            const sourceIndex = source ? this.configModalSources.indexOf(source) + 1 : null;

            return {
                value: value,
                source: source,
                sourceIndex: sourceIndex
            };
        },
        getAllBCLConvertSettings(sampleSettings) {
            // Get all raw_samplesheet_settings including defaults from schema
            const allSettings = {};

            // If config is loaded, start with defaults
            if (this.sampleClassificationConfig) {
                const bclConvertDefaults = this.sampleClassificationConfig.bcl_convert_settings?.raw_samplesheet_settings || {};
                for (const [key, config] of Object.entries(bclConvertDefaults)) {
                    if (config.default !== undefined) {
                        allSettings[key] = config.default;
                    }
                }
            }

            // Override with actual settings from the sample (including EXCLUDE values)
            if (sampleSettings?.raw_samplesheet_settings) {
                Object.assign(allSettings, sampleSettings.raw_samplesheet_settings);
            }

            return allSettings;
        },
        isSettingsManuallyEdited(timestamp) {
            // Check if the settings at the given timestamp were manually edited
            if (!this.demux_data?.calculated?.version_history) return false;

            const versionInfo = this.demux_data.calculated.version_history[timestamp];
            if (!versionInfo) return false;

            // Manual edits have autogenerated: false
            return versionInfo.autogenerated === false;
        },
        wasBCLSettingManuallyEdited(timestamp, settingKey, currentValue) {
            // Check if a specific BCLConvert_Setting was manually changed from its original value
            if (!this.isSettingsManuallyEdited(timestamp)) return false;

            // Get the sample that has this timestamp
            const sample = this.configModalSample;
            if (!sample || !sample.settings) return false;

            // Get all timestamps sorted (oldest first)
            const timestamps = Object.keys(sample.settings).sort();
            if (timestamps.length < 2) return false; // No edits if only one version

            // Get the original (first) raw_samplesheet_settings
            const originalSettings = sample.settings[timestamps[0]].raw_samplesheet_settings || {};
            const originalValue = originalSettings[settingKey];

            // If current value differs from original, it was manually edited
            return currentValue !== originalValue;
        },
        getSamplesheetBCLSettings(settings) {
            // Helper method to get raw_samplesheet_settings for display
            return this.getAllBCLConvertSettings(settings);
        },
        formatConfigSourceLabel(source) {
            // Format config source string into readable label
            if (!source) return null;

            // Handle conditional rules specially
            if (source.includes('.conditional_rule.')) {
                const conditionalRuleParts = source.split('.conditional_rule.');
                if (conditionalRuleParts.length === 2) {
                    const ruleSpec = conditionalRuleParts[1]; // e.g., "TrimUMI:exclude_if_no_umi_detected"
                    const [settingName, ruleName] = ruleSpec.split(':');
                    return `Conditional rule: ${settingName} (${ruleName})`;
                }
            }

            const parts = source.split('.');
            const category = parts[0];

            if (category === 'patterns') {
                return `Pattern: ${parts[1]}`;
            } else if (category === 'library_method_mapping') {
                return `Library method: ${parts.slice(1).join('.')}`;
            } else if (category === 'instrument_type_mapping') {
                if (parts.length === 2) {
                    return `Instrument type: ${parts[1]}`;
                } else if (parts.length === 4 && parts[2] === 'run_modes') {
                    return `Run mode: ${parts[3]}`;
                }
                return `Instrument: ${parts.slice(1).join('.')}`;
            } else if (category === 'other_general_sample_types') {
                return `General type: ${parts[1]}`;
            } else if (category === 'control_patterns') {
                return 'Control pattern';
            } else if (category === 'custom_config') {
                return `Custom: ${parts.slice(1).join('.')}`;
            } else if (category === 'bcl_convert_settings') {
                return `Default: ${parts.slice(1).join('.')}`;
            }

            return source;
        },
        applyPreset() {
            // Apply selected preset to the form
            if (!this.selectedPreset || !this.samplePresets) return;

            let preset = null;

            // Check if it's an instrument type preset (format: "instrument:Type" or "instrument:Type:Mode")
            if (this.selectedPreset.startsWith('instrument:')) {
                const parts = this.selectedPreset.split(':');
                const instrumentKey = parts[1];
                const runModeKey = parts[2]; // May be undefined

                const instrument = this.samplePresets.instrument_types[instrumentKey];
                if (instrument) {
                    if (runModeKey && instrument.run_modes && instrument.run_modes[runModeKey]) {
                        // Use run mode preset
                        preset = instrument.run_modes[runModeKey];
                    } else {
                        // Use instrument type preset
                        preset = instrument;
                    }
                }
            } else {
                // Look for preset in patterns first, then library methods
                preset = this.samplePresets.patterns[this.selectedPreset] ||
                    this.samplePresets.library_methods[this.selectedPreset];
            }

            if (preset) {
                // Update recipe based on index_length if available
                if (preset.index_length && Array.isArray(preset.index_length)) {
                    const [i7, i5] = preset.index_length;
                    if (i7 > 0 && i5 > 0) {
                        this.editFormData.recipe = `${i7}-${i5}`;
                    } else if (i7 > 0) {
                        this.editFormData.recipe = `${i7}`;
                    }
                }

                // Update named_indices if available
                if (preset.named_indices) {
                    this.editFormData.named_index = preset.named_indices;
                }

                // Note: We don't set index_1/index_2 as those are specific to each sample
                // Note: UMI config and samplesheet settings are applied by the backend based on classification
            }
        },
        fetchDemuxInfo(updateHistory = true) {
            // Clear previous errors
            this.error_messages = [];

            if (!this.flowcell_id.trim()) {
                this.error_messages.push('Please enter a flowcell ID.');
                return;
            }

            this.loading = true;

            axios.get(`/api/v1/demux_sample_info/${this.flowcell_id}`)
                .then(response => {
                    this.demux_data = response.data;
                    // Reset edited data
                    this.editedData = {};
                    this.selectedVersion = null; // Reset to latest
                    this.loading = false;

                    // Update URL in browser history
                    if (updateHistory) {
                        const newUrl = `${window.location.pathname}?flowcell=${encodeURIComponent(this.flowcell_id)}`;
                        history.pushState({ flowcell: this.flowcell_id }, '', newUrl);
                    }
                })
                .catch(error => {
                    if (error.response && error.response.status === 404) {
                        this.error_messages.push(`No demux sample info found for flowcell ${this.flowcell_id}.`);
                    } else {
                        this.error_messages.push(`Error fetching demux sample info for flowcell ${this.flowcell_id}. Please try again or contact a system administrator.`);
                    }
                    console.error(error);
                    this.loading = false;
                });
        },
        backToList() {
            // Return to the flowcell list page
            window.location.href = '/y_flowcells';
        },
        formatTimestamp(timestamp) {
            if (!timestamp) return '';
            return new Date(timestamp).toLocaleString();
        },
        getSampleSettings(sampleUuid, lane) {
            if (!this.calculatedLanes[lane] || !this.calculatedLanes[lane].sample_rows[sampleUuid]) {
                return null;
            }
            const sample = this.calculatedLanes[lane].sample_rows[sampleUuid];
            // Get settings for the current version or the latest
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            return sample.settings[settingsVersions[0]];
        },
        toggleColumn(columnKey) {
            // Prevent toggling off mandatory columns
            if (columnKey === 'sample_id') return;

            const index = this.visibleColumns.indexOf(columnKey);
            if (index > -1) {
                this.visibleColumns.splice(index, 1);
            } else {
                this.visibleColumns.push(columnKey);
            }
        },
        isColumnVisible(columnKey) {
            return this.visibleColumns.includes(columnKey);
        },
        applyColumnPreset(preset) {
            if (preset === 'default') {
                this.visibleColumns = [...this.defaultVisibleColumns];
            } else if (preset === 'all') {
                this.visibleColumns = this.availableColumns.map(col => col.key);
            }
        },
        formatCellValue(value, columnKey) {
            if (columnKey === 'last_modified') {
                return this.formatTimestamp(value);
            }
            if (columnKey === 'config_sources') {
                // Format config_sources array as numbered list
                if (Array.isArray(value)) {
                    return value.map((src, i) => `${i + 1}. ${src}`).join(' → ');
                }
                return value || 'N/A';
            }
            if (columnKey === 'index_length' || columnKey === 'umi_length') {
                // Format array as "i7/i5" notation
                if (Array.isArray(value)) {
                    return `[${value[0]}, ${value[1]}]`;
                }
                return 'N/A';
            }
            if (columnKey === 'umi_config') {
                // Format umi_config object as a compact string
                if (typeof value === 'object' && value !== null) {
                    const parts = [];
                    for (const [key, config] of Object.entries(value)) {
                        if (config.length > 0) {
                            parts.push(`${key}:${config.position}(${config.length})`);
                        }
                    }
                    return parts.length > 0 ? parts.join(', ') : 'No UMIs';
                }
                return 'N/A';
            }
            return value || 'N/A';
        },
        isFieldEditable(columnKey) {
            // Determine which fields should be editable
            // Start with index fields, can expand to others later
            const editableFields = ['index_1', 'index_2', 'sample_name', 'sample_ref', 'named_index', 'description', 'operator', 'override_cycles'];
            return editableFields.includes(columnKey);
        },
        isFieldEdited(lane, uuid, field) {
            // Check if a specific field has been edited
            return this.editedData[lane]?.[uuid]?.[field] !== undefined;
        },
        isSampleEdited(lane, uuid) {
            // Check if any field in the sample has been edited
            return this.editedData[lane]?.[uuid] && Object.keys(this.editedData[lane][uuid]).length > 0;
        },
        getOriginalValue(lane, uuid, field) {
            // Get the original value before any edits
            const laneData = this.calculatedLanes[lane];
            if (!laneData || !laneData.sample_rows[uuid]) return null;

            const sample = laneData.sample_rows[uuid];
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            const latestSettings = sample.settings[settingsVersions[0]];
            return latestSettings[field];
        },
        getEditTooltip(lane, uuid, field) {
            // Generate tooltip text showing before and after values
            if (!this.isFieldEdited(lane, uuid, field)) return '';

            const originalValue = this.getOriginalValue(lane, uuid, field) || 'N/A';
            const newValue = this.editedData[lane][uuid][field] || 'N/A';
            return `Before: ${originalValue}\nAfter: ${newValue}`;
        },
        updateValue(lane, uuid, field, newValue) {
            // Initialize lane if it doesn't exist
            if (!this.editedData[lane]) {
                this.editedData[lane] = {};
            }
            // Initialize sample settings if it doesn't exist
            if (!this.editedData[lane][uuid]) {
                this.editedData[lane][uuid] = {};
            }

            // Map frontend field names to backend storage locations
            const fieldMapping = {
                'sample_id': ['per_sample_fields', 'Sample_ID'],
                'sample_name': ['per_sample_fields', 'Sample_Name'],
                'sample_project': ['per_sample_fields', 'Sample_Project'],
                'index_1': ['per_sample_fields', 'index'],
                'index_2': ['per_sample_fields', 'index2'],
                'sample_ref': ['other_details', 'sample_ref'],
                'named_index': ['other_details', 'named_index'],
                'recipe': ['other_details', 'recipe'],
                'operator': ['other_details', 'operator'],
                'override_cycles': ['per_sample_fields', 'OverrideCycles'],
                'trim_umi': ['raw_samplesheet_settings', 'TrimUMI'],
                'create_fastq_for_index_reads': ['raw_samplesheet_settings', 'CreateFastqForIndexReads'],
                'barcode_mismatches_index1': ['raw_samplesheet_settings', 'BarcodeMismatchesIndex1'],
                'barcode_mismatches_index2': ['raw_samplesheet_settings', 'BarcodeMismatchesIndex2'],
                'control': ['sample_row', 'control'],
                'description': ['sample_row', 'description']
            };

            // Get original value to compare
            const originalSample = this.calculatedLanes[lane]?.sample_rows[uuid];
            if (originalSample) {
                const settingsVersions = Object.keys(originalSample.settings).sort().reverse();
                const latestSettings = originalSample.settings[settingsVersions[0]];

                let originalValue;

                // Get the original value from the correct location
                if (fieldMapping[field]) {
                    const [section, key] = fieldMapping[field];
                    if (section === 'sample_row') {
                        // Top-level sample field
                        originalValue = originalSample[key];
                    } else {
                        // Settings field
                        originalValue = latestSettings[section]?.[key];
                    }
                } else {
                    // Fallback for unmapped fields
                    originalValue = latestSettings[field];
                }

                // Normalize null/undefined/empty string for comparison
                // For raw_samplesheet_settings numeric fields, null, undefined, and empty string all mean "not set"
                let normalizedOriginal = originalValue === undefined ? null : originalValue;
                let normalizedNew = newValue === undefined ? null : newValue;

                // Also normalize empty strings and NaN to null for numeric fields
                if (field === 'barcode_mismatches_index1' || field === 'barcode_mismatches_index2') {
                    if (normalizedNew === '' || Number.isNaN(normalizedNew)) {
                        normalizedNew = null;
                    }
                    if (normalizedOriginal === '' || Number.isNaN(normalizedOriginal)) {
                        normalizedOriginal = null;
                    }
                }

                // If value matches original, remove from edited data
                if (normalizedNew === normalizedOriginal) {
                    delete this.editedData[lane][uuid][field];
                    // Clean up empty objects
                    if (Object.keys(this.editedData[lane][uuid]).length === 0) {
                        delete this.editedData[lane][uuid];
                    }
                    if (Object.keys(this.editedData[lane]).length === 0) {
                        delete this.editedData[lane];
                    }
                } else {
                    // Store the edited value (use normalized value to ensure consistency)
                    this.editedData[lane][uuid][field] = normalizedNew;
                }
            } else {
                // No original found, normalize value for consistency
                let normalizedNew = newValue === undefined ? null : newValue;
                if (field === 'barcode_mismatches_index1' || field === 'barcode_mismatches_index2') {
                    if (normalizedNew === '' || Number.isNaN(normalizedNew)) {
                        normalizedNew = null;
                    }
                }
                this.editedData[lane][uuid][field] = normalizedNew;
            }
        },
        saveChanges() {
            if (!this.hasChanges) {
                this.error_messages.push('No changes to save.');
                return;
            }

            this.error_messages = [];
            this.saving = true;

            // Map frontend field names to backend field names
            const frontendToBackendFieldMap = {
                'sample_id': 'sample_id',
                'sample_name': 'sample_name',
                'sample_project': 'sample_project',
                'index_1': 'index',
                'index_2': 'index2',
                'sample_ref': 'sample_ref',
                'named_index': 'named_index',
                'recipe': 'recipe',
                'operator': 'operator',
                'override_cycles': 'override_cycles',
                'trim_umi': 'trim_umi',
                'create_fastq_for_index_reads': 'create_fastq_for_index_reads',
                'barcode_mismatches_index1': 'barcode_mismatches_index1',
                'barcode_mismatches_index2': 'barcode_mismatches_index2',
                'control': 'control',
                'description': 'description'
            };

            // Transform editedData to use backend field names
            const transformedEditedData = {};
            Object.entries(this.editedData).forEach(([lane, samples]) => {
                transformedEditedData[lane] = {};
                Object.entries(samples).forEach(([uuid, fields]) => {
                    transformedEditedData[lane][uuid] = {};
                    Object.entries(fields).forEach(([frontendField, value]) => {
                        const backendField = frontendToBackendFieldMap[frontendField] || frontendField;
                        transformedEditedData[lane][uuid][backendField] = value;
                    });
                });
            });

            // Prepare the data to send to the API
            const payload = {
                flowcell_id: this.flowcell_id,
                edited_settings: transformedEditedData,  // { lane: { uuid: settings_object } }
                comment: this.saveComment || ''  // Optional user comment
            };

            axios.put(`/api/v1/demux_sample_info/${this.flowcell_id}`, payload)
                .then(response => {
                    // Refresh the data after successful save
                    this.demux_data = response.data;
                    // Clear edited data and comment after successful save
                    this.editedData = {};
                    this.saveComment = '';
                    this.saving = false;
                    // Show success message
                    alert('Changes saved successfully!');
                })
                .catch(error => {
                    this.error_messages.push('Error saving changes. Please try again or contact a system administrator.');
                    console.error(error);
                    this.saving = false;
                });
        },
        discardChanges() {
            if (confirm('Are you sure you want to discard all unsaved changes?')) {
                // Clear all edited data
                this.editedData = {};
            }
        },
        getConfigSources(sample) {
            // Extract config_sources from the sample's latest settings
            if (!sample || !sample.settings) return [];

            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            const latestSettings = sample.settings[settingsVersions[0]];
            const other_details = latestSettings.other_details || {};

            return other_details.config_sources || [];
        },
        computeFieldHistory(sample) {
            // Compute the history of changes for each field
            if (!sample || !sample.settings) return {};

            const history = {};
            const settingsVersions = Object.keys(sample.settings).sort(); // oldest first

            // Field mappings: display name -> path in settings
            const fieldPaths = {
                'Sample ID': ['per_sample_fields', 'Sample_ID'],
                'Sample Name': ['per_sample_fields', 'Sample_Name'],
                'Sample Project': ['per_sample_fields', 'Sample_Project'],
                'Index 1': ['per_sample_fields', 'index'],
                'Index 2': ['per_sample_fields', 'index2'],
                'Sample Ref': ['other_details', 'sample_ref'],
                'Sample Type': ['other_details', 'sample_type'],
                'Named Index': ['other_details', 'named_index'],
                'Recipe': ['other_details', 'recipe'],
                'Operator': ['other_details', 'operator'],
                'Override Cycles': ['per_sample_fields', 'OverrideCycles'],
                'Trim UMI': ['raw_samplesheet_settings', 'TrimUMI'],
                'Create FASTQ for Index Reads': ['raw_samplesheet_settings', 'CreateFastqForIndexReads'],
                'Barcode Mismatches Index 1': ['raw_samplesheet_settings', 'BarcodeMismatchesIndex1'],
                'Barcode Mismatches Index 2': ['raw_samplesheet_settings', 'BarcodeMismatchesIndex2'],
                'Control': ['_top', 'control'],
                'Description': ['_top', 'description']
            };

            // Track the history for each field
            Object.entries(fieldPaths).forEach(([displayName, path]) => {
                const changes = [];
                let previousValue = undefined;

                settingsVersions.forEach(timestamp => {
                    const settings = sample.settings[timestamp];
                    let currentValue;

                    if (path[0] === '_top') {
                        // Top-level field on sample
                        currentValue = sample[path[1]];
                    } else {
                        // Nested field in settings
                        const section = settings[path[0]];
                        currentValue = section?.[path[1]];
                    }

                    // Only track if value changed
                    if (currentValue !== previousValue) {
                        changes.push({
                            timestamp: timestamp,
                            value: currentValue === undefined || currentValue === null ? '(not set)' : currentValue,
                            rawValue: currentValue
                        });
                        previousValue = currentValue;
                    }
                });

                // Only include fields that actually changed (more than 1 value)
                if (changes.length > 1) {
                    history[displayName] = changes;
                }
            });

            return history;
        },
        formatTimestamp(timestamp) {
            // Format ISO timestamp to human-readable format
            // Format: "YYYY-MM-DD HH:MM:SS"
            try {
                const date = new Date(timestamp);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            } catch (e) {
                return timestamp;
            }
        },
        openBulkEditModal() {
            this.showBulkEditModal = true;
            this.bulkEditProject = '';
            this.bulkEditLane = '';
            this.bulkEditAction = 'reverse_complement_index1';
        },
        updateProjectLaneSelection() {
            // When project changes, update lane selection
            if (this.isSingleLaneProject) {
                this.bulkEditLane = this.projectLanes[0];
            } else if (this.projectLanes.length > 0) {
                this.bulkEditLane = 'all';
            } else {
                this.bulkEditLane = '';
            }
        },
        closeBulkEditModal() {
            this.showBulkEditModal = false;
        },
        openEditModal(lane, uuid) {
            // Open edit modal for an existing sample
            const laneData = this.calculatedLanes[lane];
            if (!laneData || !laneData.sample_rows[uuid]) return;

            const sample = laneData.sample_rows[uuid];
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            const latestSettings = sample.settings[settingsVersions[0]];

            // Check if there are already edits for this sample
            const currentSettings = this.editedData[lane]?.[uuid] || {};

            // Populate form data with current values (edited or original)
            this.editFormData = {
                sample_id: currentSettings.sample_id || latestSettings.per_sample_fields?.Sample_ID,
                sample_name: currentSettings.sample_name || latestSettings.per_sample_fields?.Sample_Name,
                sample_project: currentSettings.sample_project || latestSettings.per_sample_fields?.Sample_Project,
                sample_ref: currentSettings.sample_ref || latestSettings.other_details?.sample_ref,
                index_1: currentSettings.index_1 || latestSettings.per_sample_fields?.index || '',
                index_2: currentSettings.index_2 || latestSettings.per_sample_fields?.index2 || '',
                named_index: currentSettings.named_index || latestSettings.other_details?.named_index || '',
                recipe: currentSettings.recipe || latestSettings.other_details?.recipe || '',
                operator: currentSettings.operator || latestSettings.other_details?.operator || '',
                description: currentSettings.description || sample.description || '',
                control: currentSettings.control || sample.control || 'N',
                override_cycles: currentSettings.override_cycles || latestSettings.per_sample_fields?.OverrideCycles || '',
                trim_umi: currentSettings.trim_umi !== undefined ? currentSettings.trim_umi : (latestSettings.raw_samplesheet_settings?.TrimUMI !== undefined ? latestSettings.raw_samplesheet_settings.TrimUMI : null),
                create_fastq_for_index_reads: currentSettings.create_fastq_for_index_reads !== undefined ? currentSettings.create_fastq_for_index_reads : (latestSettings.raw_samplesheet_settings?.CreateFastqForIndexReads !== undefined ? latestSettings.raw_samplesheet_settings.CreateFastqForIndexReads : null),
                barcode_mismatches_index1: currentSettings.barcode_mismatches_index1 !== undefined ? currentSettings.barcode_mismatches_index1 : (latestSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex1 !== undefined ? latestSettings.raw_samplesheet_settings.BarcodeMismatchesIndex1 : null),
                barcode_mismatches_index2: currentSettings.barcode_mismatches_index2 !== undefined ? currentSettings.barcode_mismatches_index2 : (latestSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex2 !== undefined ? latestSettings.raw_samplesheet_settings.BarcodeMismatchesIndex2 : null)
            };

            this.editModalLane = lane;
            this.editModalUuid = uuid;
            this.editModalSample = sample;
            this.editModalIsNew = false;
            this.showFieldHistory = false;

            // Compute field history
            this.fieldHistory = this.computeFieldHistory(sample);

            this.showEditModal = true;
        },
        openEditModalForNewSample() {
            // Open edit modal for a new sample (called when add_sample is selected)
            // Load presets if not already loaded
            this.fetchSamplePresets();
            this.selectedPreset = '';  // Reset preset selection

            const newSampleId = this.nextSampleId;
            const lane = this.bulkEditLane;

            // Generate a new UUID for the sample
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

            // Get template settings from an existing sample in the same project
            let templateSettings = null;
            Object.values(this.calculatedLanes).some(laneData => {
                return Object.values(laneData.sample_rows).some(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    if (latestSettings.per_sample_fields?.Sample_Project === this.bulkEditProject) {
                        templateSettings = { ...latestSettings };
                        return true;
                    }
                });
            });

            // Populate form data with template or defaults
            this.editFormData = templateSettings ? {
                sample_id: newSampleId,
                sample_name: newSampleId,
                sample_project: this.bulkEditProject,
                sample_ref: templateSettings.other_details?.sample_ref || '',
                index_1: '',
                index_2: '',
                named_index: templateSettings.other_details?.named_index || '',
                recipe: templateSettings.other_details?.recipe || '',
                operator: templateSettings.other_details?.operator || '',
                description: '',
                control: templateSettings.control || 'N',
                override_cycles: templateSettings.per_sample_fields?.OverrideCycles || '',
                trim_umi: templateSettings.raw_samplesheet_settings?.TrimUMI !== undefined ? templateSettings.raw_samplesheet_settings.TrimUMI : null,
                create_fastq_for_index_reads: templateSettings.raw_samplesheet_settings?.CreateFastqForIndexReads !== undefined ? templateSettings.raw_samplesheet_settings.CreateFastqForIndexReads : null,
                barcode_mismatches_index1: templateSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex1 !== undefined ? templateSettings.raw_samplesheet_settings.BarcodeMismatchesIndex1 : null,
                barcode_mismatches_index2: templateSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex2 !== undefined ? templateSettings.raw_samplesheet_settings.BarcodeMismatchesIndex2 : null
            } : {
                sample_id: newSampleId,
                sample_name: newSampleId,
                sample_project: this.bulkEditProject,
                sample_ref: '',
                index_1: '',
                index_2: '',
                named_index: '',
                recipe: '',
                operator: '',
                description: '',
                control: 'N',
                    override_cycles: '',
                    trim_umi: null,
                    create_fastq_for_index_reads: null,
                    barcode_mismatches_index1: null,
                    barcode_mismatches_index2: null
            };

            this.editModalLane = lane;
            this.editModalUuid = uuid;
            this.editModalSample = null;
            this.editModalIsNew = true;
            this.showEditModal = true;
            this.closeBulkEditModal();
        },
        closeEditModal() {
            this.showEditModal = false;
            this.editModalSample = null;
            this.editModalLane = null;
            this.editModalUuid = null;
            this.editModalIsNew = false;
            this.editFormData = {};
            this.fieldHistory = {};
            this.showFieldHistory = false;
        },
        saveEditModal() {
            // Save the edited sample data
            const lane = this.editModalLane;
            const uuid = this.editModalUuid;

            if (this.editModalIsNew) {
                // Add new sample to the data structure
                const timestamp = new Date().toISOString();
                const newSettings = {
                    ...this.editFormData,
                    lane: lane,
                    flowcell_id: this.flowcell_id,
                    mask_short_reads: 0,
                    minimum_trimmed_read_length: 0
                };

                // Add to editedData
                if (!this.editedData[lane]) {
                    this.editedData[lane] = {};
                }
                this.editedData[lane][uuid] = newSettings;

                // Add to the actual data structure for immediate display
                if (!this.demux_data.calculated.lanes[lane]) {
                    this.demux_data.calculated.lanes[lane] = { sample_rows: {} };
                }
                this.demux_data.calculated.lanes[lane].sample_rows[uuid] = {
                    sample_id: newSettings.sample_id,
                    last_modified: timestamp,
                    settings: {
                        [timestamp]: newSettings
                    }
                };

                alert(`Added new sample ${newSettings.sample_id} to lane ${lane}`);
            } else {
                // Update existing sample - only save changed fields
                Object.keys(this.editFormData).forEach(field => {
                    let newValue = this.editFormData[field];

                    // Sanitize raw_samplesheet_settings number fields: convert NaN or empty string to null
                    if (field === 'barcode_mismatches_index1' || field === 'barcode_mismatches_index2') {
                        if (newValue === '' || Number.isNaN(newValue)) {
                            newValue = null;
                        }
                    }

                    this.updateValue(lane, uuid, field, newValue);
                });
                alert(`Updated sample in lane ${lane}`);
            }

            this.closeEditModal();
        },
        reverseComplement(sequence) {
            // Reverse complement a DNA sequence
            const complement = {
                'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C',
                'a': 't', 't': 'a', 'c': 'g', 'g': 'c',
                'N': 'N', 'n': 'n'
            };
            return sequence.split('').reverse().map(base => complement[base] || base).join('');
        },
        applyBulkEdit() {
            if (!this.bulkEditProject) {
                alert('Please select a project.');
                return;
            }

            // Handle add_sample action separately
            if (this.bulkEditAction === 'add_sample') {
                if (!this.bulkEditLane) {
                    alert('Please select a lane.');
                    return;
                }
                this.openEditModalForNewSample();
                return;
            }

            let editCount = 0;
            const lanesToEdit = this.bulkEditLane === 'all' ? this.projectLanes : [this.bulkEditLane];

            lanesToEdit.forEach(lane => {
                const laneData = this.calculatedLanes[lane];
                if (!laneData) return;

                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];

                    // Check if this sample matches the selected project
                    if (latestSettings.per_sample_fields?.Sample_Project === this.bulkEditProject) {
                        if (this.bulkEditAction === 'reverse_complement_index1') {
                            const currentIndex = this.editedData[lane]?.[uuid]?.index_1 || latestSettings.per_sample_fields?.index;
                            if (currentIndex) {
                                const newIndex = this.reverseComplement(currentIndex);
                                this.updateValue(lane, uuid, 'index_1', newIndex);
                                editCount++;
                            }
                        } else if (this.bulkEditAction === 'reverse_complement_index2') {
                            const currentIndex = this.editedData[lane]?.[uuid]?.index_2 || latestSettings.per_sample_fields?.index2;
                            if (currentIndex) {
                                const newIndex = this.reverseComplement(currentIndex);
                                this.updateValue(lane, uuid, 'index_2', newIndex);
                                editCount++;
                            }
                        }
                    }
                });
            });

            alert(`Applied ${this.bulkEditAction} to ${editCount} sample(s) in project ${this.bulkEditProject}`);
            this.closeBulkEditModal();
        },
        addNewSample() {
            const newSampleId = this.nextSampleId;
            const lane = this.bulkEditLane;

            // Generate a new UUID for the sample
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

            // Get template settings from an existing sample in the same project
            let templateSettings = null;
            Object.values(this.calculatedLanes).some(laneData => {
                return Object.values(laneData.sample_rows).some(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    if (latestSettings.per_sample_fields?.Sample_Project === this.bulkEditProject) {
                        templateSettings = { ...latestSettings };
                        return true;
                    }
                });
            });

            // Create new sample settings
            const timestamp = new Date().toISOString();
            const newSettings = templateSettings ? {
                ...templateSettings,
                sample_id: newSampleId,
                sample_name: newSampleId,
                lane: lane
            } : {
                sample_id: newSampleId,
                sample_name: newSampleId,
                    sample_project: this.bulkEditProject,
                sample_ref: '',
                index_1: '',
                index_2: '',
                named_index: '',
                recipe: '',
                operator: '',
                description: '',
                control: 'N',
                mask_short_reads: 0,
                minimum_trimmed_read_length: 0,
                override_cycles: '',
                lane: lane,
                flowcell_id: this.flowcell_id
            };

            // Add to editedData (which will be sent to backend on save)
            if (!this.editedData[lane]) {
                this.editedData[lane] = {};
            }
            this.editedData[lane][uuid] = newSettings;

            // Also add to the actual data structure for immediate display
            if (!this.demux_data.calculated.lanes[lane]) {
                this.demux_data.calculated.lanes[lane] = { sample_rows: {} };
            }
            this.demux_data.calculated.lanes[lane].sample_rows[uuid] = {
                sample_id: newSampleId,
                last_modified: timestamp,
                settings: {
                    [timestamp]: newSettings
                }
            };

            alert(`Added new sample ${newSampleId} to lane ${lane}`);
            this.closeBulkEditModal();
        },
        generateSamplesheetContent(samplesheet) {
            // Convert JSON samplesheet to Illumina v2 CSV format
            const lines = [];

            // [Header] section
            lines.push('[Header]');
            for (const [key, value] of Object.entries(samplesheet.Header)) {
                lines.push(`${key},${value}`);
            }
            lines.push('');

            // [BCLConvert_Settings] section
            lines.push('[BCLConvert_Settings]');

            // Add samplesheet settings in standard order
            const settingsOrder = ['SoftwareVersion', 'MinimumTrimmedReadLength', 'MaskShortReads'];
            for (const key of settingsOrder) {
                if (samplesheet.raw_samplesheet_settings[key] !== undefined) {
                    lines.push(`${key},${samplesheet.raw_samplesheet_settings[key]}`);
                }
            }

            // Add remaining settings
            for (const [key, value] of Object.entries(samplesheet.raw_samplesheet_settings)) {
                if (!settingsOrder.includes(key)) {
                    lines.push(`${key},${value}`);
                }
            }

            lines.push('');

            // [BCLConvert_Data] section
            lines.push('[BCLConvert_Data]');
            lines.push('Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,OverrideCycles');

            // Add sample rows
            for (const sample of samplesheet.BCLConvert_Data) {
                lines.push(`${sample.Lane},${sample.Sample_ID},${sample.Sample_Name},${sample.index},${sample.index2},${sample.Sample_Project},${sample.OverrideCycles}`);
            }

            return lines.join('\n');
        },
        downloadSamplesheet(samplesheet) {
            // Convert JSON samplesheet to CSV and download
            const content = this.generateSamplesheetContent(samplesheet);
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', samplesheet.filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        handlePopState(event) {
            // Handle browser back/forward buttons
            const urlParams = new URLSearchParams(window.location.search);
            const flowcellId = urlParams.get('flowcell');

            if (flowcellId) {
                this.flowcell_id = flowcellId;
                this.fetchDemuxInfo(false); // false = don't push to history again
            } else {
                // Clear data if no flowcell in URL
                this.flowcell_id = '';
                this.demux_data = null;
                this.error_messages = [];
            }
        }
    },
    mounted() {
        // Check if flowcell ID is in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const flowcellId = urlParams.get('flowcell');

        if (flowcellId) {
            this.flowcell_id = flowcellId;
            this.fetchDemuxInfo(false); // false = don't push to history on initial load
        }

        // Listen for browser back/forward navigation
        window.addEventListener('popstate', this.handlePopState);
    },
    unmounted() {
        // Clean up event listener
        window.removeEventListener('popstate', this.handlePopState);
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Y Flowcells</h1>

                    <!-- Input form (shown when no flowcell loaded) -->
                    <div v-if="!demux_data" class="card mt-4 mb-4">
                        <div class="card-body">
                            <p class="mb-3">
                                <a href="/y_flowcells" class="btn btn-sm btn-outline-primary">
                                    <i class="fa fa-list me-1"></i> View Flowcell List
                                </a>
                            </p>
                            <label class="form-label"><strong>Enter a flowcell ID:</strong></label>
                                <div class="row g-2 align-items-end">
                                    <div class="col-auto flex-grow-1">
                                        <input
                                            type="text"
                                            class="form-control"
                                            v-model="flowcell_id"
                                            placeholder="e.g., 233KCWLT4"
                                            @keyup.enter="fetchDemuxInfo">
                                    </div>
                                    <div class="col-auto">
                                        <button
                                            class="btn btn-primary"
                                            @click="fetchDemuxInfo"
                                            :disabled="loading">
                                            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                            {{ loading ? 'Loading...' : 'Fetch Data' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error messages -->
                    <template v-if="error_messages.length > 0">
                        <div class="alert alert-danger" role="alert">
                            <h3 v-for="error in error_messages">{{ error }}</h3>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template v-if="loading && !demux_data">
                        <div class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p>Loading demux sample info...</p>
                        </div>
                    </template>

                    <!-- Demux data -->
                    <template v-if="demux_data">
                        <!-- Back button -->
                        <div class="mb-3">
                            <button class="btn btn-outline-secondary" @click="backToList">
                                <i class="fa fa-arrow-left mr-2"></i>Back to Flowcell List
                            </button>
                        </div>

                        <h2>Flowcell: {{ demux_data.flowcell_id }}</h2>

                        <!-- Metadata Card -->
                        <div class="card mt-4" v-if="demux_data.metadata">
                            <div class="card-header">
                                <h5 class="mb-0">Metadata</h5>
                            </div>
                            <div class="card-body">
                                <dl class="row">
                                    <dt class="col-sm-3">Number of Lanes:</dt>
                                    <dd class="col-sm-9">{{ demux_data.metadata.num_lanes }}</dd>

                                    <dt class="col-sm-3">Run Setup:</dt>
                                    <dd class="col-sm-9">{{ demux_data.metadata.run_setup || 'N/A' }}</dd>

                                    <dt class="col-sm-3">Setup LIMS Step ID:</dt>
                                    <dd class="col-sm-9">
                                        <a v-if="demux_data.metadata.setup_lims_step_id && limsUrl"
                                           :href="limsUrl + '/clarity/work-complete/' + demux_data.metadata.setup_lims_step_id"
                                           target="_blank"
                                           rel="noopener noreferrer">
                                            {{ demux_data.metadata.setup_lims_step_id }}
                                        </a>
                                        <span v-else>{{ demux_data.metadata.setup_lims_step_id || 'N/A' }}</span>
                                    </dd>
                                </dl>
                            </div>
                        </div>

                        <!-- Tabs Navigation -->
                        <ul class="nav nav-tabs mt-4" role="tablist">
                            <li class="nav-item" role="presentation">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === 'calculated' }"
                                    @click.prevent="viewMode = 'calculated'"
                                    href="#">
                                    By Lane
                                </a>
                            </li>
                            <li class="nav-item" role="presentation">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === 'uploaded' }"
                                    @click.prevent="viewMode = 'uploaded'"
                                    href="#">
                                    Uploaded Info
                                </a>
                            </li>
                            <li class="nav-item" role="presentation" v-if="versionTimestamps.length > 0">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === 'history' }"
                                    @click.prevent="viewMode = 'history'"
                                    href="#">
                                    Version History
                                </a>
                            </li>
                            <li class="nav-item" role="presentation">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === 'samplesheets' }"
                                    @click.prevent="viewMode = 'samplesheets'"
                                    href="#">
                                    Samplesheets
                                    <span class="badge bg-primary ms-1">{{ samplesheets.length }}</span>
                                </a>
                            </li>
                        </ul>

                        <!-- Tab Content -->
                        <div class="tab-content mt-3">
                            <!-- Uploaded Info tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === 'uploaded' }">
                                <h3>Uploaded Info from LIMS</h3>
                                <div v-for="(sample_rows, lane) in uploadedSamplesByLane" :key="lane" class="mt-3">
                                    <h4>Lane {{ lane }}</h4>
                                    <table class="table table-striped table-bordered table-sm">
                                        <thead>
                                            <tr class="darkth">
                                                <th>Flowcell ID</th>
                                                <th>Sample ID</th>
                                                <th>Sample Name</th>
                                                <th>Sample Ref</th>
                                                <th>Index 1</th>
                                                <th>Index 2</th>
                                                <th>Description</th>
                                                <th>Control</th>
                                                <th>Recipe</th>
                                                <th>Operator</th>
                                                <th>Sample Project</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(sample, index) in sample_rows" :key="index">
                                                <td>{{ sample.flowcell_id }}</td>
                                                <td>{{ sample.sample_id }}</td>
                                                <td>{{ sample.sample_name }}</td>
                                                <td>{{ sample.sample_ref }}</td>
                                                <td><code>{{ sample.index_1 }}</code></td>
                                                <td><code>{{ sample.index_2 }}</code></td>
                                                <td>{{ sample.description }}</td>
                                                <td>{{ sample.control }}</td>
                                                <td>{{ sample.recipe }}</td>
                                                <td>{{ sample.operator }}</td>
                                                <td>{{ sample.sample_project }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Calculated Samples tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === 'calculated' }">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h3 class="mb-0">Calculated Samples (by Lane)</h3>
                                    <div>
                                        <button
                                            class="btn btn-primary me-2"
                                            @click="openBulkEditModal">
                                            <i class="fa fa-edit"></i> Bulk Edit Actions
                                        </button>
                                        <button
                                            class="btn btn-info me-2"
                                            @click="openCustomConfigModal()">
                                            <i class="fa fa-magic"></i> Custom Config
                                        </button>
                                        <span v-if="hasChanges">
                                            <button
                                                class="btn btn-success me-2"
                                                @click="saveChanges"
                                                :disabled="saving">
                                                <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                                {{ saving ? 'Saving...' : 'Save Changes' }}
                                            </button>
                                            <button
                                                class="btn btn-secondary"
                                                @click="discardChanges"
                                                :disabled="saving">
                                                Discard Changes
                                            </button>
                                        </span>
                                    </div>
                                </div>

                                <!-- Save Comment Field (shown when there are changes) -->
                                <div v-if="hasChanges" class="card mt-3 mb-3 border-info">
                                    <div class="card-body">
                                        <label for="saveComment" class="form-label">
                                            <i class="fa fa-comment"></i> <strong>Change Comment (optional)</strong>
                                        </label>
                                        <textarea
                                            class="form-control"
                                            id="saveComment"
                                            v-model="saveComment"
                                            rows="2"
                                            placeholder="Describe the changes you made (optional)..."
                                            :disabled="saving"></textarea>
                                        <small class="text-muted">This comment will be saved in the version history.</small>
                                    </div>
                                </div>

                                <!-- Column Configuration Menu -->
                                <div class="card mt-3 mb-4">
                                    <div class="card-header" @click="columnConfigCollapsed = !columnConfigCollapsed" style="cursor: pointer;">
                                        <h5 class="mb-0">
                                            <i class="fa" :class="columnConfigCollapsed ? 'fa-caret-right' : 'fa-caret-down'"></i>
                                            Column Configuration
                                        </h5>
                                    </div>
                                    <div class="card-body" v-show="!columnConfigCollapsed">
                                        <div class="row">
                                            <div class="col-12">
                                                <div class="mb-3">
                                                    <label class="form-label">Presets:</label>
                                                    <div class="btn-group" role="group">
                                                        <input type="radio" class="btn-check" name="columnPreset" id="presetDefault" value="default" @change="applyColumnPreset('default')" autocomplete="off" checked>
                                                        <label class="btn btn-outline-primary" for="presetDefault">Default</label>

                                                        <input type="radio" class="btn-check" name="columnPreset" id="presetAll" value="all" @change="applyColumnPreset('all')" autocomplete="off">
                                                        <label class="btn btn-outline-primary" for="presetAll">All</label>
                                                    </div>
                                                </div>
                                                <p class="text-muted mb-2">Select columns to display:</p>
                                                <div class="d-flex flex-wrap gap-2">
                                                    <div v-for="column in availableColumns" :key="column.key" class="form-check form-check-inline">
                                                        <input
                                                            class="form-check-input"
                                                            type="checkbox"
                                                            :id="'col-' + column.key"
                                                            :value="column.key"
                                                            :checked="isColumnVisible(column.key)"
                                                            :disabled="column.key === 'sample_id'"
                                                            @change="toggleColumn(column.key)">
                                                        <label class="form-check-label" :for="'col-' + column.key" :class="{ 'text-muted': column.key === 'sample_id' }">
                                                            {{ column.label }}
                                                            <span v-if="column.key === 'sample_id'" class="badge bg-secondary ms-1">Required</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Custom Configurations -->
                                <div v-if="demux_data && demux_data.custom_configs && demux_data.custom_configs.length > 0" class="card mt-3 mb-4">
                                    <div class="card-header" @click="customConfigsCollapsed = !customConfigsCollapsed" style="cursor: pointer;">
                                        <h5 class="mb-0">
                                            <i class="fa" :class="customConfigsCollapsed ? 'fa-caret-right' : 'fa-caret-down'"></i>
                                            Custom Configurations
                                            <span class="badge bg-info ms-2">{{ demux_data.custom_configs.length }}</span>
                                        </h5>
                                    </div>
                                    <div class="card-body" v-show="!customConfigsCollapsed">
                                        <p class="text-muted mb-3">
                                            Custom configurations that have been applied to samples in this flowcell.
                                        </p>
                                        <div v-for="(config, index) in demux_data.custom_configs" :key="index" class="card mb-2">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6 class="mb-1">
                                                            <i class="fa fa-magic text-info"></i>
                                                            <strong>{{ config.name }}</strong>
                                                        </h6>
                                                        <div class="text-muted small">
                                                            <div><strong>Target:</strong>
                                                                <span v-if="config.target_type === 'project'">All lanes in project {{ config.target_project }}</span>
                                                                <span v-else-if="config.target_type === 'lane'">All projects in lane {{ config.target_lane }}</span>
                                                                <span v-else>Project {{ config.target_project }} in lane {{ config.target_lane }}</span>
                                                            </div>
                                                            <div v-if="config.created_at"><strong>Created:</strong> {{ new Date(config.created_at).toLocaleString() }}</div>
                                                            <div v-if="config.created_by"><strong>Created by:</strong> {{ config.created_by }}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <button class="btn btn-sm btn-outline-primary" @click="openCustomConfigModal(config, index)" title="Edit">
                                                            <i class="fa fa-edit"></i> Edit
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="mt-2">
                                                    <strong>Custom Config Settings:</strong>
                                                    <ul class="mb-0 mt-1 small">
                                                        <li v-if="config.raw_samplesheet_settings.TrimUMI !== undefined">
                                                            TrimUMI:
                                                            <code v-if="config.raw_samplesheet_settings.TrimUMI === 'EXCLUDE'" class="text-danger">Do not include</code>
                                                            <code v-else>{{ config.raw_samplesheet_settings.TrimUMI }}</code>
                                                        </li>
                                                        <li v-if="config.raw_samplesheet_settings.CreateFastqForIndexReads !== undefined">
                                                            CreateFastqForIndexReads:
                                                            <code v-if="config.raw_samplesheet_settings.CreateFastqForIndexReads === 'EXCLUDE'" class="text-danger">Do not include</code>
                                                            <code v-else>{{ config.raw_samplesheet_settings.CreateFastqForIndexReads }}</code>
                                                        </li>
                                                        <li v-if="config.raw_samplesheet_settings.BarcodeMismatchesIndex1 !== undefined">
                                                            BarcodeMismatchesIndex1: <code>{{ config.raw_samplesheet_settings.BarcodeMismatchesIndex1 }}</code>
                                                        </li>
                                                        <li v-if="config.raw_samplesheet_settings.BarcodeMismatchesIndex2 !== undefined">
                                                            BarcodeMismatchesIndex2: <code>{{ config.raw_samplesheet_settings.BarcodeMismatchesIndex2 }}</code>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Grouping Order Toggle -->
                                <div class="card mt-3 mb-3">
                                    <div class="card-body">
                                        <div class="form-check form-switch">
                                            <input
                                                class="form-check-input"
                                                type="checkbox"
                                                id="groupByProjectFirstToggle"
                                                v-model="groupByProjectFirst">
                                            <label class="form-check-label" for="groupByProjectFirstToggle">
                                                <strong>Group by Project → Lanes</strong>
                                                <small class="text-muted d-block">
                                                    <span v-if="!groupByProjectFirst">Currently: Lanes → Projects (samples grouped by lane, then by project)</span>
                                                    <span v-else>Currently: Projects → Lanes (samples grouped by project, then by lane)</span>
                                                </small>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Named Index Grouping Toggle -->
                                <div class="card mt-3 mb-3">
                                    <div class="card-body">
                                        <div class="form-check form-switch">
                                            <input
                                                class="form-check-input"
                                                type="checkbox"
                                                id="groupByNamedIndexToggle"
                                                v-model="groupByNamedIndex">
                                            <label class="form-check-label" for="groupByNamedIndexToggle">
                                                <strong>Group by Named Index</strong>
                                                <small class="text-muted d-block">Display samples grouped by their index name (useful for 10X samples and index expansion workflows)</small>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tables grouped by Lane → Project -->
                                <div v-if="!groupByProjectFirst">
                                    <div v-for="(projects, lane) in calculatedSamplesByLaneProjectAndNamedIndex" :key="lane" class="mt-4">
                                        <h4>Lane {{ lane }}</h4>
                                        <div v-for="(indexGroups, projectName) in projects" :key="projectName" class="mb-4">
                                        <div class="card">
                                            <div class="card-header bg-light">
                                                <h5 class="mb-0">
                                                    <i class="fa fa-folder-open"></i> {{ projectName }}
                                                    <template v-if="groupByNamedIndex">
                                                        <small class="text-muted">({{ Object.values(indexGroups).flat().length }} sample{{ Object.values(indexGroups).flat().length !== 1 ? 's' : '' }})</small>
                                                    </template>
                                                    <template v-else>
                                                        <small class="text-muted">({{ indexGroups['_all_'].length }} sample{{ indexGroups['_all_'].length !== 1 ? 's' : '' }})</small>
                                                    </template>
                                                </h5>
                                            </div>
                                            <div class="card-body p-0">
                                                <!-- When NOT grouped by named index -->
                                                <div v-if="!groupByNamedIndex" class="table-responsive">
                                                    <table class="table table-sm mb-0">
                                                        <thead>
                                                            <tr class="darkth">
                                                                <th v-for="columnKey in visibleColumns" :key="columnKey">
                                                                    {{ columnLabel[columnKey] }}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr v-for="sample in indexGroups['_all_']" :key="sample.uuid" :class="{ 'table-info': isSampleEdited(lane, sample.uuid) }">
                                                                <td v-for="columnKey in visibleColumns" :key="columnKey"
                                                                    :class="{ 'bg-info': isFieldEdited(lane, sample.uuid, columnKey) }"
                                                                    :title="getEditTooltip(lane, sample.uuid, columnKey)">
                                                                    <!-- Sample ID column with edit button -->
                                                                    <template v-if="columnKey === 'sample_id'">
                                                                        <button
                                                                            class="btn btn-sm btn-link p-0 text-decoration-none"
                                                                            @click="openEditModal(lane, sample.uuid)"
                                                                            :title="'Edit sample: ' + sample[columnKey]">
                                                                            {{ formatCellValue(sample[columnKey], columnKey) }}<i class="fa fa-pencil ml-2"></i>
                                                                        </button>
                                                                    </template>
                                                                    <!-- Index columns with code formatting -->
                                                                    <code v-else-if="columnKey === 'index_1' || columnKey === 'index_2'">{{ formatCellValue(sample[columnKey], columnKey) }}</code>
                                                                    <!-- Sample type with config button -->
                                                                    <button v-else-if="columnKey === 'sample_type' && Array.isArray(sample['config_sources']) && sample['config_sources'].length > 0"
                                                                        class="btn btn-sm btn-outline-info"
                                                                        @click="openConfigModal(calculatedLanes[lane].sample_rows[sample.uuid], lane)"
                                                                        :title="'Click to view Stage 1 configuration details (stored settings)'">
                                                                        <i class="fa fa-info-circle"></i> {{ formatCellValue(sample[columnKey], columnKey) }}
                                                                    </button>
                                                                    <!-- All other columns -->
                                                                    <span v-else>{{ formatCellValue(sample[columnKey], columnKey) }}</span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <!-- When grouped by named index -->
                                                <div v-else>
                                                    <div v-for="(samples, namedIndex) in indexGroups" :key="namedIndex" class="mb-3">
                                                        <div class="px-3 py-2 bg-white border-bottom">
                                                            <h6 class="mb-0">
                                                                <i class="fa fa-tags"></i> Named Index: <strong>{{ namedIndex }}</strong>
                                                                <small class="text-muted">({{ samples.length }} sample{{ samples.length !== 1 ? 's' : '' }})</small>
                                                            </h6>
                                                        </div>
                                                        <div class="table-responsive">
                                                            <table class="table table-sm mb-0">
                                                                <thead>
                                                                    <tr class="darkth">
                                                                        <th v-for="columnKey in visibleColumns" :key="columnKey">
                                                                            {{ columnLabel[columnKey] }}
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr v-for="sample in samples" :key="sample.uuid" :class="{ 'table-info': isSampleEdited(lane, sample.uuid) }">
                                                                        <td v-for="columnKey in visibleColumns" :key="columnKey"
                                                                            :class="{ 'bg-info': isFieldEdited(lane, sample.uuid, columnKey) }"
                                                                            :title="getEditTooltip(lane, sample.uuid, columnKey)">
                                                                            <!-- Sample ID column with edit button -->
                                                                            <template v-if="columnKey === 'sample_id'">
                                                                                <button
                                                                                    class="btn btn-sm btn-link p-0 text-decoration-none"
                                                                                    @click="openEditModal(lane, sample.uuid)"
                                                                                    :title="'Edit sample: ' + sample[columnKey]">
                                                                                    <i class="fa fa-pencil me-1"></i>{{ formatCellValue(sample[columnKey], columnKey) }}
                                                                                </button>
                                                                            </template>
                                                                            <!-- Index columns with code formatting -->
                                                                            <code v-else-if="columnKey === 'index_1' || columnKey === 'index_2'">{{ formatCellValue(sample[columnKey], columnKey) }}</code>
                                                                            <!-- Sample type with config button -->
                                                                            <button v-else-if="columnKey === 'sample_type' && Array.isArray(sample['config_sources']) && sample['config_sources'].length > 0"
                                                                                class="btn btn-sm btn-outline-info"
                                                                                @click="openConfigModal(calculatedLanes[lane].sample_rows[sample.uuid], lane)"
                                                                                :title="'Click to view Stage 1 configuration details (stored settings)'">
                                                                                <i class="fa fa-info-circle"></i> {{ formatCellValue(sample[columnKey], columnKey) }}
                                                                            </button>
                                                                            <!-- All other columns -->
                                                                            <span v-else>{{ formatCellValue(sample[columnKey], columnKey) }}</span>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div> <!-- end Lane → Project grouping -->

                                <!-- Tables grouped by Project → Lane -->
                                <div v-else>
                                    <div v-for="(lanes, projectName) in calculatedSamplesByProjectLaneAndNamedIndex" :key="projectName" class="mt-4">
                                        <h4><i class="fa fa-folder-open"></i> {{ projectName }}</h4>
                                        <div v-for="(indexGroups, lane) in lanes" :key="lane" class="mb-4">
                                            <div class="card">
                                                <div class="card-header bg-light">
                                                    <h5 class="mb-0">
                                                        Lane {{ lane }}
                                                        <template v-if="groupByNamedIndex">
                                                            <small class="text-muted">({{ Object.values(indexGroups).flat().length }} sample{{ Object.values(indexGroups).flat().length !== 1 ? 's' : '' }})</small>
                                                        </template>
                                                        <template v-else>
                                                            <small class="text-muted">({{ indexGroups['_all_'].length }} sample{{ indexGroups['_all_'].length !== 1 ? 's' : '' }})</small>
                                                        </template>
                                                    </h5>
                                                </div>
                                                <div class="card-body p-0">
                                                    <!-- When NOT grouped by named index -->
                                                    <div v-if="!groupByNamedIndex" class="table-responsive">
                                                        <table class="table table-sm mb-0">
                                                            <thead>
                                                                <tr class="darkth">
                                                                    <th v-for="columnKey in visibleColumns" :key="columnKey">
                                                                        {{ columnLabel[columnKey] }}
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr v-for="sample in indexGroups['_all_']" :key="sample.uuid" :class="{ 'table-info': isSampleEdited(lane, sample.uuid) }">
                                                                    <td v-for="columnKey in visibleColumns" :key="columnKey"
                                                                        :class="{ 'bg-info': isFieldEdited(lane, sample.uuid, columnKey) }"
                                                                        :title="getEditTooltip(lane, sample.uuid, columnKey)">
                                                                        <template v-if="columnKey === 'sample_id'">
                                                                            <button
                                                                                class="btn btn-sm btn-link p-0 text-decoration-none"
                                                                                @click="openEditModal(lane, sample.uuid)"
                                                                                :title="'Edit sample: ' + sample[columnKey]">
                                                                                {{ formatCellValue(sample[columnKey], columnKey) }}<i class="fa fa-pencil ml-2"></i>
                                                                            </button>
                                                                        </template>
                                                                        <code v-else-if="columnKey === 'index_1' || columnKey === 'index_2'">{{ formatCellValue(sample[columnKey], columnKey) }}</code>
                                                                        <button v-else-if="columnKey === 'sample_type' && Array.isArray(sample['config_sources']) && sample['config_sources'].length > 0"
                                                                            class="btn btn-sm btn-outline-info"
                                                                            @click="openConfigModal(calculatedLanes[lane].sample_rows[sample.uuid], lane)"
                                                                            :title="'Click to view Stage 1 configuration details (stored settings)'">
                                                                            <i class="fa fa-info-circle"></i> {{ formatCellValue(sample[columnKey], columnKey) }}
                                                                        </button>
                                                                        <span v-else>{{ formatCellValue(sample[columnKey], columnKey) }}</span>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <!-- When grouped by named index -->
                                                    <div v-else>
                                                        <div v-for="(samples, namedIndex) in indexGroups" :key="namedIndex" class="mb-3">
                                                            <div class="px-3 py-2 bg-white border-bottom">
                                                                <h6 class="mb-0">
                                                                    <i class="fa fa-tags"></i> Named Index: <strong>{{ namedIndex }}</strong>
                                                                    <small class="text-muted">({{ samples.length }} sample{{ samples.length !== 1 ? 's' : '' }})</small>
                                                                </h6>
                                                            </div>
                                                            <div class="table-responsive">
                                                                <table class="table table-sm mb-0">
                                                                    <thead>
                                                                        <tr class="darkth">
                                                                            <th v-for="columnKey in visibleColumns" :key="columnKey">
                                                                                {{ columnLabel[columnKey] }}
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr v-for="sample in samples" :key="sample.uuid" :class="{ 'table-info': isSampleEdited(lane, sample.uuid) }">
                                                                            <td v-for="columnKey in visibleColumns" :key="columnKey"
                                                                                :class="{ 'bg-info': isFieldEdited(lane, sample.uuid, columnKey) }"
                                                                                :title="getEditTooltip(lane, sample.uuid, columnKey)">
                                                                                <template v-if="columnKey === 'sample_id'">
                                                                                    <button
                                                                                        class="btn btn-sm btn-link p-0 text-decoration-none"
                                                                                        @click="openEditModal(lane, sample.uuid)"
                                                                                        :title="'Edit sample: ' + sample[columnKey]">
                                                                                        <i class="fa fa-pencil me-1"></i>{{ formatCellValue(sample[columnKey], columnKey) }}
                                                                                    </button>
                                                                                </template>
                                                                                <code v-else-if="columnKey === 'index_1' || columnKey === 'index_2'">{{ formatCellValue(sample[columnKey], columnKey) }}</code>
                                                                                <button v-else-if="columnKey === 'sample_type' && Array.isArray(sample['config_sources']) && sample['config_sources'].length > 0"
                                                                                    class="btn btn-sm btn-outline-info"
                                                                                    @click="openConfigModal(calculatedLanes[lane].sample_rows[sample.uuid], lane)"
                                                                                    :title="'Click to view Stage 1 configuration details (stored settings)'">
                                                                                    <i class="fa fa-info-circle"></i> {{ formatCellValue(sample[columnKey], columnKey) }}
                                                                                </button>
                                                                                <span v-else>{{ formatCellValue(sample[columnKey], columnKey) }}</span>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div> <!-- end Project → Lane grouping -->
                            </div> <!-- end Calculated Samples tab-pane -->

                            <!-- Version History tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === 'history' }">
                                <h3>Version History {{viewMode}}</h3>
                                <h5>Inside</H5>
                                <div v-if="versionTimestamps.length === 0" class="alert alert-info">
                                    No version history available.
                                </div>
                                <div v-else>
                                    <div v-for="timestamp in versionTimestamps" :key="timestamp" class="card mb-3">
                                        <div class="card-header">
                                            <h5 class="mb-0">{{ formatTimestamp(timestamp) }}</h5>
                                        </div>
                                        <div class="card-body">
                                            <dl class="row mb-0">
                                                <dt class="col-sm-3">Generated By:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].generated_by || 'N/A' }}</dd>

                                                <dt class="col-sm-3">Autogenerated:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].autogenerated ? 'Yes' : 'No' }}</dd>

                                                <dt class="col-sm-3">Auto Run:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].auto_run ? 'Yes' : 'No' }}</dd>

                                                <dt class="col-sm-3">Comment:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].comment || 'None' }}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Samplesheets tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === 'samplesheets' }">
                                <h3>Illumina v2 Samplesheets</h3>
                                <p class="text-muted">Generated samplesheets grouped by lane and Stage 2 samplesheet settings. Projects with different settings are split into separate samplesheets.</p>

                                <div v-if="samplesheets.length === 0" class="alert alert-info">
                                    No samplesheets available. Please ensure data is loaded.
                                </div>

                                <div v-else>
                                    <div v-for="(samplesheet, index) in samplesheets" :key="index" class="card mb-4">
                                        <div class="card-header bg-light d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 class="mb-0">
                                                    <i class="fa fa-file-text"></i> Lane {{ samplesheet.lane }} - {{ samplesheet.projects.join(', ') }}
                                                </h5>
                                                <small class="text-muted">{{ samplesheet.sample_count }} sample{{ samplesheet.sample_count !== 1 ? 's' : '' }}</small>
                                            </div>
                                            <button class="btn btn-primary btn-sm" @click="downloadSamplesheet(samplesheet)">
                                                <i class="fa fa-download"></i> Download
                                            </button>
                                        </div>
                                        <div class="card-body">
                                            <!-- Samplesheet Preview -->
                                            <div>
                                                <h6 class="text-muted">Preview:</h6>
                                                <pre class="bg-light p-3 rounded" style="max-height: 400px; overflow-y: auto;"><code>{{ generateSamplesheetContent(samplesheet) }}</code></pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> <!-- end tab-content -->
                    </template>

                <!-- Edit Sample Modal -->
                    <div v-if="showEditModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">{{ editModalIsNew ? 'Add New Sample' : 'Edit Sample' }}</h5>
                                    <div class="ms-auto me-2">
                                        <button
                                            v-if="!editModalIsNew && Object.keys(fieldHistory).length > 0"
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary"
                                            @click="showFieldHistory = !showFieldHistory">
                                            <i class="fa" :class="showFieldHistory ? 'fa-eye-slash' : 'fa-history'"></i>
                                            {{ showFieldHistory ? 'Hide History' : 'Show Field History' }}
                                        </button>
                                    </div>
                                    <button type="button" class="btn-close" @click="closeEditModal"></button>
                                </div>
                                <div class="modal-body">
                                    <!-- Config Sources Info (only for existing samples) -->
                                    <div v-if="!editModalIsNew && editModalSample" class="row mb-3">
                                        <div class="col-12">
                                            <div class="card bg-light border-info">
                                                <div class="card-body">
                                                    <h6 class="card-title text-info">
                                                        <i class="fa fa-info-circle"></i> Configuration Sources Applied
                                                    </h6>
                                                    <p class="mb-2 small text-muted">The following configurations were applied to generate this sample's current settings:</p>
                                                    <ol class="mb-0">
                                                        <li v-for="(source, index) in getConfigSources(editModalSample)" :key="index" class="font-monospace small">
                                                            {{ source }}
                                                        </li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Field History (only for existing samples when toggled) -->
                                    <div v-if="!editModalIsNew && showFieldHistory && Object.keys(fieldHistory).length > 0" class="row mb-3">
                                        <div class="col-12">
                                            <div class="card border-warning">
                                                <div class="card-body">
                                                    <h6 class="card-title text-warning">
                                                        <i class="fa fa-history"></i> Field History
                                                    </h6>
                                                    <p class="mb-3 small text-muted">Historical changes to individual fields for this sample:</p>

                                                    <!-- Iterate through each field that has history -->
                                                    <div v-for="(changes, fieldName) in fieldHistory" :key="fieldName" class="mb-3">
                                                        <div class="d-flex align-items-center mb-2">
                                                            <strong class="text-primary">{{ fieldName }}:</strong>
                                                            <span class="badge bg-secondary ms-2">{{ changes.length }} change{{ changes.length !== 1 ? 's' : '' }}</span>
                                                        </div>
                                                        <div class="border-start border-2 border-primary ps-3">
                                                            <div v-for="(change, idx) in changes" :key="idx" class="mb-2">
                                                                <div class="d-flex align-items-start">
                                                                    <span class="badge bg-light text-dark me-2" style="min-width: 180px;">
                                                                        <i class="fa fa-clock"></i>
                                                                        {{ formatTimestamp(change.timestamp) }}
                                                                    </span>
                                                                    <span class="font-monospace flex-grow-1">
                                                                        <span v-if="change.value === null || change.value === undefined || change.value === ''" class="text-muted fst-italic">
                                                                            (empty)
                                                                        </span>
                                                                        <span v-else-if="typeof change.value === 'boolean'">
                                                                            <span :class="change.value ? 'text-success' : 'text-danger'">
                                                                                {{ change.value ? 'Yes' : 'No' }}
                                                                            </span>
                                                                        </span>
                                                                        <span v-else>
                                                                            {{ change.value }}
                                                                        </span>
                                                                        <span v-if="idx === changes.length - 1" class="badge bg-success ms-2">Current</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Empty state (shouldn't happen if we check Object.keys length) -->
                                                    <div v-if="Object.keys(fieldHistory).length === 0" class="text-muted fst-italic">
                                                        No field history available for this sample.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Preset Selector (only for new samples) -->
                                    <div v-if="editModalIsNew && samplePresets" class="row mb-3">
                                        <div class="col-12">
                                            <div class="card bg-light">
                                                <div class="card-body">
                                                    <h6 class="card-title">Apply Sample Type Preset</h6>
                                                    <div class="row align-items-end">
                                                        <div class="col-md-8">
                                                            <label for="preset_select" class="form-label">Select a preset to auto-fill recipe and named index fields:</label>
                                                            <select class="form-select" id="preset_select" v-model="selectedPreset">
                                                                <option value="">-- Select Preset --</option>
                                                                <optgroup label="Sample Patterns">
                                                                    <option v-for="(preset, key) in samplePresets.patterns" :key="key" :value="key">
                                                                        {{ preset.description }} ({{ preset.sample_type }})
                                                                    </option>
                                                                </optgroup>
                                                                <optgroup label="Library Methods" v-if="samplePresets.library_methods && Object.keys(samplePresets.library_methods).length > 0">
                                                                    <option v-for="(preset, key) in samplePresets.library_methods" :key="key" :value="key">
                                                                        {{ preset.description }} ({{ preset.sample_type }})
                                                                    </option>
                                                                </optgroup>
                                                                <optgroup label="Instrument Types" v-if="samplePresets.instrument_types && Object.keys(samplePresets.instrument_types).length > 0">
                                                                    <template v-for="(instrument, instKey) in samplePresets.instrument_types" :key="instKey">
                                                                        <option :value="'instrument:' + instKey">
                                                                            {{ instrument.description }} - {{ instKey }}
                                                                        </option>
                                                                        <template v-if="instrument.run_modes">
                                                                            <option v-for="(mode, modeKey) in instrument.run_modes" :key="instKey + ':' + modeKey" :value="'instrument:' + instKey + ':' + modeKey" class="ms-3">
                                                                                &nbsp;&nbsp;↳ {{ modeKey }} - {{ mode.description }}
                                                                            </option>
                                                                        </template>
                                                                    </template>
                                                                </optgroup>
                                                            </select>
                                                        </div>
                                                        <div class="col-md-4">
                                                            <button type="button" class="btn btn-primary" @click="applyPreset" :disabled="!selectedPreset">
                                                                Apply Preset
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_sample_id" class="form-label">Sample ID:</label>
                                            <input type="text" class="form-control" id="edit_sample_id" v-model="editFormData.sample_id" :readonly="!editModalIsNew">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_sample_name" class="form-label">Sample Name:</label>
                                            <input type="text" class="form-control" id="edit_sample_name" v-model="editFormData.sample_name">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_sample_project" class="form-label">Sample Project:</label>
                                            <input type="text" class="form-control" id="edit_sample_project" v-model="editFormData.sample_project" readonly>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_sample_ref" class="form-label">Sample Ref:</label>
                                            <input type="text" class="form-control" id="edit_sample_ref" v-model="editFormData.sample_ref">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_index_1" class="form-label">Index 1:</label>
                                            <input
                                                type="text"
                                                class="form-control font-monospace"
                                                id="edit_index_1"
                                                v-model="editFormData.index_1"
                                                @input="editFormData.index_1 = editFormData.index_1.toUpperCase().replace(/[^ACGT]/g, '')"
                                                pattern="[ACGT]*"
                                                title="Only ACGT characters are allowed">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_index_2" class="form-label">Index 2:</label>
                                            <input
                                                type="text"
                                                class="form-control font-monospace"
                                                id="edit_index_2"
                                                v-model="editFormData.index_2"
                                                @input="editFormData.index_2 = editFormData.index_2.toUpperCase().replace(/[^ACGT]/g, '')"
                                                pattern="[ACGT]*"
                                                title="Only ACGT characters are allowed">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_named_index" class="form-label">Named Index:</label>
                                            <input type="text" class="form-control" id="edit_named_index" v-model="editFormData.named_index">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_recipe" class="form-label">Recipe:</label>
                                            <input type="text" class="form-control" id="edit_recipe" v-model="editFormData.recipe">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_operator" class="form-label">Operator:</label>
                                            <input type="text" class="form-control" id="edit_operator" v-model="editFormData.operator">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_control" class="form-label">Control:</label>
                                            <select class="form-select" id="edit_control" v-model="editFormData.control">
                                                <option value="N">N</option>
                                                <option value="Y">Y</option>
                                            </select>
                                        </div>
                                        <div class="col-md-12 mb-3">
                                            <label for="edit_description" class="form-label">Description:</label>
                                            <textarea class="form-control" id="edit_description" v-model="editFormData.description" rows="2"></textarea>
                                        </div>
                                        <div class="col-md-12 mb-3">
                                            <label for="edit_override_cycles" class="form-label">
                                                Override Cycles:
                                                <span class="text-muted small">(auto-calculated from recipe and UMI config)</span>
                                            </label>
                                            <input type="text" class="form-control font-monospace bg-light" id="edit_override_cycles" v-model="editFormData.override_cycles" readonly>
                                        </div>

                                        <!-- Samplesheet Settings Section -->
                                        <div class="col-md-12 mb-3">
                                            <hr>
                                            <h6 class="mb-3">
                                                <i class="fa fa-cog"></i> Samplesheet Settings
                                                <span class="text-muted small">(Values not included use BCLConvert defaults)</span>
                                            </h6>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Trim UMI:</label>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="edit_trim_umi_yes" v-model="editFormData.trim_umi" :value="true">
                                                <label class="form-check-label" for="edit_trim_umi_yes">
                                                    Yes
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="edit_trim_umi_no" v-model="editFormData.trim_umi" :value="false">
                                                <label class="form-check-label" for="edit_trim_umi_no">
                                                    No
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="edit_trim_umi_default" v-model="editFormData.trim_umi" :value="null">
                                                <label class="form-check-label" for="edit_trim_umi_default">
                                                    Do not override
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Create FASTQ for Index Reads:</label>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="edit_create_fastq_yes" v-model="editFormData.create_fastq_for_index_reads" :value="true">
                                                <label class="form-check-label" for="edit_create_fastq_yes">
                                                    Yes
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="edit_create_fastq_no" v-model="editFormData.create_fastq_for_index_reads" :value="false">
                                                <label class="form-check-label" for="edit_create_fastq_no">
                                                    No
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="edit_create_fastq_default" v-model="editFormData.create_fastq_for_index_reads" :value="null">
                                                <label class="form-check-label" for="edit_create_fastq_default">
                                                    Do not override
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_barcode_mismatches_index1" class="form-label">Barcode Mismatches Index 1:</label>
                                            <input type="number" class="form-control" id="edit_barcode_mismatches_index1" v-model.number="editFormData.barcode_mismatches_index1" min="0" max="2" placeholder="Default">
                                            <small class="form-text text-muted">0-2 mismatches allowed (leave blank for default)</small>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="edit_barcode_mismatches_index2" class="form-label">Barcode Mismatches Index 2:</label>
                                            <input type="number" class="form-control" id="edit_barcode_mismatches_index2" v-model.number="editFormData.barcode_mismatches_index2" min="0" max="2" placeholder="Default">
                                            <small class="form-text text-muted">0-2 mismatches allowed (leave blank for default)</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
                                    <button type="button" class="btn btn-primary" @click="saveEditModal">
                                        {{ editModalIsNew ? 'Add Sample' : 'Save Changes' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bulk Edit Modal -->
                    <div v-if="showBulkEditModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Bulk Edit Actions</h5>
                                    <button type="button" class="btn-close" @click="closeBulkEditModal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="mb-3">
                                        <label for="bulkEditAction" class="form-label">Action:</label>
                                        <select class="form-select" id="bulkEditAction" v-model="bulkEditAction" @change="updateProjectLaneSelection">
                                            <option value="reverse_complement_index1">Reverse Complement Index 1</option>
                                            <option value="reverse_complement_index2">Reverse Complement Index 2</option>
                                            <option value="add_sample">Add New Sample</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="bulkEditProject" class="form-label">Project:</label>
                                        <select class="form-select" id="bulkEditProject" v-model="bulkEditProject" @change="updateProjectLaneSelection" required>
                                            <option value="">-- Select Project --</option>
                                            <option v-for="project in availableProjects" :key="project" :value="project">
                                                {{ project }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="mb-3" v-if="bulkEditProject">
                                        <label for="bulkEditLane" class="form-label">Lane:</label>
                                        <select class="form-select" id="bulkEditLane" v-model="bulkEditLane" :disabled="isSingleLaneProject">
                                            <option v-if="!isSingleLaneProject && bulkEditAction !== 'add_sample'" value="all">All Lanes</option>
                                            <option v-for="lane in projectLanes" :key="lane" :value="lane">
                                                Lane {{ lane }}
                                            </option>
                                        </select>
                                        <small v-if="isSingleLaneProject" class="form-text text-muted">
                                            This project is only present in one lane.
                                        </small>
                                    </div>
                                    <div v-if="bulkEditAction === 'add_sample' && bulkEditProject && bulkEditLane" class="alert alert-info">
                                        <strong>Next Sample ID:</strong> {{ nextSampleId }}
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeBulkEditModal">Cancel</button>
                                    <button type="button" class="btn btn-primary" @click="applyBulkEdit">
                                        {{ bulkEditAction === 'add_sample' ? 'Continue' : 'Apply' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Configuration Details Modal -->
                    <div v-if="showConfigModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header bg-info text-white">
                                    <h5 class="modal-title">
                                        <i class="fa fa-cog"></i> Sample Classification Configuration Details
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" @click="closeConfigModal"></button>
                                </div>
                                <div class="modal-body">
                                    <!-- Three-Stage Architecture Info -->
                                    <div class="alert alert-info" role="alert">
                                        <h6 class="alert-heading"><i class="fa fa-info-circle"></i> Understanding the Three-Stage Processing Architecture</h6>
                                        <p class="mb-2 small">
                                            The system uses a <strong>three-stage approach</strong> to create samplesheets:
                                        </p>
                                        <ul class="small mb-2">
                                            <li><strong>Stage 1: Classification & Storage</strong> - Base settings (<code>raw_samplesheet_settings</code>) calculated from sample properties using a 6-tier classification system. Stored permanently and editable.</li>
                                            <li><strong>Stage 2: Rule Application</strong> - Conditional rules applied to Stage 1 settings to produce final samplesheet settings (<code>samplesheet_settings</code>). Results are stored but recalculated when rules change.</li>
                                            <li><strong>Stage 3: Samplesheet Assembly</strong> - Samples grouped by their Stage 2 settings and formatted into downloadable CSV files.</li>
                                        </ul>
                                        <p class="mb-0 small">
                                            <i class="fa fa-lightbulb-o"></i> <strong>Note:</strong> Both Stage 1 and Stage 2 settings are stored in the database. Stage 2 settings show what will actually appear in the samplesheet <code>[BCLConvert_Settings]</code> section.
                                        </p>
                                    </div>
                                    <!-- Current Settings -->
                                    <div v-if="configModalSample && sortedConfigModalSettings.length > 0" class="mb-4">
                                        <h5 class="text-info">
                                            <i class="fa fa-database"></i> Stage 1: Raw Samplesheet Settings (Editable)
                                        </h5>
                                        <p class="text-muted">Base settings stored in <code>raw_samplesheet_settings</code> field, calculated from sample classification and editable via custom configs:</p>
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="text-muted">{{ formatTimestamp(sortedConfigModalSettings[0][0]) }}</h6>

                                                <!-- Show config sources for current version -->
                                                <div v-if="sortedConfigModalSettings[0][1].other_details?.config_sources && sortedConfigModalSettings[0][1].other_details.config_sources.length > 0" class="alert alert-secondary small mb-3">
                                                    <strong><i class="fa fa-list"></i> Stage 1: Classification sources applied:</strong>
                                                    <ol class="mb-0 mt-1">
                                                        <li v-for="(source, idx) in sortedConfigModalSettings[0][1].other_details.config_sources" :key="idx" class="font-monospace">
                                                            {{ source }}
                                                        </li>
                                                    </ol>
                                                    <div class="mt-2 fst-italic">
                                                        <i class="fa fa-info-circle"></i> These sources determined your base <code>raw_samplesheet_settings</code>. Stage 2 rules then process these to create final <code>samplesheet_settings</code>.
                                                    </div>
                                                </div>

                                                <div class="table-responsive">
                                                    <table class="table table-sm table-hover">
                                                        <thead class="table-light">
                                                            <tr>
                                                                <th style="width: 30%">Setting Name</th>
                                                                <th style="width: 45%">Value</th>
                                                                <th style="width: 25%">Source</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td><strong>Sample Type</strong></td>
                                                                <td><code>{{ sortedConfigModalSettings[0][1].other_details?.sample_type || 'N/A' }}</code></td>
                                                                <td>
                                                                    <span v-if="traceConfigValueSource('sample_type')" class="badge bg-info">
                                                                        {{ formatConfigSourceLabel(traceConfigValueSource('sample_type')) }}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Index Length</strong></td>
                                                                <td><code>{{ formatConfigValue(sortedConfigModalSettings[0][1].other_details?.index_length) }}</code></td>
                                                                <td><span class="badge bg-secondary">actual indices</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>UMI Config</strong></td>
                                                                <td><code>{{ formatConfigValue(sortedConfigModalSettings[0][1].other_details?.umi_config) }}</code></td>
                                                                <td>
                                                                    <span v-if="traceConfigValueSource('umi_config')" class="badge bg-info">
                                                                        {{ formatConfigSourceLabel(traceConfigValueSource('umi_config')) }}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Named Indices</strong></td>
                                                                <td><code>{{ sortedConfigModalSettings[0][1].other_details?.named_index || 'N/A' }}</code></td>
                                                                <td>
                                                                    <span v-if="traceConfigValueSource('named_indices')" class="badge bg-info">
                                                                        {{ formatConfigSourceLabel(traceConfigValueSource('named_indices')) }}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr v-if="getAllBCLConvertSettings(sortedConfigModalSettings[0][1]) && Object.keys(getAllBCLConvertSettings(sortedConfigModalSettings[0][1])).length > 0">
                                                                <td colspan="3" class="table-secondary">
                                                                    <strong>Raw Samplesheet Settings</strong>
                                                                    <span class="badge bg-primary ms-2 small" title="Stage 1: Base settings from classification, stored as raw_samplesheet_settings">Stage 1: Editable</span>
                                                                </td>
                                                            </tr>
                                                            <tr v-for="(value, key) in getAllBCLConvertSettings(sortedConfigModalSettings[0][1])" :key="key">
                                                                <td class="ps-4">{{ key }}</td>
                                                                <td>
                                                                    <code v-if="value === 'EXCLUDE'" class="text-danger" title="This value is set to EXCLUDE in stored settings (rare - typically EXCLUDE is used in Stage 2 samplesheet generation rules)">EXCLUDE</code>
                                                                    <code v-else>{{ value }}</code>
                                                                </td>
                                                                <td>
                                                                    <span v-if="wasBCLSettingManuallyEdited(sortedConfigModalSettings[0][0], key, value)" class="badge bg-warning text-dark">
                                                                        Manual Edit
                                                                    </span>
                                                                    <span v-else-if="traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)" class="badge bg-info">
                                                                        {{ formatConfigSourceLabel(traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)) }}
                                                                    </span>
                                                                    <span v-else class="badge bg-secondary">default</span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Configuration Source Details -->
                                    <div class="mt-4 mb-4">
                                        <h5 class="text-info">
                                            <i class="fa fa-list"></i> Stage 1: Classification Source Details
                                        </h5>
                                        <p class="text-muted mb-3">
                                            Detailed information about each classification tier that determined <code>raw_samplesheet_settings</code>.
                                            Configurations are applied in order during classification (from least specific to most specific):
                                        </p>

                                        <div v-if="!sampleClassificationConfig" class="text-center">
                                            <div class="spinner-border text-info" role="status">
                                                <span class="visually-hidden">Loading configuration...</span>
                                            </div>
                                            <p class="mt-2">Loading configuration details...</p>
                                        </div>

                                        <div v-else>
                                            <div v-for="(source, index) in configModalSources" :key="index" class="card mb-2">
                                                <div class="card-header">
                                                    <button class="btn btn-link text-start w-100 text-decoration-none d-flex align-items-center"
                                                        type="button"
                                                        @click="toggleConfigSource(index)">
                                                        <span class="badge bg-primary me-2">{{ index + 1 }}</span>
                                                        <strong class="flex-grow-1">{{ source }}</strong>
                                                        <i class="fa" :class="isConfigSourceExpanded(index) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                                                    </button>
                                                </div>
                                                <div v-show="isConfigSourceExpanded(index)" class="card-body">
                                                    <div v-if="getConfigDetails(source)">
                                                        <pre class="bg-light p-3 rounded mb-0"><code>{{ formatConfigValue(getConfigDetails(source)) }}</code></pre>
                                                    </div>
                                                    <div v-else class="alert alert-warning mb-0">
                                                        Configuration details not available for this source.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Stage 2: Calculated Samplesheet Settings -->
                                        <div class="mt-4 mb-4">
                                            <h5 class="text-success">
                                                <i class="fa fa-cogs"></i> Stage 2: Samplesheet Settings (Calculated)
                                            </h5>
                                            <p class="text-muted">Final settings stored in <code>samplesheet_settings</code> field after applying conditional rules to Stage 1 settings. These are what appear in the <code>[BCLConvert_Settings]</code> section of generated samplesheets:</p>
                                            
                                            <div v-if="sortedConfigModalSettings[0][1].samplesheet_settings" class="card">
                                                <div class="card-body">
                                                    <div v-if="Object.keys(sortedConfigModalSettings[0][1].samplesheet_settings).length === 0" class="alert alert-warning mb-0">
                                                        <i class="fa fa-exclamation-triangle"></i> No settings will appear in samplesheet - all values were filtered out by Stage 2 rules.
                                                    </div>
                                                    <div v-else class="table-responsive">
                                                        <table class="table table-sm table-hover mb-0">
                                                            <thead class="table-light">
                                                                <tr>
                                                                    <th style="width: 40%">Setting Name</th>
                                                                    <th style="width: 30%">Value</th>
                                                                    <th style="width: 30%">Stage 1 → Stage 2</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr v-for="(value, key) in sortedConfigModalSettings[0][1].samplesheet_settings" :key="key">
                                                                    <td><strong>{{ key }}</strong></td>
                                                                    <td><code>{{ value }}</code></td>
                                                                    <td>
                                                                        <span v-if="sortedConfigModalSettings[0][1].raw_samplesheet_settings && sortedConfigModalSettings[0][1].raw_samplesheet_settings[key] === value" class="badge bg-success">✓ Unchanged</span>
                                                                        <span v-else-if="sortedConfigModalSettings[0][1].raw_samplesheet_settings && sortedConfigModalSettings[0][1].raw_samplesheet_settings[key]" class="badge bg-warning">Modified</span>
                                                                        <span v-else class="badge bg-info">Added by rules</span>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-else class="alert alert-warning">
                                                <i class="fa fa-exclamation-circle"></i> <code>samplesheet_settings</code> not available (may need to recalculate - try editing and saving).
                                            </div>
                                            
                                            <div class="alert alert-info mt-3 mb-0 small">
                                                <strong><i class="fa fa-info-circle"></i> Stage 2 Processing:</strong>
                                                <ul class="mb-0 mt-1">
                                                    <li>Applies global <code>samplesheet_generation_rules</code> from config</li>
                                                    <li>Applies custom config <code>samplesheet_generation_rules</code> if defined</li>
                                                    <li>Filters out <code>EXCLUDE</code> and <code>null</code> values</li>
                                                    <li>Recalculated automatically when rules or Stage 1 settings change</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Historical Settings -->
                                    <div v-if="configModalSample && sortedConfigModalSettings.length > 1" class="mt-4">
                                        <h3 class="text-secondary">
                                            <i class="fa fa-history"></i> Stage 1: Version History
                                        </h3>
                                        <p class="text-muted">Previous versions of stored settings for this sample:</p>
                                        <div class="card">
                                            <div class="card-body">
                                                <div v-for="[timestamp, settings] in sortedConfigModalSettings.slice(1)" :key="timestamp" class="mb-4 pb-3 border-bottom">
                                                    <h6 class="text-muted">{{ formatTimestamp(timestamp) }}</h6>

                                                    <!-- Show config sources for this specific version -->
                                                    <div v-if="settings.other_details?.config_sources && settings.other_details.config_sources.length > 0" class="alert alert-secondary small mb-3">
                                                        <strong><i class="fa fa-stream"></i> Stage 1: Configuration sources applied:</strong>
                                                        <ol class="mb-0 mt-1">
                                                            <li v-for="(source, idx) in settings.other_details.config_sources" :key="idx" class="font-monospace">
                                                                {{ source }}
                                                            </li>
                                                        </ol>
                                                    </div>

                                                    <div class="table-responsive">
                                                        <table class="table table-sm table-hover">
                                                            <thead class="table-light">
                                                                <tr>
                                                                    <th style="width: 30%">Setting Name</th>
                                                                    <th style="width: 45%">Value</th>
                                                                    <th style="width: 25%">Source</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td><strong>Sample Type</strong></td>
                                                                    <td><code>{{ settings.other_details?.sample_type || 'N/A' }}</code></td>
                                                                    <td>
                                                                        <span v-if="traceConfigValueSource('sample_type')" class="badge bg-info">
                                                                            {{ formatConfigSourceLabel(traceConfigValueSource('sample_type')) }}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Index Length</strong></td>
                                                                    <td><code>{{ formatConfigValue(settings.other_details?.index_length) }}</code></td>
                                                                    <td><span class="badge bg-secondary">actual indices</span></td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>UMI Config</strong></td>
                                                                    <td><code>{{ formatConfigValue(settings.other_details?.umi_config) }}</code></td>
                                                                    <td>
                                                                        <span v-if="traceConfigValueSource('umi_config')" class="badge bg-info">
                                                                            {{ formatConfigSourceLabel(traceConfigValueSource('umi_config')) }}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Named Indices</strong></td>
                                                                    <td><code>{{ settings.other_details?.named_index || 'N/A' }}</code></td>
                                                                    <td>
                                                                        <span v-if="traceConfigValueSource('named_indices')" class="badge bg-info">
                                                                            {{ formatConfigSourceLabel(traceConfigValueSource('named_indices')) }}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                                <tr v-if="getAllBCLConvertSettings(settings) && Object.keys(getAllBCLConvertSettings(settings)).length > 0">
                                                                    <td colspan="3" class="table-secondary">
                                                                        <strong>Raw Samplesheet Settings</strong>
                                                                        <span class="badge bg-primary ms-2 small">Stage 1</span>
                                                                    </td>
                                                                </tr>
                                                                <tr v-for="(value, key) in getAllBCLConvertSettings(settings)" :key="key">
                                                                    <td class="ps-4">{{ key }}</td>
                                                                    <td>
                                                                        <code v-if="value === 'EXCLUDE'" class="text-danger" title="WARNING: EXCLUDE should not be in raw_samplesheet_settings">⚠️ EXCLUDE</code>
                                                                        <code v-else>{{ value }}</code>
                                                                    </td>
                                                                    <td>
                                                                        <span v-if="wasBCLSettingManuallyEdited(timestamp, key, value)" class="badge bg-warning text-dark">
                                                                            Manual Edit
                                                                        </span>
                                                                        <span v-else-if="traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)" class="badge bg-info">
                                                                            {{ formatConfigSourceLabel(traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)) }}
                                                                        </span>
                                                                        <span v-else class="badge bg-secondary">default</span>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeConfigModal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Config Modal -->
                    <div v-if="showCustomConfigModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header bg-primary text-white">
                                    <h5 class="modal-title">
                                        <i class="fa fa-magic"></i> {{ customConfigEditMode ? 'Edit Custom Configuration' : 'Create Custom Configuration' }}
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" @click="closeCustomConfigModal"></button>
                                </div>
                                <div class="modal-body">
                                    <!-- Three-Stage Architecture Info -->
                                    <div class="alert alert-info mb-3" role="alert">
                                        <h6 class="alert-heading"><i class="fa fa-info-circle"></i> Custom Configuration: Override Stage 1 Settings</h6>
                                        <p class="mb-1 small">
                                            Custom configurations override <strong>Stage 1</strong> <code>raw_samplesheet_settings</code> for targeted samples.
                                            Overrides are permanently stored and appear in config_sources. You can also define Stage 2 <code>samplesheet_generation_rules</code> (not shown in this UI yet).
                                        </p>
                                        <p class="mb-0 small">
                                            <strong>Note:</strong> Stage 2 rules will still process these overridden settings to generate final <code>samplesheet_settings</code>.
                                        </p>
                                    </div>

                                    <p class="text-muted">Define custom Stage 1 settings to override the calculated <code>raw_samplesheet_settings</code> for specific samples or projects.</p>

                                    <!-- Config Name and Target -->
                                    <div class="row mb-4">
                                        <div class="col-md-12 mb-3">
                                            <label for="custom_config_name" class="form-label"><strong>Configuration Name:</strong></label>
                                            <input type="text" class="form-control" id="custom_config_name" v-model="customConfigFormData.name" placeholder="e.g., NovaSeq X Special Settings" :readonly="customConfigEditMode">
                                            <small class="form-text text-muted">
                                                <span v-if="customConfigEditMode">The name cannot be changed when editing an existing configuration.</span>
                                                <span v-else>A descriptive name for this custom configuration</span>
                                            </small>
                                        </div>

                                        <div class="col-md-4 mb-3">
                                            <label for="custom_config_target_type" class="form-label"><strong>Target Type:</strong></label>
                                            <select class="form-select" id="custom_config_target_type" v-model="customConfigFormData.target_type">
                                                <option value="project">All lanes in project</option>
                                                <option value="lane">All projects in lane</option>
                                                <option value="project_lane">Specific project + lane</option>
                                            </select>
                                        </div>

<div class="col-md-4 mb-3" v-if="customConfigFormData.target_type !== 'lane'">
                                            <label for="custom_config_target_project" class="form-label"><strong>Target Project:</strong></label>
                                            <select class="form-select" id="custom_config_target_project" v-model="customConfigFormData.target_project" required>
                                                <option value="">-- Select Project --</option>
                                                <option v-for="project in availableProjects" :key="project" :value="project">
                                                    {{ project }}
                                                </option>
                                            </select>
                                        </div>

                                        <div class="col-md-4 mb-3" v-if="customConfigFormData.target_type !== 'project'">
                                            <label for="custom_config_target_lane" class="form-label"><strong>Target Lane:</strong></label>
                                            <select class="form-select" id="custom_config_target_lane" v-model="customConfigFormData.target_lane">
                                                <option value="">-- Select Lane --</option>
                                                <option v-for="lane in Object.keys(calculatedLanes)" :key="lane" :value="lane">
                                                    Lane {{ lane }}
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <!-- Stage 1: Raw Samplesheet Settings -->
                                    <div class="row mb-4">
                                        <div class="col-md-12 mb-3">
                                            <hr>
                                            <h6 class="mb-2">
                                                <i class="fa fa-database"></i> Stage 1: Raw Samplesheet Settings Overrides
                                            </h6>
                                            <p class="text-muted small mb-3">
                                                Override the automatically calculated <code>raw_samplesheet_settings</code> for targeted samples. These overrides are permanently stored.
                                                Leave settings at "Do not override" to keep the automatically calculated values from the 6-tier classification system.
                                            </p>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Trim UMI:</label>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="custom_trim_umi_yes" v-model="customConfigFormData.trim_umi" :value="true">
                                                <label class="form-check-label" for="custom_trim_umi_yes">Yes</label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="custom_trim_umi_no" v-model="customConfigFormData.trim_umi" :value="false">
                                                <label class="form-check-label" for="custom_trim_umi_no">No</label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="custom_trim_umi_default" v-model="customConfigFormData.trim_umi" :value="null">
                                                <label class="form-check-label" for="custom_trim_umi_default">Do not override</label>
                                            </div>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Create FASTQ for Index Reads:</label>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="custom_create_fastq_yes" v-model="customConfigFormData.create_fastq_for_index_reads" :value="true">
                                                <label class="form-check-label" for="custom_create_fastq_yes">Yes</label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="custom_create_fastq_no" v-model="customConfigFormData.create_fastq_for_index_reads" :value="false">
                                                <label class="form-check-label" for="custom_create_fastq_no">No</label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="custom_create_fastq_default" v-model="customConfigFormData.create_fastq_for_index_reads" :value="null">
                                                <label class="form-check-label" for="custom_create_fastq_default">Do not override</label>
                                            </div>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label for="custom_barcode_mismatches_index1" class="form-label">Barcode Mismatches Index 1:</label>
                                            <input type="number" class="form-control" id="custom_barcode_mismatches_index1" v-model.number="customConfigFormData.barcode_mismatches_index1" min="0" max="2" placeholder="Do not override">
                                            <small class="form-text text-muted">0-2 mismatches allowed (leave blank to not override)</small>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label for="custom_barcode_mismatches_index2" class="form-label">Barcode Mismatches Index 2:</label>
                                            <input type="number" class="form-control" id="custom_barcode_mismatches_index2" v-model.number="customConfigFormData.barcode_mismatches_index2" min="0" max="2" placeholder="Do not override">
                                            <small class="form-text text-muted">0-2 mismatches allowed (leave blank to not override)</small>
                                        </div>
                                    </div>

                                    <!-- Stage 2: Samplesheet Generation Rules (NEW!) -->
                                    <div class="row mb-4">
                                        <div class="col-md-12 mb-3">
                                            <hr>
                                            <h6 class="mb-2">
                                                <i class="fa fa-cogs"></i> Stage 2: Samplesheet Generation Rules (Advanced)
                                                <span class="badge bg-success ms-2 small">Optional</span>
                                            </h6>
                                            <p class="text-muted small mb-3">
                                                Define conditional rules that dynamically EXCLUDE settings from the final samplesheet based on sample properties.
                                                These rules are applied AFTER Stage 1 settings to create the final <code>samplesheet_settings</code>.
                                            </p>
                                            
                                            <div class="form-check mb-3">
                                                <input type="checkbox" class="form-check-input" id="enable_stage2_rules" v-model="customConfigFormData.enable_stage2_rules">
                                                <label class="form-check-label" for="enable_stage2_rules">
                                                    <strong>Enable Stage 2 Rules</strong> - Apply conditional exclusions based on sample properties
                                                </label>
                                            </div>
                                        </div>

                                        <div v-if="customConfigFormData.enable_stage2_rules" class="col-md-12">
                                            <div class="alert alert-info small mb-3">
                                                <strong><i class="fa fa-info-circle"></i> How Stage 2 Rules Work:</strong>
                                                <ul class="mb-0 mt-1">
                                                    <li>Rules are evaluated for each sample based on conditions you specify</li>
                                                    <li>If conditions match, the setting is set to <code>EXCLUDE</code> and filtered out from the final samplesheet</li>
                                                    <li>Leave condition fields empty to match all samples</li>
                                                    <li>Multiple conditions act as AND (all must match)</li>
                                                </ul>
                                            </div>

                                            <!-- TrimUMI Rule -->
                                            <div class="card mb-3">
                                                <div class="card-header bg-light">
                                                    <strong>TrimUMI Exclusion Rule</strong>
                                                </div>
                                                <div class="card-body">
                                                    <div class="row">
                                                        <div class="col-md-6 mb-3">
                                                            <label class="form-label">Action:</label>
                                                            <div class="form-check">
                                                                <input type="radio" class="form-check-input" id="stage2_trim_umi_keep" v-model="customConfigFormData.stage2_trim_umi_action" value="keep">
                                                                <label class="form-check-label" for="stage2_trim_umi_keep">Keep in samplesheet (default)</label>
                                                            </div>
                                                            <div class="form-check">
                                                                <input type="radio" class="form-check-input" id="stage2_trim_umi_exclude" v-model="customConfigFormData.stage2_trim_umi_action" value="exclude">
                                                                <label class="form-check-label" for="stage2_trim_umi_exclude">Exclude from samplesheet if conditions match</label>
                                                            </div>
                                                        </div>
                                                        
                                                        <div v-if="customConfigFormData.stage2_trim_umi_action === 'exclude'" class="col-md-6">
                                                            <label class="form-label">Conditions (all must match):</label>
                                                            <div class="mb-2">
                                                                <label class="form-label small">Sample Type:</label>
                                                                <input type="text" class="form-control form-control-sm" v-model="customConfigFormData.stage2_trim_umi_conditions.sample_type" placeholder="e.g., NOINDEX, STANDARD (leave empty for all)">
                                                            </div>
                                                            <div class="mb-2">
                                                                <label class="form-label small">UMI Config:</label>
                                                                <input type="text" class="form-control form-control-sm" v-model="customConfigFormData.stage2_trim_umi_conditions.umi_config" placeholder="e.g., null, r1_start (leave empty for all)">
                                                                <small class="text-muted">Enter "null" to match samples without UMI config</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- CreateFastqForIndexReads Rule -->
                                            <div class="card mb-3">
                                                <div class="card-header bg-light">
                                                    <strong>CreateFastqForIndexReads Exclusion Rule</strong>
                                                </div>
                                                <div class="card-body">
                                                    <div class="row">
                                                        <div class="col-md-6 mb-3">
                                                            <label class="form-label">Action:</label>
                                                            <div class="form-check">
                                                                <input type="radio" class="form-check-input" id="stage2_create_fastq_keep" v-model="customConfigFormData.stage2_create_fastq_action" value="keep">
                                                                <label class="form-check-label" for="stage2_create_fastq_keep">Keep in samplesheet (default)</label>
                                                            </div>
                                                            <div class="form-check">
                                                                <input type="radio" class="form-check-input" id="stage2_create_fastq_exclude" v-model="customConfigFormData.stage2_create_fastq_action" value="exclude">
                                                                <label class="form-check-label" for="stage2_create_fastq_exclude">Exclude from samplesheet if conditions match</label>
                                                            </div>
                                                        </div>
                                                        
                                                        <div v-if="customConfigFormData.stage2_create_fastq_action === 'exclude'" class="col-md-6">
                                                            <label class="form-label">Conditions (all must match):</label>
                                                            <div class="mb-2">
                                                                <label class="form-label small">Sample Type:</label>
                                                                <input type="text" class="form-control form-control-sm" v-model="customConfigFormData.stage2_create_fastq_conditions.sample_type" placeholder="e.g., NOINDEX, STANDARD (leave empty for all)">
                                                            </div>
                                                            <div class="mb-2">
                                                                <label class="form-label small">UMI Config:</label>
                                                                <input type="text" class="form-control form-control-sm" v-model="customConfigFormData.stage2_create_fastq_conditions.umi_config" placeholder="e.g., null, r1_start (leave empty for all)">
                                                                <small class="text-muted">Enter "null" to match samples without UMI config</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Preview of Affected Samples -->
                                    <div v-if="customConfigTargetSamples.length > 0" class="alert alert-info">
                                        <h6><i class="fa fa-info-circle"></i> Affected Samples ({{ customConfigTargetSamples.length }})</h6>
                                        <div class="mt-2" style="max-height: 200px; overflow-y: auto;">
                                            <ul class="mb-0">
                                                <li v-for="target in customConfigTargetSamples.slice(0, 20)" :key="target.lane + '_' + target.uuid">
                                                    Lane {{ target.lane }}: {{ target.sample_id }}
                                                </li>
                                                <li v-if="customConfigTargetSamples.length > 20">
                                                    ... and {{ customConfigTargetSamples.length - 20 }} more
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div v-else-if="customConfigFormData.target_project || customConfigFormData.target_type === 'lane'" class="alert alert-warning">
                                        <i class="fa fa-exclamation-triangle"></i> No samples match the selected criteria.
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeCustomConfigModal">Cancel</button>
                                    <button type="button" class="btn btn-primary" @click="saveCustomConfig">
                                        <i class="fa fa-save"></i> {{ customConfigEditMode ? 'Update Configuration' : 'Create Configuration' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
};

const app = Vue.createApp(vDemuxSampleInfoEditor);
app.mount('#demux_sample_info_editor_main');
