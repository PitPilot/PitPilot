const allianceAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["totalEPA", "strengths", "weaknesses", "keyPlayers"],
  properties: {
    totalEPA: { type: "number" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    keyPlayers: { type: "array", items: { type: "number" } },
  },
} as const;

const epaBreakdownSchema = {
  type: "object",
  additionalProperties: false,
  required: ["total", "auto", "teleop", "endgame"],
  properties: {
    total: { type: "number" },
    auto: { type: "number" },
    teleop: { type: "number" },
    endgame: { type: "number" },
  },
} as const;

export const BRIEF_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "prediction",
    "redAlliance",
    "blueAlliance",
    "teamAnalysis",
    "strategy",
    "scoutingPriorities",
  ],
  properties: {
    prediction: {
      type: "object",
      additionalProperties: false,
      required: ["winner", "confidence", "redScore", "blueScore"],
      properties: {
        winner: { type: "string", enum: ["red", "blue"] },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        redScore: { type: "number" },
        blueScore: { type: "number" },
      },
    },
    redAlliance: allianceAnalysisSchema,
    blueAlliance: allianceAnalysisSchema,
    teamAnalysis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "teamNumber",
          "alliance",
          "epaBreakdown",
          "scoutingInsights",
          "role",
        ],
        properties: {
          teamNumber: { type: "number" },
          alliance: { type: "string", enum: ["red", "blue"] },
          epaBreakdown: epaBreakdownSchema,
          scoutingInsights: { type: "string" },
          role: { type: "string", enum: ["scorer", "defender", "support"] },
        },
      },
    },
    strategy: {
      type: "object",
      additionalProperties: false,
      required: ["redRecommendations", "blueRecommendations", "keyMatchups"],
      properties: {
        redRecommendations: { type: "array", items: { type: "string" } },
        blueRecommendations: { type: "array", items: { type: "string" } },
        keyMatchups: { type: "array", items: { type: "string" } },
      },
    },
    scoutingPriorities: {
      type: "object",
      additionalProperties: false,
      required: ["teamsNeedingCoverage", "scoutActions"],
      properties: {
        teamsNeedingCoverage: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["teamNumber", "alliance", "priority", "reason", "focus"],
            properties: {
              teamNumber: { type: "number" },
              alliance: { type: "string", enum: ["red", "blue"] },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              reason: { type: "string" },
              focus: { type: "string" },
            },
          },
        },
        scoutActions: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

export const PICK_LIST_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["yourTeamNumber", "summary", "rankings"],
  properties: {
    yourTeamNumber: {
      anyOf: [{ type: "number" }, { type: "null" }],
    },
    summary: { type: "string" },
    rankings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "rank",
          "teamNumber",
          "overallScore",
          "epa",
          "winRate",
          "synergy",
          "synergyReason",
          "strengths",
          "weaknesses",
          "role",
          "scoutingSummary",
          "pickReason",
        ],
        properties: {
          rank: { type: "number" },
          teamNumber: { type: "number" },
          overallScore: { type: "number" },
          epa: epaBreakdownSchema,
          winRate: {
            anyOf: [{ type: "number" }, { type: "null" }],
          },
          synergy: { type: "string", enum: ["high", "medium", "low"] },
          synergyReason: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          role: {
            type: "string",
            enum: ["scorer", "defender", "support", "versatile"],
          },
          scoutingSummary: { type: "string" },
          pickReason: { type: "string" },
        },
      },
    },
  },
} as const;
