const vDemuxSampleInfoEditor = {
    data() {
        const config = window.STATUS_CONFIG || {};
        const defaultVisibleColumns = ['sample_id', 'last_modified', 'sample_type', 'index_1', 'index_2', 'umi_config', 'recipe', 'override_cycles'];
        return {
            limsUrl: config.lims_url || '',
            flowcell_id: '',
            demux_data: null,
            flowcell_list: [],  // List of recent flowcells
            loadingFlowcells: false,
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
                { key: 'config_sources', label: 'Config Sources' },
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
            samplePresets: null,  // Sample classification presets
            selectedPreset: '',  // Currently selected preset
            sampleClassificationConfig: null,  // Full sample classification configuration
            showConfigModal: false,
            configModalSources: [],
            configModalSample: null,
            expandedConfigSources: []  // Track which config sources are expanded
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
                    const editedSettings = this.editedData[lane]?.[uuid];
                    const finalSettings = editedSettings ? { ...latestSettings, ...editedSettings } : latestSettings;

                    // Extract per_sample_fields and other_details
                    const per_sample_fields = finalSettings.per_sample_fields || {};
                    const other_details = finalSettings.other_details || {};

                    result[lane].push({
                        uuid: uuid,
                        lane: per_sample_fields.Lane,
                        sample_id: per_sample_fields.Sample_ID,
                        sample_name: per_sample_fields.Sample_Name,
                        sample_project: per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: per_sample_fields.index,
                        index_2: per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: other_details.named_index,
                        recipe: other_details.recipe,
                        operator: other_details.operator,
                        description: sample.description,
                        control: sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: per_sample_fields.OverrideCycles
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
                    const editedSettings = this.editedData[lane]?.[uuid];
                    const finalSettings = editedSettings ? { ...latestSettings, ...editedSettings } : latestSettings;

                    // Extract per_sample_fields and other_details
                    const per_sample_fields = finalSettings.per_sample_fields || {};
                    const other_details = finalSettings.other_details || {};

                    const projectName = sample.project_name || 'Unknown Project';

                    if (!result[lane][projectName]) {
                        result[lane][projectName] = [];
                    }

                    result[lane][projectName].push({
                        uuid: uuid,
                        lane: per_sample_fields.Lane,
                        sample_id: per_sample_fields.Sample_ID,
                        sample_name: per_sample_fields.Sample_Name,
                        sample_project: per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: per_sample_fields.index,
                        index_2: per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: other_details.named_index,
                        recipe: other_details.recipe,
                        operator: other_details.operator,
                        description: sample.description,
                        control: sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: per_sample_fields.OverrideCycles
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
                    const editedSettings = this.editedData[lane]?.[uuid];
                    const finalSettings = editedSettings ? { ...latestSettings, ...editedSettings } : latestSettings;

                    // Extract per_sample_fields and other_details
                    const per_sample_fields = finalSettings.per_sample_fields || {};
                    const other_details = finalSettings.other_details || {};

                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = other_details.named_index || 'No Named Index';

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
                        sample_id: per_sample_fields.Sample_ID,
                        sample_name: per_sample_fields.Sample_Name,
                        sample_project: per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: per_sample_fields.index,
                        index_2: per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: other_details.named_index,
                        recipe: other_details.recipe,
                        operator: other_details.operator,
                        description: sample.description,
                        control: sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: per_sample_fields.OverrideCycles
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
                    const editedSettings = this.editedData[lane]?.[uuid];
                    const finalSettings = editedSettings ? { ...latestSettings, ...editedSettings } : latestSettings;

                    // Extract per_sample_fields and other_details
                    const per_sample_fields = finalSettings.per_sample_fields || {};
                    const other_details = finalSettings.other_details || {};

                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = other_details.named_index || 'No Named Index';

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
                        sample_id: per_sample_fields.Sample_ID,
                        sample_name: per_sample_fields.Sample_Name,
                        sample_project: per_sample_fields.Sample_Project,
                        project_name: sample.project_name,
                        project_id: sample.project_id,
                        last_modified: sample.last_modified,
                        sample_ref: other_details.sample_ref,
                        sample_type: other_details.sample_type,
                        config_sources: other_details.config_sources,
                        index_1: per_sample_fields.index,
                        index_2: per_sample_fields.index2,
                        index_length: other_details.index_length,
                        umi_config: other_details.umi_config,
                        named_index: other_details.named_index,
                        recipe: other_details.recipe,
                        operator: other_details.operator,
                        description: sample.description,
                        control: sample.control,
                        mask_short_reads: per_sample_fields.MaskShortReads,
                        minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                        override_cycles: per_sample_fields.OverrideCycles
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

            const parts = configSource.split('.');
            if (parts.length < 2) return null;

            const category = parts[0];  // e.g., "patterns", "library_method_mapping", "bcl_convert_settings", "instrument_type_mapping"
            const key = parts.slice(1).join('.');  // e.g., "tenx_single", "BCLConvert_Settings"

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
            }

            return null;
        },
        formatConfigValue(value) {
            // Format configuration value for display
            if (value === null || value === undefined) {
                return 'null';
            }
            if (typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }
            return String(value);
        },
        traceConfigValueSource(configKey, path = null) {
            // Trace which config source set a specific value
            // configKey can be 'sample_type', 'umi_config', 'named_indices', or 'BCLConvert_Settings'
            // path is for nested values like 'BCLConvert_Settings.BarcodeMismatchesIndex1'

            if (!this.configModalSources || !this.sampleClassificationConfig) return null;

            let lastSource = null;

            // Go through config sources in order
            for (const source of this.configModalSources) {
                const config = this.getConfigDetails(source);
                if (!config) continue;

                if (path) {
                    // For nested paths like BCLConvert_Settings.BarcodeMismatchesIndex1
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
            // Get all BCLConvert settings including defaults from schema
            const allSettings = {};

            // If config is loaded, start with defaults
            if (this.sampleClassificationConfig) {
                const bclConvertDefaults = this.sampleClassificationConfig.bcl_convert_settings?.BCLConvert_Settings || {};
                for (const [key, config] of Object.entries(bclConvertDefaults)) {
                    if (config.default !== undefined) {
                        allSettings[key] = config.default;
                    }
                }
            }

            // Override with actual settings from the sample
            if (sampleSettings?.BCLConvert_Settings) {
                Object.assign(allSettings, sampleSettings.BCLConvert_Settings);
            }

            return allSettings;
        },
        getSamplesheetBCLSettings(settings) {
            // Helper method to get BCLConvert settings for samplesheet display
            return this.getAllBCLConvertSettings(settings);
        },
        formatConfigSourceLabel(source) {
            // Format config source string into readable label
            if (!source) return null;

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
                // Note: UMI config and BCLConvert settings are applied by the backend based on classification
            }
        },
        fetchDemuxInfo() {
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
        fetchFlowcellList() {
            // Fetch the list of recent flowcells
            this.loadingFlowcells = true;

            axios.get('/api/v1/demux_sample_info_list')
                .then(response => {
                    this.flowcell_list = response.data.flowcells || [];
                    this.loadingFlowcells = false;
                })
                .catch(error => {
                    console.error('Error fetching flowcell list:', error);
                    this.loadingFlowcells = false;
                });
        },
        selectFlowcell(flowcellId) {
            // Select a flowcell from the list
            this.flowcell_id = flowcellId;
            this.fetchDemuxInfo();
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

            // Get original value to compare
            const originalSample = this.calculatedLanes[lane]?.sample_rows[uuid];
            if (originalSample) {
                const settingsVersions = Object.keys(originalSample.settings).sort().reverse();
                const latestSettings = originalSample.settings[settingsVersions[0]];
                const originalValue = latestSettings[field];

                // If value matches original, remove from edited data
                if (newValue === originalValue) {
                    delete this.editedData[lane][uuid][field];
                    // Clean up empty objects
                    if (Object.keys(this.editedData[lane][uuid]).length === 0) {
                        delete this.editedData[lane][uuid];
                    }
                    if (Object.keys(this.editedData[lane]).length === 0) {
                        delete this.editedData[lane];
                    }
                } else {
                    // Store the edited value
                    this.editedData[lane][uuid][field] = newValue;
                }
            } else {
                // No original found, just store the value
                this.editedData[lane][uuid][field] = newValue;
            }
        },
        saveChanges() {
            if (!this.hasChanges) {
                this.error_messages.push('No changes to save.');
                return;
            }

            this.error_messages = [];
            this.saving = true;

            // Prepare the data to send to the API
            // Convert editedData to the format expected by the backend
            const payload = {
                flowcell_id: this.flowcell_id,
                edited_settings: this.editedData,  // { lane: { uuid: settings_object } }
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
                override_cycles: currentSettings.override_cycles || latestSettings.per_sample_fields?.OverrideCycles || ''
            };

            this.editModalLane = lane;
            this.editModalUuid = uuid;
            this.editModalSample = sample;
            this.editModalIsNew = false;
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
                override_cycles: templateSettings.per_sample_fields?.OverrideCycles || ''
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
                override_cycles: ''
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
                    const newValue = this.editFormData[field];
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

            // Add BCLConvert settings in standard order
            const settingsOrder = ['SoftwareVersion', 'MinimumTrimmedReadLength', 'MaskShortReads'];
            for (const key of settingsOrder) {
                if (samplesheet.BCLConvert_Settings[key] !== undefined) {
                    lines.push(`${key},${samplesheet.BCLConvert_Settings[key]}`);
                }
            }

            // Add remaining settings
            for (const [key, value] of Object.entries(samplesheet.BCLConvert_Settings)) {
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
        }
    },
    mounted() {
        // Fetch the list of recent flowcells
        this.fetchFlowcellList();

        // Check if flowcell ID is in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const flowcellId = urlParams.get('flowcell');
        
        if (flowcellId) {
            this.flowcell_id = flowcellId;
            this.fetchDemuxInfo();
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Demux Sample Info Editor</h1>

                    <!-- Recent Flowcells List -->
                    <div class="card mt-4 mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Recent Flowcells (Latest 50)</h5>

                            <!-- Loading state -->
                            <div v-if="loadingFlowcells" class="text-center py-3">
                                <div class="spinner-border spinner-border-sm" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <span class="ms-2">Loading flowcells...</span>
                            </div>

                            <!-- Flowcell list -->
                            <div v-else-if="flowcell_list.length > 0" class="list-group" style="max-height: 400px; overflow-y: auto;">
                                <button
                                    v-for="fc in flowcell_list"
                                    :key="fc.flowcell_id"
                                    type="button"
                                    class="list-group-item list-group-item-action"
                                    :class="{ 'active': flowcell_id === fc.flowcell_id }"
                                    @click="selectFlowcell(fc.flowcell_id)">
                                    <i class="fa fa-file-text-o me-2"></i>{{ fc.flowcell_id }}
                                </button>
                            </div>

                            <!-- No flowcells found -->
                            <div v-else class="alert alert-info mb-0">
                                No flowcells found in the database.
                            </div>

                            <!-- Manual entry option -->
                            <div class="mt-3 pt-3 border-top">
                                <label class="form-label"><strong>Or enter a flowcell ID manually:</strong></label>
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
                                            Bulk Edit Actions
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
                                                                        :title="'Click to view configuration details'">
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
                                                                                :title="'Click to view configuration details'">
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
                                                                            :title="'Click to view configuration details'">
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
                                                                                    :title="'Click to view configuration details'">
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
                                <p class="text-muted">Generated samplesheets grouped by lane and BCLConvert settings. Projects with different settings are split into separate samplesheets.</p>

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
                    <div v-if="showEditModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">{{ editModalIsNew ? 'Add New Sample' : 'Edit Sample' }}</h5>
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
                                                    <p class="mb-2 small text-muted">The following configurations were applied in order to generate this sample's settings:</p>
                                                    <ol class="mb-0">
                                                        <li v-for="(source, index) in getConfigSources(editModalSample)" :key="index" class="font-monospace small">
                                                            {{ source }}
                                                        </li>
                                                    </ol>
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
                    <div v-if="showBulkEditModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
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
                    <div v-if="showConfigModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header bg-info text-white">
                                    <h5 class="modal-title">
                                        <i class="fa fa-cog"></i> Sample Classification Configuration Details
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" @click="closeConfigModal"></button>
                                </div>
                                <div class="modal-body">
                                    <!-- Show the final calculated settings -->
                                    <div v-if="configModalSample" class="mb-4">
                                        <h5 class="text-info">
                                            <i class="fa fa-check-circle"></i> Final Calculated Settings
                                        </h5>
                                        <p class="text-muted">After applying all configurations above, these are the final settings for this sample:</p>
                                        <div class="card">
                                            <div class="card-body">
                                                <div v-if="configModalSample.settings">
                                                    <div v-for="(settings, timestamp) in configModalSample.settings" :key="timestamp">
                                                        <h6 class="text-muted">Settings ({{ formatTimestamp(timestamp) }})</h6>
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
                                                                        <td colspan="3" class="table-secondary"><strong>BCLConvert Settings</strong></td>
                                                                    </tr>
                                                                    <tr v-for="(value, key) in getAllBCLConvertSettings(settings)" :key="key">
                                                                        <td class="ps-4">{{ key }}</td>
                                                                        <td><code>{{ value }}</code></td>
                                                                        <td>
                                                                            <span v-if="traceConfigValueSource('BCLConvert_Settings', 'BCLConvert_Settings.' + key)" class="badge bg-info">
                                                                                {{ formatConfigSourceLabel(traceConfigValueSource('BCLConvert_Settings', 'BCLConvert_Settings.' + key)) }}
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

                                    <!-- Configuration Sources -->
                                    <div class="mt-4">
                                        <h5 class="text-info">
                                            <i class="fa fa-list"></i> Configuration Sources Applied
                                        </h5>
                                        <p class="text-muted mb-3">
                                            The following configurations were applied in order (from least specific to most specific) to determine this sample's classification:
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
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeConfigModal">Close</button>
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
