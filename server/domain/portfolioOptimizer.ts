export const PORTFOLIO_OPTIMIZER_VERSION = "deterministic-portfolio-v1" as const;

export type PortfolioCandidate = {
  scenarioId: number;
  name: string;
  investmentInr: number;
  carbonReductionKg: number;
  annualSavingsInr: number;
  paybackYears: number | null;
};

export type PortfolioObjective = "carbon_reduction" | "annual_savings";

export type PortfolioOptimizationInput = {
  candidates: PortfolioCandidate[];
  budgetInr: number;
  maxInterventions: number;
  objective: PortfolioObjective;
};

export type PortfolioOptimizationResult = {
  version: typeof PORTFOLIO_OPTIMIZER_VERSION;
  objective: PortfolioObjective;
  budgetInr: number;
  maxInterventions: number;
  selected: PortfolioCandidate[];
  excluded: Array<PortfolioCandidate & { reason: "over_budget" | "not_selected" }>;
  totals: { investmentInr: number; carbonReductionKg: number; annualSavingsInr: number };
  disclosure: string;
};

const round = (value: number) => Math.round(value * 100) / 100;
const compareCandidateIds = (left: PortfolioCandidate, right: PortfolioCandidate) => left.scenarioId - right.scenarioId;

function comparePortfolios(left: PortfolioCandidate[], right: PortfolioCandidate[], objective: PortfolioObjective) {
  const sum = (items: PortfolioCandidate[], key: "investmentInr" | "carbonReductionKg" | "annualSavingsInr") => items.reduce((total, item) => total + item[key], 0);
  const objectiveKey = objective === "carbon_reduction" ? "carbonReductionKg" : "annualSavingsInr";
  const first = sum(left, objectiveKey) - sum(right, objectiveKey);
  if (first) return first;
  const secondKey = objective === "carbon_reduction" ? "annualSavingsInr" : "carbonReductionKg";
  const second = sum(left, secondKey) - sum(right, secondKey);
  if (second) return second;
  const lowerInvestment = sum(right, "investmentInr") - sum(left, "investmentInr");
  if (lowerInvestment) return lowerInvestment;
  return right.map((item) => item.scenarioId).sort((a, b) => a - b).join(",").localeCompare(left.map((item) => item.scenarioId).sort((a, b) => a - b).join(","));
}

export function optimizeInterventionPortfolio(input: PortfolioOptimizationInput): PortfolioOptimizationResult {
  if (!Number.isFinite(input.budgetInr) || input.budgetInr < 0) throw new Error("Budget must be a finite non-negative number.");
  if (!Number.isInteger(input.maxInterventions) || input.maxInterventions < 1 || input.maxInterventions > 6) throw new Error("Select between one and six interventions.");
  if (input.candidates.length < 2 || input.candidates.length > 10) throw new Error("Select between two and ten saved scenarios.");
  if (new Set(input.candidates.map((candidate) => candidate.scenarioId)).size !== input.candidates.length) throw new Error("Portfolio candidates must reference unique saved scenarios.");
  if (input.candidates.some((candidate) => [candidate.investmentInr, candidate.carbonReductionKg, candidate.annualSavingsInr].some((value) => !Number.isFinite(value) || value < 0))) throw new Error("Portfolio candidates require finite non-negative modeled values.");

  const usable = input.candidates.filter((candidate) => candidate.investmentInr <= input.budgetInr).sort(compareCandidateIds);
  let best: PortfolioCandidate[] = [];
  const choose = (start: number, selected: PortfolioCandidate[], invested: number) => {
    if (selected.length && comparePortfolios(selected, best, input.objective) > 0) best = [...selected];
    if (selected.length === input.maxInterventions) return;
    for (let index = start; index < usable.length; index += 1) {
      const candidate = usable[index];
      if (invested + candidate.investmentInr <= input.budgetInr) choose(index + 1, [...selected, candidate], invested + candidate.investmentInr);
    }
  };
  choose(0, [], 0);
  const selectedIds = new Set(best.map((candidate) => candidate.scenarioId));
  const excluded = input.candidates.filter((candidate) => !selectedIds.has(candidate.scenarioId)).sort(compareCandidateIds).map((candidate) => ({ ...candidate, reason: candidate.investmentInr > input.budgetInr ? "over_budget" as const : "not_selected" as const }));
  const sum = (key: "investmentInr" | "carbonReductionKg" | "annualSavingsInr") => round(best.reduce((total, candidate) => total + candidate[key], 0));
  return {
    version: PORTFOLIO_OPTIMIZER_VERSION,
    objective: input.objective,
    budgetInr: round(input.budgetInr),
    maxInterventions: input.maxInterventions,
    selected: [...best].sort(compareCandidateIds),
    excluded,
    totals: { investmentInr: sum("investmentInr"), carbonReductionKg: sum("carbonReductionKg"), annualSavingsInr: sum("annualSavingsInr") },
    disclosure: "This bounded deterministic selector ranks only the chosen saved-scenario outputs against the stated budget and maximum count. It does not validate procurement cost, funding, implementability, intervention dependencies, overlapping baselines, stacking effects, realized savings, or carbon outcomes.",
  };
}
