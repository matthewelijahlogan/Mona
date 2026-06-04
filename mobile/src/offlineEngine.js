let cachedCancerTypes;
let cachedElements;
let cachedSimulations;
let cachedSynthetic;
let cachedPredictorBundle;
let cachedPredictorMetadata;

function getCancerTypesData() {
  if (!cachedCancerTypes) {
    cachedCancerTypes = require("./data/offlineCancerTypes.json");
  }
  return cachedCancerTypes;
}

function getSimulationsData() {
  if (!cachedSimulations) {
    cachedSimulations = require("./data/offlineSimulations.json");
  }
  return cachedSimulations;
}

function getElementsData() {
  if (!cachedElements) {
    cachedElements = require("./data/offlineElements.json");
  }
  return cachedElements;
}

function getSyntheticData() {
  if (!cachedSynthetic) {
    cachedSynthetic = require("./data/offlineSynthetic.json");
  }
  return cachedSynthetic;
}

function getPredictorBundle() {
  if (!cachedPredictorBundle) {
    cachedPredictorBundle = require("./data/quickPredictorBundle.json");
  }
  return cachedPredictorBundle;
}

export function getPredictorMetadata() {
  if (!cachedPredictorMetadata) {
    cachedPredictorMetadata = require("./data/predictorMetadata.json");
  }
  return cachedPredictorMetadata;
}

function bisectRight(sortedValues, value) {
  let low = 0;
  let high = sortedValues.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (value < sortedValues[mid]) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}

function getSensitivityBand(score) {
  if (score >= 0.9) {
    return "Exceptional sensitivity";
  }
  if (score >= 0.75) {
    return "Strong sensitivity";
  }
  if (score >= 0.5) {
    return "Above-median sensitivity";
  }
  if (score >= 0.25) {
    return "Limited sensitivity";
  }
  return "Weak sensitivity";
}

function evaluateTree(tree, featureVector, thresholdScale, valueScale) {
  let nodeIndex = 0;

  while (tree.f[nodeIndex] >= 0) {
    const featureIndex = tree.f[nodeIndex];
    const threshold = tree.t[nodeIndex] / thresholdScale;
    nodeIndex =
      featureVector[featureIndex] <= threshold
        ? tree.l[nodeIndex]
        : tree.r[nodeIndex];
  }

  return tree.v[nodeIndex] / valueScale;
}

function evaluateForest(bundle, featureVector) {
  let total = 0;

  for (const tree of bundle.trees) {
    total += evaluateTree(
      tree,
      featureVector,
      bundle.threshold_scale,
      bundle.value_scale,
    );
  }

  return total / bundle.trees.length;
}

export async function fetchOfflineStatus() {
  const metadata = getPredictorMetadata();
  const cancers = getCancerTypesData();
  const elements = getElementsData();
  const simulations = getSimulationsData();
  const synthetic = getSyntheticData();

  return {
    server: "offline-bundled",
    health: "Standalone Ready",
    app_mode: "offline-first",
    quick_predict_supported_cancers: metadata.supported_cancer_types.length,
    bundled_elements: elements.length,
    total_cancer_profiles: cancers.length,
    bundled_simulation_profiles: Object.keys(simulations).length,
    bundled_synthetic_profiles: Object.keys(synthetic).length,
    quick_predictor: metadata.quick_predictor,
    turbo_predictor: metadata.turbo_predictor,
  };
}

export async function fetchOfflineCancerTypes() {
  return getCancerTypesData();
}

export async function fetchOfflineElements() {
  return getElementsData();
}

export async function quickPredictCompound(cancerType, features) {
  const metadata = getPredictorMetadata();
  const bundle = getPredictorBundle();
  const expectedCount = metadata.feature_columns.length;

  if (!Array.isArray(features) || features.length !== expectedCount) {
    throw new Error(`Features must be a list of ${expectedCount} numeric values.`);
  }

  if (!metadata.supported_cancer_types.includes(cancerType)) {
    throw new Error(
      `Quick Predict supports only: ${metadata.supported_cancer_types.join(", ")}`,
    );
  }

  const cancerIndex = bundle.cancer_categories.indexOf(cancerType);
  if (cancerIndex < 0) {
    throw new Error(`Cancer type not found in quick predictor bundle: ${cancerType}`);
  }

  const inputVector = new Array(bundle.feature_count).fill(0);
  inputVector[cancerIndex] = 1;

  features.forEach((value, index) => {
    const numericValue = Number(value) || 0;
    inputVector[bundle.cancer_categories.length + index] = numericValue;
  });

  const predictedAuc = evaluateForest(bundle, inputVector);
  const referenceValues = metadata.auc_reference_values || [];
  const aucPercentile = referenceValues.length
    ? bisectRight(referenceValues, predictedAuc) / referenceValues.length
    : 0;
  const sensitivityScore = 1 - aucPercentile;

  return {
    mode: "quick",
    mode_label: "Quick Predict",
    prediction: Number(sensitivityScore.toFixed(4)),
    raw_prediction: Number(predictedAuc.toFixed(4)),
    predicted_auc: Number(predictedAuc.toFixed(4)),
    sensitivity_score: Number(sensitivityScore.toFixed(4)),
    sensitivity_percentile: Number((sensitivityScore * 100).toFixed(2)),
    auc_percentile: Number((aucPercentile * 100).toFixed(2)),
    sensitivity_band: getSensitivityBand(sensitivityScore),
    effective: predictedAuc <= metadata.sensitivity_threshold_auc,
    threshold_auc: metadata.sensitivity_threshold_auc,
  };
}

export async function simulateAllElementsOffline(cancerType) {
  const simulations = getSimulationsData();
  const topPredictions = simulations[cancerType];

  if (!topPredictions) {
    throw new Error(`No bundled simulation profile for ${cancerType}.`);
  }

  return {
    cancer_type: cancerType,
    top_predictions: topPredictions,
  };
}

export async function fetchTopSyntheticOffline(cancerType) {
  const synthetic = getSyntheticData();
  return synthetic[cancerType] || [];
}
