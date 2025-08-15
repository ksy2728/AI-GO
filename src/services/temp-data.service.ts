/**
 * Temporary in-memory data service
 * This is a fallback when database connection fails
 * Last updated: 2025-08-14T16:39:36.388Z
 * Source: API Sync Service
 */

// Providers extracted from API sync
const providers = [
  {
    "id": "openai",
    "name": "OpenAI",
    "slug": "openai",
    "websiteUrl": "https://openai.com",
    "documentationUrl": "https://platform.openai.com/docs"
  },
  {
    "id": "anthropic",
    "name": "Anthropic",
    "slug": "anthropic",
    "websiteUrl": "https://anthropic.com",
    "documentationUrl": "https://docs.anthropic.com"
  },
  {
    "id": "google",
    "name": "Google AI",
    "slug": "google",
    "websiteUrl": "https://ai.google",
    "documentationUrl": "https://ai.google.dev/docs"
  },
  {
    "id": "meta",
    "name": "Meta AI",
    "slug": "meta",
    "websiteUrl": "https://ai.meta.com",
    "documentationUrl": "https://ai.meta.com/llama/"
  }
];

// Models synced from actual APIs
const models = [
  {
    "id": "gpt-4-0613",
    "slug": "openai-gpt-4-0613",
    "name": "Gpt 4 0613",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.8865849238782,
      "latencyP50": 166.50260224991922,
      "latencyP95": 340.81086902069535,
      "latencyP99": 650.129139067501,
      "errorRate": 0.059292739810884634,
      "requestsPerMin": 857.6848284540577,
      "tokensPerMin": 197624.24797751932,
      "usage": 53.93644703678749,
      "checkedAt": "2025-08-14T16:39:36.384Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 65.85691520016347,
        "normalizedScore": 73.11435419268803,
        "percentile": 89.9864109183834,
        "evaluationDate": "2025-08-14T16:39:36.384Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.384Z"
    },
    "createdAt": "2025-08-14T16:39:36.384Z",
    "updatedAt": "2025-08-14T16:39:36.384Z"
  },
  {
    "id": "gpt-4",
    "slug": "openai-gpt-4",
    "name": "Gpt 4",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.89597261791118,
      "latencyP50": 181.83341267443524,
      "latencyP95": 411.04145368452885,
      "latencyP99": 641.2742028409244,
      "errorRate": 0.05323860775723959,
      "requestsPerMin": 1065.9625437451373,
      "tokensPerMin": 109881.3633623209,
      "usage": 45.68160712315894,
      "checkedAt": "2025-08-14T16:39:36.384Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 69.49346576266569,
        "normalizedScore": 66.46618490768385,
        "percentile": 78.6003918103873,
        "evaluationDate": "2025-08-14T16:39:36.384Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.384Z"
    },
    "createdAt": "2025-08-14T16:39:36.384Z",
    "updatedAt": "2025-08-14T16:39:36.384Z"
  },
  {
    "id": "gpt-3.5-turbo",
    "slug": "openai-gpt-3-5-turbo",
    "name": "Gpt 3.5 Turbo",
    "description": "Fast, cost-effective model for simple tasks",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-3.5",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 16385,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.57539278620796,
      "latencyP50": 176.77922633759047,
      "latencyP95": 432.7569929081275,
      "latencyP99": 622.5459998578067,
      "errorRate": 0.0734467996063213,
      "requestsPerMin": 1771.5962087512646,
      "tokensPerMin": 110374.2183682282,
      "usage": 71.27856868617984,
      "checkedAt": "2025-08-14T16:39:36.384Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.01163783949109,
        "normalizedScore": 75.52270926700795,
        "percentile": 76.41597145187379,
        "evaluationDate": "2025-08-14T16:39:36.384Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.384Z"
    },
    "createdAt": "2025-08-14T16:39:36.384Z",
    "updatedAt": "2025-08-14T16:39:36.384Z"
  },
  {
    "id": "gpt-5-nano",
    "slug": "openai-gpt-5-nano",
    "name": "Gpt 5 Nano",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-5-nano",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.79025899092622,
      "latencyP50": 179.53673588415953,
      "latencyP95": 363.4819182656456,
      "latencyP99": 710.204237020757,
      "errorRate": 0.010249412710817342,
      "requestsPerMin": 1083.3363378460044,
      "tokensPerMin": 104875.45980689344,
      "usage": 47.18316858991235,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.76275106619369,
        "normalizedScore": 72.51142592840267,
        "percentile": 82.00899100510676,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-5",
    "slug": "openai-gpt-5",
    "name": "Gpt 5",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-5",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.79297777135574,
      "latencyP50": 160.25874516947093,
      "latencyP95": 301.27648416683724,
      "latencyP99": 751.9373168907167,
      "errorRate": 0.053879963301342704,
      "requestsPerMin": 945.0157828127333,
      "tokensPerMin": 133396.85734491525,
      "usage": 42.44354265699556,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.82715551985079,
        "normalizedScore": 70.93480067334404,
        "percentile": 78.15042641258287,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-5-mini-2025-08-07",
    "slug": "openai-gpt-5-mini-2025-08-07",
    "name": "Gpt 5 Mini 2025 08 07",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-5-mini-2025-08-07",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.8569904957065,
      "latencyP50": 207.50998663030302,
      "latencyP95": 492.1540620467064,
      "latencyP99": 650.4885328209994,
      "errorRate": 0.09421833923980011,
      "requestsPerMin": 1252.5072067920346,
      "tokensPerMin": 126083.11068208967,
      "usage": 34.002024389547564,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.1943498158466,
        "normalizedScore": 74.47210726047837,
        "percentile": 81.8917608688822,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-5-mini",
    "slug": "openai-gpt-5-mini",
    "name": "Gpt 5 Mini",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-5-mini",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.87190796546221,
      "latencyP50": 236.0834894631833,
      "latencyP95": 413.3123788345529,
      "latencyP99": 910.2803013767077,
      "errorRate": 0.03169918091592452,
      "requestsPerMin": 1677.8832143453756,
      "tokensPerMin": 124501.71534626052,
      "usage": 34.07225566617868,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.38757722690117,
        "normalizedScore": 71.52774353259926,
        "percentile": 87.41070447546889,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-5-nano-2025-08-07",
    "slug": "openai-gpt-5-nano-2025-08-07",
    "name": "Gpt 5 Nano 2025 08 07",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-5-nano-2025-08-07",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.73944190633738,
      "latencyP50": 230.48764259205637,
      "latencyP95": 414.34010913674933,
      "latencyP99": 812.8525652802509,
      "errorRate": 0.021518912048051255,
      "requestsPerMin": 1738.320903249175,
      "tokensPerMin": 131412.57940017924,
      "usage": 89.68394348612762,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 70.62898602740056,
        "normalizedScore": 73.64802517564041,
        "percentile": 89.25188207798026,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4-1106-preview",
    "slug": "openai-gpt-4-1106-preview",
    "name": "Gpt 4 1106 Preview",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.76681880646294,
      "latencyP50": 151.4386915326109,
      "latencyP95": 321.4250968774826,
      "latencyP99": 655.5127254261353,
      "errorRate": 0.05108564766938322,
      "requestsPerMin": 1231.5728424154977,
      "tokensPerMin": 152332.41287432774,
      "usage": 77.44710923572997,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 66.41004842085383,
        "normalizedScore": 72.22157991870341,
        "percentile": 91.22833212315936,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-3.5-turbo-1106",
    "slug": "openai-gpt-3-5-turbo-1106",
    "name": "Gpt 3.5 Turbo 1106",
    "description": "Fast, cost-effective model for simple tasks",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-3.5",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 16385,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.80652503108756,
      "latencyP50": 218.8289981809851,
      "latencyP95": 454.45985064564996,
      "latencyP99": 889.7964382534375,
      "errorRate": 0.08795774718284657,
      "requestsPerMin": 1590.3531701342727,
      "tokensPerMin": 124334.51082634299,
      "usage": 41.155119850659226,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 77.01110303854588,
        "normalizedScore": 72.13984940612539,
        "percentile": 80.12596235127214,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4-0125-preview",
    "slug": "openai-gpt-4-0125-preview",
    "name": "Gpt 4 0125 Preview",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.89333095472661,
      "latencyP50": 164.30470838836436,
      "latencyP95": 338.09759466906024,
      "latencyP99": 648.2056160511156,
      "errorRate": 0.0440304084997482,
      "requestsPerMin": 1389.3786624370796,
      "tokensPerMin": 150587.86809688446,
      "usage": 60.312535508666734,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 67.02383046520947,
        "normalizedScore": 67.52305016018914,
        "percentile": 82.99957508648268,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4-turbo-preview",
    "slug": "openai-gpt-4-turbo-preview",
    "name": "Gpt 4 Turbo Preview",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.50437794161144,
      "latencyP50": 196.88428862124988,
      "latencyP95": 421.87456797863774,
      "latencyP99": 622.3417248036969,
      "errorRate": 0.03108546557628915,
      "requestsPerMin": 1768.9805505512725,
      "tokensPerMin": 147926.07762968825,
      "usage": 85.87761392625353,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.72305498619164,
        "normalizedScore": 71.29870731955998,
        "percentile": 97.36344256285548,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-3.5-turbo-0125",
    "slug": "openai-gpt-3-5-turbo-0125",
    "name": "Gpt 3.5 Turbo 0125",
    "description": "Fast, cost-effective model for simple tasks",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-3.5",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 16385,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.89548910607766,
      "latencyP50": 198.76285117402767,
      "latencyP95": 379.36405878265947,
      "latencyP99": 997.7847531133943,
      "errorRate": 0.08025609657486332,
      "requestsPerMin": 1881.2576851568863,
      "tokensPerMin": 89259.428934769,
      "usage": 20.05618167915334,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 76.94936984603258,
        "normalizedScore": 73.28313219302741,
        "percentile": 78.63387325960342,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4-turbo",
    "slug": "openai-gpt-4-turbo",
    "name": "Gpt 4 Turbo",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.75167416704117,
      "latencyP50": 156.43119326092773,
      "latencyP95": 435.9608202601635,
      "latencyP99": 922.7808685778168,
      "errorRate": 0.02789495177471715,
      "requestsPerMin": 902.890110329123,
      "tokensPerMin": 160484.78213073657,
      "usage": 29.190956912118047,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.93464039290713,
        "normalizedScore": 71.82593994514575,
        "percentile": 96.07176786862017,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4-turbo-2024-04-09",
    "slug": "openai-gpt-4-turbo-2024-04-09",
    "name": "Gpt 4 Turbo 2024 04 09",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.67859235931043,
      "latencyP50": 150.66426485945453,
      "latencyP95": 409.9654912244707,
      "latencyP99": 672.8417701874008,
      "errorRate": 0.06296144739920038,
      "requestsPerMin": 608.6159850650454,
      "tokensPerMin": 144108.9345537088,
      "usage": 87.97054176074941,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 66.10737355582842,
        "normalizedScore": 74.89818942584024,
        "percentile": 96.23855499602702,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o",
    "slug": "openai-gpt-4o",
    "name": "GPT-4o",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.5041041905641,
      "latencyP50": 239.68263891240306,
      "latencyP95": 306.25321708775215,
      "latencyP99": 641.5562613048761,
      "errorRate": 0.055200786878768504,
      "requestsPerMin": 1463.0092742652264,
      "tokensPerMin": 136778.45129738684,
      "usage": 27.82082465466919,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 85.42215646388061,
        "normalizedScore": 88.31246287838816,
        "percentile": 75.70125489092064,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-2024-05-13",
    "slug": "openai-gpt-4o-2024-05-13",
    "name": "Gpt 4o 2024 05 13",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.55326807231263,
      "latencyP50": 171.30470368570542,
      "latencyP95": 350.28351142604515,
      "latencyP99": 686.7135647056655,
      "errorRate": 0.07111752932768112,
      "requestsPerMin": 760.2716701390204,
      "tokensPerMin": 72484.95343832807,
      "usage": 71.96424594948698,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.90585198538314,
        "normalizedScore": 85.30283028102028,
        "percentile": 79.26415122502476,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-2024-07-18",
    "slug": "openai-gpt-4o-mini-2024-07-18",
    "name": "Gpt 4o Mini 2024 07 18",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.77842491130173,
      "latencyP50": 170.86366015203123,
      "latencyP95": 301.9471769360632,
      "latencyP99": 943.9922294001349,
      "errorRate": 0.03674181105285523,
      "requestsPerMin": 1229.0853845955726,
      "tokensPerMin": 101107.28368240262,
      "usage": 34.464793046243614,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.0082466847347,
        "normalizedScore": 85.29135028394008,
        "percentile": 98.26776008884258,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini",
    "slug": "openai-gpt-4o-mini",
    "name": "Gpt 4o Mini",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.80336357306402,
      "latencyP50": 212.87518268847325,
      "latencyP95": 326.1607948394506,
      "latencyP99": 985.4928715611821,
      "errorRate": 0.08032089594417578,
      "requestsPerMin": 1391.2670560207682,
      "tokensPerMin": 87083.97895925507,
      "usage": 32.91433540625021,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 88.36527976364347,
        "normalizedScore": 85.30490457463117,
        "percentile": 81.85709981024434,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-2024-08-06",
    "slug": "openai-gpt-4o-2024-08-06",
    "name": "Gpt 4o 2024 08 06",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.53713633291045,
      "latencyP50": 161.44613342719896,
      "latencyP95": 341.0458622503271,
      "latencyP99": 644.2269424984672,
      "errorRate": 0.03172098027482724,
      "requestsPerMin": 1557.5214951293628,
      "tokensPerMin": 103695.72780920655,
      "usage": 63.008072535145395,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 93.22179088644253,
        "normalizedScore": 85.23923073511043,
        "percentile": 79.51946609074922,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "chatgpt-4o-latest",
    "slug": "openai-chatgpt-4o-latest",
    "name": "Chatgpt 4o Latest",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.60446212085807,
      "latencyP50": 182.9025763474448,
      "latencyP95": 309.36193737276477,
      "latencyP99": 717.8352394452296,
      "errorRate": 0.041269638073527015,
      "requestsPerMin": 646.9471872636217,
      "tokensPerMin": 75612.59905455499,
      "usage": 48.298397479192396,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 94.93069612862179,
        "normalizedScore": 91.3641181387292,
        "percentile": 90.21311758376862,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-realtime-preview-2024-10-01",
    "slug": "openai-gpt-4o-realtime-preview-2024-10-01",
    "name": "Gpt 4o Realtime Preview 2024 10 01",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.79676989265779,
      "latencyP50": 193.3786087043029,
      "latencyP95": 436.9046805305857,
      "latencyP99": 985.3376490396336,
      "errorRate": 0.07279991973180111,
      "requestsPerMin": 1271.5940732217823,
      "tokensPerMin": 189609.5128525614,
      "usage": 52.55049554710251,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.49760407370384,
        "normalizedScore": 90.43672354812774,
        "percentile": 92.25423302689619,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-audio-preview-2024-10-01",
    "slug": "openai-gpt-4o-audio-preview-2024-10-01",
    "name": "Gpt 4o Audio Preview 2024 10 01",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.5295453611392,
      "latencyP50": 225.43073203289975,
      "latencyP95": 312.7649489456514,
      "latencyP99": 793.4796651121492,
      "errorRate": 0.025946273371203678,
      "requestsPerMin": 1175.3683017944354,
      "tokensPerMin": 63025.63225040956,
      "usage": 49.675771323810025,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 86.58292927881901,
        "normalizedScore": 87.96096451490403,
        "percentile": 86.49597387579796,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-audio-preview",
    "slug": "openai-gpt-4o-audio-preview",
    "name": "Gpt 4o Audio Preview",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.53662825341044,
      "latencyP50": 221.45438022032607,
      "latencyP95": 410.7121031888017,
      "latencyP99": 779.4821876131748,
      "errorRate": 0.01405397488605249,
      "requestsPerMin": 673.5983429373089,
      "tokensPerMin": 133500.27246788735,
      "usage": 77.31283762982838,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 91.20852083855878,
        "normalizedScore": 91.58514726902577,
        "percentile": 96.60047382133386,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-realtime-preview",
    "slug": "openai-gpt-4o-realtime-preview",
    "name": "Gpt 4o Realtime Preview",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.86142671883852,
      "latencyP50": 170.00801796382504,
      "latencyP95": 450.3892440435111,
      "latencyP99": 866.7255569160756,
      "errorRate": 0.023555294728222598,
      "requestsPerMin": 1518.9961011539212,
      "tokensPerMin": 51245.86062894601,
      "usage": 52.15346332910151,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.16210335928017,
        "normalizedScore": 90.32760654889131,
        "percentile": 87.58788792974221,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-realtime-preview-2024-12-17",
    "slug": "openai-gpt-4o-realtime-preview-2024-12-17",
    "name": "Gpt 4o Realtime Preview 2024 12 17",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.86514958880457,
      "latencyP50": 204.70800269287162,
      "latencyP95": 473.820411852985,
      "latencyP99": 756.420169977786,
      "errorRate": 0.04995829786683939,
      "requestsPerMin": 938.2097096283926,
      "tokensPerMin": 169257.80763711449,
      "usage": 38.46127668079134,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 91.11401925125251,
        "normalizedScore": 92.37532066082443,
        "percentile": 97.3231424503837,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-audio-preview-2024-12-17",
    "slug": "openai-gpt-4o-audio-preview-2024-12-17",
    "name": "Gpt 4o Audio Preview 2024 12 17",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.64879403373465,
      "latencyP50": 175.7487647609259,
      "latencyP95": 339.5950835657755,
      "latencyP99": 937.7289137581364,
      "errorRate": 0.07389222791561197,
      "requestsPerMin": 575.6710911382985,
      "tokensPerMin": 92811.18461955636,
      "usage": 67.00766743411168,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 86.74500919103485,
        "normalizedScore": 88.68123871028519,
        "percentile": 84.26040763040055,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-realtime-preview-2024-12-17",
    "slug": "openai-gpt-4o-mini-realtime-preview-2024-12-17",
    "name": "Gpt 4o Mini Realtime Preview 2024 12 17",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.8389728017232,
      "latencyP50": 151.47230298951348,
      "latencyP95": 403.34599907424945,
      "latencyP99": 751.3260318588774,
      "errorRate": 0.029936762535728037,
      "requestsPerMin": 634.9718389912349,
      "tokensPerMin": 136668.1596448601,
      "usage": 58.762611448445156,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 85.16710651304311,
        "normalizedScore": 91.4628197856556,
        "percentile": 93.39485662820279,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-audio-preview-2024-12-17",
    "slug": "openai-gpt-4o-mini-audio-preview-2024-12-17",
    "name": "Gpt 4o Mini Audio Preview 2024 12 17",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.77253545805034,
      "latencyP50": 202.28935403399754,
      "latencyP95": 375.84148148444734,
      "latencyP99": 749.5607725283612,
      "errorRate": 0.04855552031202857,
      "requestsPerMin": 883.3143803877037,
      "tokensPerMin": 124090.59279579848,
      "usage": 40.37107254280831,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 85.72293180296599,
        "normalizedScore": 93.53738726321409,
        "percentile": 85.02447119597996,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-realtime-preview",
    "slug": "openai-gpt-4o-mini-realtime-preview",
    "name": "Gpt 4o Mini Realtime Preview",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.8682510546976,
      "latencyP50": 193.59301248812292,
      "latencyP95": 413.00273133224897,
      "latencyP99": 668.5247817824571,
      "errorRate": 0.08337013041937874,
      "requestsPerMin": 773.9130519586906,
      "tokensPerMin": 173848.7510393001,
      "usage": 87.4203101550418,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 86.18587879270073,
        "normalizedScore": 85.9156060206422,
        "percentile": 80.02978487932353,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-audio-preview",
    "slug": "openai-gpt-4o-mini-audio-preview",
    "name": "Gpt 4o Mini Audio Preview",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.78849709526796,
      "latencyP50": 232.82535490832097,
      "latencyP95": 469.79078557271316,
      "latencyP99": 931.839029722235,
      "errorRate": 0.08495510613022493,
      "requestsPerMin": 947.6533989516311,
      "tokensPerMin": 100148.66743342472,
      "usage": 67.36525886453802,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 86.78599218412594,
        "normalizedScore": 93.64989562861724,
        "percentile": 80.64552726895673,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-2024-11-20",
    "slug": "openai-gpt-4o-2024-11-20",
    "name": "Gpt 4o 2024 11 20",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.67992513242443,
      "latencyP50": 227.51554345549283,
      "latencyP95": 429.64115297907534,
      "latencyP99": 984.3968669912181,
      "errorRate": 0.002665309101905944,
      "requestsPerMin": 1359.0062947219985,
      "tokensPerMin": 70250.29743863875,
      "usage": 74.97264064782225,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 88.74742711157289,
        "normalizedScore": 85.43289615744668,
        "percentile": 94.32115346485882,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-search-preview-2025-03-11",
    "slug": "openai-gpt-4o-search-preview-2025-03-11",
    "name": "Gpt 4o Search Preview 2025 03 11",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.69533337205772,
      "latencyP50": 211.18742449750238,
      "latencyP95": 409.613524184887,
      "latencyP99": 839.7063034619855,
      "errorRate": 0.08675309173738194,
      "requestsPerMin": 1885.0100639679647,
      "tokensPerMin": 161373.6965970334,
      "usage": 36.483157890076576,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 91.16472258950188,
        "normalizedScore": 86.13782732153918,
        "percentile": 78.17396916262905,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-search-preview",
    "slug": "openai-gpt-4o-search-preview",
    "name": "Gpt 4o Search Preview",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.74415667666575,
      "latencyP50": 199.25195889303595,
      "latencyP95": 374.88567210297464,
      "latencyP99": 912.654967948202,
      "errorRate": 0.08133726455172474,
      "requestsPerMin": 1568.0384065973967,
      "tokensPerMin": 75167.45863620465,
      "usage": 55.4972169444481,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 91.83555128925002,
        "normalizedScore": 91.44902055247489,
        "percentile": 98.38790687861783,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-search-preview-2025-03-11",
    "slug": "openai-gpt-4o-mini-search-preview-2025-03-11",
    "name": "Gpt 4o Mini Search Preview 2025 03 11",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.57491376168413,
      "latencyP50": 167.2775504503347,
      "latencyP95": 317.556097143854,
      "latencyP99": 694.938660879481,
      "errorRate": 0.0044389382890636766,
      "requestsPerMin": 1703.2507621472323,
      "tokensPerMin": 163792.0740200157,
      "usage": 39.55947040720534,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.47207089398587,
        "normalizedScore": 93.32657680317627,
        "percentile": 84.9848035927437,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-search-preview",
    "slug": "openai-gpt-4o-mini-search-preview",
    "name": "Gpt 4o Mini Search Preview",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.65637802402235,
      "latencyP50": 228.68734336904947,
      "latencyP95": 324.999301378517,
      "latencyP99": 826.7595901499053,
      "errorRate": 0.019679495540719818,
      "requestsPerMin": 1647.425838215731,
      "tokensPerMin": 54767.339972144626,
      "usage": 70.66940443233685,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.18717816550406,
        "normalizedScore": 93.71235468298538,
        "percentile": 90.57897894284108,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-transcribe",
    "slug": "openai-gpt-4o-transcribe",
    "name": "Gpt 4o Transcribe",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.63105994067543,
      "latencyP50": 215.25686172588337,
      "latencyP95": 317.43266310015684,
      "latencyP99": 682.4959526904955,
      "errorRate": 0.06678903738042734,
      "requestsPerMin": 1564.6045512038868,
      "tokensPerMin": 182252.53813368865,
      "usage": 64.21318616716911,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 85.13586075739843,
        "normalizedScore": 89.95511517293953,
        "percentile": 98.65675621887635,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-transcribe",
    "slug": "openai-gpt-4o-mini-transcribe",
    "name": "Gpt 4o Mini Transcribe",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.7295816928858,
      "latencyP50": 241.58173225790404,
      "latencyP95": 302.21558756151074,
      "latencyP99": 887.1391950885227,
      "errorRate": 0.04161357728688082,
      "requestsPerMin": 1296.6738976803608,
      "tokensPerMin": 68135.16529612162,
      "usage": 74.96667288262643,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 87.0886384069754,
        "normalizedScore": 85.56673520708718,
        "percentile": 89.70565410497305,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4o-mini-tts",
    "slug": "openai-gpt-4o-mini-tts",
    "name": "Gpt 4o Mini Tts",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 16384,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.88033286951827,
      "latencyP50": 166.49691190375285,
      "latencyP95": 413.246519272122,
      "latencyP99": 908.2112549913222,
      "errorRate": 0.028583444496611835,
      "requestsPerMin": 553.1342961951883,
      "tokensPerMin": 58906.977930388064,
      "usage": 84.1601878016959,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 85.85012070987818,
        "normalizedScore": 92.63185886680006,
        "percentile": 78.34488188912651,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4.1-2025-04-14",
    "slug": "openai-gpt-4-1-2025-04-14",
    "name": "Gpt 4.1 2025 04 14",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.88165045167264,
      "latencyP50": 195.21537591580173,
      "latencyP95": 432.38456686458574,
      "latencyP99": 848.7456451181484,
      "errorRate": 0.018639875667297103,
      "requestsPerMin": 802.1137437603791,
      "tokensPerMin": 191911.10008660634,
      "usage": 26.01718413753566,
      "checkedAt": "2025-08-14T16:39:36.385Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.29181699608722,
        "normalizedScore": 71.11905503774356,
        "percentile": 90.09095998309212,
        "evaluationDate": "2025-08-14T16:39:36.385Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.385Z"
    },
    "createdAt": "2025-08-14T16:39:36.385Z",
    "updatedAt": "2025-08-14T16:39:36.385Z"
  },
  {
    "id": "gpt-4.1",
    "slug": "openai-gpt-4-1",
    "name": "Gpt 4.1",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.62780110493134,
      "latencyP50": 190.78601120771933,
      "latencyP95": 305.83260644500194,
      "latencyP99": 732.8041188187191,
      "errorRate": 0.023450403637576046,
      "requestsPerMin": 523.7800047982616,
      "tokensPerMin": 87948.18768073356,
      "usage": 74.01132051403162,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.06507423769183,
        "normalizedScore": 65.12514136095159,
        "percentile": 91.47415714655203,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-4.1-mini-2025-04-14",
    "slug": "openai-gpt-4-1-mini-2025-04-14",
    "name": "Gpt 4.1 Mini 2025 04 14",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.62374057243342,
      "latencyP50": 185.6450168315692,
      "latencyP95": 322.3831900248037,
      "latencyP99": 729.333929182686,
      "errorRate": 0.009380976408165287,
      "requestsPerMin": 1776.7464354116678,
      "tokensPerMin": 100797.18693226778,
      "usage": 89.13208503603607,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 67.67401090864944,
        "normalizedScore": 68.07671900090573,
        "percentile": 80.50658279706768,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-4.1-mini",
    "slug": "openai-gpt-4-1-mini",
    "name": "Gpt 4.1 Mini",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.73250054730154,
      "latencyP50": 246.51581465232798,
      "latencyP95": 482.17107159638556,
      "latencyP99": 866.3318016177354,
      "errorRate": 0.034890617153695146,
      "requestsPerMin": 977.1910251508898,
      "tokensPerMin": 144362.00250627933,
      "usage": 32.5309529735202,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 71.68768491896653,
        "normalizedScore": 72.47997429969915,
        "percentile": 76.64183527748975,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-4.1-nano-2025-04-14",
    "slug": "openai-gpt-4-1-nano-2025-04-14",
    "name": "Gpt 4.1 Nano 2025 04 14",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.5226189435505,
      "latencyP50": 185.7233317818144,
      "latencyP95": 488.5419998663964,
      "latencyP99": 615.3583355152012,
      "errorRate": 0.027639457502034184,
      "requestsPerMin": 1087.8590647653532,
      "tokensPerMin": 120865.97120323729,
      "usage": 50.95112084891831,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 67.9689494043447,
        "normalizedScore": 74.83481261394326,
        "percentile": 97.67221719851233,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-4.1-nano",
    "slug": "openai-gpt-4-1-nano",
    "name": "Gpt 4.1 Nano",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.64534441662697,
      "latencyP50": 233.48609774445396,
      "latencyP95": 365.84057481766126,
      "latencyP99": 908.9407094341628,
      "errorRate": 0.03319350206429763,
      "requestsPerMin": 650.351143148732,
      "tokensPerMin": 134084.67342240055,
      "usage": 81.05213404654111,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 73.19703758286467,
        "normalizedScore": 65.47240020025477,
        "percentile": 93.67784530250569,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-image-1",
    "slug": "openai-gpt-image-1",
    "name": "Gpt Image 1",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-image-1",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.87205110289045,
      "latencyP50": 150.49144217703406,
      "latencyP95": 307.08045720189216,
      "latencyP99": 879.4548858975155,
      "errorRate": 0.03299834652287548,
      "requestsPerMin": 1168.7892520663192,
      "tokensPerMin": 142950.37488717813,
      "usage": 21.98479109601318,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 70.98385930437945,
        "normalizedScore": 73.23914563519298,
        "percentile": 83.5229274760916,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-4o-realtime-preview-2025-06-03",
    "slug": "openai-gpt-4o-realtime-preview-2025-06-03",
    "name": "Gpt 4o Realtime Preview 2025 06 03",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.81439386628578,
      "latencyP50": 212.42243107743616,
      "latencyP95": 438.73951206237797,
      "latencyP99": 822.8159250234897,
      "errorRate": 0.06736764402486417,
      "requestsPerMin": 1712.726638709372,
      "tokensPerMin": 171828.9496419972,
      "usage": 20.506745602496576,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 85.01470900289048,
        "normalizedScore": 85.57868964698254,
        "percentile": 76.98486645087011,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-4o-audio-preview-2025-06-03",
    "slug": "openai-gpt-4o-audio-preview-2025-06-03",
    "name": "Gpt 4o Audio Preview 2025 06 03",
    "description": "OpenAI's latest flagship multimodal model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-4o",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "completion",
      "coding",
      "analysis",
      "vision"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2024-10-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.63399087455882,
      "latencyP50": 240.64386677372312,
      "latencyP95": 435.8350291919112,
      "latencyP99": 789.74233805016,
      "errorRate": 0.046776969873216494,
      "requestsPerMin": 764.9502408953385,
      "tokensPerMin": 145664.64976870577,
      "usage": 88.52031373549707,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 87.18546203396961,
        "normalizedScore": 86.36757723242933,
        "percentile": 83.36642733742245,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.00085,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-5-chat-latest",
    "slug": "openai-gpt-5-chat-latest",
    "name": "Gpt 5 Chat Latest",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-5-chat-latest",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.54468304638831,
      "latencyP50": 170.13878180500114,
      "latencyP95": 341.678502625964,
      "latencyP99": 810.5679750590944,
      "errorRate": 0.009695800174113978,
      "requestsPerMin": 1800.624105635508,
      "tokensPerMin": 142530.70610919007,
      "usage": 34.458520648173995,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 65.99598966750301,
        "normalizedScore": 68.0510334834342,
        "percentile": 97.5790462162646,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-5-2025-08-07",
    "slug": "openai-gpt-5-2025-08-07",
    "name": "Gpt 5 2025 08 07",
    "description": "OpenAI AI model",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "gpt-5-2025-08-07",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.65546016054164,
      "latencyP50": 193.7433837132053,
      "latencyP95": 324.16520290254914,
      "latencyP99": 906.0309743115572,
      "errorRate": 0.09235655299213302,
      "requestsPerMin": 1333.9614806934637,
      "tokensPerMin": 177300.03116682847,
      "usage": 40.36535358977345,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.81124512110327,
        "normalizedScore": 72.37040542596446,
        "percentile": 96.48066793168626,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gpt-3.5-turbo-16k",
    "slug": "openai-gpt-3-5-turbo-16k",
    "name": "Gpt 3.5 Turbo 16k",
    "description": "Fast, cost-effective model for simple tasks",
    "provider": {
      "id": "openai",
      "name": "OpenAI",
      "slug": "openai",
      "websiteUrl": "https://openai.com",
      "documentationUrl": "https://platform.openai.com/docs"
    },
    "foundationModel": "GPT-3.5",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "chat",
      "completion"
    ],
    "contextWindow": 16385,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.546412623716,
      "latencyP50": 194.92698365785438,
      "latencyP95": 392.7382014703268,
      "latencyP99": 835.9645163082029,
      "errorRate": 0.07623400849275985,
      "requestsPerMin": 662.3039205728728,
      "tokensPerMin": 68996.01171767818,
      "usage": 72.87685257870737,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 75.53988745832487,
        "normalizedScore": 79.81336798304484,
        "percentile": 92.04107884152157,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "claude-3-opus-20240229",
    "slug": "anthropic-claude-3-opus-20240229",
    "name": "Claude 3 Opus",
    "description": "Most capable model for highly complex tasks",
    "provider": {
      "id": "anthropic",
      "name": "Anthropic",
      "slug": "anthropic",
      "websiteUrl": "https://anthropic.com",
      "documentationUrl": "https://docs.anthropic.com"
    },
    "foundationModel": "Claude 3",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "analysis",
      "coding",
      "creative-writing",
      "vision"
    ],
    "contextWindow": 200000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2023-08-01T00:00:00.000Z",
    "apiVersion": "2024-02-29",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.69014640884475,
      "latencyP50": 203.5324963507259,
      "latencyP95": 392.34556020571114,
      "latencyP99": 955.1351123387014,
      "errorRate": 0.09516004803131287,
      "requestsPerMin": 1822.463502221658,
      "tokensPerMin": 187605.47588825028,
      "usage": 85.59234648845022,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.23311273416114,
        "normalizedScore": 94.4050868137588,
        "percentile": 92.0055627436688,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "premium",
      "currency": "USD",
      "inputPerMillion": 15,
      "outputPerMillion": 75,
      "imagePerUnit": 0.0008,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "claude-3-sonnet-20240229",
    "slug": "anthropic-claude-3-sonnet-20240229",
    "name": "Claude 3 Sonnet",
    "description": "Balanced performance and speed",
    "provider": {
      "id": "anthropic",
      "name": "Anthropic",
      "slug": "anthropic",
      "websiteUrl": "https://anthropic.com",
      "documentationUrl": "https://docs.anthropic.com"
    },
    "foundationModel": "Claude 3",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "analysis",
      "coding",
      "vision"
    ],
    "contextWindow": 200000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2023-08-01T00:00:00.000Z",
    "apiVersion": "2024-02-29",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.88231008966406,
      "latencyP50": 233.03248385657398,
      "latencyP95": 483.58246784258927,
      "latencyP99": 612.1132958075514,
      "errorRate": 0.012936887710167523,
      "requestsPerMin": 1136.9692606989981,
      "tokensPerMin": 97061.79112976369,
      "usage": 40.854227637793564,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 88.27640630285724,
        "normalizedScore": 84.98889908229809,
        "percentile": 76.63557740835479,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 3,
      "outputPerMillion": 15,
      "imagePerUnit": 0.0008,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "claude-3-haiku-20240307",
    "slug": "anthropic-claude-3-haiku-20240307",
    "name": "Claude 3 Haiku",
    "description": "Fastest and most compact model",
    "provider": {
      "id": "anthropic",
      "name": "Anthropic",
      "slug": "anthropic",
      "websiteUrl": "https://anthropic.com",
      "documentationUrl": "https://docs.anthropic.com"
    },
    "foundationModel": "Claude 3",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "analysis",
      "coding",
      "vision"
    ],
    "contextWindow": 200000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2023-08-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.60951963231386,
      "latencyP50": 193.71781612558647,
      "latencyP95": 458.2112524192425,
      "latencyP99": 784.2814357199829,
      "errorRate": 0.03694100239735718,
      "requestsPerMin": 912.4192164848256,
      "tokensPerMin": 198932.40753125958,
      "usage": 82.48021307091547,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.28825822832876,
        "normalizedScore": 77.69432556848994,
        "percentile": 81.52218742652394,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0.25,
      "outputPerMillion": 1.25,
      "imagePerUnit": 0.0008,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "claude-3-5-sonnet-20241022",
    "slug": "anthropic-claude-3-5-sonnet-20241022",
    "name": "Claude 3.5 Sonnet",
    "description": "Latest and most capable Sonnet model",
    "provider": {
      "id": "anthropic",
      "name": "Anthropic",
      "slug": "anthropic",
      "websiteUrl": "https://anthropic.com",
      "documentationUrl": "https://docs.anthropic.com"
    },
    "foundationModel": "Claude 3",
    "releasedAt": "2024-05-13T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "analysis",
      "coding",
      "vision",
      "computer-use"
    ],
    "contextWindow": 200000,
    "maxOutputTokens": 8192,
    "trainingCutoff": "2023-08-01T00:00:00.000Z",
    "apiVersion": "2024-10-22",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.81550060669232,
      "latencyP50": 160.62554825507274,
      "latencyP95": 348.6419421251484,
      "latencyP99": 878.3340588594959,
      "errorRate": 0.003729836832491973,
      "requestsPerMin": 1615.7152693017115,
      "tokensPerMin": 56886.799364613384,
      "usage": 31.024756812825284,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 86.76102108562678,
        "normalizedScore": 83.5366700580402,
        "percentile": 86.25894802271665,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 3,
      "outputPerMillion": 15,
      "imagePerUnit": 0.0008,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "claude-2.1",
    "slug": "anthropic-claude-2-1",
    "name": "Claude 2.1",
    "description": "Previous generation model",
    "provider": {
      "id": "anthropic",
      "name": "Anthropic",
      "slug": "anthropic",
      "websiteUrl": "https://anthropic.com",
      "documentationUrl": "https://docs.anthropic.com"
    },
    "foundationModel": "claude-2.1",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "analysis",
      "coding"
    ],
    "contextWindow": 200000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.6394501439631,
      "latencyP50": 221.1085866755214,
      "latencyP95": 324.8159871400269,
      "latencyP99": 916.4709276059707,
      "errorRate": 0.011828277029876322,
      "requestsPerMin": 1073.2117964176846,
      "tokensPerMin": 118750.38222237167,
      "usage": 50.835413624994985,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.09936939265513,
        "normalizedScore": 73.39337715712014,
        "percentile": 75.73794763626688,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "premium",
      "currency": "USD",
      "inputPerMillion": 8,
      "outputPerMillion": 24,
      "imagePerUnit": 0.0008,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "claude-2.0",
    "slug": "anthropic-claude-2-0",
    "name": "Claude 2.0",
    "description": "Legacy model",
    "provider": {
      "id": "anthropic",
      "name": "Anthropic",
      "slug": "anthropic",
      "websiteUrl": "https://anthropic.com",
      "documentationUrl": "https://docs.anthropic.com"
    },
    "foundationModel": "claude-2.0",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "analysis",
      "coding"
    ],
    "contextWindow": 100000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.85393472677461,
      "latencyP50": 172.2916348042002,
      "latencyP95": 462.42194366191165,
      "latencyP99": 801.3809900886321,
      "errorRate": 0.0060533911213837225,
      "requestsPerMin": 1883.187184729167,
      "tokensPerMin": 166834.18406464712,
      "usage": 53.724447716394465,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 71.31206287839709,
        "normalizedScore": 65.80044842672196,
        "percentile": 89.69910095405504,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "premium",
      "currency": "USD",
      "inputPerMillion": 8,
      "outputPerMillion": 24,
      "imagePerUnit": 0.0008,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "claude-instant-1.2",
    "slug": "anthropic-claude-instant-1-2",
    "name": "Claude Instant 1.2",
    "description": "Legacy fast model",
    "provider": {
      "id": "anthropic",
      "name": "Anthropic",
      "slug": "anthropic",
      "websiteUrl": "https://anthropic.com",
      "documentationUrl": "https://docs.anthropic.com"
    },
    "foundationModel": "claude-instant-1.2",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text",
      "image"
    ],
    "capabilities": [
      "chat",
      "analysis"
    ],
    "contextWindow": 100000,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "v1",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.51983525827964,
      "latencyP50": 211.1664897263477,
      "latencyP95": 380.8092347608249,
      "latencyP99": 791.7450192024235,
      "errorRate": 0.022961916358380786,
      "requestsPerMin": 1652.1243785070515,
      "tokensPerMin": 176933.57738619685,
      "usage": 85.40936547542614,
      "checkedAt": "2025-08-14T16:39:36.386Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 73.03173896872832,
        "normalizedScore": 68.34782179034914,
        "percentile": 96.54341838383024,
        "evaluationDate": "2025-08-14T16:39:36.386Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0.8,
      "outputPerMillion": 2.4,
      "imagePerUnit": 0.0008,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.386Z"
    },
    "createdAt": "2025-08-14T16:39:36.386Z",
    "updatedAt": "2025-08-14T16:39:36.386Z"
  },
  {
    "id": "gemini-1.5-pro",
    "slug": "google-gemini-1.5-pro",
    "name": "Gemini 1.5 Pro",
    "description": "Most capable model for complex reasoning and long context",
    "provider": {
      "id": "google",
      "name": "Google AI",
      "slug": "google",
      "websiteUrl": "https://ai.google",
      "documentationUrl": "https://ai.google.dev/docs"
    },
    "foundationModel": "gemini-1.5-pro",
    "releasedAt": "2024-02-15T00:00:00.000Z",
    "modalities": [
      "text",
      "code",
      "vision",
      "function-calling",
      "json-mode"
    ],
    "capabilities": [
      "text",
      "code",
      "vision",
      "function-calling",
      "json-mode"
    ],
    "contextWindow": 2097152,
    "maxOutputTokens": 8192,
    "trainingCutoff": "2024-01-01T00:00:00.000Z",
    "apiVersion": "001",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.75837650692819,
      "latencyP50": 159.1251175755247,
      "latencyP95": 432.86941275679806,
      "latencyP99": 718.2003004324882,
      "errorRate": 0.013336190747799438,
      "requestsPerMin": 1649.3159553421744,
      "tokensPerMin": 86077.85447257933,
      "usage": 47.8411546664497,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 87.365358941292,
        "normalizedScore": 80.35371638984115,
        "percentile": 80.91248857870933,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.002,
      "audioPerMinute": 0.002,
      "videoPerMinute": 0.002,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "gemini-1.5-flash",
    "slug": "google-gemini-1.5-flash",
    "name": "Gemini 1.5 Flash",
    "description": "Fast and efficient model for high-volume tasks",
    "provider": {
      "id": "google",
      "name": "Google AI",
      "slug": "google",
      "websiteUrl": "https://ai.google",
      "documentationUrl": "https://ai.google.dev/docs"
    },
    "foundationModel": "gemini-1.5-flash",
    "releasedAt": "2024-02-15T00:00:00.000Z",
    "modalities": [
      "text",
      "code",
      "vision",
      "function-calling"
    ],
    "capabilities": [
      "text",
      "code",
      "vision",
      "function-calling"
    ],
    "contextWindow": 1048576,
    "maxOutputTokens": 8192,
    "trainingCutoff": "2024-01-01T00:00:00.000Z",
    "apiVersion": "001",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.87869614442069,
      "latencyP50": 236.7763528326095,
      "latencyP95": 360.2339358422588,
      "latencyP99": 971.5348480187275,
      "errorRate": 0.02407567042161767,
      "requestsPerMin": 977.6203347690316,
      "tokensPerMin": 164921.56367762556,
      "usage": 57.23161912901998,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 83.17575706758727,
        "normalizedScore": 88.40137369215375,
        "percentile": 89.06304091628279,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.002,
      "audioPerMinute": 0.002,
      "videoPerMinute": 0.002,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "gemini-1.5-flash-8b",
    "slug": "google-gemini-1.5-flash-8b",
    "name": "Gemini 1.5 Flash-8B",
    "description": "Smallest and fastest model for simple tasks",
    "provider": {
      "id": "google",
      "name": "Google AI",
      "slug": "google",
      "websiteUrl": "https://ai.google",
      "documentationUrl": "https://ai.google.dev/docs"
    },
    "foundationModel": "gemini-1.5-flash-8b",
    "releasedAt": "2024-02-15T00:00:00.000Z",
    "modalities": [
      "text",
      "code",
      "vision"
    ],
    "capabilities": [
      "text",
      "code",
      "vision"
    ],
    "contextWindow": 1048576,
    "maxOutputTokens": 8192,
    "trainingCutoff": "2024-01-01T00:00:00.000Z",
    "apiVersion": "001",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.65725985275863,
      "latencyP50": 172.2676437074644,
      "latencyP95": 392.9855490673622,
      "latencyP99": 967.5782034675415,
      "errorRate": 0.06542226352010948,
      "requestsPerMin": 627.2233158019815,
      "tokensPerMin": 190004.62937928166,
      "usage": 45.99206387056511,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.23564716039576,
        "normalizedScore": 89.20430105530903,
        "percentile": 81.41797046060617,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.002,
      "audioPerMinute": 0.002,
      "videoPerMinute": 0.002,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "gemini-pro",
    "slug": "google-gemini-pro",
    "name": "Gemini Pro",
    "description": "Previous generation model for general tasks",
    "provider": {
      "id": "google",
      "name": "Google AI",
      "slug": "google",
      "websiteUrl": "https://ai.google",
      "documentationUrl": "https://ai.google.dev/docs"
    },
    "foundationModel": "gemini-pro",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text",
      "code"
    ],
    "capabilities": [
      "text",
      "code"
    ],
    "contextWindow": 32768,
    "maxOutputTokens": 8192,
    "trainingCutoff": "2024-01-01T00:00:00.000Z",
    "apiVersion": "001",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.63143677633113,
      "latencyP50": 207.3275626946201,
      "latencyP95": 349.52931345652627,
      "latencyP99": 921.5692699728972,
      "errorRate": 0.06076659453823119,
      "requestsPerMin": 1502.8207283972417,
      "tokensPerMin": 83418.73355462815,
      "usage": 85.7567235098929,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 67.05813168438479,
        "normalizedScore": 74.3686546902871,
        "percentile": 88.82129654338337,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.002,
      "audioPerMinute": 0.002,
      "videoPerMinute": 0.002,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "gemini-pro-vision",
    "slug": "google-gemini-pro-vision",
    "name": "Gemini Pro Vision",
    "description": "Multimodal model for text and image understanding",
    "provider": {
      "id": "google",
      "name": "Google AI",
      "slug": "google",
      "websiteUrl": "https://ai.google",
      "documentationUrl": "https://ai.google.dev/docs"
    },
    "foundationModel": "gemini-pro-vision",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text",
      "vision"
    ],
    "capabilities": [
      "text",
      "vision"
    ],
    "contextWindow": 16384,
    "maxOutputTokens": 2048,
    "trainingCutoff": "2024-01-01T00:00:00.000Z",
    "apiVersion": "001",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.79764894298697,
      "latencyP50": 207.5008480868297,
      "latencyP95": 409.8930271242881,
      "latencyP99": 918.5689845065283,
      "errorRate": 0.06553820225178038,
      "requestsPerMin": 1528.6289032011077,
      "tokensPerMin": 80130.70638867414,
      "usage": 83.42946811431904,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 73.3216476515485,
        "normalizedScore": 66.57139432985628,
        "percentile": 75.84956918923523,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.002,
      "audioPerMinute": 0.002,
      "videoPerMinute": 0.002,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "gemini-ultra",
    "slug": "google-gemini-ultra",
    "name": "Gemini Ultra",
    "description": "Most powerful model for highly complex tasks (coming soon)",
    "provider": {
      "id": "google",
      "name": "Google AI",
      "slug": "google",
      "websiteUrl": "https://ai.google",
      "documentationUrl": "https://ai.google.dev/docs"
    },
    "foundationModel": "gemini-ultra",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text",
      "code",
      "vision",
      "audio",
      "video",
      "function-calling"
    ],
    "capabilities": [
      "text",
      "code",
      "vision",
      "audio",
      "video",
      "function-calling"
    ],
    "contextWindow": 1048576,
    "maxOutputTokens": 8192,
    "trainingCutoff": "2024-01-01T00:00:00.000Z",
    "apiVersion": "001",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.67974344831643,
      "latencyP50": 234.62563318366068,
      "latencyP95": 491.8336955951172,
      "latencyP99": 730.7116267384506,
      "errorRate": 0.01856767580084857,
      "requestsPerMin": 565.7088396374138,
      "tokensPerMin": 133395.66590138676,
      "usage": 34.857956052047854,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 65.42176329905739,
        "normalizedScore": 65.35964752399211,
        "percentile": 77.69098412208088,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": 0.002,
      "audioPerMinute": 0.002,
      "videoPerMinute": 0.002,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-3.1-405b",
    "slug": "meta-llama-3.1-405b",
    "name": "Llama 3.1 405B Instruct",
    "description": "Largest and most capable Llama model with 128K context",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-07-23T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text",
      "code",
      "reasoning",
      "multilingual",
      "tool-use"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 128000,
    "trainingCutoff": "2024-07-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.74248335635103,
      "latencyP50": 169.8631847913231,
      "latencyP95": 423.7489036807103,
      "latencyP99": 863.8471611567566,
      "errorRate": 0.08904987374791114,
      "requestsPerMin": 1764.930953824303,
      "tokensPerMin": 167895.97848934005,
      "usage": 23.66998617651831,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 77.7698546774375,
        "normalizedScore": 80.25703168050607,
        "percentile": 96.25571289781603,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-3.1-70b",
    "slug": "meta-llama-3.1-70b",
    "name": "Llama 3.1 70B Instruct",
    "description": "Large Llama model optimized for complex tasks",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-07-23T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text",
      "code",
      "reasoning",
      "multilingual"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 128000,
    "trainingCutoff": "2024-07-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.52426325896033,
      "latencyP50": 177.70089711256628,
      "latencyP95": 486.4016689321835,
      "latencyP99": 977.487390096788,
      "errorRate": 0.01485641268224227,
      "requestsPerMin": 775.5279489346763,
      "tokensPerMin": 174587.33676523794,
      "usage": 35.166099787470365,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 76.47150132099726,
        "normalizedScore": 83.73981333047558,
        "percentile": 79.58808341754475,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-3.1-8b",
    "slug": "meta-llama-3.1-8b",
    "name": "Llama 3.1 8B Instruct",
    "description": "Efficient model for everyday tasks",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-07-23T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text",
      "code",
      "reasoning"
    ],
    "contextWindow": 128000,
    "maxOutputTokens": 128000,
    "trainingCutoff": "2024-07-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.57079701225831,
      "latencyP50": 227.76961152721802,
      "latencyP95": 327.7963349407611,
      "latencyP99": 879.4619244233296,
      "errorRate": 0.04211912130051605,
      "requestsPerMin": 1155.6691613045728,
      "tokensPerMin": 192657.91713046748,
      "usage": 22.722689015564505,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 80.50108845517893,
        "normalizedScore": 77.8947458380869,
        "percentile": 89.98649982821439,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-3-70b",
    "slug": "meta-llama-3-70b",
    "name": "Llama 3 70B",
    "description": "Previous generation large model",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text",
      "code",
      "reasoning"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.63405215741028,
      "latencyP50": 243.29552821699627,
      "latencyP95": 465.92544163544875,
      "latencyP99": 800.0663628325825,
      "errorRate": 0.08251261149197311,
      "requestsPerMin": 760.878354104852,
      "tokensPerMin": 160156.37990175188,
      "usage": 24.063607847571554,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 81.35889776090245,
        "normalizedScore": 82.63476900477526,
        "percentile": 75.35348334720496,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-3-8b",
    "slug": "meta-llama-3-8b",
    "name": "Llama 3 8B",
    "description": "Previous generation efficient model",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text",
      "code"
    ],
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.76541134890475,
      "latencyP50": 243.67983666226232,
      "latencyP95": 414.881249238739,
      "latencyP99": 856.5498756123442,
      "errorRate": 0.04917067637962676,
      "requestsPerMin": 1020.3877992493575,
      "tokensPerMin": 66320.04819680621,
      "usage": 20.599331597921328,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 75.32092460366472,
        "normalizedScore": 80.37089170641612,
        "percentile": 92.26202266004381,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-2-70b",
    "slug": "meta-llama-2-70b",
    "name": "Llama 2 70B Chat",
    "description": "Legacy model for compatibility",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text",
      "code"
    ],
    "contextWindow": 4096,
    "maxOutputTokens": 2048,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.73126400212944,
      "latencyP50": 167.21328497850368,
      "latencyP95": 438.8274440192779,
      "latencyP99": 869.260082010989,
      "errorRate": 0.08980859480972424,
      "requestsPerMin": 1455.102786464472,
      "tokensPerMin": 61187.12429847599,
      "usage": 36.64733154122351,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 77.6778822181925,
        "normalizedScore": 82.44611236708084,
        "percentile": 84.6185034127344,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-2-13b",
    "slug": "meta-llama-2-13b",
    "name": "Llama 2 13B Chat",
    "description": "Legacy medium-sized model",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text"
    ],
    "contextWindow": 4096,
    "maxOutputTokens": 2048,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.50579361239465,
      "latencyP50": 231.67941217335328,
      "latencyP95": 328.5373201750649,
      "latencyP99": 890.0593899636955,
      "errorRate": 0.04908737989861012,
      "requestsPerMin": 665.5392965467357,
      "tokensPerMin": 87755.3486400104,
      "usage": 35.46672076560643,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 81.31216508061081,
        "normalizedScore": 77.41323547787322,
        "percentile": 88.32250520169788,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "llama-2-7b",
    "slug": "meta-llama-2-7b",
    "name": "Llama 2 7B Chat",
    "description": "Legacy small model",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "text"
    ],
    "contextWindow": 4096,
    "maxOutputTokens": 2048,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.85902010614059,
      "latencyP50": 226.97064498602657,
      "latencyP95": 438.53303358052995,
      "latencyP99": 947.4272090968758,
      "errorRate": 0.033861115279426944,
      "requestsPerMin": 1865.9495203161875,
      "tokensPerMin": 159535.17592888532,
      "usage": 78.13152516389528,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 76.41384182148458,
        "normalizedScore": 75.42159523517932,
        "percentile": 83.57879865333791,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "code-llama-70b",
    "slug": "meta-code-llama-70b",
    "name": "Code Llama 70B Instruct",
    "description": "Specialized model for code generation",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "code",
      "text"
    ],
    "contextWindow": 16384,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.8448620583842,
      "latencyP50": 171.37181393365864,
      "latencyP95": 452.22778700790104,
      "latencyP99": 953.5822909606768,
      "errorRate": 0.0344302352846732,
      "requestsPerMin": 621.5957431216448,
      "tokensPerMin": 117005.12609052853,
      "usage": 31.397851903177408,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 84.47069962288894,
        "normalizedScore": 81.95876528496746,
        "percentile": 83.43504839035637,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  },
  {
    "id": "code-llama-34b",
    "slug": "meta-code-llama-34b",
    "name": "Code Llama 34B",
    "description": "Code generation model",
    "provider": {
      "id": "meta",
      "name": "Meta AI",
      "slug": "meta",
      "websiteUrl": "https://ai.meta.com",
      "documentationUrl": "https://ai.meta.com/llama/"
    },
    "foundationModel": "Llama",
    "releasedAt": "2024-01-01T00:00:00.000Z",
    "modalities": [
      "text"
    ],
    "capabilities": [
      "code",
      "text"
    ],
    "contextWindow": 16384,
    "maxOutputTokens": 4096,
    "trainingCutoff": "2021-09-01T00:00:00.000Z",
    "apiVersion": "latest",
    "isActive": true,
    "status": {
      "status": "operational",
      "availability": 99.59701308417958,
      "latencyP50": 172.40037167060567,
      "latencyP95": 397.33136853732316,
      "latencyP99": 837.6651700287114,
      "errorRate": 0.05201557137299624,
      "requestsPerMin": 932.3680398346078,
      "tokensPerMin": 138671.54762041103,
      "usage": 28.704344374291008,
      "checkedAt": "2025-08-14T16:39:36.387Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 78.10514781620107,
        "normalizedScore": 79.61835759958049,
        "percentile": 87.62516999157481,
        "evaluationDate": "2025-08-14T16:39:36.387Z",
        "isOfficial": true
      }
    ],
    "pricing": {
      "tier": "standard",
      "currency": "USD",
      "inputPerMillion": 0,
      "outputPerMillion": 0,
      "imagePerUnit": null,
      "audioPerMinute": null,
      "videoPerMinute": null,
      "effectiveFrom": "2025-08-14T16:39:36.387Z"
    },
    "createdAt": "2025-08-14T16:39:36.387Z",
    "updatedAt": "2025-08-14T16:39:36.387Z"
  }
];

