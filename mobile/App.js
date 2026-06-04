
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar as NativeStatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  fetchLeaderboard,
  fetchTurboStatus,
  getTurboBaseUrl,
  predictTurboCompound,
  submitLeaderboardRecipe,
} from "./src/api";
import {
  fetchOfflineCancerTypes,
  fetchOfflineElements,
  fetchOfflineStatus,
  fetchTopSyntheticOffline,
  getPredictorMetadata,
  quickPredictCompound,
  simulateAllElementsOffline,
} from "./src/offlineEngine";
import { MODEL_ELEMENTS, TAB_ITEMS } from "./src/constants";

const COLORS = {
  ink: "#EAF7FF",
  muted: "#8CA3C7",
  accent: "#43E7FF",
  accentDark: "#0AA2FF",
  warm: "#6FD9FF",
  shell: "#040916",
  card: "#0B1426",
  line: "#173255",
  success: "#43E7FF",
  warning: "#F3B34C",
  danger: "#FF6E9C",
  tabBar: "#07101F",
};

const BRAND_LOGO = require("./assets/splash-icon.png");
const COMPANY_LOGO = require("./assets/company-logo.png");
const MONA_EXPANSION = "Model Of Natural Advancement";
const COMPANY_NAME = "Touch Of Davinci Studios";

function scoreTone(score) {
  if (score >= 0.75) {
    return COLORS.success;
  }
  if (score >= 0.5) {
    return COLORS.accentDark;
  }
  if (score >= 0.25) {
    return COLORS.warning;
  }
  return COLORS.danger;
}

function formatRecipe(amounts) {
  const parts = MODEL_ELEMENTS.flatMap((element) => {
    const amount = Number.parseFloat(amounts[element] ?? "");
    if (!Number.isFinite(amount) || amount <= 0) {
      return [];
    }
    return `${element}:${amount.toFixed(2)}`;
  });

  return parts.length > 0 ? parts.join(" | ") : "No active elements";
}

function formatSyntheticElements(compound) {
  if (compound.elements) {
    return Object.entries(compound.elements)
      .map(([symbol, qty]) => `${symbol}:${qty.toFixed(1)}`)
      .join(" | ");
  }

  return compound.formula || "Unknown";
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
}

function isTurboOfflineMessage(message) {
  return typeof message === "string" && message.includes("Turbo backend unavailable");
}

function buildRecipeElements(amounts) {
  const nextElements = {};

  MODEL_ELEMENTS.forEach((element) => {
    const amount = Number.parseFloat(amounts[element] ?? "");
    if (Number.isFinite(amount) && amount > 0) {
      nextElements[element] = Number(amount.toFixed(4));
    }
  });

  return nextElements;
}

