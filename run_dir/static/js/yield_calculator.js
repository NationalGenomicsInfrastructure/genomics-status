const vYieldCalculator = {
    /* Yield Calculator component */
    data() {
        return {
            // Input fields
            numSamples: 1,
            numberOfUnits: 2,
            targetPhiX: 0.01,
            enableCoverage: false,
            readLengthTotal: 302,
            genomeSize: 3000,
            
            // Output fields
            targetProjectYield: 0,
            targetYieldPerSample: 0,
            perfectYieldPerSample: 0,
            requiredProjectYield: 0,
            requiredYieldPerSample: 0,
            requiredCoveragePerSample: 0,
            targetCoveragePerSample: 0,
            perfectCoveragePerSample: 0,
        }
    },
    methods: {
        calculate() {
            // 600M clusters per unit
            const clustersPerUnit = 600000000;
            const extraPhiX = (this.targetPhiX - 0.01) // 1 % is standard, so calculate the extra percentage needed
            this.targetProjectYield = clustersPerUnit * this.numberOfUnits;
            this.requiredProjectYield = clustersPerUnit * this.numberOfUnits * 0.9
            if (extraPhiX > 0) {
                this.requiredProjectYield = this.requiredProjectYield - (clustersPerUnit * this.numberOfUnits * extraPhiX)
                this.targetProjectYield = this.targetProjectYield - (clustersPerUnit * this.numberOfUnits * extraPhiX)
            }
            this.requiredYieldPerSample = 0.75 * this.requiredProjectYield / this.numSamples;
            this.targetYieldPerSample = 0.75 * this.targetProjectYield / this.numSamples;
            this.perfectYieldPerSample = this.targetProjectYield / this.numSamples;

            // Calculate coverage only if enabled and genome size and read length are provided
            if (this.enableCoverage && this.genomeSize > 0 && this.readLengthTotal > 0) {
                const genomeSizeInBp = this.genomeSize * 1000000; // Convert Mbp to bp
                this.requiredCoveragePerSample = (this.requiredYieldPerSample * this.readLengthTotal) / genomeSizeInBp;
                this.targetCoveragePerSample = (this.targetYieldPerSample * this.readLengthTotal) / genomeSizeInBp;
                this.perfectCoveragePerSample = (this.perfectYieldPerSample * this.readLengthTotal) / genomeSizeInBp;
            } else {
                this.requiredCoveragePerSample = 0;
                this.targetCoveragePerSample = 0;
                this.perfectCoveragePerSample = 0;
            }
        },
        formatNumber(num) {
            return new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 2
            }).format(num / 1000000);
        }
    },
    template: `
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Universal Project Yield Calculator</h5>
            </div>
            <div class="card-body">
                <form @submit.prevent="calculate">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label for="numSamples" class="form-label">Number of Samples</label>
                            <input type="number" class="form-control" id="numSamples" v-model.number="numSamples" min="1">
                        </div>
                        <div class="col-md-4">
                            <label for="numberOfUnits" class="form-label">Number of Units Ordered</label>
                            <input type="number" class="form-control" id="numberOfUnits" v-model.number="numberOfUnits" min="1" step="1">
                        </div>
                        <div class="col-md-4">
                            <label for="targetPhiX" class="form-label">Target PhiX (%)</label>
                            <input type="number" class="form-control" id="targetPhiX" v-model.number="targetPhiX" min="0" max="100" step="0.01">
                            <small class="form-text text-muted">Standard is 1%</small>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="enableCoverage" v-model="enableCoverage">
                                <label class="form-check-label" for="enableCoverage">
                                    Calculate Coverage
                                </label>
                            </div>
                        </div>
                    </div>

                    <div v-if="enableCoverage" class="row mb-3">
                        <div class="col-md-6">
                            <label for="readLengthTotal" class="form-label">Total Read Length (bp)</label>
                            <input type="number" class="form-control" id="readLengthTotal" v-model.number="readLengthTotal" min="1">
                            <small class="form-text text-muted">For paired-end: R1 + R2 (e.g., 151 + 151 = 302)</small>
                        </div>
                        <div class="col-md-6">
                            <label for="genomeSize" class="form-label">Genome Size (Mbp)</label>
                            <input type="number" class="form-control" id="genomeSize" v-model.number="genomeSize" min="1">
                            <small class="form-text text-muted">Human genome ≈ 3000 Mbp</small>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary btn-lg">Calculate</button>
                        </div>
                    </div>
                </form>
                
                <div v-if="requiredProjectYield > 0" class="mt-4">
                    <h5>Results</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card border-primary">
                                <div class="card-body">
                                    <h6 class="card-subtitle mb-2 text-muted">Required Project Yield (90% threshold)</h6>
                                    <p class="card-text fs-4 fw-bold text-primary">{{ formatNumber(requiredProjectYield) }} M clusters</p>
                                    <small class="text-muted">Total clusters needed for the project to pass</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-success">
                                <div class="card-body">
                                    <h6 class="card-subtitle mb-2 text-muted">Required Yield per Sample (75% allocation)</h6>
                                    <p class="card-text fs-4 fw-bold text-success">{{ formatNumber(requiredYieldPerSample) }} M clusters</p>
                                    <small class="text-muted">Minimum clusters each sample should have</small>
                                    <div v-if="enableCoverage && requiredCoveragePerSample > 0" class="mt-2">
                                        <small class="text-muted"><strong>Average depth of coverage: {{ requiredCoveragePerSample.toFixed(1) }}X</strong></small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-12">
                            <h6 class="text-muted">Target Yields (100%)</h6>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-subtitle mb-2 text-muted">Target Project Yield (100%)</h6>
                                    <p class="card-text fs-5">{{ formatNumber(targetProjectYield) }} M clusters</p>
                                    <small class="text-muted">Total clusters if 100% of ordered units are delivered</small><br>
                                    <small class="text-muted"><em>Perfect distribution: {{ formatNumber(perfectYieldPerSample) }} M clusters/sample</em>
                                    <span v-if="enableCoverage && perfectCoveragePerSample > 0"> ({{ perfectCoveragePerSample.toFixed(1) }}X)</span></small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-subtitle mb-2 text-muted">Target Yield per Sample (75% allocation)</h6>
                                    <p class="card-text fs-5">{{ formatNumber(targetYieldPerSample) }} M clusters</p>
                                    <small class="text-muted">Expected clusters per sample at 100% delivery</small>
                                    <div v-if="enableCoverage && targetCoveragePerSample > 0" class="mt-2">
                                        <small class="text-muted"><strong>Average coverage: {{ targetCoveragePerSample.toFixed(1) }}X</strong></small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Create and mount the Vue app
const { createApp } = Vue;

const app = createApp({
    components: {
        'v-yield-calculator': vYieldCalculator
    }
});

app.mount('#yield_calculator_main');
