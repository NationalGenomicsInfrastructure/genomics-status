// Centralized field configuration - single source of truth for all field metadata
const FIELD_CONFIG = {
    lane: {
        key: 'lane',
        label: 'Lane',
        backendKey: 'lane',
        settingsPath: ['per_sample_fields', 'Lane'],
        bulkEditable: false,
        historyDisplayName: 'Lane',
        topLevel: false
    },
    sample_id: {
        key: 'sample_id',
        label: 'Sample ID',
        backendKey: 'sample_id',
        settingsPath: ['per_sample_fields', 'Sample_ID'],
        bulkEditable: false,
        historyDisplayName: 'Sample ID',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 1,
            columnWidth: 6,
            helpText: {
                add: 'Replace XXXX with a 3-4 digit number (e.g., 001 or 1001)',
                edit: null
            }
        }
    },
    sample_name: {
        key: 'sample_name',
        label: 'Sample Name',
        backendKey: 'sample_name',
        settingsPath: ['per_sample_fields', 'Sample_Name'],
        bulkEditable: false,
        historyDisplayName: 'Sample Name',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 2,
            columnWidth: 6,
            helpText: {
                add: 'Replace XXXX with a 3-4 digit number (e.g., 001 or 1001)',
                edit: null
            }
        }
    },
    sample_project: {
        key: 'sample_project',
        label: 'Sample Project',
        backendKey: 'sample_project',
        settingsPath: ['per_sample_fields', 'Sample_Project'],
        bulkEditable: true,
        historyDisplayName: 'Sample Project',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 3,
            columnWidth: 6,
            readonly: true
        }
    },
    project_name: {
        key: 'project_name',
        label: 'Project Name',
        backendKey: 'project_name',
        settingsPath: ['_sample', 'project_name'],
        bulkEditable: true,
        historyDisplayName: 'Project Name',
        topLevel: true,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 3.1,
            columnWidth: 6
        }
    },
    project_id: {
        key: 'project_id',
        label: 'Project ID',
        backendKey: 'project_id',
        settingsPath: ['_sample', 'project_id'],
        bulkEditable: true,
        historyDisplayName: 'Project ID',
        topLevel: true,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 3.2,
            columnWidth: 6
        }
    },
    sample_ref: {
        key: 'sample_ref',
        label: 'Sample Ref',
        backendKey: 'sample_ref',
        settingsPath: ['other_details', 'sample_ref'],
        bulkEditable: true,
        historyDisplayName: 'Sample Ref',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 4,
            columnWidth: 6
        }
    },
    sample_type: {
        key: 'sample_type',
        label: 'Sample Type',
        backendKey: 'sample_type',
        settingsPath: ['other_details', 'sample_type'],
        bulkEditable: false,
        historyDisplayName: 'Sample Type',
        topLevel: false
    },
    config_sources: {
        key: 'config_sources',
        label: 'Config Sources (Stage 1)',
        backendKey: 'config_sources',
        settingsPath: ['other_details', 'config_sources'],
        bulkEditable: false,
        historyDisplayName: 'Config Sources',
        topLevel: false
    },
    index_1: {
        key: 'index_1',
        label: 'Index 1',
        backendKey: 'index',
        settingsPath: ['per_sample_fields', 'index'],
        bulkEditable: false,
        historyDisplayName: 'Index 1',
        topLevel: false,
        formField: {
            inputType: 'index',
            showInForm: true,
            order: 5,
            columnWidth: 6,
            pattern: '[ACGT]*',
            title: 'Only ACGT characters are allowed'
        }
    },
    index_2: {
        key: 'index_2',
        label: 'Index 2',
        backendKey: 'index2',
        settingsPath: ['per_sample_fields', 'index2'],
        bulkEditable: false,
        historyDisplayName: 'Index 2',
        topLevel: false,
        formField: {
            inputType: 'index',
            showInForm: true,
            order: 6,
            columnWidth: 6,
            pattern: '[ACGT]*',
            title: 'Only ACGT characters are allowed'
        }
    },
    index_length: {
        key: 'index_length',
        label: 'Index Length',
        backendKey: 'index_length',
        settingsPath: ['other_details', 'index_length'],
        bulkEditable: false,
        historyDisplayName: 'Index Length',
        topLevel: false
    },
    umi_length: {
        key: 'umi_length',
        label: 'UMI Length',
        backendKey: 'umi_length',
        settingsPath: ['other_details', 'umi_length'],
        bulkEditable: true,
        historyDisplayName: 'UMI Length',
        topLevel: false
    },
    umi_config: {
        key: 'umi_config',
        label: 'UMI Config',
        backendKey: 'umi_config',
        settingsPath: ['other_details', 'umi_config'],
        bulkEditable: true,
        historyDisplayName: 'UMI Config',
        topLevel: false,
        type: 'object'
    },
    named_index: {
        key: 'named_index',
        label: 'Named Index',
        backendKey: 'named_index',
        settingsPath: ['other_details', 'named_index'],
        bulkEditable: false,
        historyDisplayName: 'Named Index',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 7,
            columnWidth: 6
        }
    },
    recipe: {
        key: 'recipe',
        label: 'Recipe',
        backendKey: 'recipe',
        settingsPath: ['other_details', 'recipe'],
        bulkEditable: true,
        historyDisplayName: 'Recipe',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 8,
            columnWidth: 6
        }
    },
    operator: {
        key: 'operator',
        label: 'Operator',
        backendKey: 'operator',
        settingsPath: ['other_details', 'operator'],
        bulkEditable: true,
        historyDisplayName: 'Operator',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 9,
            columnWidth: 6
        }
    },
    description: {
        key: 'description',
        label: 'Description',
        backendKey: 'description',
        settingsPath: ['_sample', 'description'],
        bulkEditable: true,
        historyDisplayName: 'Description',
        topLevel: true,
        formField: {
            inputType: 'textarea',
            showInForm: true,
            order: 11,
            columnWidth: 12,
            rows: 2
        }
    },
    control: {
        key: 'control',
        label: 'Control',
        backendKey: 'control',
        settingsPath: ['_sample', 'control'],
        bulkEditable: true,
        historyDisplayName: 'Control',
        topLevel: true,
        formField: {
            inputType: 'select',
            showInForm: true,
            order: 10,
            columnWidth: 6,
            options: [
                { value: 'N', label: 'N' },
                { value: 'Y', label: 'Y' }
            ]
        }
    },
    mask_short_reads: {
        key: 'mask_short_reads',
        label: 'Mask Short Reads',
        backendKey: 'mask_short_reads',
        settingsPath: ['per_sample_fields', 'MaskShortReads'],
        bulkEditable: true,
        historyDisplayName: 'Mask Short Reads',
        topLevel: false,
        type: 'number'
    },
    minimum_trimmed_read_length: {
        key: 'minimum_trimmed_read_length',
        label: 'Min Trimmed Length',
        backendKey: 'minimum_trimmed_read_length',
        settingsPath: ['per_sample_fields', 'MinimumTrimmedReadLength'],
        bulkEditable: true,
        historyDisplayName: 'Minimum Trimmed Read Length',
        topLevel: false,
        type: 'number'
    },
    override_cycles: {
        key: 'override_cycles',
        label: 'Override Cycles',
        backendKey: 'override_cycles',
        settingsPath: ['per_sample_fields', 'OverrideCycles'],
        bulkEditable: false,
        historyDisplayName: 'Override Cycles',
        topLevel: false,
        formField: {
            inputType: 'text',
            showInForm: true,
            order: 12,
            columnWidth: 12,
            readonly: true,
            cssClass: 'font-monospace bg-light'
        }
    },
    last_modified: {
        key: 'last_modified',
        label: 'Last Modified',
        backendKey: 'last_modified',
        settingsPath: ['_sample', 'last_modified'],
        bulkEditable: false,
        historyDisplayName: 'Last Modified',
        topLevel: true
    },
    trim_umi: {
        key: 'trim_umi',
        label: 'Trim UMI',
        backendKey: 'trim_umi',
        settingsPath: ['raw_samplesheet_settings', 'TrimUMI'],
        bulkEditable: true,
        historyDisplayName: 'Trim UMI',
        topLevel: false,
        type: 'boolean',
        formField: {
            inputType: 'radio-boolean-nullable',
            showInForm: true,
            order: 14,
            columnWidth: 6,
            section: 'bclconvert'
        }
    },
    create_fastq_for_index_reads: {
        key: 'create_fastq_for_index_reads',
        label: 'Create FASTQ for Index Reads',
        backendKey: 'create_fastq_for_index_reads',
        settingsPath: ['raw_samplesheet_settings', 'CreateFastqForIndexReads'],
        bulkEditable: true,
        historyDisplayName: 'Create FASTQ for Index Reads',
        topLevel: false,
        type: 'boolean',
        formField: {
            inputType: 'radio-boolean-nullable',
            showInForm: true,
            order: 15,
            columnWidth: 6,
            section: 'bclconvert'
        }
    },
    barcode_mismatches_index1: {
        key: 'barcode_mismatches_index1',
        label: 'Barcode Mismatches Index 1',
        backendKey: 'barcode_mismatches_index1',
        settingsPath: ['raw_samplesheet_settings', 'BarcodeMismatchesIndex1'],
        bulkEditable: true,
        historyDisplayName: 'Barcode Mismatches Index 1',
        topLevel: false,
        type: 'number',
        formField: {
            inputType: 'number',
            showInForm: true,
            order: 16,
            columnWidth: 6,
            section: 'bclconvert',
            min: 0,
            max: 2,
            placeholder: 'Default',
            helpText: {
                add: '0-2 mismatches allowed (leave blank for default)',
                edit: '0-2 mismatches allowed (leave blank for default)'
            }
        }
    },
    barcode_mismatches_index2: {
        key: 'barcode_mismatches_index2',
        label: 'Barcode Mismatches Index 2',
        backendKey: 'barcode_mismatches_index2',
        settingsPath: ['raw_samplesheet_settings', 'BarcodeMismatchesIndex2'],
        bulkEditable: true,
        historyDisplayName: 'Barcode Mismatches Index 2',
        topLevel: false,
        type: 'number',
        formField: {
            inputType: 'number',
            showInForm: true,
            order: 17,
            columnWidth: 6,
            section: 'bclconvert',
            min: 0,
            max: 2,
            placeholder: 'Default',
            helpText: {
                add: '0-2 mismatches allowed (leave blank for default)',
                edit: '0-2 mismatches allowed (leave blank for default)'
            }
        }
    }
};

// Constants for magic strings and default values
const CONSTANTS = {
    VIEW_MODES: {
        UPLOADED: 'uploaded',
        CALCULATED: 'calculated',
        GROUPED_NAMED_INDEX: 'grouped_named_index'
    },
    MODAL_TABS: {
        EDIT: 'edit',
        ADD: 'add',
        BULK: 'bulk'
    }
};

// Utility functions for common operations
const UTILS = {
    /**
     * Sort lanes numerically instead of alphabetically
     * @param {Array<string>} lanes - Array of lane identifiers
     * @returns {Array<string>} Sorted lanes
     */
    sortLanesNumerically(lanes) {
        return lanes.sort((a, b) => parseInt(a) - parseInt(b));
    },
    /**
     * Sort object keys as lanes and return new object with sorted keys
     * @param {Object} obj - Object with lane keys
     * @returns {Object} New object with lanes sorted numerically
     */
    sortLaneObject(obj) {
        return Object.keys(obj)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .reduce((acc, lane) => {
                acc[lane] = obj[lane];
                return acc;
            }, {});
    }
};

/**
 * ConfigInspectModal Component
 *
 * Modal for inspecting sample classification configuration details and sources.
 * Shows Stage 1 (stored settings) and historical versions.
 *
 * @component
 * @emits close - Emitted when modal should be closed
 * @emits toggle-source - Emitted when config source expansion is toggled
 */
