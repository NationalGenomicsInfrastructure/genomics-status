const vYieldCalculator = {
    /* Yield Calculator component */
    data() {
        return {
            // Input fields
            numSamples: 1,
            numberOfUnits: 2,
            targetPhiX: 0.01,
            
            // Output fields
            targetProjectYield: 0,
            targetYieldPerSample: 0,
            perfectYieldPerSample: 0,
            requiredProjectYield: 0,
            requiredYieldPerSample: 0,

            // Saved values for recent calculation
            savedNumSamples: null,
            savedNumberOfUnits: null,
            savedTargetPhiX: null,
        }
    },
    methods: {
        calculate() {
            // Save current input values
            this.savedNumSamples = this.numSamples;
            this.savedNumberOfUnits = this.numberOfUnits;
            this.savedTargetPhiX = this.targetPhiX;
            // Calculation logic will go here
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
                            <input type="number" class="form-control" id="numberOfUnits" v-model.number="numberOfUnits" min="1" step="0.5">
                        </div>
                        <div class="col-md-4">
                            <label for="targetPhiX" class="form-label">Target PhiX (%)</label>
                            <input type="number" class="form-control" id="targetPhiX" v-model.number="targetPhiX" min="0" max="100" step="0.01">
                            <small class="form-text text-muted">Standard is 1%</small>
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
                                    <small class="text-muted">Total clusters if 100% of ordered units are delivered</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-subtitle mb-2 text-muted">Target Yield per Sample (75% allocation)</h6>
                                    <p class="card-text fs-5">{{ formatNumber(targetYieldPerSample) }} M clusters</p>
                                    <small class="text-muted">Expected clusters per sample at 100% delivery</small><br>
                                    <small class="text-muted"><em>Perfect distribution: {{ formatNumber(perfectYieldPerSample) }} M clusters/sample</em></small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="alert alert-info">
                                <strong>Note:</strong> 
                                <ul class="mb-0 mt-2">
                                    <li>Project threshold is 90% of ({{ savedNumberOfUnits }} units × 600M clusters/unit) = {{ formatNumber(savedNumberOfUnits * 600000000 * 0.9) }} M clusters</li>
                                    <li v-if="savedTargetPhiX > 0.01">Extra PhiX ({{ ((savedTargetPhiX - 0.01) * 100).toFixed(2) }}%) reduces available clusters by {{ formatNumber(savedNumberOfUnits * 600000000 * (savedTargetPhiX - 0.01)) }} M clusters</li>
                                    <li>Per-sample threshold uses 75% allocation: 0.75 x {{ formatNumber(requiredProjectYield) }} ÷ {{ savedNumSamples }} samples = {{ formatNumber(requiredYieldPerSample) }} M clusters</li>
                                </ul>
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