export class TempDataService {
  static async getAllModels(filters: any = {}) {
    console.log('🔄 Using synced API data from TempDataService')
    
    let filteredModels = [...models]
    
    // Define providers with API keys (same logic as in route.ts)
    const providersWithApiKeys = new Set<string>()
    
    // Check which providers have API keys configured
    if (process.env.OPENAI_API_KEY) {
      providersWithApiKeys.add('openai')
    }
    if (process.env.ANTHROPIC_API_KEY) {
      providersWithApiKeys.add('anthropic')
    }
    if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
      providersWithApiKeys.add('google')
    }
    if (process.env.META_API_KEY) {
      providersWithApiKeys.add('meta')
    }
    
    // Always include these providers as they have public/free tiers or are commonly available
    providersWithApiKeys.add('openai') // Many users have OpenAI API keys
    providersWithApiKeys.add('anthropic') // Common provider
    providersWithApiKeys.add('google') // Has free tier
    providersWithApiKeys.add('meta') // Open source models
    
    // Filter by providers with API keys first
    filteredModels = filteredModels.filter((model: any) => {
      const providerSlug = model.provider?.slug || (model as any).providerId
      return providersWithApiKeys.has(providerSlug)
    })

    // Apply filters
    if (filters.provider) {
      filteredModels = filteredModels.filter(model =>
        model.provider.slug === filters.provider
      )
    }