const ConfigInspectModal = {
    name: 'ConfigInspectModal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        sample: {
            type: Object,
            default: null
        },
        sources: {
            type: Array,
            default: () => []
        },
        expandedSources: {
            type: Array,
            default: () => []
        },
        classificationConfig: {
            type: Object,
            default: null
        },
        sortedSettings: {
            type: Array,
            default: () => []
        },
        // Pass method functions as props
        formatTimestamp: {
            type: Function,
            required: true
        },
        formatConfigValue: {
            type: Function,
            required: true
        },
        getConfigDetails: {
            type: Function,
            required: true
        },
        traceConfigValueSource: {
            type: Function,
            required: true
        },
        formatConfigSourceLabel: {
            type: Function,
            required: true
        },
        getAllBCLConvertSettings: {
            type: Function,
            required: true
        },
        wasBCLSettingManuallyEdited: {
            type: Function,
            required: true
        }
    },
    methods: {
        close() {
            this.$emit('close');
        },
        toggleSource(index) {
            this.$emit('toggle-source', index);
        },
        isSourceExpanded(index) {
            return this.expandedSources.includes(index);
        }
    },
    template: /*html*/`
        <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fa fa-cog"></i> Sample Classification Configuration Details
                        </h5>
                        <button type="button" class="btn-close btn-close-white" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Two-Stream Architecture Info -->
                        <div class="alert alert-info" role="alert">
                            <h6 class="alert-heading"><i class="fa fa-info-circle"></i> Understanding the Two-Stream Architecture</h6>
                            <p class="mb-2 small">
                                The system uses a <strong>two-stream approach</strong> to manage sample configurations:
                            </p>
                            <ul class="small mb-2">
                                <li><strong>Stage 1: Classification & Storage</strong> - Settings shown below are calculated and stored permanently in the database based on sample properties (6-tier classification system). These are your "gold standard" settings.</li>
                                <li><strong>Stage 2: Samplesheet Generation</strong> - When creating samplesheets, additional rules are applied dynamically (e.g., excluding TrimUMI for NoIndex samples or samples without UMI config). These adjustments are <em>not</em> stored in the database.</li>
                            </ul>
                            <p class="mb-0 small">
                                <i class="fa fa-lightbulb-o"></i> <strong>Note:</strong> The settings displayed here reflect Stage 1 (stored data). To see what will actually appear in generated samplesheets after Stage 2 rules are applied, download the samplesheets from the Samplesheets tab.
                            </p>
                        </div>
                        <!-- Current Settings -->
                        <div v-if="sample && sortedSettings.length > 0" class="mb-4">
                            <h5 class="text-info">
                                <i class="fa fa-check-circle"></i> Current Settings (Stage 1: Stored in Database)
                            </h5>
                            <p class="text-muted">These settings are permanently stored and represent the calculated configuration based on sample classification:</p>
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="text-muted">{{ formatTimestamp(sortedSettings[0][0]) }}</h6>
                                    <!-- Show config sources for current version -->
                                    <div v-if="sortedSettings[0][1].other_details?.config_sources && sortedSettings[0][1].other_details.config_sources.length > 0" class="alert alert-secondary small mb-3">
                                        <strong><i class="fa fa-stream"></i> Stage 1: Configuration sources applied (stored in database):</strong>
                                        <ol class="mb-0 mt-1">
                                            <li v-for="(source, idx) in sortedSettings[0][1].other_details.config_sources" :key="idx" class="font-monospace">
                                                {{ source }}
                                            </li>
                                        </ol>
                                        <div class="mt-2 fst-italic">
                                            <i class="fa fa-info-circle"></i> These sources show how Stage 1 calculated and stored your settings. Stage 2 samplesheet generation rules may dynamically adjust these for the final output.
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
                                                    <td><code>{{ sortedSettings[0][1].other_details?.sample_type || 'N/A' }}</code></td>
                                                    <td>
                                                        <span v-if="traceConfigValueSource('sample_type')" class="badge bg-info">
                                                            {{ formatConfigSourceLabel(traceConfigValueSource('sample_type')) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Index Length</strong></td>
                                                    <td><code>{{ formatConfigValue(sortedSettings[0][1].other_details?.index_length) }}</code></td>
                                                    <td><span class="badge bg-secondary">actual indices</span></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>UMI Config</strong></td>
                                                    <td><code>{{ formatConfigValue(sortedSettings[0][1].other_details?.umi_config) }}</code></td>
                                                    <td>
                                                        <span v-if="traceConfigValueSource('umi_config')" class="badge bg-info">
                                                            {{ formatConfigSourceLabel(traceConfigValueSource('umi_config')) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Named Indices</strong></td>
                                                    <td><code>{{ sortedSettings[0][1].other_details?.named_index || 'N/A' }}</code></td>
                                                    <td>
                                                        <span v-if="traceConfigValueSource('named_indices')" class="badge bg-info">
                                                            {{ formatConfigSourceLabel(traceConfigValueSource('named_indices')) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr v-if="getAllBCLConvertSettings(sortedSettings[0][1]) && Object.keys(getAllBCLConvertSettings(sortedSettings[0][1])).length > 0">
                                                    <td colspan="3" class="table-secondary">
                                                        <strong>BCLConvert Settings (Stage 1: Stored)</strong>
                                                        <span class="badge bg-info ms-2 small" title="These are the calculated and stored settings. Stage 2 may dynamically exclude some settings during samplesheet generation.">Stage 1</span>
                                                    </td>
                                                </tr>
                                                <tr v-for="(value, key) in getAllBCLConvertSettings(sortedSettings[0][1])" :key="key">
                                                    <td class="ps-4">{{ key }}</td>
                                                    <td>
                                                        <code v-if="value === 'EXCLUDE'" class="text-danger" title="This value is set to EXCLUDE in stored settings (rare - typically EXCLUDE is used in Stage 2 samplesheet generation rules)">EXCLUDE</code>
                                                        <code v-else>{{ value }}</code>
                                                    </td>
                                                    <td>
                                                        <span v-if="wasBCLSettingManuallyEdited(sortedSettings[0][0], key, value)" class="badge bg-warning text-dark">
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
                                <i class="fa fa-list"></i> Stage 1: Configuration Source Details (Stored Settings)
                            </h5>
                            <p class="text-muted mb-3">
                                Detailed information about each Stage 1 configuration source that determined the stored settings.
                                Configurations are applied in order during classification (from least specific to most specific):
                            </p>
                            <div v-if="!classificationConfig" class="text-center">
                                <div class="spinner-border text-info" role="status">
                                    <span class="visually-hidden">Loading configuration...</span>
                                </div>
                                <p class="mt-2">Loading configuration details...</p>
                            </div>
                            <div v-else>
                                <div v-for="(source, index) in sources" :key="index" class="card mb-2">
                                    <div class="card-header">
                                        <button class="btn btn-link text-start w-100 text-decoration-none d-flex align-items-center"
                                            type="button"
                                            @click="toggleSource(index)">
                                            <span class="badge bg-primary me-2">{{ index + 1 }}</span>
                                            <strong class="flex-grow-1">{{ source }}</strong>
                                            <i class="fa" :class="isSourceExpanded(index) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                                        </button>
                                    </div>
                                    <div v-show="isSourceExpanded(index)" class="card-body">
                                        <div v-if="getConfigDetails(source)">
                                            <pre class="bg-light p-3 rounded mb-0"><code>{{ formatConfigValue(getConfigDetails(source)) }}</code></pre>
                                        </div>
                                        <div v-else class="alert alert-warning mb-0">
                                            Configuration details not available for this source.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Stage 2 Information -->
                            <div class="alert alert-warning mt-3" role="alert">
                                <h6 class="alert-heading"><i class="fa fa-stream"></i> Stage 2: Samplesheet Generation Rules (Not Shown Here)</h6>
                                <p class="mb-2 small">
                                    In addition to the stored settings above, <strong>conditional rules are applied dynamically</strong> when generating samplesheets. These rules:
                                </p>
                                <ul class="small mb-2">
                                    <li>May <strong>exclude settings</strong> from the samplesheet based on sample properties (e.g., excluding TrimUMI for samples without UMI configuration)</li>
                                    <li>Are <strong>not stored</strong> in the database or tracked in config_sources</li>
                                    <li>Apply to: NoIndex samples, standard samples without UMI, IDT UMI samples without UMI config, and control samples</li>
                                </ul>
                                <p class="mb-0 small">
                                    <i class="fa fa-download"></i> <strong>To see the final samplesheet output:</strong> Download the generated samplesheets from the Samplesheets tab. They reflect both Stage 1 (stored settings) and Stage 2 (dynamic rules).
                                </p>
                            </div>
                        </div>
                        <!-- Historical Settings -->
                        <div v-if="sample && sortedSettings.length > 1" class="mt-4">
                            <h3 class="text-secondary">
                                <i class="fa fa-history"></i> Historical Settings (Stage 1: Version History)
                            </h3>
                            <p class="text-muted">Previous versions of stored settings for this sample:</p>
                            <div class="card">
                                <div class="card-body">
                                    <div v-for="[timestamp, settings] in sortedSettings.slice(1)" :key="timestamp" class="mb-4 pb-3 border-bottom">
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
                                                            <strong>BCLConvert Settings (Stage 1: Stored)</strong>
                                                        </td>
                                                    </tr>
                                                    <tr v-for="(value, key) in getAllBCLConvertSettings(settings)" :key="key">
                                                        <td class="ps-4">{{ key }}</td>
                                                        <td>
                                                            <code v-if="value === 'EXCLUDE'" class="text-danger" title="This value is set to EXCLUDE in stored settings (rare - typically EXCLUDE is used in Stage 2 samplesheet generation rules)">EXCLUDE</code>
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
                        <button type="button" class="btn btn-secondary" @click="close">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `
};
/**
 * SampleFormFields Component
 * 
 * Dynamically generates form fields based on FIELD_CONFIG.
 * Handles all common sample fields and BCLConvert settings.
 * 
 * @component
 * @emits update:modelValue - Emitted when any form field changes
 */