function LaunchIntro({
  introOpacity,
  companyOpacity,
  companyScale,
  logoOpacity,
  logoScale,
  subtitleOpacity,
  typedSubtitle,
  bootstrapping,
}) {
  return (
    <Animated.View style={[styles.introOverlay, { opacity: introOpacity }]}>
      <View style={styles.introOrbOne} />
      <View style={styles.introOrbTwo} />
      <View style={styles.introLogoStage}>
        <Animated.View
          style={[
            styles.companyLogoWrap,
            {
              opacity: companyOpacity,
              transform: [{ scale: companyScale }],
            },
          ]}
        >
          <Image source={COMPANY_LOGO} resizeMode="contain" style={styles.companyLogo} />
          <Text style={styles.companyName}>{COMPANY_NAME}</Text>
        </Animated.View>
        <Animated.Image
          source={BRAND_LOGO}
          resizeMode="contain"
          style={[
            styles.introLogo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        />
      </View>
      <Animated.View style={[styles.introCopyWrap, { opacity: subtitleOpacity }]}>
        <Text style={styles.introKicker}>MONA</Text>
        <Text style={styles.introSubtitle}>{typedSubtitle}</Text>
        <Text style={styles.introCursor}>{typedSubtitle.length < MONA_EXPANSION.length ? "|" : ""}</Text>
      </Animated.View>
      {bootstrapping ? (
        <View style={styles.introLoadingRow}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.introLoadingText}>Loading bundled research stack...</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function ActionButton({ label, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" ? styles.buttonSecondaryText : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionCard({ eyebrow, title, children }) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function HomeScreen({
  status,
  cancerTypes,
  elements,
  turboStatus,
  turboError,
  onRetryTurbo,
  bootstrapError,
  onRetryBootstrap,
}) {
  const predictorMetadata = getPredictorMetadata();

  return (
    <View style={styles.screenStack}>
      <SectionCard eyebrow="Standalone" title="Core research stack, packed into the phone">
        <Text style={styles.bodyText}>
          Quick Predict, full-table simulation, and synthetic rankings now live inside the app with no server
          required.
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{status?.health ?? "Loading"}</Text>
            <Text style={styles.summaryLabel}>standalone status</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{cancerTypes.length}</Text>
            <Text style={styles.summaryLabel}>cancer profiles</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{elements.length}</Text>
            <Text style={styles.summaryLabel}>bundled elements</Text>
          </View>
        </View>
        <Text style={styles.bodyText}>
          Predictor truth line: {predictorMetadata.supported_cancer_types.length} supported cancers and 36
          model-trained element inputs. Explorer and simulation span the full {elements.length}-element table.
        </Text>
        <Text style={styles.bodyText}>
          Quick holdout R²: {predictorMetadata.quick_predictor.evaluation.r2.toFixed(3)}. Turbo holdout R²:{" "}
          {predictorMetadata.turbo_predictor.evaluation.r2.toFixed(3)} when you want the heavier local model.
        </Text>
      </SectionCard>

      <SectionCard eyebrow="Turbo" title="Optional local backend">
        <Text style={styles.bodyText}>
          Turbo Predict wakes up only when you point the phone at a local backend. For tethered use, run the
          backend locally and use `adb reverse tcp:8001 tcp:8001`.
        </Text>
        <Text style={styles.kicker}>Current target</Text>
        <Text style={styles.codeLine}>{getTurboBaseUrl()}</Text>
        <Text style={styles.bodyText}>
          Turbo status: {turboStatus?.health ?? (turboError ? "Unavailable" : "Not connected")}
        </Text>
        {turboError ? <Text style={[styles.bodyText, styles.errorText]}>{turboError}</Text> : null}
        <View style={styles.inlineButtonWrap}>
          <ActionButton label="Check turbo backend" onPress={onRetryTurbo} variant="secondary" />
        </View>
      </SectionCard>

      {bootstrapError ? (
        <SectionCard eyebrow="Fallback" title="Bundled bootstrap issue">
          <Text style={[styles.bodyText, styles.errorText]}>{bootstrapError}</Text>
          <View style={styles.inlineButtonWrap}>
            <ActionButton label="Retry standalone load" onPress={onRetryBootstrap} variant="secondary" />
          </View>
        </SectionCard>
      ) : null}
    </View>
  );
}
function RecipesScreen({ cancerTypes, history, onHistoryAdd, onTurboRefresh, turboStatus }) {
  const [selectedCancer, setSelectedCancer] = useState("");
  const [selectedElements, setSelectedElements] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [recipeName, setRecipeName] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [turboLoading, setTurboLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [error, setError] = useState("");
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboardMessage, setLeaderboardMessage] = useState("");
  const [quickResult, setQuickResult] = useState(null);
  const [turboResult, setTurboResult] = useState(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [syntheticResults, setSyntheticResults] = useState([]);

  const predictorCancerTypes = cancerTypes.filter((type) => type.supported_by_model);
  const selectedCancerInfo = predictorCancerTypes.find((type) => type.name === selectedCancer);
  const localLeaderboard = history
    .filter((item) => item.cancerType === selectedCancer)
    .slice()
    .sort((left, right) => right.prediction - left.prediction)
    .slice(0, 6);

  const toggleElement = (element) => {
    setSelectedElements((current) =>
      current.includes(element)
        ? current.filter((item) => item !== element)
        : [...current, element],
    );
  };

  const loadLeaderboard = async (cancerType = selectedCancer, { quiet = false } = {}) => {
    if (!cancerType) {
      setLeaderboardEntries([]);
      setLeaderboardError("");
      return;
    }

    try {
      setLeaderboardLoading(true);
      setLeaderboardError("");
      const response = await fetchLeaderboard(cancerType, 10);
      setLeaderboardEntries(response?.entries || []);
    } catch (nextError) {
      const nextMessage =
        nextError instanceof Error
          ? nextError.message
          : "Community leaderboard unavailable.";
      setLeaderboardEntries([]);
      setLeaderboardError(quiet && isTurboOfflineMessage(nextMessage) ? "" : nextMessage);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (!selectedCancer) {
      setSyntheticResults([]);
      setLeaderboardEntries([]);
      setLeaderboardError("");
      setLeaderboardMessage("");
      return undefined;
    }

    const loadSyntheticRecipes = async () => {
      try {
        setSyntheticLoading(true);
        const response = await fetchTopSyntheticOffline(selectedCancer);
        if (!cancelled) {
          setSyntheticResults(response || []);
        }
      } catch (nextError) {
        if (!cancelled) {
          setSyntheticResults([]);
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to load bundled recipe candidates.",
          );
        }
      } finally {
        if (!cancelled) {
          setSyntheticLoading(false);
        }
      }
    };

    void loadSyntheticRecipes();
    void loadLeaderboard(selectedCancer, { quiet: true });

    return () => {
      cancelled = true;
    };
  }, [selectedCancer]);

  const loadSyntheticRecipe = (compound) => {
    const nextElements = Object.keys(compound.elements || {}).filter((element) =>
      MODEL_ELEMENTS.includes(element),
    );
    const nextAmounts = {};

    nextElements.forEach((element) => {
      nextAmounts[element] = String(compound.elements[element]);
    });

    setSelectedElements(nextElements);
    setAmounts(nextAmounts);
    setRecipeName(compound.formula || "Loaded candidate");
    setQuickResult(null);
    setTurboResult(null);
    setLeaderboardMessage("Loaded a model-generated recipe into the composer.");
    setError("");
  };

  const reset = () => {
    setSelectedCancer("");
    setSelectedElements([]);
    setAmounts({});
    setRecipeName("");
    setSubmittedBy("");
    setQuickResult(null);
    setTurboResult(null);
    setError("");
    setLeaderboardEntries([]);
    setSyntheticResults([]);
    setLeaderboardError("");
    setLeaderboardMessage("");
  };

  const buildFeatureVector = () => {
    if (!selectedCancer) {
      throw new Error("Choose a cancer profile first.");
    }

    if (selectedElements.length === 0) {
      throw new Error("Select at least one model element.");
    }

    const features = MODEL_ELEMENTS.map((element) => {
      const amount = Number.parseFloat(amounts[element] ?? "");
      return Number.isFinite(amount) ? amount : 0;
    });

    if (!features.some((value) => value > 0)) {
      throw new Error("Enter a positive amount for at least one selected element.");
    }

    return features;
  };

  const buildRecipeSubmission = () => {
    const elements = buildRecipeElements(amounts);

    if (!selectedCancer) {
      throw new Error("Choose a cancer profile first.");
    }

    if (!Object.keys(elements).length) {
      throw new Error("Enter a positive amount for at least one selected element.");
    }

    return {
      cancerType: selectedCancer,
      recipeName: recipeName.trim() || formatRecipe(amounts),
      submittedBy: submittedBy.trim() || "Anonymous",
      elements,
    };
  };

  const handleResult = (mode, response) => {
    onHistoryAdd({
      timestamp: new Date().toISOString(),
      cancerType: selectedCancer,
      recipeName: recipeName.trim() || formatRecipe(amounts),
      submittedBy: submittedBy.trim() || "You",
      recipe: formatRecipe(amounts),
      mode,
      prediction: response.prediction,
      rawPrediction: response.raw_prediction,
    });
  };

  const runQuickPrediction = async () => {
    try {
      const features = buildFeatureVector();
      setQuickLoading(true);
      setError("");
      setLeaderboardMessage("");
      const response = await quickPredictCompound(selectedCancer, features);
      setQuickResult(response);
      handleResult("Quick", response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Quick Predict failed.");
    } finally {
      setQuickLoading(false);
    }
  };

  const runTurboPrediction = async () => {
    try {
      const features = buildFeatureVector();
      setTurboLoading(true);
      setError("");
      setLeaderboardMessage("");
      const response = await predictTurboCompound(selectedCancer, features);
      setTurboResult({ ...response, mode: "turbo", mode_label: "Turbo Predict" });
      handleResult("Turbo", response);
      await onTurboRefresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Turbo Predict failed.");
    } finally {
      setTurboLoading(false);
    }
  };

  const submitRecipe = async () => {
    try {
      const payload = buildRecipeSubmission();
      setSubmitLoading(true);
      setLeaderboardError("");
      setLeaderboardMessage("");
      const response = await submitLeaderboardRecipe(payload);
      setLeaderboardEntries(response?.leaderboard || []);
      setLeaderboardMessage(
        typeof response?.rank === "number"
          ? `Posted to the community leaderboard at #${response.rank}.`
          : "Recipe posted to the community leaderboard.",
      );
      await onTurboRefresh();
    } catch (nextError) {
      setLeaderboardError(
        nextError instanceof Error ? nextError.message : "Leaderboard submission failed.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={styles.screenStack}>
      <SectionCard eyebrow="Recipes" title="Compose, score, and rank in one place">
        <Text style={styles.bodyText}>
          This is now the merged recipe workspace. Design a compound, score it on-device, compare it against
          the bundled synthetic leaders, and post it to the connected leaderboard when the turbo backend is up.
        </Text>
        <Text style={styles.bodyText}>
          Training compounds usually contain 4 to 5 active elements, so compound-like recipes are closer to
          the model's home turf than single-element probes.
        </Text>
        <Text style={styles.bodyText}>
          Turbo backend: {turboStatus?.health ?? "not connected yet"}.
        </Text>
        <View style={styles.chipWrap}>
          {predictorCancerTypes.map((type) => (
            <Chip
              key={type.name}
              label={type.name}
              selected={selectedCancer === type.name}
              onPress={() => setSelectedCancer(type.name)}
            />
          ))}
        </View>
        {selectedCancerInfo ? (
          <Text style={styles.bodyText}>
            {selectedCancerInfo.tissue ? `${selectedCancerInfo.tissue} | ` : ""}
            {selectedCancerInfo.description}
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow="Composer" title="Recipe identity and active elements">
        <TextInput
          value={recipeName}
          onChangeText={setRecipeName}
          placeholder="Recipe name"
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
        />
        <TextInput
          value={submittedBy}
          onChangeText={setSubmittedBy}
          placeholder="Submitted by"
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
        />
        <View style={styles.chipWrap}>
          {MODEL_ELEMENTS.map((element) => (
            <Chip
              key={element}
              label={element}
              selected={selectedElements.includes(element)}
              onPress={() => toggleElement(element)}
            />
          ))}
        </View>

        {selectedElements.length > 0 ? (
          <View style={styles.amountGrid}>
            {selectedElements.map((element) => (
              <View key={element} style={styles.amountField}>
                <Text style={styles.amountLabel}>{element}</Text>
                <TextInput
                  value={amounts[element] ?? ""}
                  onChangeText={(value) =>
                    setAmounts((current) => ({
                      ...current,
                      [element]: value.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  placeholder="0.00"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <ActionButton
            label={quickLoading ? "Running Quick..." : "Quick Predict"}
            onPress={runQuickPrediction}
            disabled={quickLoading}
          />
          <ActionButton
            label={turboLoading ? "Running Turbo..." : "Turbo Predict"}
            onPress={runTurboPrediction}
            variant="secondary"
            disabled={turboLoading}
          />
          <ActionButton
            label={submitLoading ? "Posting..." : "Post to leaderboard"}
            onPress={submitRecipe}
            variant="secondary"
            disabled={submitLoading}
          />
        </View>

        <View style={styles.inlineButtonWrap}>
          <ActionButton label="Reset" onPress={reset} variant="secondary" />
        </View>

        {error ? <Text style={[styles.bodyText, styles.errorText]}>{error}</Text> : null}
        {leaderboardMessage ? (
          <Text style={[styles.bodyText, { color: COLORS.success }]}>{leaderboardMessage}</Text>
        ) : null}
        {leaderboardError ? (
          <Text style={[styles.bodyText, styles.errorText]}>{leaderboardError}</Text>
        ) : null}
      </SectionCard>

      {quickResult ? (
        <SectionCard eyebrow="Quick" title="On-device prediction">
          <Text style={[styles.scoreLine, { color: scoreTone(quickResult.sensitivity_score) }]}>
            {quickResult.sensitivity_score.toFixed(4)} | {quickResult.sensitivity_band}
          </Text>
          <Text style={styles.bodyText}>Predicted AUC: {quickResult.predicted_auc.toFixed(4)}</Text>
          <Text style={styles.bodyText}>
            Sensitivity percentile: {quickResult.sensitivity_percentile.toFixed(2)}
          </Text>
          <Text style={styles.bodyText}>
            Sensitive at threshold {quickResult.threshold_auc.toFixed(2)}: {quickResult.effective ? "yes" : "no"}
          </Text>
          <Text style={styles.bodyText}>Recipe: {formatRecipe(amounts)}</Text>
        </SectionCard>
      ) : null}

      {turboResult ? (
        <SectionCard eyebrow="Turbo" title="Backend-powered prediction">
          <Text style={[styles.scoreLine, { color: scoreTone(turboResult.sensitivity_score) }]}>
            {turboResult.sensitivity_score.toFixed(4)} | {turboResult.sensitivity_band}
          </Text>
          <Text style={styles.bodyText}>Predicted AUC: {turboResult.predicted_auc.toFixed(4)}</Text>
          <Text style={styles.bodyText}>
            Sensitivity percentile: {turboResult.sensitivity_percentile.toFixed(2)}
          </Text>
          <Text style={styles.bodyText}>
            Sensitive at threshold {turboResult.threshold_auc.toFixed(2)}: {turboResult.effective ? "yes" : "no"}
          </Text>
          <Text style={styles.bodyText}>Recipe: {formatRecipe(amounts)}</Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Leaderboard" title="Connected community board">
        <Text style={styles.bodyText}>
          When the turbo backend is reachable at {getTurboBaseUrl()}, recipes can be posted to the shared
          leaderboard. If it is unavailable, this section falls back to the best runs from the current
          session.
        </Text>
        <View style={styles.inlineButtonWrap}>
          <ActionButton
            label={leaderboardLoading ? "Refreshing..." : "Refresh leaderboard"}
            onPress={() => loadLeaderboard()}
            variant="secondary"
            disabled={leaderboardLoading || !selectedCancer}
          />
        </View>
        {leaderboardEntries.length > 0 ? (
          leaderboardEntries.map((entry, index) => (
            <View key={entry.id || `${entry.recipe_name}-${index}`} style={styles.listItem}>
              <Text style={styles.listTitle}>#{index + 1} | {entry.recipe_name}</Text>
              <Text style={[styles.scoreLine, { color: scoreTone(entry.prediction) }]}>
                {entry.prediction.toFixed(4)}
              </Text>
              <Text style={styles.bodyText}>
                {entry.submitted_by} | {entry.sensitivity_band}
              </Text>
              <Text style={styles.bodyText}>
                {formatSyntheticElements({ formula: entry.formula, elements: entry.elements })}
              </Text>
              <Text style={styles.bodyText}>{formatTimestamp(entry.created_at)}</Text>
            </View>
          ))
        ) : localLeaderboard.length > 0 ? (
          localLeaderboard.map((item, index) => (
            <View key={item.timestamp} style={styles.listItem}>
              <Text style={styles.listTitle}>
                #{index + 1} | {item.recipeName || item.recipe}
              </Text>
              <Text style={[styles.scoreLine, { color: scoreTone(item.prediction) }]}>
                {item.prediction.toFixed(4)}
              </Text>
              <Text style={styles.bodyText}>
                {item.submittedBy || "You"} | {item.mode} session result
              </Text>
              <Text style={styles.bodyText}>{item.recipe}</Text>
              <Text style={styles.bodyText}>{formatTimestamp(item.timestamp)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>
            {selectedCancer
              ? "No community or session leaderboard entries yet for this cancer profile."
              : "Pick a cancer profile to view the leaderboard."}
          </Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Synthetic" title="Bundled top recipe candidates">
        <Text style={styles.bodyText}>
          The old synthetic page now feeds this composer directly. Load a candidate, tweak it, and rescore it
          instead of bouncing between tabs.
        </Text>
        {syntheticLoading ? (
          <Text style={styles.bodyText}>Loading bundled recipe candidates...</Text>
        ) : syntheticResults.length > 0 ? (
          syntheticResults.map((compound, index) => {
            const score = compound.score ?? compound.confidence ?? 0;
            return (
              <View key={`${compound.formula ?? "compound"}-${index}`} style={styles.listItem}>
                <Text style={styles.listTitle}>
                  #{index + 1} | {compound.formula ?? "Generated formula"}
                </Text>
                <Text style={[styles.scoreLine, { color: scoreTone(score) }]}>{score.toFixed(4)}</Text>
                <Text style={styles.bodyText}>{formatSyntheticElements(compound)}</Text>
                <View style={styles.inlineButtonWrap}>
                  <ActionButton
                    label="Load into composer"
                    onPress={() => loadSyntheticRecipe(compound)}
                    variant="secondary"
                  />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.bodyText}>
            {selectedCancer
              ? "No bundled synthetic candidates were found for this cancer profile."
              : "Pick a cancer profile to load bundled recipe candidates."}
          </Text>
        )}
      </SectionCard>

      {history.length > 0 ? (
        <SectionCard eyebrow="History" title="Recent prediction runs">
          {history.slice(0, 6).map((item) => (
            <View key={item.timestamp} style={styles.listItem}>
              <Text style={styles.listTitle}>
                {item.mode} | {item.cancerType} | {item.recipeName || "Untitled recipe"}
              </Text>
              <Text style={styles.bodyText}>{item.recipe}</Text>
              <Text style={styles.bodyText}>
                Score {item.prediction.toFixed(4)} | raw {item.rawPrediction.toFixed(4)}
              </Text>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </View>
  );
}

function ElementsScreen({ cancerTypes, elements }) {
  const [selectedCancer, setSelectedCancer] = useState("");
  const [scoresByElement, setScoresByElement] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPredictorOnly, setShowPredictorOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!selectedCancer) {
      setScoresByElement({});
      setLoading(false);
      setError("");
      return undefined;
    }

    const loadScores = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await simulateAllElementsOffline(selectedCancer);
        if (cancelled) {
          return;
        }

        setScoresByElement(
          response.top_predictions.reduce((accumulator, item) => {
            accumulator[item.element] = item;
            return accumulator;
          }, {}),
        );
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Element explorer failed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadScores();

    return () => {
      cancelled = true;
    };
  }, [selectedCancer]);

  const filteredElements = showPredictorOnly
    ? elements.filter((element) => element.predictor_supported)
    : elements;

  return (
    <View style={styles.screenStack}>
      <SectionCard eyebrow="Elements" title="Whole periodic table, bundled on-device">
        <Text style={styles.bodyText}>
          The app now carries {elements.length} bundled element records for standalone exploration. That gives
          us a real whole-table view on the phone instead of only exposing the 36 predictor inputs.
        </Text>
        <Text style={styles.bodyText}>
          Predictor truth line: Quick and Turbo still consume the 36 model-trained element channels. The
          wider table is available today for simulation, ranking, and discovery.
        </Text>
        <View style={styles.buttonRow}>
          <ActionButton
            label={showPredictorOnly ? "Show all bundled elements" : "Show predictor-supported only"}
            onPress={() => setShowPredictorOnly((current) => !current)}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard eyebrow="Cancer Profile" title="Overlay simulation scores on the table">
        <Text style={styles.bodyText}>
          Pick a cancer profile and each element card will show its bundled offline simulation score.
        </Text>
        <View style={styles.chipWrap}>
          {cancerTypes.map((type) => (
            <Chip
              key={type.name}
              label={type.name}
              selected={selectedCancer === type.name}
              onPress={() => setSelectedCancer(type.name)}
            />
          ))}
        </View>
        {selectedCancer ? (
          <Text style={styles.bodyText}>
            {loading ? `Scoring ${selectedCancer}...` : `Showing ${selectedCancer} scores across ${filteredElements.length} visible elements.`}
          </Text>
        ) : (
          <Text style={styles.bodyText}>Choose a cancer profile to paint the table with scores.</Text>
        )}
        {error ? <Text style={[styles.bodyText, styles.errorText]}>{error}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Explorer" title={`Visible elements: ${filteredElements.length}`}>
        <View style={styles.resultGrid}>
          {filteredElements.map((element) => {
            const score = scoresByElement[element.symbol];
            return (
              <View key={element.symbol} style={styles.resultCard}>
                <Text style={styles.resultElement}>{element.symbol}</Text>
                <Text style={styles.resultLabel}>
                  {element.name} | #{element.number}
                </Text>
                <Text style={styles.resultBody}>
                  {element.category || "Uncategorized"} | period {element.period || "?"}
                </Text>
                <Text
                  style={[
                    styles.resultScore,
                    score ? { color: scoreTone(score.confidence) } : null,
                  ]}
                >
                  {score ? score.confidence.toFixed(4) : element.predictor_supported ? "Predictor-ready" : "Explorer-only"}
                </Text>
                <Text style={styles.resultBody}>
                  {score ? score.result : element.predictor_supported ? "Included in Quick and Turbo inputs." : "Not part of the current predictor training space."}
                </Text>
              </View>
            );
          })}
        </View>
      </SectionCard>
    </View>
  );
}

function SimulateScreen({ cancerTypes }) {
  const [selectedCancer, setSelectedCancer] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visibleResults = showAll ? results : results.slice(0, 24);

  const runSimulation = async () => {
    if (!selectedCancer) {
      setError("Choose a cancer profile first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await simulateAllElementsOffline(selectedCancer);
      setResults(response.top_predictions);
      setShowAll(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenStack}>
      <SectionCard eyebrow="Simulation" title="Bundled periodic-table scan">
        <Text style={styles.bodyText}>
          This screen now runs from bundled simulation data so it still works without a backend.
        </Text>
        <View style={styles.chipWrap}>
          {cancerTypes.map((type) => (
            <Chip
              key={type.name}
              label={type.name}
              selected={selectedCancer === type.name}
              onPress={() => setSelectedCancer(type.name)}
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          <ActionButton label={loading ? "Loading..." : "Run simulation"} onPress={runSimulation} disabled={loading} />
        </View>
        {error ? <Text style={[styles.bodyText, styles.errorText]}>{error}</Text> : null}
      </SectionCard>

      {results.length > 0 ? (
        <SectionCard eyebrow="Results" title={`Top elements for ${selectedCancer}`}>
          <Text style={styles.bodyText}>
            Showing {visibleResults.length} of {results.length} bundled simulation results.
          </Text>
          <View style={styles.resultGrid}>
            {visibleResults.map((item) => (
              <View key={item.element} style={styles.resultCard}>
                <Text style={styles.resultElement}>{item.element}</Text>
                <Text style={[styles.resultScore, { color: scoreTone(item.confidence) }]}>
                  {item.confidence.toFixed(4)}
                </Text>
                <Text style={styles.resultLabel}>{item.result}</Text>
                <Text style={styles.resultBody}>{item.message}</Text>
              </View>
            ))}
          </View>
          {results.length > 24 ? (
            <View style={styles.inlineButtonWrap}>
              <ActionButton
                label={showAll ? "Show top 24 only" : "Show all elements"}
                onPress={() => setShowAll((current) => !current)}
                variant="secondary"
              />
            </View>
          ) : null}
        </SectionCard>
      ) : null}
    </View>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [status, setStatus] = useState(null);
  const [turboStatus, setTurboStatus] = useState(null);
  const [turboError, setTurboError] = useState("");
  const [cancerTypes, setCancerTypes] = useState([]);
  const [elements, setElements] = useState([]);
  const [bootstrapError, setBootstrapError] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [introSequenceComplete, setIntroSequenceComplete] = useState(false);
  const [showLaunchIntro, setShowLaunchIntro] = useState(true);

  const introOpacity = useRef(new Animated.Value(1)).current;
  const companyOpacity = useRef(new Animated.Value(0)).current;
  const companyScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const bootstrap = async () => {
    try {
      setBootstrapping(true);
      setBootstrapError("");
      const [nextStatus, nextCancerTypes, nextElements] = await Promise.all([
        fetchOfflineStatus(),
        fetchOfflineCancerTypes(),
        fetchOfflineElements(),
      ]);
      setStatus(nextStatus);
      setCancerTypes(nextCancerTypes);
      setElements(nextElements);
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Failed to load bundled app data.");
    } finally {
      setBootstrapping(false);
    }
  };

  const refreshTurbo = async ({ quiet = false } = {}) => {
    try {
      setTurboError("");
      const nextTurboStatus = await fetchTurboStatus();
      setTurboStatus(nextTurboStatus);
    } catch (error) {
      setTurboStatus(null);
      const nextMessage = error instanceof Error ? error.message : "Turbo backend unavailable.";
      setTurboError(quiet ? "" : nextMessage);
    }
  };

  useEffect(() => {
    let companyHoldTimeout;
    let logoTransitionTimeout;
    let typingTimeout;
    let typingInterval;
    let holdTimeout;

    Animated.parallel([
      Animated.timing(companyOpacity, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(companyScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    companyHoldTimeout = setTimeout(() => {
      Animated.timing(companyOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, 1250);

    logoTransitionTimeout = setTimeout(() => {
      Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 42,
        useNativeDriver: true,
      }),
      ]).start();
    }, 1380);

    typingTimeout = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
      }).start();

      let index = 0;
      typingInterval = setInterval(() => {
        index += 1;
        setTypedSubtitle(MONA_EXPANSION.slice(0, index));

        if (index >= MONA_EXPANSION.length) {
          clearInterval(typingInterval);
          holdTimeout = setTimeout(() => {
            setIntroSequenceComplete(true);
          }, 2100);
        }
      }, 52);
    }, 1760);

    return () => {
      clearTimeout(companyHoldTimeout);
      clearTimeout(logoTransitionTimeout);
      clearTimeout(typingTimeout);
      clearTimeout(holdTimeout);
      clearInterval(typingInterval);
    };
  }, [companyOpacity, companyScale, logoOpacity, logoScale, subtitleOpacity]);

  useEffect(() => {
    void bootstrap();
    void refreshTurbo({ quiet: true });
  }, []);

  useEffect(() => {
    if (!showLaunchIntro || !introSequenceComplete || bootstrapping) {
      return;
    }

    Animated.timing(introOpacity, {
      toValue: 0,
      duration: 520,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowLaunchIntro(false);
    });
  }, [bootstrapping, introOpacity, introSequenceComplete, showLaunchIntro]);

  const shellTopInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight || 0) + 6 : 10;
  const tabBarBottomInset = Platform.OS === "android" ? 58 : 36;

  let screen = (
    <HomeScreen
      status={status}
      cancerTypes={cancerTypes}
      elements={elements}
      turboStatus={turboStatus}
      turboError={turboError}
      onRetryTurbo={refreshTurbo}
      bootstrapError={bootstrapError}
      onRetryBootstrap={bootstrap}
    />
  );

  if (activeTab === "recipes") {
    screen = (
      <RecipesScreen
        cancerTypes={cancerTypes}
        history={predictionHistory}
        turboStatus={turboStatus}
        onTurboRefresh={refreshTurbo}
        onHistoryAdd={(item) => setPredictionHistory((current) => [item, ...current].slice(0, 10))}
      />
    );
  }

  if (activeTab === "elements") {
    screen = <ElementsScreen cancerTypes={cancerTypes} elements={elements} />;
  }

  if (activeTab === "simulate") {
    screen = <SimulateScreen cancerTypes={cancerTypes} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={[styles.shell, { paddingTop: shellTopInset, paddingBottom: tabBarBottomInset + 8 }]}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />
        <View style={styles.topBrand}>
          <Image source={BRAND_LOGO} style={styles.topBrandLogo} resizeMode="contain" />
        </View>

        {bootstrapping ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.accentDark} />
            <Text style={styles.bodyText}>Loading bundled research data...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {screen}
          </ScrollView>
        )}

        <View style={[styles.tabBar, { bottom: tabBarBottomInset }]}>
          {TAB_ITEMS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, activeTab === tab.key ? styles.tabButtonActive : null]}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : null]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
        {showLaunchIntro ? (
          <LaunchIntro
            bootstrapping={bootstrapping}
            introOpacity={introOpacity}
            companyOpacity={companyOpacity}
            companyScale={companyScale}
            logoOpacity={logoOpacity}
            logoScale={logoScale}
            subtitleOpacity={subtitleOpacity}
            typedSubtitle={typedSubtitle}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.shell,
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#020814",
    zIndex: 20,
  },
  introOrbOne: {
    position: "absolute",
    top: -80,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#0E4FFF",
    opacity: 0.32,
  },
  introOrbTwo: {
    position: "absolute",
    bottom: -70,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#19DFFF",
    opacity: 0.2,
  },
  introLogo: {
    position: "absolute",
    width: 286,
    height: 132,
  },
  introLogoStage: {
    width: "100%",
    minHeight: 186,
    alignItems: "center",
    justifyContent: "center",
  },
  companyLogoWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  companyLogo: {
    width: 240,
    height: 126,
  },
  companyName: {
    marginTop: 14,
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  introCopyWrap: {
    alignItems: "center",
    marginTop: 26,
    minHeight: 92,
  },
  introKicker: {
    color: COLORS.warm,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  introSubtitle: {
    marginTop: 14,
    color: COLORS.ink,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  introCursor: {
    marginTop: 6,
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "700",
    minHeight: 24,
  },
  introLoadingRow: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  introLoadingText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  shell: {
    flex: 1,
    backgroundColor: COLORS.shell,
    paddingHorizontal: 16,
  },
  orbOne: {
    position: "absolute",
    top: -40,
    right: -85,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#0E4FFF",
    opacity: 0.4,
  },
  orbTwo: {
    position: "absolute",
    top: 100,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#19DFFF",
    opacity: 0.25,
  },
  topBrand: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "rgba(10, 22, 44, 0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#2BCBFF",
    shadowColor: "#2BCBFF",
    shadowOpacity: 0.32,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  topBrandLogo: {
    width: 232,
    height: 92,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 220,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  screenStack: {
    gap: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: "#101B31",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#31D6FF",
    shadowColor: "#1BD8FF",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  summaryValue: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E67A8",
    shadowColor: "#00AFFF",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  eyebrow: {
    color: COLORS.warm,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  cardBody: {
    marginTop: 12,
    gap: 12,
  },
  bodyText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  codeLine: {
    color: COLORS.ink,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  kicker: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.ink,
    backgroundColor: "#081120",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  chipIdle: {
    backgroundColor: "#0E192C",
    borderColor: "#21446E",
  },
  chipSelected: {
    backgroundColor: COLORS.accentDark,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  chipText: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#F3FCFF",
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amountField: {
    width: "31%",
    minWidth: 92,
  },
  amountLabel: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.ink,
    backgroundColor: "#081120",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  button: {
    minWidth: 150,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.accentDark,
    shadowColor: COLORS.accent,
    borderWidth: 1,
    borderColor: "#8CF4FF",
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  buttonSecondary: {
    backgroundColor: "#0C1830",
    borderWidth: 1,
    borderColor: "#31D6FF",
    shadowColor: "#1BD8FF",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#F3FCFF",
    fontSize: 14,
    fontWeight: "800",
  },
  buttonSecondaryText: {
    color: COLORS.accent,
  },
  inlineButtonWrap: {
    alignItems: "flex-start",
  },
  scoreLine: {
    fontSize: 18,
    fontWeight: "900",
  },
  errorText: {
    color: COLORS.danger,
  },
  listItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  listTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  resultGrid: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: "#101B31",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E67A8",
    shadowColor: "#0AA2FF",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  resultElement: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  resultScore: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
  },
  resultLabel: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  resultBody: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: COLORS.tabBar,
    borderRadius: 26,
    padding: 9,
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#32D9FF",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.26,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: COLORS.accentDark,
    borderWidth: 1,
    borderColor: "#8CF4FF",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  tabLabel: {
    color: "#7F98BF",
    fontSize: 12,
    fontWeight: "800",
  },
  tabLabelActive: {
    color: "#F3FCFF",
  },
});

