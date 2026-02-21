"use client";

import { OnboardingTour, type TourStep } from "@/components/onboarding-tour";

const ANALYTICS_TOUR_STEPS: TourStep[] = [
  {
    selector: null,
    titleKey: "tour.analyticsWelcome",
    descKey: "tour.analyticsWelcomeDesc",
  },
  {
    selector: "[data-tour='analytics-header']",
    titleKey: "tour.analyticsHeader",
    descKey: "tour.analyticsHeaderDesc",
  },
  {
    selector: "[data-tour='analytics-export']",
    titleKey: "tour.analyticsExport",
    descKey: "tour.analyticsExportDesc",
  },
  {
    selector: "[data-tour='analytics-team-analysis']",
    titleKey: "tour.analyticsTeamAnalysis",
    descKey: "tour.analyticsTeamAnalysisDesc",
  },
  {
    selector: "[data-tour='analytics-overview-table']",
    titleKey: "tour.analyticsOverview",
    descKey: "tour.analyticsOverviewDesc",
  },
];

export function AnalyticsTour() {
  return (
    <OnboardingTour
      storageKey="pitpilot_tour_seen_analytics"
      steps={ANALYTICS_TOUR_STEPS}
    />
  );
}