const SampleFormFields = {
    name: 'SampleFormFields',
    props: {
        modelValue: {
            type: Object,
            required: true
        },
        mode: {
            type: String,
            default: 'edit',
            validator: (value) => ['edit', 'add'].includes(value)
        },
        isNewSample: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        formData: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            }
        },
        // Get all fields with formField config, sorted by order
        orderedFormFields() {
            return Object.values(FIELD_CONFIG)
                .filter(field => field.formField?.showInForm)
                .sort((a, b) => a.formField.order - b.formField.order);
        },
        // Separate BCLConvert fields for section rendering
        regularFields() {
            return this.orderedFormFields.filter(f => !f.formField.section);
        },
        bclconvertFields() {
            return this.orderedFormFields.filter(f => f.formField.section === 'bclconvert');
        }
    },
    methods: {
        updateField(fieldName, value) {
            this.$emit('update:modelValue', {
                ...this.modelValue,
                [fieldName]: value
            });
        },
        sanitizeIndex(value) {
            return value.toUpperCase().replace(/[^ACGT]/g, '');
        },
        onIndexInput(fieldName, event) {
            const sanitized = this.sanitizeIndex(event.target.value);
            this.updateField(fieldName, sanitized);
        },
        isFieldReadonly(field) {
            if (field.key === 'sample_id') {
                return this.mode === 'edit' && !this.isNewSample;
            }
            return field.formField.readonly === true;
        },
        getHelpText(field) {
            const helpText = field.formField.helpText;
            if (!helpText) return null;
            return helpText[this.mode] || null;
        },
        getOverrideCyclesLabel() {
            return this.mode === 'edit'
                ? '(auto-calculated from recipe and UMI config)'
                : '(leave empty - will be calculated after saving)';
        }
    },
    template: /*html*/`
        <div class="row">
            <!-- Regular Fields -->
            <template v-for="field in regularFields" :key="field.key">
                <!-- Text and Index inputs -->
                <div v-if="field.formField.inputType === 'text' || field.formField.inputType === 'index'"
                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                    <label :for="mode + '_' + field.key" class="form-label">{{ field.label }}:</label>
                    <input
                        :type="'text'"
                        :class="'form-control' + (field.formField.inputType === 'index' ? ' font-monospace' : '') + (field.formField.cssClass ? ' ' + field.formField.cssClass : '')"
                        :id="mode + '_' + field.key"
                        :value="formData[field.key]"
                        @input="field.formField.inputType === 'index' ? onIndexInput(field.key, $event) : updateField(field.key, $event.target.value)"
                        :readonly="isFieldReadonly(field)"
                        :pattern="field.formField.pattern"
                        :title="field.formField.title">
                    <small v-if="getHelpText(field)" class="form-text text-muted">{{ getHelpText(field) }}</small>
                    <span v-if="field.key === 'override_cycles'" class="text-muted small">{{ getOverrideCyclesLabel() }}</span>
                </div>

                <!-- Textarea -->
                <div v-else-if="field.formField.inputType === 'textarea'"
                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                    <label :for="mode + '_' + field.key" class="form-label">{{ field.label }}:</label>
                    <textarea
                        class="form-control"
                        :id="mode + '_' + field.key"
                        :value="formData[field.key]"
                        @input="updateField(field.key, $event.target.value)"
                        :rows="field.formField.rows || 3"></textarea>
                    <small v-if="getHelpText(field)" class="form-text text-muted">{{ getHelpText(field) }}</small>
                </div>

                <!-- Select dropdown -->
                <div v-else-if="field.formField.inputType === 'select'"
                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                    <label :for="mode + '_' + field.key" class="form-label">{{ field.label }}:</label>
                    <select
                        class="form-select"
                        :id="mode + '_' + field.key"
                        :value="formData[field.key]"
                        @input="updateField(field.key, $event.target.value)">
                        <option v-for="option in field.formField.options" :key="option.value" :value="option.value">
                            {{ option.label }}
                        </option>
                    </select>
                    <small v-if="getHelpText(field)" class="form-text text-muted">{{ getHelpText(field) }}</small>
                </div>
            </template>

            <!-- BCLConvert Settings Section -->
            <div class="col-md-12 mb-3">
                <hr>
                <h6 class="mb-3">
                    <i class="fa fa-cog"></i> BCLConvert Settings
                    <span class="text-muted small">(Values not included use BCLConvert defaults)</span>
                </h6>
            </div>

            <!-- BCLConvert Fields -->
            <template v-for="field in bclconvertFields" :key="field.key">
                <!-- Boolean radio (Yes/No/Default) -->
                <div v-if="field.formField.inputType === 'radio-boolean-nullable'"
                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                    <label class="form-label">{{ field.label }}:</label>
                    <div class="form-check">
                        <input
                            type="radio"
                            class="form-check-input"
                            :id="mode + '_' + field.key + '_yes'"
                            :name="mode + '_' + field.key"
                            :checked="formData[field.key] === true"
                            @change="updateField(field.key, true)">
                        <label class="form-check-label" :for="mode + '_' + field.key + '_yes'">
                            Yes
                        </label>
                    </div>
                    <div class="form-check">
                        <input
                            type="radio"
                            class="form-check-input"
                            :id="mode + '_' + field.key + '_no'"
                            :name="mode + '_' + field.key"
                            :checked="formData[field.key] === false"
                            @change="updateField(field.key, false)">
                        <label class="form-check-label" :for="mode + '_' + field.key + '_no'">
                            No
                        </label>
                    </div>
                    <div class="form-check">
                        <input
                            type="radio"
                            class="form-check-input"
                            :id="mode + '_' + field.key + '_default'"
                            :name="mode + '_' + field.key"
                            :checked="formData[field.key] === null"
                            @change="updateField(field.key, null)">
                        <label class="form-check-label" :for="mode + '_' + field.key + '_default'">
                            Do not override
                        </label>
                    </div>
                </div>

                <!-- Number inputs -->
                <div v-else-if="field.formField.inputType === 'number'"
                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                    <label :for="mode + '_' + field.key" class="form-label">{{ field.label }}:</label>
                    <input
                        type="number"
                        class="form-control"
                        :id="mode + '_' + field.key"
                        :value="formData[field.key]"
                        @input="updateField(field.key, $event.target.value ? Number($event.target.value) : null)"
                        :min="field.formField.min"
                        :max="field.formField.max"
                        :placeholder="field.formField.placeholder">
                    <small v-if="getHelpText(field)" class="form-text text-muted">{{ getHelpText(field) }}</small>
                </div>
            </template>
        </div>
    `
};
/**
 * SampleTable Component
 * 
 * Reusable table component for displaying samples with configurable columns.
 * Used within ProjectLaneCard to render sample data in a consistent format.
 * 
 * @component
 * @emits openConfigModal - Emitted when inspect button is clicked
 * @emits openEditModal - Emitted when edit button is clicked
 */