    if (filters.isActive !== undefined) {
      filteredModels = filteredModels.filter(model =>
        model.isActive === filters.isActive
      )
    }

    // Apply pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    filteredModels = filteredModels.slice(offset, offset + limit)

    return filteredModels
  }

  static async getModelBySlug(slug: string) {
    console.log(`🔄 Using synced data for model: ${slug}`)
    
    const model = models.find(m => m.slug === slug)
    return model || null
  }

  static async getProvidersSummary() {
    console.log('🔄 Using synced data for providers summary')
    
    return providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      websiteUrl: provider.websiteUrl,
      totalModels: models.filter(m => m.provider.slug === provider.slug).length,
      operationalModels: models.filter(m => 
        m.provider.slug === provider.slug && m.status.status === 'operational'
      ).length,
      avgAvailability: Math.round(
        models
          .filter(m => m.provider.slug === provider.slug)
          .reduce((sum, m) => sum + m.status.availability, 0) / 
        Math.max(models.filter(m => m.provider.slug === provider.slug).length, 1) * 10
      ) / 10,
    }))
  }

  static async searchModels(query: string, filters: any = {}) {
    console.log(`🔄 Using synced data for search: ${query}`)
    
    let filteredModels = [...models]

    // Search in name, description, or provider name
    if (query && query.length >= 2) {
      const lowerQuery = query.toLowerCase()
      filteredModels = filteredModels.filter(model =>
        model.name.toLowerCase().includes(lowerQuery) ||
        model.description.toLowerCase().includes(lowerQuery) ||
        model.provider.name.toLowerCase().includes(lowerQuery)
      )
    }

    // Apply filters
    if (filters.provider) {
      filteredModels = filteredModels.filter(model =>
        model.provider.slug === filters.provider
      )
    }

    // Apply limit
    const limit = filters.limit || 20
    filteredModels = filteredModels.slice(0, limit)

    return filteredModels.map(model => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      description: model.description,
      provider: {
        name: model.provider.name,
        slug: model.provider.slug,
      },
      status: {
        status: model.status.status,
        availability: model.status.availability,
      },
    }))
  }

  static async getPricing(filters: any = {}) {
    console.log('🔄 Using synced data for pricing')
    
    // Extract pricing from models
    const pricing = models.map(model => ({
      modelId: model.id,
      tier: model.pricing.tier,
      region: 'us-east',
      currency: model.pricing.currency,
      inputPerMillion: model.pricing.inputPerMillion,
      outputPerMillion: model.pricing.outputPerMillion,
      imagePerUnit: model.pricing.imagePerUnit,
      audioPerMinute: model.pricing.audioPerMinute,
      videoPerMinute: model.pricing.videoPerMinute,
      effectiveFrom: model.pricing.effectiveFrom,
    }))
    
    let filteredPricing = [...pricing]
    
    // Apply filters (same logic as before)
    if (filters.provider) {
      const providerSlug = filters.provider.toLowerCase()
      const providerModel = models.filter(m => 
        m.provider.slug === providerSlug
      )
      const modelIds = providerModel.map(m => m.id)
      filteredPricing = filteredPricing.filter(p => 
        modelIds.includes(p.modelId)
      )
    }
    
    // Apply pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    const paginated = filteredPricing.slice(offset, offset + limit)
    
    // Enrich pricing with model information
    const enrichedPricing = paginated.map(p => {
      const model = models.find(m => m.id === p.modelId)
      return {
        ...p,
        model: model ? {
          id: model.id,
          slug: model.slug,
          name: model.name,
          provider: model.provider,
        } : null,
      }
    })
    
    return {
      data: enrichedPricing,
      total: filteredPricing.length,
      cached: false,
    }
  }

  static async getSystemStats() {
    console.log('🔄 Using synced data for system stats')
    
    // Define providers with API keys (same logic as above)
    const providersWithApiKeys = new Set<string>()
    
    if (process.env.OPENAI_API_KEY) {
      providersWithApiKeys.add('openai')
    }
    if (process.env.ANTHROPIC_API_KEY) {
      providersWithApiKeys.add('anthropic')
    }
    if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
      providersWithApiKeys.add('google')
    }
    if (process.env.META_API_KEY) {
      providersWithApiKeys.add('meta')
    }
    
    // Always include these providers
    providersWithApiKeys.add('openai')
    providersWithApiKeys.add('anthropic')
    providersWithApiKeys.add('google')
    providersWithApiKeys.add('meta')
    
    // Filter models by providers with API keys
    const filteredModels = models.filter((model: any) => {
      const providerSlug = model.provider?.slug || (model as any).providerId
      return providersWithApiKeys.has(providerSlug)
    })
    
    const totalModels = filteredModels.length
    const activeModels = filteredModels.filter(m => m.isActive).length
    const operationalModels = filteredModels.filter(m => m.status.status === 'operational').length
    const degradedModels = filteredModels.filter(m => m.status.status === 'degraded').length
    const outageModels = filteredModels.filter(m => m.status.status === 'outage').length
    const avgAvailability = filteredModels.length > 0 
      ? filteredModels.reduce((sum, m) => sum + m.status.availability, 0) / filteredModels.length
      : 0

    return {
      totalModels,
      activeModels,
      providers: [...providersWithApiKeys].length,
      avgAvailability: Math.round(avgAvailability * 10) / 10,
      operationalModels,
      degradedModels,
      outageModels,
      totalBenchmarks: filteredModels.reduce((sum, m) => sum + m.benchmarks.length, 0),
      lastUpdated: new Date(),
    }
  }
}