const SampleTable = {
    name: 'SampleTable',
    props: {
        samples: {
            type: Array,
            required: true
        },
        lane: {
            type: String,
            required: true
        },
        visibleColumns: {
            type: Array,
            required: true
        },
        columnLabel: {
            type: Object,
            required: true
        },
        calculatedLanes: {
            type: Object,
            required: true
        },
        // Methods passed from parent
        getRowClasses: {
            type: Function,
            required: true
        },
        getCellClasses: {
            type: Function,
            required: true
        },
        getEditTooltip: {
            type: Function,
            required: true
        },
        isCodeFormattedColumn: {
            type: Function,
            required: true
        },
        formatCellValue: {
            type: Function,
            required: true
        },
        getActionButtonsConfig: {
            type: Function,
            required: true
        }
    },
    template: /*html*/`
        <div class="table-responsive">
            <table class="table table-sm mb-0">
                <thead>
                    <tr class="darkth">
                        <th v-for="columnKey in visibleColumns" :key="columnKey">
                            {{ columnLabel[columnKey] }}
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="sample in samples" :key="sample.uuid" :class="getRowClasses(lane, sample.uuid)">
                        <td v-for="columnKey in visibleColumns" :key="columnKey"
                            :class="getCellClasses(lane, sample.uuid, columnKey)"
                            :title="getEditTooltip(lane, sample.uuid, columnKey)">
                            <code v-if="isCodeFormattedColumn(columnKey)">{{ formatCellValue(sample[columnKey], columnKey) }}</code>
                            <span v-else>{{ formatCellValue(sample[columnKey], columnKey) }}</span>
                            <span v-if="columnKey === 'sample_name' && sample.deleted" class="badge bg-danger ms-2">DELETED</span>
                        </td>
                        <td>
                            <button
                                class="btn btn-sm btn-outline-info"
                                @click="$emit('openConfigModal', calculatedLanes[lane].sample_rows[sample.uuid], lane)"
                                :disabled="!getActionButtonsConfig(lane, sample).inspect.enabled"
                                :title="getActionButtonsConfig(lane, sample).inspect.title">
                                <i class="fa fa-info-circle"></i> Inspect
                            </button>
                            <button
                                class="btn btn-sm btn-outline-primary ml-1"
                                @click="$emit('openEditModal', lane, sample.uuid)"
                                :disabled="!getActionButtonsConfig(lane, sample).edit.enabled"
                                :title="getActionButtonsConfig(lane, sample).edit.title">
                                <i class="fa fa-pencil"></i> Edit
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
};

/**
 * ProjectLaneCard Component
 * 
 * Card wrapper for displaying samples organized by project and lane.
 * Supports optional grouping by named index with expandable sections.
 * 
 * @component
 * @emits openConfigModal - Emitted when inspect button is clicked in child SampleTable
 * @emits openEditModal - Emitted when edit button is clicked in child SampleTable
 */
const ProjectLaneCard = {
    name: 'ProjectLaneCard',
    components: {
        SampleTable
    },
    props: {
        title: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: ''
        },
        indexGroups: {
            type: Object,
            required: true
        },
        lane: {
            type: String,
            required: true
        },
        groupByNamedIndex: {
            type: Boolean,
            required: true
        },
        visibleColumns: {
            type: Array,
            required: true
        },
        columnLabel: {
            type: Object,
            required: true
        },
        calculatedLanes: {
            type: Object,
            required: true
        },
        // Methods passed from parent
        getRowClasses: {
            type: Function,
            required: true
        },
        getCellClasses: {
            type: Function,
            required: true
        },
        getEditTooltip: {
            type: Function,
            required: true
        },
        isCodeFormattedColumn: {
            type: Function,
            required: true
        },
        formatCellValue: {
            type: Function,
            required: true
        },
        getActionButtonsConfig: {
            type: Function,
            required: true
        }
    },
    template: /*html*/`
        <div class="card">
            <div class="card-header bg-light">
                <h5 class="mb-0">
                    <i v-if="icon" :class="icon"></i> {{ title }}
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
                <sample-table
                    v-if="!groupByNamedIndex"
                    :samples="indexGroups['_all_']"
                    :lane="lane"
                    :visible-columns="visibleColumns"
                    :column-label="columnLabel"
                    :calculated-lanes="calculatedLanes"
                    :get-row-classes="getRowClasses"
                    :get-cell-classes="getCellClasses"
                    :get-edit-tooltip="getEditTooltip"
                    :is-code-formatted-column="isCodeFormattedColumn"
                    :format-cell-value="formatCellValue"
                    :get-action-buttons-config="getActionButtonsConfig"
                    @openConfigModal="(sample, lane) => $emit('openConfigModal', sample, lane)"
                    @openEditModal="(lane, uuid) => $emit('openEditModal', lane, uuid)">
                </sample-table>
                <!-- When grouped by named index -->
                <div v-else>
                    <div v-for="(samples, namedIndex) in indexGroups" :key="namedIndex" class="mb-3">
                        <div class="px-3 py-2 bg-white border-bottom">
                            <h6 class="mb-0">
                                <i class="fa fa-tags"></i> Named Index: <strong>{{ namedIndex }}</strong>
                                <small class="text-muted">({{ samples.length }} sample{{ samples.length !== 1 ? 's' : '' }})</small>
                            </h6>
                        </div>
                        <sample-table
                            :samples="samples"
                            :lane="lane"
                            :visible-columns="visibleColumns"
                            :column-label="columnLabel"
                            :calculated-lanes="calculatedLanes"
                            :get-row-classes="getRowClasses"
                            :get-cell-classes="getCellClasses"
                            :get-edit-tooltip="getEditTooltip"
                            :is-code-formatted-column="isCodeFormattedColumn"
                            :format-cell-value="formatCellValue"
                            :get-action-buttons-config="getActionButtonsConfig"
                            @openConfigModal="(sample, lane) => $emit('openConfigModal', sample, lane)"
                            @openEditModal="(lane, uuid) => $emit('openEditModal', lane, uuid)">
                        </sample-table>
                    </div>
                </div>
            </div>
        </div>
    `
};

const vDemuxSampleInfoEditor = {
    // Register child components
    components: {
        ConfigInspectModal,
        SampleFormFields,
        SampleTable,
        ProjectLaneCard
    },
    data() {
        const config = window.STATUS_CONFIG || {};
        const defaultVisibleColumns = ['sample_name', 'last_modified', 'sample_type', 'index_1', 'index_2', 'umi_config', 'recipe', 'override_cycles'];
        // Derive availableColumns from FIELD_CONFIG
        const availableColumns = Object.values(FIELD_CONFIG)
            .map(f => ({ key: f.key, label: f.label }));
        // Derive bulkEditExcludedFields from FIELD_CONFIG
        const bulkEditExcludedFields = Object.values(FIELD_CONFIG)
            .filter(f => !f.bulkEditable)
            .map(f => f.key);
        return {
            CONSTANTS: CONSTANTS,  // Expose constants to template
            fieldConfig: FIELD_CONFIG,
            limsUrl: config.lims_url || '',
            flowcell_id: '',
            demux_data: null,
            editedData: {},  // Stores edited settings per sample: { lane: { uuid: settings_object } }
            error_messages: [],
            loading: false,
            saving: false,
            viewMode: CONSTANTS.VIEW_MODES.CALCULATED,
            selectedVersion: null,
            availableColumns: availableColumns,
            visibleColumns: defaultVisibleColumns,
            defaultVisibleColumns: defaultVisibleColumns,
            bulkEditExcludedFields: bulkEditExcludedFields,
            showBulkEditModal: false,
            showEditModal: false,
            showAddModal: false,
            columnConfigCollapsed: true,
            groupByNamedIndex: false,
            groupByProjectFirst: false,
            copiedSamplesheetIndex: null,  // Track which samplesheet was just copied for visual feedback
            saveComment: '',
            bulkEditAction: 'reverse_complement_index1',
            bulkEditProject: '',
            bulkEditLane: 'all',
            bulkEditFormData: {},
            bulkEditProjectWarnings: [],  // Warnings about inconsistent values in project for bulk edit
            bulkEditTargetSamples: [],  // Array of sample UUIDs to edit (empty = all samples)
            // Add Sample specific variables
            addSampleTargetProject: '',
            addSampleTargetLanes: [],  // Multiple lanes (at least one required)
            addSampleProjectWarnings: [],  // Warnings about inconsistent values in project
            showEditModal: false,
            editModalSample: null,
            editModalLane: null,
            editModalUuid: null,
            editModalIsNew: false,
            editFormData: {},
            fieldHistory: {},
            showFieldHistory: false,
            sampleClassificationConfig: null,  // Full sample classification configuration
            showConfigModal: false,
            configModalSources: [],
            configModalSample: null,
            expandedConfigSources: []  // Track which config sources are expanded
        }
    },
    computed: {
        columnsByCategory() {
            // Group columns by category: Sample Info, Project Info, Indices, Metadata, BCLConvert Settings
            const categories = {
                'Sample Info': [],
                'Project Info': [],
                'Indices': [],
                'Metadata': [],
                'BCLConvert Settings': []
            };

            this.availableColumns.forEach(column => {
                const fieldConfig = this.fieldConfig[column.key];
                if (!fieldConfig) {
                    categories['Metadata'].push(column);
                    return;
                }

                // Categorize based on field properties
                if (fieldConfig.settingsPath && fieldConfig.settingsPath[0] === 'raw_samplesheet_settings') {
                    categories['BCLConvert Settings'].push(column);
                } else if (['sample_id', 'sample_name', 'sample_ref', 'sample_type', 'config_sources'].includes(column.key)) {
                    categories['Sample Info'].push(column);
                } else if (['sample_project', 'project_name', 'project_id'].includes(column.key)) {
                    categories['Project Info'].push(column);
                } else if (['index_1', 'index_2', 'index_length', 'named_index', 'umi_config', 'umi_length'].includes(column.key)) {
                    categories['Indices'].push(column);
                } else {
                    categories['Metadata'].push(column);
                }
            });

            return categories;
        },
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
            return UTILS.sortLaneObject(grouped);
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
                    const latestSettings = this.getLatestSettings(sample);
                    result[lane].push(this.buildSampleObject(lane, uuid, sample, latestSettings));
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
                    const latestSettings = this.getLatestSettings(sample);
                    const projectName = sample.project_name || 'Unknown Project';
                    if (!result[lane][projectName]) {
                        result[lane][projectName] = [];
                    }
                    result[lane][projectName].push(this.buildSampleObject(lane, uuid, sample, latestSettings));
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
                    const latestSettings = this.getLatestSettings(sample);
                    const sampleObj = this.buildSampleObject(lane, uuid, sample, latestSettings);
                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = sampleObj.named_index || 'No Named Index';
                    if (!result[lane][projectName]) {
                        result[lane][projectName] = {};
                    }
                    // Group by named index if enabled, otherwise use a default key
                    const groupKey = this.groupByNamedIndex ? namedIndex : '_all_';
                    if (!result[lane][projectName][groupKey]) {
                        result[lane][projectName][groupKey] = [];
                    }
                    result[lane][projectName][groupKey].push(sampleObj);
                });
            });
            return result;
        },
        calculatedSamplesByProjectLaneAndNamedIndex() {
            // Group samples by project first, then by lane, then optionally by named index
            const result = {};
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const latestSettings = this.getLatestSettings(sample);
                    const sampleObj = this.buildSampleObject(lane, uuid, sample, latestSettings);
                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = sampleObj.named_index || 'No Named Index';
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
                    result[projectName][lane][groupKey].push(sampleObj);
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
            // Return objects with both project name and ID
            const projectsMap = new Map();
            Object.values(this.calculatedLanes).forEach(laneData => {
                Object.values(laneData.sample_rows).forEach(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    const projectName = sample.project_name || sampleProject;
                    const projectId = sample.project_id;
                    // Use project_id as key if available, otherwise use project name
                    const key = projectId || projectName;
                    if (key && !projectsMap.has(key)) {
                        projectsMap.set(key, {
                            id: projectId || '',
                            name: projectName || '',
                            displayName: projectId && projectName ? `${projectName} (${projectId})` : (projectName || projectId)
                        });
                    }
                });
            });
            return Array.from(projectsMap.values()).sort((a, b) => {
                // Sort by project ID if available, otherwise by name
                const aKey = a.id || a.name;
                const bKey = b.id || b.name;
                return aKey.localeCompare(bKey);
            });
        },
        availableLanes() {
            // Get list of lanes
            return UTILS.sortLanesNumerically(Object.keys(this.calculatedLanes));
        },
        projectLanes() {
            // Get lanes that contain the selected project
            // Check both bulkEditProject (for bulk operations) and addSampleTargetProject (for add sample)
            const targetProject = this.bulkEditProject || this.addSampleTargetProject;
            if (!targetProject) return [];
            const lanes = new Set();
            this.getSamplesForProject(targetProject).forEach(({ lane }) => {
                lanes.add(lane);
            });
            return UTILS.sortLanesNumerically(Array.from(lanes));
        },
        isSingleLaneProject() {
            return this.projectLanes.length === 1;
        },
        nextSampleId() {
            // Generate a sample ID template with project prefix and placeholder for manual entry
            // Format: ProjectPrefix_XXXX (user must replace XXXX with 3-4 digit number)
            const targetProject = this.bulkEditProject || this.addSampleTargetProject;
            if (!targetProject) return '';
            // Find all sample names for this project to extract the project prefix
            // Use Sample_Name instead of Sample_ID to avoid "Sample_" prefix
            const projectSamples = this.getSamplesForProject(targetProject);
            // Extract project prefix (part before first underscore)
            let projectPrefix = '';
            for (const { latestSettings } of projectSamples) {
                const sampleName = latestSettings.per_sample_fields?.Sample_Name;
                if (sampleName) {
                    const underscoreIndex = sampleName.indexOf('_');
                    if (underscoreIndex > 0) {
                        projectPrefix = sampleName.substring(0, underscoreIndex);
                        break; // Use first valid prefix found
                    }
                }
            }
            // Fallback to project name if no prefix found
            if (!projectPrefix) {
                projectPrefix = targetProject;
            }
            return projectPrefix + '_XXXX';
        },
        selectedProjectDetails() {
            // Get the project_id and project_name for the selected target project
            const targetProject = this.addSampleTargetProject;
            if (!targetProject) return { id: '', name: '' };
            // Find the project details from availableProjects
            const projectDetails = this.availableProjects.find(p =>
                p.id === targetProject || p.name === targetProject
            );
            if (projectDetails) {
                return {
                    id: projectDetails.id,
                    name: projectDetails.name
                };
            }
            // Fallback: if not found in availableProjects, use targetProject as name
            return { id: '', name: targetProject };
        },
        samplesheets() {
            // Return pre-generated samplesheets from the server
            if (!this.demux_data || !this.demux_data.samplesheets) return [];
            return this.demux_data.samplesheets;
        },
        sortedConfigModalSettings() {
            // Return settings sorted by timestamp in descending order (newest first)
            if (!this.configModalSample || !this.configModalSample.settings) {
                return [];
            }
            return Object.entries(this.configModalSample.settings)
                .sort((a, b) => b[0].localeCompare(a[0])); // ISO timestamps sort lexicographically
        },
        bulkEditableFields() {
            // Get all fields that are bulkEditable and have formField config, sorted by order
            return Object.values(FIELD_CONFIG)
                .filter(field => field.bulkEditable && field.formField?.showInForm)
                .sort((a, b) => a.formField.order - b.formField.order);
        },
        bulkEditAvailableSamples() {
            // Get samples in the selected project/lane for bulk edit
            if (!this.bulkEditProject) return [];
            const lanesToInclude = this.bulkEditLane === 'all' ? this.projectLanes : [this.bulkEditLane];
            const samples = [];
            lanesToInclude.forEach(lane => {
                const samplesInLane = this.getSamplesForProject(this.bulkEditProject, lane);
                samplesInLane.forEach(({ uuid, sample, latestSettings }) => {
                    samples.push({
                        uuid: uuid,
                        lane: lane,
                        sampleId: latestSettings.per_sample_fields?.Sample_ID || 'Unknown',
                        sampleName: latestSettings.per_sample_fields?.Sample_Name || 'Unknown',
                        sample: sample
                    });
                });
            });
            // Sort by lane, then by sample ID
            return samples.sort((a, b) => {
                const laneCompare = String(a.lane).localeCompare(String(b.lane), undefined, { numeric: true });
                if (laneCompare !== 0) return laneCompare;
                return a.sampleId.localeCompare(b.sampleId);
            });
        }
    },
    watch: {
        addSampleTargetProject(newProject) {
            // Update editFormData.sample_project when target project changes
            if (this.showAddModal && this.editFormData) {
                // Update sample_id and sample_name to next ID for this project
                const nextId = this.nextSampleId;
                // Sample_ID should be prefixed with 'Sample_', Sample_Name should not
                this.editFormData.sample_id = nextId ? 'Sample_' + nextId : '';
                this.editFormData.sample_name = nextId;
                // Pre-fill form with project-based defaults and show warnings if values differ
                // This will populate sample_project from existing samples' Sample_Project field
                this.updateAddSampleFormWithProjectDefaults(newProject);
            }
        },
        addSampleTargetLanes(newLanes) {
            // Update editModalLane and lane field when lanes change
            if (this.showAddModal && newLanes.length > 0) {
                this.editModalLane = newLanes[0];
                if (this.editFormData) {
                    this.editFormData.lane = newLanes[0];
                }
            }
        },
        bulkEditProject(newProject) {
            // Pre-fill bulk edit form when project changes
            if (this.showBulkEditModal) {
                // Clear sample selection when project changes
                this.bulkEditTargetSamples = [];
                if (newProject) {
                    this.populateFormWithProjectDefaults(newProject, this.bulkEditFormData, this.bulkEditProjectWarnings);
                } else {
                    // Clear warnings and reset form when no project selected
                    this.populateFormWithProjectDefaults(null, this.bulkEditFormData, this.bulkEditProjectWarnings);
                }
            }
        },
        bulkEditLane(newLane) {
            // Clear sample selection when lane changes
            if (this.showBulkEditModal) {
                this.bulkEditTargetSamples = [];
            }
        }
    },
    methods: {
        // ===== Helper Methods for Data Structure Transformation =====
        /**
         * Transform flat form data to nested backend structure
         * 
         * This helper centralizes the transformation between two data formats:
         * - FLAT: Used for forms and editing - simple, clean v-model bindings
         *   Example: {sample_id: "Sample_001", sample_ref: "hg38", recipe: "TruSeq"}
         * 
         * - NESTED: Used by backend and for display - matches database structure
         *   Example: {
         *     per_sample_fields: {Sample_ID: "Sample_001"},
         *     other_details: {sample_ref: "hg38", recipe: "TruSeq"}
         *   }
         * 
         * Uses FIELD_CONFIG.settingsPath to automatically map fields, ensuring consistency
         * and preventing manual mapping errors. This is the single source of truth for
         * flat→nested transformation.
         * 
         * @param {Object} flatData - Flat form data object (e.g., {sample_id: "123", sample_ref: "hg38"})
         * @returns {Object} Nested backend structure with per_sample_fields, other_details, raw_samplesheet_settings
         * 
         * Note: topLevel fields (description, control, project_id, project_name) are not included
         * in the returned structure as they live directly on the sample object, not in settings.
         */
        flatToBackendStructure(flatData) {
            const backendStructure = {
                per_sample_fields: {},
                other_details: {},
                raw_samplesheet_settings: {}
            };
            
            // Process each field in FIELD_CONFIG
            Object.values(FIELD_CONFIG).forEach(fieldConfig => {
                const fieldKey = fieldConfig.key;
                const value = flatData[fieldKey];
                
                // Skip if value is not present in flatData
                if (value === undefined) return;
                
                // Handle topLevel fields (stored on sample object, not in settings)
                if (fieldConfig.topLevel) {
                    // These will be handled separately: description, control, project_id, project_name, last_modified
                    return;
                }
                
                // Map to nested structure based on settingsPath
                const settingsPath = fieldConfig.settingsPath;
                if (!settingsPath || settingsPath.length < 2) return;
                
                const section = settingsPath[0]; // e.g., 'per_sample_fields', 'other_details'
                const actualKey = settingsPath[1]; // e.g., 'Sample_ID', 'sample_ref'
                
                // Set the value in the appropriate section
                if (backendStructure[section] !== undefined) {
                    backendStructure[section][actualKey] = value;
                }
            });
            
            return backendStructure;
        },
        
        // ===== Helper Methods for Sample Object Building (Refactoring #1) =====
        /**
         * Get the latest settings for a sample
         * @param {Object} sample - The sample object
         * @returns {Object} The latest settings object
         */
        getLatestSettings(sample) {
            if (!sample || !sample.settings) return {};
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            return sample.settings[settingsVersions[0]] || {};
        },
        // ===== Helper Methods for Project/Lane Matching (Refactoring #4) =====
        /**
         * Check if a sample matches a target project
         * @param {Object} sample - The sample object
         * @param {Object} latestSettings - The latest settings for the sample
         * @param {string} targetProject - The project identifier to match against
         * @returns {boolean} True if the sample belongs to the target project
         */
        projectMatches(sample, latestSettings, targetProject) {
            const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
            const projectId = sample.project_id;
            const projectName = sample.project_name;
            return sampleProject === targetProject || 
                   projectId === targetProject || 
                   projectName === targetProject;
        },
        /**
         * Get all samples that belong to a specific project
         * @param {string} targetProject - The project identifier
         * @param {string|null} filterLane - Optional lane filter
         * @returns {Array} Array of objects with {lane, uuid, sample, latestSettings}
         */
        getSamplesForProject(targetProject, filterLane = null) {
            const samples = [];
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                if (filterLane && lane !== filterLane) return;
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    // Skip deleted samples
                    if (sample.deleted) return;
                    const latestSettings = this.getLatestSettings(sample);
                    if (this.projectMatches(sample, latestSettings, targetProject)) {
                        samples.push({ lane, uuid, sample, latestSettings });
                    }
                });
            });
            return samples;
        },
        // ===== Helper Methods for Bulk Field Handling (Refactoring #3) =====
        /**
         * Get a field value from a sample's settings based on the field configuration
         * @param {Object} sample - The sample object
         * @param {Object} settings - The settings object
         * @param {Array} settingsPath - Path to the field in settings
         * @param {boolean} topLevel - Whether the field is at the top level of sample
         * @returns {*} The field value
         */
        getFieldValueFromSettings(sample, settings, settingsPath, topLevel = false) {
            if (topLevel) {
                // Top-level field on sample object (e.g., description, control)
                return sample[settingsPath[1]];
            }
            // Nested field in settings
            let value = settings;
            for (const key of settingsPath) {
                value = value?.[key];
            }
            return value;
        },
        /**
         * Normalize a value for comparison (converts to string representation)
         * @param {*} value - The value to normalize
         * @param {string} type - The field type
         * @returns {string} Normalized value as string
         */
        normalizeForComparison(value, type) {
            if (value === undefined || value === null) return 'null';
            if (type === 'boolean' || type === 'number') return String(value);
            if (type === 'object') return JSON.stringify(value);
            // Handle arrays specially - sort them for consistent comparison
            if (Array.isArray(value)) {
                return JSON.stringify([...value].sort());
            }
            return value;
        },
        /**
         * Denormalize a value back from string representation
         * @param {string} value - The normalized value
         * @param {string} type - The field type
         * @returns {*} The denormalized value
         */
        denormalizeValue(value, type) {
            if (value === 'null') return null;
            if (type === 'boolean') return value === 'true';
            if (type === 'number') return parseInt(value);
            if (type === 'object') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return null;
                }
            }
            return value;
        },
        /**
         * Get default value for a field
         * @param {string} fieldKey - The field key
         * @returns {*} Default value
         */
        getDefaultValue(fieldKey) {
            const defaults = {
                'sample_project': '',
                'project_name': '',
                'project_id': '',
                'sample_ref': '',
                'recipe': '',
                'operator': '',
                'control': 'N',
                'description': '',
                'mask_short_reads': 0,
                'minimum_trimmed_read_length': 0,
                'umi_config': null,
                'trim_umi': null,
                'create_fastq_for_index_reads': null,
                'barcode_mismatches_index1': null,
                'barcode_mismatches_index2': null
            };
            return defaults[fieldKey];
        },
        /**
         * Build a complete sample object with all fields, merging original and edited data
         * @param {string} lane - The lane number
         * @param {string} uuid - The sample UUID
         * @param {Object} sample - The raw sample object
         * @param {Object} latestSettings - The latest settings for the sample
         * @returns {Object} Complete sample object ready for display
         */
        buildSampleObject(lane, uuid, sample, latestSettings) {
            const editedSettings = this.editedData[lane]?.[uuid] || {};
            const per_sample_fields = latestSettings.per_sample_fields || {};
            const other_details = latestSettings.other_details || {};
            // Helper to get value from either edited or original
            const getValue = (editedKey, originalValue) => {
                return editedSettings[editedKey] !== undefined 
                    ? editedSettings[editedKey] 
                    : originalValue;
            };
            // Build the complete sample object
            return {
                uuid: uuid,
                lane: per_sample_fields.Lane,
                sample_id: getValue('sample_id', per_sample_fields.Sample_ID),
                sample_name: getValue('sample_name', per_sample_fields.Sample_Name),
                sample_project: getValue('sample_project', per_sample_fields.Sample_Project),
                project_name: sample.project_name,
                project_id: sample.project_id,
                last_modified: sample.last_modified,
                sample_ref: getValue('sample_ref', other_details.sample_ref),
                sample_type: other_details.sample_type,
                config_sources: other_details.config_sources,
                index_1: getValue('index_1', per_sample_fields.index),
                index_2: getValue('index_2', per_sample_fields.index2),
                index_length: other_details.index_length,
                umi_config: other_details.umi_config,
                umi_length: other_details.umi_length,
                named_index: getValue('named_index', other_details.named_index),
                recipe: getValue('recipe', other_details.recipe),
                operator: getValue('operator', other_details.operator),
                description: getValue('description', sample.description),
                control: getValue('control', sample.control),
                mask_short_reads: per_sample_fields.MaskShortReads,
                minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                override_cycles: getValue('override_cycles', per_sample_fields.OverrideCycles),
                trim_umi: getValue('trim_umi', latestSettings.raw_samplesheet_settings?.TrimUMI),
                create_fastq_for_index_reads: getValue('create_fastq_for_index_reads', latestSettings.raw_samplesheet_settings?.CreateFastqForIndexReads),
                barcode_mismatches_index1: getValue('barcode_mismatches_index1', latestSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex1),
                barcode_mismatches_index2: getValue('barcode_mismatches_index2', latestSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex2),
                deleted: sample.deleted || false,
                deleted_at: sample.deleted_at,
                deleted_by: sample.deleted_by
            };
        },
        // ===== End Helper Methods =====
        // ===== Template Helper Methods (Refactoring #6) =====

        /**
         * Check if a cell should show code formatting (for index columns)
         * @param {string} columnKey - The column key
         * @returns {boolean} True if cell should use code formatting
         */
        isCodeFormattedColumn(columnKey) {
            return columnKey === 'index_1' || columnKey === 'index_2';
        },

        /**
         * Get CSS classes for a table cell
         * @param {string} lane - The lane number
         * @param {string} uuid - The sample UUID
         * @param {string} columnKey - The column key
         * @returns {Object} Object with class names as keys and boolean values
         */
        getCellClasses(lane, uuid, columnKey) {
            return {
                'bg-info': this.isFieldEdited(lane, uuid, columnKey)
            };
        },

        /**
         * Get configuration for action buttons for a sample
         * @param {string} lane - The lane number
         * @param {Object} sample - The sample object
         * @returns {Object} Configuration object for buttons
         */
        getActionButtonsConfig(lane, sample) {
            const hasConfigSources = Array.isArray(sample.config_sources) && sample.config_sources.length > 0;
            const isDeleted = sample.deleted || false;
            return {
                inspect: {
                    enabled: hasConfigSources && !isDeleted,
                    title: isDeleted
                        ? 'Cannot inspect deleted sample'
                        : (hasConfigSources
                            ? 'View Stage 1 configuration details (stored settings)' 
                            : 'No configuration sources available'),
                    onClick: () => this.openConfigModal(this.calculatedLanes[lane].sample_rows[sample.uuid], lane)
                },
                edit: {
                    enabled: !isDeleted,
                    title: isDeleted ? 'Cannot edit deleted sample' : 'Edit sample',
                    onClick: () => this.openEditModal(lane, sample.uuid)
                }
            };
        },

        /**
         * Get the sample count text with proper pluralization
         * @param {number} count - Number of samples
         * @returns {string} Formatted count text
         */
        getSampleCountText(count) {
            return `${count} sample${count !== 1 ? 's' : ''}`;
        },

        /**
         * Check if a sample row should be highlighted
         * @param {string} lane - The lane number
         * @param {string} uuid - The sample UUID
         * @returns {Object} Object with class names
         */
        getRowClasses(lane, uuid) {
            const sample = this.calculatedLanes[lane]?.sample_rows[uuid];
            const isDeleted = sample?.deleted || false;
            return {
                'table-info': this.isSampleEdited(lane, uuid),
                'table-danger': isDeleted,
                'text-decoration-line-through': isDeleted
            };
        },
        // ===== End Template Helper Methods =====

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
        /**
         * Generic method to populate a form with project defaults and detect inconsistencies
         * @param {string} targetProject - The project identifier
         * @param {Object} formData - The form data object to populate
         * @param {Array} warningsArray - The warnings array to populate (pass by reference)
         * @returns {Object} Field data with pre-filled values
         */
        populateFormWithProjectDefaults(targetProject, formData, warningsArray) {
            // Clear warnings
            warningsArray.splice(0, warningsArray.length);
            
            if (!targetProject || !formData) {
                // Reset fields to defaults when no project is selected
                if (formData) {
                    Object.values(FIELD_CONFIG)
                        .filter(f => f.bulkEditable)
                        .forEach(fieldConfig => {
                            formData[fieldConfig.key] = this.getDefaultValue(fieldConfig.key);
                        });
                }
                return {};
            }

            // Collect all samples from this project using helper method
            const projectSamplesData = this.getSamplesForProject(targetProject);
            const projectSamples = projectSamplesData.map(({ sample, latestSettings }) => ({
                sample,
                settings: latestSettings
            }));
            
            if (projectSamples.length === 0) {
                return {};
            }

            // Get all bulk-editable fields from FIELD_CONFIG
            const bulkEditableFields = Object.values(FIELD_CONFIG)
                .filter(f => f.bulkEditable);
            const fieldData = {};
            
            // For each bulk-editable field, collect values from all project samples
            bulkEditableFields.forEach(fieldConfig => {
                const valueToSamples = new Map(); // Map of normalized value -> array of sample IDs
                projectSamples.forEach(({ sample, settings }) => {
                    const value = this.getFieldValueFromSettings(
                        sample,
                        settings,
                        fieldConfig.settingsPath,
                        fieldConfig.topLevel
                    );
                    // Normalize value for comparison
                    const normalizedValue = this.normalizeForComparison(
                        value !== undefined ? value : this.getDefaultValue(fieldConfig.key),
                        fieldConfig.type
                    );
                    if (!valueToSamples.has(normalizedValue)) {
                        valueToSamples.set(normalizedValue, []);
                    }
                    const sampleId = settings.per_sample_fields?.Sample_ID || 'Unknown';
                    valueToSamples.get(normalizedValue).push(sampleId);
                });
                const uniqueValues = Array.from(valueToSamples.keys());
                
                // Check for inconsistency
                if (uniqueValues.length > 1) {
                    // Build a more informative display
                    const valueParts = uniqueValues.map(v => {
                        const displayValue = v === '' || v === 'null' ? '(empty)' : v;
                        const sampleIds = valueToSamples.get(v);
                        const count = sampleIds.length;

                        // If only 1-2 samples have this value, show their IDs
                        if (count <= 2) {
                            return `"${displayValue}" (${sampleIds.join(', ')})`;
                        } else {
                            return `"${displayValue}" (${count} samples)`;
                        }
                    });
                    const valuesDisplay = valueParts.join(' vs ');
                    warningsArray.push(
                        `${fieldConfig.label}: ${valuesDisplay}`
                    );
                }
                // Store the first (or only) value, denormalized
                fieldData[fieldConfig.key] = this.denormalizeValue(
                    uniqueValues[0],
                    fieldConfig.type
                );
            });
            
            // Update the form with these defaults
            Object.entries(fieldData).forEach(([key, value]) => {
                formData[key] = value !== undefined && value !== null 
                    ? value 
                    : this.getDefaultValue(key);
            });
            
            return fieldData;
        },
        updateAddSampleFormWithProjectDefaults(targetProject) {
            // Pre-fill bulk-editable fields from existing project samples and warn if values differ
            this.addSampleProjectWarnings = [];
            if (!targetProject || !this.editFormData) {
                // Reset using generic method
                this.populateFormWithProjectDefaults(null, this.editFormData, this.addSampleProjectWarnings);
                return {};
            }

            // Use generic method to populate form and get warnings
            // This will populate sample_project from existing samples' Sample_Project field
            return this.populateFormWithProjectDefaults(targetProject, this.editFormData, this.addSampleProjectWarnings);
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
        // ===== Config Source Parsing Helpers (Refactoring #5) =====
        /**
         * Get conditional rules for a given category and tier path
         * @param {string} category - The category (patterns, control_patterns, etc.)
         * @param {Array} tierParts - The tier path parts
         * @returns {Object|null} The conditional rules object
         */
        getConditionalRulesForCategory(category, tierParts) {
            const config = this.sampleClassificationConfig;
            switch (category) {
                case 'control_patterns':
                    return config.control_conditional_rules;
                case 'patterns':
                    const patternKey = tierParts[1];
                    return config.patterns?.[patternKey]?.conditional_rules;
                case 'other_general_sample_types':
                    const typeKey = tierParts[1];
                    return config.other_general_sample_types?.[typeKey]?.conditional_rules;
                case 'library_method_mapping':
                    const methodKey = tierParts.slice(1).join('.');
                    return config.library_method_mapping?.[methodKey]?.conditional_rules;
                case 'instrument_type_mapping':
                    return this.getInstrumentTypeConditionalRules(tierParts);
                default:
                    return null;
            }
        },
        /**
         * Get conditional rules for instrument type mappings
         * @param {Array} tierParts - The tier path parts
         * @returns {Object|null} The conditional rules object
         */
        getInstrumentTypeConditionalRules(tierParts) {
            const instrumentType = tierParts[1];
            const config = this.sampleClassificationConfig.instrument_type_mapping?.[instrumentType];
            if (!config) return null;
            if (tierParts.length === 2) {
                // Instrument type level
                return config.conditional_rules;
            } else if (tierParts.length === 4 && tierParts[2] === 'run_modes') {
                // Run mode level
                const runMode = tierParts[3];
                return config.run_modes?.[runMode]?.conditional_rules;
            }
            return null;
        },
        /**
         * Parse a conditional rule from a config source string
         * @param {string} configSource - The config source string
         * @returns {Object|null} Parsed conditional rule or null
         */
        parseConditionalRule(configSource) {
            const parts = configSource.split('.conditional_rule.');
            if (parts.length !== 2) return null;
            const tierPath = parts[0];
            const ruleSpec = parts[1];
            const [settingName, ruleName] = ruleSpec.split(':');
            const tierParts = tierPath.split('.');
            const category = tierParts[0];
            const conditionalRules = this.getConditionalRulesForCategory(category, tierParts);
            if (conditionalRules && conditionalRules[settingName]) {
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
        },
        /**
         * Parse instrument type configuration
         * @param {Array} restParts - The remaining path parts after 'instrument_type_mapping'
         * @returns {Object|null} The instrument type config or null
         */
        parseInstrumentTypeConfig(restParts) {
            const instrumentType = restParts[0];
            const config = this.sampleClassificationConfig.instrument_type_mapping?.[instrumentType];
            if (!config) return null;
            if (restParts.length === 1) {
                return config;
            } else if (restParts.length === 3 && restParts[1] === 'run_modes') {
                const runMode = restParts[2];
                return config.run_modes?.[runMode];
            }
            return null;
        },
        /**
         * Parse standard configuration (non-conditional, non-instrument)
         * @param {string} category - The config category
         * @param {string} key - The config key
         * @returns {*} The configuration value
         */
        parseStandardConfig(category, key) {
            const config = this.sampleClassificationConfig;
            switch (category) {
                case 'bcl_convert_settings':
                    return config.bcl_convert_settings?.[key];
                case 'patterns':
                    return config.patterns?.[key];
                case 'other_general_sample_types':
                    return config.other_general_sample_types?.[key];
                case 'library_method_mapping':
                    return config.library_method_mapping?.[key];
                case 'control_patterns':
                    return { control_patterns: config.control_patterns };
                default:
                    return null;
            }
        },
        // ===== End Config Source Parsing Helpers =====
        getConfigDetails(configSource) {
            // Parse config source and return the configuration details
            if (!this.sampleClassificationConfig) return null;
            // Handle conditional rules specially
            if (configSource.includes('.conditional_rule.')) {
                return this.parseConditionalRule(configSource);
            }
            const parts = configSource.split('.');
            if (parts.length < 2) return null;
            const category = parts[0];
            const key = parts.slice(1).join('.');
            // Handle special categories
            if (category === 'instrument_type_mapping') {
                return this.parseInstrumentTypeConfig(parts.slice(1));
            }
            // Handle standard configurations
            return this.parseStandardConfig(category, key);
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
            // Get all BCLConvert settings including defaults from schema
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
            // Helper method to get BCLConvert settings for samplesheet display
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
            // Handle boolean values
            if (typeof value === 'boolean') {
                return value ? 'true' : 'false';
            }
            // Handle null/undefined values
            if (value === null || value === undefined) {
                return 'N/A';
            }
            return value;
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
            // Check if sample is deleted first
            const sample = this.calculatedLanes[lane]?.sample_rows[uuid];
            if (sample?.deleted) {
                const deletedAt = sample.deleted_at ? this.formatTimestamp(sample.deleted_at) : 'Unknown';
                const deletedBy = sample.deleted_by || 'Unknown';
                return `DELETED: ${deletedAt} by ${deletedBy}`;
            }

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
                'project_id': ['sample_row', 'project_id'],
                'project_name': ['sample_row', 'project_name'],
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
            // Map frontend field names to backend field names using FIELD_CONFIG
            const frontendToBackendFieldMap = Object.values(FIELD_CONFIG).reduce((map, fieldConfig) => {
                map[fieldConfig.key] = fieldConfig.backendKey;
                return map;
            }, {});
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
        deleteSample(lane, uuid) {
            // Get sample info for confirmation message
            const laneData = this.calculatedLanes[lane];
            if (!laneData || !laneData.sample_rows[uuid]) return;
            const sample = laneData.sample_rows[uuid];
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            const latestSettings = sample.settings[settingsVersions[0]];
            const sampleId = latestSettings.per_sample_fields?.Sample_ID || 'Unknown';

            // Confirm deletion
            if (!confirm(`Are you sure you want to delete sample "${sampleId}" from lane ${lane}?\n\nThis action will be traceable in the database, but the sample will no longer appear in samplesheets.`)) {
                return;
            }

            this.error_messages = [];
            this.saving = true;

            // Send delete request to backend
            axios.delete(`/api/v1/demux_sample_info/${this.flowcell_id}/sample/${lane}/${uuid}`)
                .then(response => {
                    // Refresh the data after successful deletion
                    this.demux_data = response.data;
                    // Clear any edits for this sample
                    if (this.editedData[lane] && this.editedData[lane][uuid]) {
                        delete this.editedData[lane][uuid];
                        if (Object.keys(this.editedData[lane]).length === 0) {
                            delete this.editedData[lane];
                        }
                    }
                    this.saving = false;
                    alert(`Sample "${sampleId}" deleted successfully!`);
                })
                .catch(error => {
                    this.error_messages.push('Error deleting sample. Please try again or contact a system administrator.');
                    console.error(error);
                    this.saving = false;
                });
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
            // Build field paths from FIELD_CONFIG
            const fieldPaths = Object.values(FIELD_CONFIG)
                .filter(f => f.historyDisplayName) // Only fields with history display
                .reduce((map, fieldConfig) => {
                    // Convert settingsPath to the format used by history tracking
                    let path = [...fieldConfig.settingsPath];
                    if (fieldConfig.topLevel) {
                        // Top-level fields on sample object
                        path = ['_sample', fieldConfig.settingsPath[1]];
                    }
                    map[fieldConfig.historyDisplayName] = path;
                    return map;
                }, {});
            // Track the history for each field
            Object.entries(fieldPaths).forEach(([displayName, path]) => {
                const changes = [];
                let previousValue = undefined;
                settingsVersions.forEach(timestamp => {
                    const settings = sample.settings[timestamp];
                    let currentValue;
                    if (path[0] === '_sample') {
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
            this.bulkEditProjectWarnings = [];
            this.bulkEditTargetSamples = [];
            // Initialize bulk edit form data with empty values for all bulk editable fields
            this.bulkEditFormData = {};
            Object.values(FIELD_CONFIG)
                .filter(field => field.bulkEditable && field.formField?.showInForm)
                .forEach(field => {
                    this.bulkEditFormData[field.key] = '';
                });
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
            // Clear sample selection when project or lane changes
            this.bulkEditTargetSamples = [];
        },
        closeBulkEditModal() {
            this.showBulkEditModal = false;
        },
        closeAddModal() {
            this.showAddModal = false;
            this.addSampleTargetProject = '';
            this.addSampleTargetLanes = [];
            this.addSampleProjectWarnings = [];
            this.editFormData = {};
        },
        openEditModal(lane, uuid) {
            // Open edit modal for an existing sample
            const laneData = this.calculatedLanes[lane];
            if (!laneData || !laneData.sample_rows[uuid]) return;
            this.showEditModal = true;
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
                project_name: currentSettings.project_name || sample.project_name || '',
                project_id: currentSettings.project_id || sample.project_id || '',
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
        },
        openEditModalForNewSample(lane = null, project = null) {
            // Open edit modal for a new sample
            // Initialize add sample selections based on what was provided
            if (lane && project) {
                // Both provided (from specific context)
                this.addSampleTargetLanes = [lane];
                this.addSampleTargetProject = project;
            } else if (lane) {
                // Only lane provided
                this.addSampleTargetLanes = [lane];
                this.addSampleTargetProject = '';
            } else if (project) {
                // Only project provided - get lanes for this project
                this.addSampleTargetProject = project;
                // projectLanes computed property will populate based on project
                this.addSampleTargetLanes = [];
            } else {
                // Nothing provided, start fresh
                this.addSampleTargetProject = '';
                this.addSampleTargetLanes = [];
            }
            const newSampleId = this.nextSampleId;
            // Generate a new UUID for the sample
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            // Populate form data with empty defaults initially
            this.editFormData = {
                sample_id: newSampleId,
                sample_name: newSampleId,
                sample_project: '',  // Will be set by addSampleTargetProject watcher or updateAddSampleFormWithProjectDefaults
                sample_ref: this.getDefaultValue('sample_ref'),
                lane: this.addSampleTargetLanes[0] || null,  // Show the first target lane (will be saved to all target lanes)
                index_1: '',
                index_2: '',
                named_index: '',
                recipe: this.getDefaultValue('recipe'),
                operator: this.getDefaultValue('operator'),
                description: this.getDefaultValue('description'),
                control: this.getDefaultValue('control'),
                override_cycles: '',
                mask_short_reads: this.getDefaultValue('mask_short_reads'),
                minimum_trimmed_read_length: this.getDefaultValue('minimum_trimmed_read_length'),
                umi_config: this.getDefaultValue('umi_config'),
                trim_umi: this.getDefaultValue('trim_umi'),
                create_fastq_for_index_reads: this.getDefaultValue('create_fastq_for_index_reads'),
                barcode_mismatches_index1: this.getDefaultValue('barcode_mismatches_index1'),
                barcode_mismatches_index2: this.getDefaultValue('barcode_mismatches_index2')
            };
            // Pre-fill bulk-editable fields from project samples (if project is set)
            this.updateAddSampleFormWithProjectDefaults(this.addSampleTargetProject);
            this.editModalLane = this.addSampleTargetLanes[0] || null;
            this.editModalUuid = uuid;
            this.editModalSample = null;
            this.editModalIsNew = true;
            this.showAddModal = true;
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
        saveEditedSample() {
            // Save the edited sample data
            const lane = this.editModalLane;
            const uuid = this.editModalUuid;
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
            this.closeEditModal();
        },
        saveAddedSample() {
            // Validation for Add Sample
            if (this.addSampleTargetLanes.length === 0) {
                alert('Please select at least one lane.');
                return;
            }
            // Check if Sample ID or Sample Name is filled
            if (!this.editFormData.sample_id && !this.editFormData.sample_name) {
                alert('Please provide either a Sample ID or Sample Name.');
                return;
            }
            // Check if XXXX placeholder is still present in sample_id or sample_name
            if ((this.editFormData.sample_id && this.editFormData.sample_id.includes('XXXX')) ||
                (this.editFormData.sample_name && this.editFormData.sample_name.includes('XXXX'))) {
                alert('Please replace XXXX in the Sample ID or Sample Name with a 3-4 digit number (e.g., 001 or 1001).');
                return;
            }
            // Confirmation for multi-lane add
            if (this.addSampleTargetLanes.length > 1) {
                const confirmation = confirm(`Are you sure you want to add this sample to ${this.addSampleTargetLanes.length} lanes (${this.addSampleTargetLanes.join(', ')})?`);
                if (!confirmation) {
                    return;
                }
            }
            // Use the selected lanes
            const targetLanes = this.addSampleTargetLanes;
            const timestamp = new Date().toISOString();
            const projectDetails = this.selectedProjectDetails;
            const uuid = this.editModalUuid;
            const newSettings = {
                ...this.editFormData,
                // Only set flowcell_id explicitly - all other fields are already populated correctly in editFormData
                flowcell_id: this.flowcell_id
            };
            // Add sample to all target lanes
            targetLanes.forEach(targetLane => {
                const laneSpecificSettings = {
                    ...newSettings,
                    lane: targetLane
                };
                // Add to editedData (flat structure for saving)
                if (!this.editedData[targetLane]) {
                    this.editedData[targetLane] = {};
                }
                this.editedData[targetLane][uuid] = laneSpecificSettings;
                
                // Create backend-compatible structure for immediate display using helper
                const backendStructureSettings = this.flatToBackendStructure(laneSpecificSettings);
                // Add flowcell_id which is not in FIELD_CONFIG
                backendStructureSettings.flowcell_id = this.flowcell_id;
                
                // Add to the actual data structure for immediate display
                if (!this.demux_data.calculated.lanes[targetLane]) {
                    this.demux_data.calculated.lanes[targetLane] = { sample_rows: {} };
                }
                this.demux_data.calculated.lanes[targetLane].sample_rows[uuid] = {
                    sample_id: laneSpecificSettings.sample_id,
                    project_id: projectDetails.id,
                    project_name: projectDetails.name,
                    description: laneSpecificSettings.description,
                    control: laneSpecificSettings.control,
                    last_modified: timestamp,
                    settings: {
                        [timestamp]: backendStructureSettings
                    }
                };
            });
            if (targetLanes.length === 1) {
                alert(`Added new sample ${newSettings.sample_id} to lane ${targetLanes[0]}`);
            } else {
                alert(`Added new sample ${newSettings.sample_id} to ${targetLanes.length} lanes: ${targetLanes.map(l => 'Lane ' + l).join(', ')}`);
            }
            this.closeAddModal();
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

            // Determine which samples to edit
            const samplesToEdit = this.bulkEditTargetSamples.length > 0
                ? this.bulkEditTargetSamples
                : this.bulkEditAvailableSamples.map(s => s.uuid);

            if (samplesToEdit.length === 0) {
                alert('No samples selected or available for editing.');
                return;
            }

            let editCount = 0;
            const lanesToEdit = this.bulkEditLane === 'all' ? this.projectLanes : [this.bulkEditLane];
            lanesToEdit.forEach(lane => {
                const laneData = this.calculatedLanes[lane];
                if (!laneData) return;
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    // Skip if this sample is not in the target list
                    if (!samplesToEdit.includes(uuid)) return;

                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    const projectId = sample.project_id;
                    const projectName = sample.project_name;
                    // Check if this sample matches the selected project
                    if (sampleProject === this.bulkEditProject || projectId === this.bulkEditProject || projectName === this.bulkEditProject) {
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
                        } else if (this.bulkEditAction === 'edit_fields') {
                            // Apply bulk field edits - only update fields that have non-empty values
                            let sampleEdited = false;
                            Object.entries(this.bulkEditFormData).forEach(([fieldKey, value]) => {
                                // Only update if value is not empty (handle different "empty" values)
                                const isEmpty = value === '' || value === null || value === undefined;
                                if (!isEmpty) {
                                    this.updateValue(lane, uuid, fieldKey, value);
                                    sampleEdited = true;
                                }
                            });
                            if (sampleEdited) {
                                editCount++;
                            }
                        }
                    }
                });
            });
            const actionLabel = this.bulkEditAction === 'edit_fields' ? 'field edits' : this.bulkEditAction;
            const sampleCountLabel = this.bulkEditTargetSamples.length > 0
                ? `${editCount} selected sample(s)`
                : `${editCount} sample(s)`;
            alert(`Applied ${actionLabel} to ${sampleCountLabel} in project ${this.bulkEditProject}`);
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
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    const projectId = sample.project_id;
                    const projectName = sample.project_name;
                    // Match against Sample_Project, project_id, or project_name
                    if (sampleProject === this.bulkEditProject || projectId === this.bulkEditProject || projectName === this.bulkEditProject) {
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
        async copySamplesheetToClipboard(samplesheet, index) {
            // Copy samplesheet content to clipboard
            const content = this.generateSamplesheetContent(samplesheet);
            try {
                await navigator.clipboard.writeText(content);
                // Store the copied samplesheet index for visual feedback
                this.copiedSamplesheetIndex = index;
                // Clear the feedback after 2 seconds
                setTimeout(() => {
                    this.copiedSamplesheetIndex = null;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy samplesheet:', err);
                alert('Failed to copy to clipboard. Please try again.');
            }
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
                                    :class="{ active: viewMode === CONSTANTS.VIEW_MODES.CALCULATED }"
                                    @click.prevent="viewMode = CONSTANTS.VIEW_MODES.CALCULATED"
                                    href="#">
                                    By Lane
                                </a>
                            </li>
                            <li class="nav-item" role="presentation">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === CONSTANTS.VIEW_MODES.UPLOADED }"
                                    @click.prevent="viewMode = CONSTANTS.VIEW_MODES.UPLOADED"
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
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === CONSTANTS.VIEW_MODES.UPLOADED }">
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
                                                <td><code>{{ sample.index }}</code></td>
                                                <td><code>{{ sample.index2 }}</code></td>
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
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === CONSTANTS.VIEW_MODES.CALCULATED }">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h3 class="mb-0">Calculated Samples (by Lane)</h3>
                                    <div>
                                        <button
                                            class="btn btn-success mr-2"
                                            @click="openEditModalForNewSample()">
                                            <i class="fa fa-plus"></i> Add Sample
                                        </button>
                                        <button
                                            class="btn btn-primary mr-2"
                                            @click="openBulkEditModal">
                                            <i class="fa fa-edit"></i> Bulk Edit Actions
                                        </button>
                                        <span v-if="hasChanges">
                                            <button
                                                class="btn btn-success mr-2"
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
                                            Configure view
                                        </h5>
                                    </div>
                                    <div class="card-body" v-show="!columnConfigCollapsed">
                                        <div class="row">
                                            <div class="col-12">
                                                <!-- Grouping Options -->
                                                <div class="mb-4">
                                                    <h6 class="text-muted mb-3">Grouping Options</h6>
                                                    <div class="form-check form-switch mb-3">
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
                                                <!-- Column Selection -->
                                                <div class="mb-3">
                                                    <h6 class="text-muted mb-3">Column Selection</h6>
                                                    <label class="form-label">Presets:</label>
                                                    <div class="btn-group" role="group">
                                                        <input type="radio" class="btn-check" name="columnPreset" id="presetDefault" value="default" @change="applyColumnPreset('default')" autocomplete="off" checked>
                                                        <label class="btn btn-outline-primary" for="presetDefault">Default</label>
                                                        <input type="radio" class="btn-check" name="columnPreset" id="presetAll" value="all" @change="applyColumnPreset('all')" autocomplete="off">
                                                        <label class="btn btn-outline-primary" for="presetAll">All</label>
                                                    </div>
                                                </div>
                                                <p class="text-muted mb-2">Select columns to display:</p>
                                                <!-- Columns by category -->
                                                <div v-for="(columns, category) in columnsByCategory" :key="category" class="mb-3">
                                                    <h6 class="text-secondary mb-2" v-if="columns.length > 0">{{ category }}</h6>
                                                    <div class="d-flex flex-wrap gap-2">
                                                        <div v-for="column in columns" :key="column.key" class="form-check form-check-inline">
                                                            <input
                                                                class="form-check-input"
                                                                type="checkbox"
                                                                :id="'col-' + column.key"
                                                                :value="column.key"
                                                                :checked="isColumnVisible(column.key)"
                                                                :disabled="column.key === 'sample_name'"
                                                                @change="toggleColumn(column.key)">
                                                            <label class="form-check-label" :for="'col-' + column.key" :class="{ 'text-muted': column.key === 'sample_name' }">
                                                                {{ column.label }}
                                                                <span v-if="column.key === 'sample_name'" class="badge bg-secondary ms-1">Required</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Tables grouped by Lane → Project -->
                                <div v-if="!groupByProjectFirst">
                                    <div v-for="(projects, lane) in calculatedSamplesByLaneProjectAndNamedIndex" :key="lane" class="mt-4">
                                        <h4>Lane {{ lane }}</h4>
                                        <project-lane-card
                                            v-for="(indexGroups, projectName) in projects"
                                            :key="projectName"
                                            class="mb-4"
                                            :title="projectName"
                                            icon="fa fa-folder-open"
                                            :index-groups="indexGroups"
                                            :lane="lane"
                                            :group-by-named-index="groupByNamedIndex"
                                            :visible-columns="visibleColumns"
                                            :column-label="columnLabel"
                                            :calculated-lanes="calculatedLanes"
                                            :get-row-classes="getRowClasses"
                                            :get-cell-classes="getCellClasses"
                                            :get-edit-tooltip="getEditTooltip"
                                            :is-code-formatted-column="isCodeFormattedColumn"
                                            :format-cell-value="formatCellValue"
                                            :get-action-buttons-config="getActionButtonsConfig"
                                            @openConfigModal="openConfigModal"
                                            @openEditModal="openEditModal">
                                        </project-lane-card>
                                    </div>
                                </div> <!-- end Lane → Project grouping -->
                                <!-- Tables grouped by Project → Lane -->
                                <div v-else>
                                    <div v-for="(lanes, projectName) in calculatedSamplesByProjectLaneAndNamedIndex" :key="projectName" class="mt-4">
                                        <h4><i class="fa fa-folder-open"></i> {{ projectName }}</h4>
                                        <project-lane-card
                                            v-for="(indexGroups, lane) in lanes"
                                            :key="lane"
                                            class="mb-4"
                                            :title="'Lane ' + lane"
                                            :index-groups="indexGroups"
                                            :lane="lane"
                                            :group-by-named-index="groupByNamedIndex"
                                            :visible-columns="visibleColumns"
                                            :column-label="columnLabel"
                                            :calculated-lanes="calculatedLanes"
                                            :get-row-classes="getRowClasses"
                                            :get-cell-classes="getCellClasses"
                                            :get-edit-tooltip="getEditTooltip"
                                            :is-code-formatted-column="isCodeFormattedColumn"
                                            :format-cell-value="formatCellValue"
                                            :get-action-buttons-config="getActionButtonsConfig"
                                            @openConfigModal="openConfigModal"
                                            @openEditModal="openEditModal">
                                        </project-lane-card>
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
                                            <div class="btn-group">
                                                <button class="btn btn-primary btn-sm" @click="downloadSamplesheet(samplesheet)">
                                                    <i class="fa fa-download"></i> Download
                                                </button>
                                                <button class="btn btn-sm"
                                                    :class="copiedSamplesheetIndex === index ? 'btn-success' : 'btn-outline-primary'"
                                                    @click="copySamplesheetToClipboard(samplesheet, index)"
                                                    :title="copiedSamplesheetIndex === index ? 'Copied!' : 'Copy to clipboard'">
                                                    <i class="fa" :class="copiedSamplesheetIndex === index ? 'fa-check' : 'fa-clipboard'"></i>
                                                    {{ copiedSamplesheetIndex === index ? 'Copied!' : 'Copy' }}
                                                </button>
                                            </div>
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
                                    <h5 class="modal-title">Edit Sample</h5>
                                    <div class="ms-auto me-2">
                                        <button
                                            v-if="Object.keys(fieldHistory).length > 0"
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
                                    <!-- Config Sources Info -->
                                    <div v-if="editModalSample" class="row mb-3">
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
                                    <!-- Field History -->
                                    <div v-if="showFieldHistory && Object.keys(fieldHistory).length > 0" class="row mb-3">
                                        <div class="col-12">
                                            <div class="card border-warning">
                                                <div class="card-body">
                                                    <h6 class="card-title text-warning">
                                                        <i class="fa fa-history"></i> Field History
                                                    </h6>
                                                    <p class="mb-3 small text-muted">Historical changes to individual fields for this sample:</p>
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
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Sample Form Fields -->
                                    <SampleFormFields
                                        v-model="editFormData"
                                        :is-new-sample="false"
                                        mode="edit" />
                                </div>
                                <div class="modal-footer">
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger me-auto"
                                        @click="deleteSample(editModalLane, editModalUuid)"
                                        title="Delete this sample (will be traceable in database)">
                                        <i class="fa fa-trash"></i> Delete Sample
                                    </button>
                                    <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
                                    <button type="button" class="btn btn-primary" @click="saveEditedSample">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Add Sample Modal -->
                    <div v-if="showAddModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"><i class="fa fa-plus"></i> Add New Sample</h5>
                                    <button type="button" class="btn-close" @click="closeAddModal"></button>
                                </div>
                                <div class="modal-body">
                                    <!-- Target Selection -->
                                    <div class="card border-primary mb-3">
                                        <div class="card-header bg-primary text-white">
                                            <h6 class="mb-0"><i class="fa fa-crosshairs"></i> Where to add the sample?</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Lane(s): <span class="text-danger">*</span></label>
                                                    <div class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                                                        <div class="form-check">
                                                            <input type="checkbox" class="form-check-input" id="addSample_allLanes"
                                                                :checked="addSampleTargetLanes.length === availableLanes.length"
                                                                @change="addSampleTargetLanes = $event.target.checked ? availableLanes.slice() : []">
                                                            <label class="form-check-label" for="addSample_allLanes">
                                                                <strong>All Lanes</strong>
                                                            </label>
                                                        </div>
                                                        <hr class="my-1">
                                                        <div v-for="lane in availableLanes" :key="lane" class="form-check">
                                                            <input type="checkbox" class="form-check-input" :id="'addSample_lane_' + lane"
                                                                :value="lane" v-model="addSampleTargetLanes">
                                                            <label class="form-check-label" :for="'addSample_lane_' + lane">
                                                                Lane {{ lane }}
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <small class="form-text text-muted">Select at least one lane (required)</small>
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label for="addSample_project" class="form-label">Project:</label>
                                                    <select class="form-select" id="addSample_project" v-model="addSampleTargetProject">
                                                        <option value="">-- None --</option>
                                                        <option v-for="project in availableProjects" :key="project.id || project.name" :value="project.id || project.name">
                                                            {{ project.displayName }}
                                                        </option>
                                                    </select>
                                                    <small class="form-text text-muted">Optional: select if sample belongs to a project</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Sample form fields -->
                                    <div v-if="addSampleTargetLanes.length > 0 && addSampleProjectWarnings.length > 0" class="alert alert-warning">
                                        <strong><i class="fa fa-info-circle"></i> Inconsistent Field Values Detected:</strong>
                                        <p class="mb-1 mt-2">The following fields have different values across samples in this project. The form has been pre-filled with values from the first sample, but you may want to review these fields:</p>
                                        <ul class="mb-0 mt-2">
                                            <li v-for="(warning, idx) in addSampleProjectWarnings" :key="idx">{{ warning }}</li>
                                        </ul>
                                    </div>
                                    <div v-if="addSampleTargetLanes.length > 0" class="alert alert-info">
                                        <strong><i class="fa fa-info-circle"></i> Note:</strong>
                                        Manually added samples require you to fill in all fields. Unlike LIMS-uploaded samples, Stage 1 processing rules will not be applied.
                                    </div>
                                    <div v-else-if="addSampleTargetLanes.length === 0" class="alert alert-warning">
                                        <i class="fa fa-exclamation-triangle"></i> Please select at least one lane above to continue
                                    </div>
                                    <div v-if="addSampleTargetLanes.length > 0">
                                        <SampleFormFields
                                            v-model="editFormData"
                                            :is-new-sample="true"
                                            mode="add" />
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeAddModal">Cancel</button>
                                    <button type="button" class="btn btn-success" @click="saveAddedSample"
                                        :disabled="addSampleTargetLanes.length === 0">
                                        <i class="fa fa-plus"></i> Add Sample
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Bulk Operations Modal -->
                    <div v-if="showBulkEditModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"><i class="fa fa-cogs"></i> Bulk Operations</h5>
                                    <button type="button" class="btn-close" @click="closeBulkEditModal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="mb-3">
                                        <label for="bulkEditAction" class="form-label">Action:</label>
                                        <select class="form-select" id="bulkEditAction" v-model="bulkEditAction" @change="updateProjectLaneSelection">
                                            <option value="reverse_complement_index1">Reverse Complement Index 1</option>
                                            <option value="reverse_complement_index2">Reverse Complement Index 2</option>
                                            <option value="edit_fields">Edit Fields</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="bulkEditProject" class="form-label">Project:</label>
                                        <select class="form-select" id="bulkEditProject" v-model="bulkEditProject" @change="updateProjectLaneSelection" required>
                                            <option value="">-- Select Project --</option>
                                            <option v-for="project in availableProjects" :key="project.id || project.name" :value="project.id || project.name">
                                                {{ project.displayName }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="mb-3" v-if="bulkEditProject">
                                        <label for="bulkEditLane" class="form-label">Lane:</label>
                                        <select class="form-select" id="bulkEditLane" v-model="bulkEditLane" :disabled="isSingleLaneProject">
                                            <option v-if="!isSingleLaneProject" value="all">All Lanes</option>
                                            <option v-for="lane in projectLanes" :key="lane" :value="lane">
                                                Lane {{ lane }}
                                            </option>
                                        </select>
                                        <small v-if="isSingleLaneProject" class="form-text text-muted">
                                            This project is only present in one lane.
                                        </small>
                                    </div>
                                    <!-- Sample Selection -->
                                    <div class="mb-3" v-if="bulkEditProject && bulkEditAvailableSamples.length > 0">
                                        <label class="form-label">Samples to Edit (optional):</label>
                                        <div class="border rounded p-2" style="max-height: 250px; overflow-y: auto;">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" id="bulkEdit_allSamples"
                                                    :checked="bulkEditTargetSamples.length === bulkEditAvailableSamples.length"
                                                    @change="bulkEditTargetSamples = $event.target.checked ? bulkEditAvailableSamples.map(s => s.uuid) : []">
                                                <label class="form-check-label" for="bulkEdit_allSamples">
                                                    <strong>All Samples ({{ bulkEditAvailableSamples.length }})</strong>
                                                </label>
                                            </div>
                                            <hr class="my-1">
                                            <div v-for="sampleInfo in bulkEditAvailableSamples" :key="sampleInfo.uuid" class="form-check">
                                                <input type="checkbox" class="form-check-input" :id="'bulkEdit_sample_' + sampleInfo.uuid"
                                                    :value="sampleInfo.uuid" v-model="bulkEditTargetSamples">
                                                <label class="form-check-label" :for="'bulkEdit_sample_' + sampleInfo.uuid">
                                                    <span class="badge bg-secondary me-1">L{{ sampleInfo.lane }}</span>
                                                    <span class="font-monospace">{{ sampleInfo.sampleId }}</span>
                                                    <span class="text-muted ms-1">({{ sampleInfo.sampleName }})</span>
                                                </label>
                                            </div>
                                        </div>
                                        <small class="form-text text-muted">
                                            Click "All Samples" to select all, or manually select specific samples below
                                        </small>
                                    </div>
                                    <!-- Warning for inconsistent field values -->
                                    <div v-if="bulkEditAction === 'edit_fields' && bulkEditProject && bulkEditProjectWarnings.length > 0" class="alert alert-warning">
                                        <strong><i class="fa fa-info-circle"></i> Inconsistent Field Values Detected:</strong>
                                        <p class="mb-1 mt-2">The following fields have different values across samples in this project. The form has been pre-filled with values from the majority of samples, but you may want to review these fields:</p>
                                        <ul class="mb-0 mt-2">
                                            <li v-for="(warning, idx) in bulkEditProjectWarnings" :key="idx">{{ warning }}</li>
                                        </ul>
                                    </div>
                                    <!-- Bulk Edit Fields Form -->
                                    <div v-if="bulkEditAction === 'edit_fields' && bulkEditProject" class="mt-4">
                                        <h6 class="mb-3">
                                            Edit Fields
                                            <span v-if="bulkEditTargetSamples.length > 0" class="text-muted">
                                                (applied to {{ bulkEditTargetSamples.length }} selected sample{{ bulkEditTargetSamples.length !== 1 ? 's' : '' }})
                                            </span>
                                            <span v-else class="text-muted">
                                                (applied to all {{ bulkEditAvailableSamples.length }} sample{{ bulkEditAvailableSamples.length !== 1 ? 's' : '' }})
                                            </span>
                                        </h6>
                                        <div class="alert alert-info">
                                            <i class="fa fa-info-circle"></i> Only fields with values entered below will be updated. Leave fields empty to keep existing values.
                                        </div>
                                        <div class="row">
                                            <!-- Iterate through bulk editable fields -->
                                            <template v-for="field in bulkEditableFields" :key="field.key">
                                                <!-- Text and Index inputs -->
                                                <div v-if="field.formField.inputType === 'text' || field.formField.inputType === 'index'"
                                                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                                                    <label :for="'bulk_' + field.key" class="form-label">{{ field.label }}:</label>
                                                    <input
                                                        :type="'text'"
                                                        :class="'form-control' + (field.formField.inputType === 'index' ? ' font-monospace' : '')"
                                                        :id="'bulk_' + field.key"
                                                        v-model="bulkEditFormData[field.key]"
                                                        :placeholder="'Leave empty to keep existing'">
                                                </div>
                                                <!-- Textarea -->
                                                <div v-else-if="field.formField.inputType === 'textarea'"
                                                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                                                    <label :for="'bulk_' + field.key" class="form-label">{{ field.label }}:</label>
                                                    <textarea
                                                        class="form-control"
                                                        :id="'bulk_' + field.key"
                                                        v-model="bulkEditFormData[field.key]"
                                                        :rows="field.formField.rows || 3"
                                                        :placeholder="'Leave empty to keep existing'"></textarea>
                                                </div>
                                                <!-- Select dropdown -->
                                                <div v-else-if="field.formField.inputType === 'select'"
                                                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                                                    <label :for="'bulk_' + field.key" class="form-label">{{ field.label }}:</label>
                                                    <select class="form-select" :id="'bulk_' + field.key" v-model="bulkEditFormData[field.key]">
                                                        <option value="">-- Keep existing --</option>
                                                        <option v-for="opt in field.formField.options" :key="opt.value" :value="opt.value">
                                                            {{ opt.label }}
                                                        </option>
                                                    </select>
                                                </div>
                                                <!-- Radio boolean nullable -->
                                                <div v-else-if="field.formField.inputType === 'radio-boolean-nullable'"
                                                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                                                    <label class="form-label">{{ field.label }}:</label>
                                                    <div>
                                                        <div class="form-check form-check-inline">
                                                            <input class="form-check-input" type="radio" :name="'bulk_' + field.key" :id="'bulk_' + field.key + '_null'" :value="null" v-model="bulkEditFormData[field.key]" checked>
                                                            <label class="form-check-label" :for="'bulk_' + field.key + '_null'">Keep existing</label>
                                                        </div>
                                                        <div class="form-check form-check-inline">
                                                            <input class="form-check-input" type="radio" :name="'bulk_' + field.key" :id="'bulk_' + field.key + '_true'" :value="true" v-model="bulkEditFormData[field.key]">
                                                            <label class="form-check-label" :for="'bulk_' + field.key + '_true'">True</label>
                                                        </div>
                                                        <div class="form-check form-check-inline">
                                                            <input class="form-check-input" type="radio" :name="'bulk_' + field.key" :id="'bulk_' + field.key + '_false'" :value="false" v-model="bulkEditFormData[field.key]">
                                                            <label class="form-check-label" :for="'bulk_' + field.key + '_false'">False</label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- Number input -->
                                                <div v-else-if="field.formField.inputType === 'number'"
                                                     :class="'col-md-' + field.formField.columnWidth + ' mb-3'">
                                                    <label :for="'bulk_' + field.key" class="form-label">{{ field.label }}:</label>
                                                    <input
                                                        type="number"
                                                        class="form-control"
                                                        :id="'bulk_' + field.key"
                                                        v-model.number="bulkEditFormData[field.key]"
                                                        :min="field.formField.min"
                                                        :max="field.formField.max"
                                                        :placeholder="field.formField.placeholder || 'Leave empty to keep existing'">
                                                    <small v-if="field.formField.helpText" class="form-text text-muted">{{ field.formField.helpText.edit || field.formField.helpText.add }}</small>
                                                </div>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeBulkEditModal">Cancel</button>
                                    <button type="button" class="btn btn-primary" @click="applyBulkEdit">Apply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Configuration Details Modal Component -->
                    <ConfigInspectModal
                        :show="showConfigModal"
                        :sample="configModalSample"
                        :sources="configModalSources"
                        :expanded-sources="expandedConfigSources"
                        :classification-config="sampleClassificationConfig"
                        :sorted-settings="sortedConfigModalSettings"
                        :format-timestamp="formatTimestamp"
                        :format-config-value="formatConfigValue"
                        :get-config-details="getConfigDetails"
                        :trace-config-value-source="traceConfigValueSource"
                        :format-config-source-label="formatConfigSourceLabel"
                        :get-all-b-c-l-convert-settings="getAllBCLConvertSettings"
                        :was-b-c-l-setting-manually-edited="wasBCLSettingManuallyEdited"
                        @close="closeConfigModal"
                        @toggle-source="toggleConfigSource" />
                </div>
            </div>
        </div>
        `
};
const app = Vue.createApp(vDemuxSampleInfoEditor);
app.mount('#demux_sample_info_editor_main');
