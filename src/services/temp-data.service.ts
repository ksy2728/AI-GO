/**
 * Temporary in-memory data service
 * This is a fallback when database connection fails
 * Last updated: 2025-08-14T15:51:59.805Z
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
      "availability": 99.68278618157827,
      "latencyP50": 164.58279383317065,
      "latencyP95": 367.8642756722725,
      "latencyP99": 757.3956055935614,
      "errorRate": 0.02742162292514072,
      "requestsPerMin": 1099.9047045477441,
      "tokensPerMin": 154383.91397232548,
      "usage": 34.12988703400109,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 70.72214374300856,
        "normalizedScore": 73.23018485391798,
        "percentile": 96.9284782241984,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.60234424971715,
      "latencyP50": 168.54011449348613,
      "latencyP95": 370.28751885573126,
      "latencyP99": 822.7127537195706,
      "errorRate": 0.0005272607390805151,
      "requestsPerMin": 985.2289313842991,
      "tokensPerMin": 163364.20012661204,
      "usage": 89.80367062123219,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 71.07221084303856,
        "normalizedScore": 72.6213248406163,
        "percentile": 78.88720161976758,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.83586097892747,
      "latencyP50": 215.10488210161458,
      "latencyP95": 394.13087443850094,
      "latencyP99": 870.5475069473414,
      "errorRate": 0.016616117946192,
      "requestsPerMin": 1329.104788265157,
      "tokensPerMin": 183044.24164982658,
      "usage": 42.07690084071126,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 77.76534135206516,
        "normalizedScore": 79.37358793571572,
        "percentile": 81.22014547209956,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.60633959353537,
      "latencyP50": 200.23927124189328,
      "latencyP95": 306.5611988031201,
      "latencyP99": 718.3370238348967,
      "errorRate": 0.08167868343907642,
      "requestsPerMin": 644.531460052204,
      "tokensPerMin": 182432.5532452093,
      "usage": 49.56698670010904,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.11755628286278,
        "normalizedScore": 72.97459117966501,
        "percentile": 98.58357945537865,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.63917286074333,
      "latencyP50": 184.96441818404497,
      "latencyP95": 331.858972491999,
      "latencyP99": 667.568795845397,
      "errorRate": 0.0014498353149740685,
      "requestsPerMin": 1532.495545742255,
      "tokensPerMin": 159975.00476827126,
      "usage": 54.769499529026355,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 71.16030257742125,
        "normalizedScore": 71.46526727415547,
        "percentile": 81.94754346659265,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.82688099121293,
      "latencyP50": 166.18600721715663,
      "latencyP95": 491.58043986060295,
      "latencyP99": 838.8573297362708,
      "errorRate": 0.08000871693762052,
      "requestsPerMin": 739.6298923377707,
      "tokensPerMin": 64746.588267059815,
      "usage": 34.767294184584856,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 69.58690089304247,
        "normalizedScore": 66.38038322437735,
        "percentile": 96.53306208085894,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.83148212784403,
      "latencyP50": 188.16885129778814,
      "latencyP95": 433.268883733229,
      "latencyP99": 812.1968412640277,
      "errorRate": 0.08831242096196355,
      "requestsPerMin": 553.3518954787947,
      "tokensPerMin": 86113.8314945692,
      "usage": 60.04544801801592,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 67.42801138188142,
        "normalizedScore": 67.89074289778154,
        "percentile": 91.49851472480327,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.67306363791721,
      "latencyP50": 206.24418625468388,
      "latencyP95": 322.12777113752054,
      "latencyP99": 672.7977628306853,
      "errorRate": 0.05564205333147823,
      "requestsPerMin": 1146.1786282918686,
      "tokensPerMin": 79525.75364631107,
      "usage": 28.248713977621833,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.79421916117761,
        "normalizedScore": 67.75099351911383,
        "percentile": 81.237275399884,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.84546899086754,
      "latencyP50": 212.35055923463602,
      "latencyP95": 401.11867821870436,
      "latencyP99": 946.9329716593659,
      "errorRate": 0.016071301245345216,
      "requestsPerMin": 1117.58106082925,
      "tokensPerMin": 192627.6034086618,
      "usage": 71.52257567573031,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 70.42167278845717,
        "normalizedScore": 66.26874695934636,
        "percentile": 75.05576323899919,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.81332023247599,
      "latencyP50": 179.82423528540855,
      "latencyP95": 334.8713554897024,
      "latencyP99": 688.7661144519193,
      "errorRate": 0.013292541653704637,
      "requestsPerMin": 1417.589698676246,
      "tokensPerMin": 156890.33928362344,
      "usage": 61.21254819523531,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.4602343057304,
        "normalizedScore": 70.75296489066744,
        "percentile": 86.6639508810866,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.71189322037417,
      "latencyP50": 213.9623444660004,
      "latencyP95": 406.1178360099491,
      "latencyP99": 894.7911070197188,
      "errorRate": 0.03382198130342234,
      "requestsPerMin": 929.3879816303945,
      "tokensPerMin": 144712.1216782688,
      "usage": 72.33197497623036,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.43918594906256,
        "normalizedScore": 70.59273172295956,
        "percentile": 81.8393257837179,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.87413607401356,
      "latencyP50": 185.0923060599338,
      "latencyP95": 321.401612251375,
      "latencyP99": 933.4104343922286,
      "errorRate": 0.08414710878566285,
      "requestsPerMin": 534.2457349126746,
      "tokensPerMin": 185754.59492937053,
      "usage": 66.48683903226795,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.61487142177215,
        "normalizedScore": 70.19168716299365,
        "percentile": 95.53675078334427,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.55978324294989,
      "latencyP50": 164.25890744670733,
      "latencyP95": 452.29057671268674,
      "latencyP99": 707.00305143052,
      "errorRate": 0.028049537602642328,
      "requestsPerMin": 1581.997882886396,
      "tokensPerMin": 54286.61649687349,
      "usage": 57.00692361589668,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 78.95870494339174,
        "normalizedScore": 76.06826063874837,
        "percentile": 96.8555762974689,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.8290987791312,
      "latencyP50": 150.34525670882454,
      "latencyP95": 317.71163389425044,
      "latencyP99": 775.6466102087873,
      "errorRate": 0.06502011719602033,
      "requestsPerMin": 1015.7922902942727,
      "tokensPerMin": 134626.2770308642,
      "usage": 58.58647453718571,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.8232673389753,
        "normalizedScore": 65.21151953868046,
        "percentile": 75.5563888101361,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.77199128541866,
      "latencyP50": 228.1064560665638,
      "latencyP95": 304.68503051663674,
      "latencyP99": 878.9928645846711,
      "errorRate": 0.09536952093840595,
      "requestsPerMin": 1530.262394923506,
      "tokensPerMin": 134813.32291653458,
      "usage": 61.30720926161484,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 65.02948526027944,
        "normalizedScore": 72.71693132171421,
        "percentile": 83.17574895372368,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
  },
  {
    "id": "gpt-4o",
    "slug": "openai-gpt-4o",
    "name": "Gpt 4o",
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
      "availability": 99.70491881698635,
      "latencyP50": 234.28192156492486,
      "latencyP95": 444.68986818872867,
      "latencyP99": 713.2908892711235,
      "errorRate": 0.015913961504573783,
      "requestsPerMin": 779.9334488659196,
      "tokensPerMin": 106240.31446665415,
      "usage": 54.45748137111874,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 94.23097706254124,
        "normalizedScore": 94.64072155113303,
        "percentile": 76.30969073692188,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.86601462681615,
      "latencyP50": 195.29147838289373,
      "latencyP95": 332.72630424994895,
      "latencyP99": 817.1925934155323,
      "errorRate": 0.01857352915378423,
      "requestsPerMin": 1719.8762517016287,
      "tokensPerMin": 173219.7197594142,
      "usage": 80.85861806957709,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 93.50909809143843,
        "normalizedScore": 91.68505033666497,
        "percentile": 97.61821321815262,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.69475966221992,
      "latencyP50": 200.0436908556862,
      "latencyP95": 460.84750158304684,
      "latencyP99": 769.9664177789912,
      "errorRate": 0.02870925554807078,
      "requestsPerMin": 1397.8978520148585,
      "tokensPerMin": 193256.839661237,
      "usage": 68.54003672198874,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 90.75723509587878,
        "normalizedScore": 89.70250529477738,
        "percentile": 91.61807828688237,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.55098356781635,
      "latencyP50": 190.66301556229803,
      "latencyP95": 429.65392892259575,
      "latencyP99": 760.7692560240127,
      "errorRate": 0.012485430990365831,
      "requestsPerMin": 1755.9986742816195,
      "tokensPerMin": 85753.29105341955,
      "usage": 53.723031209407374,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 93.61010146435808,
        "normalizedScore": 85.4656334818832,
        "percentile": 94.05997785337847,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.84688230131628,
      "latencyP50": 221.5211467044951,
      "latencyP95": 389.3349911320313,
      "latencyP99": 740.7649337022035,
      "errorRate": 0.07740884937322426,
      "requestsPerMin": 1723.663324199041,
      "tokensPerMin": 53474.74946670604,
      "usage": 83.3479301727722,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 87.70958859065999,
        "normalizedScore": 85.38385709344531,
        "percentile": 77.13960843937143,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.80375027012148,
      "latencyP50": 195.13028446745022,
      "latencyP95": 487.67390864313796,
      "latencyP99": 696.1287852766569,
      "errorRate": 0.06847314103354869,
      "requestsPerMin": 1848.7472754517862,
      "tokensPerMin": 150330.11825577778,
      "usage": 24.964462354772472,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 93.14415609504819,
        "normalizedScore": 94.6928098540406,
        "percentile": 90.16924248898293,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.6702415565208,
      "latencyP50": 230.16396760983892,
      "latencyP95": 325.2496840074453,
      "latencyP99": 987.8063718525242,
      "errorRate": 0.07094491040297439,
      "requestsPerMin": 1168.3178392498849,
      "tokensPerMin": 152477.20024499885,
      "usage": 71.47512154976917,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 86.11749417263293,
        "normalizedScore": 88.76717776371416,
        "percentile": 88.05090799781944,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.70983421449671,
      "latencyP50": 243.649207184244,
      "latencyP95": 467.32446549944007,
      "latencyP99": 820.56120424073,
      "errorRate": 0.027987493417743915,
      "requestsPerMin": 981.9771522658043,
      "tokensPerMin": 52592.71386552106,
      "usage": 83.86984257996434,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.18747726266649,
        "normalizedScore": 87.68693062677987,
        "percentile": 80.83669586910831,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.65418558570599,
      "latencyP50": 188.08439064614788,
      "latencyP95": 329.6614444015403,
      "latencyP99": 896.2162958674398,
      "errorRate": 0.034485194094871566,
      "requestsPerMin": 912.4757599011181,
      "tokensPerMin": 123808.48032317395,
      "usage": 23.43491018665912,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 94.92554254539805,
        "normalizedScore": 89.22563030724143,
        "percentile": 78.98694054070819,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.53816367961011,
      "latencyP50": 223.4634585203193,
      "latencyP95": 395.527073576389,
      "latencyP99": 876.2452823307553,
      "errorRate": 0.005782947143556561,
      "requestsPerMin": 1502.6619581893528,
      "tokensPerMin": 98912.70929903144,
      "usage": 76.04186348679667,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.08681245752545,
        "normalizedScore": 86.7755858084202,
        "percentile": 76.37535835841967,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.71579922023467,
      "latencyP50": 224.54457554902407,
      "latencyP95": 336.6144443006467,
      "latencyP99": 967.194103269886,
      "errorRate": 0.06420029855924754,
      "requestsPerMin": 1221.8064435891079,
      "tokensPerMin": 141521.69698001575,
      "usage": 49.150496568542096,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.70594234214003,
        "normalizedScore": 91.16755671335116,
        "percentile": 83.14366350259255,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.73777090666269,
      "latencyP50": 153.2553169244715,
      "latencyP95": 495.32455005491977,
      "latencyP99": 639.7567233356813,
      "errorRate": 0.0946789272629691,
      "requestsPerMin": 1967.8516093217104,
      "tokensPerMin": 50387.635913555416,
      "usage": 78.8607945939605,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.86155834174892,
        "normalizedScore": 88.44039830408944,
        "percentile": 92.23615021857124,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.62508319612027,
      "latencyP50": 162.61048054431856,
      "latencyP95": 440.77178877411046,
      "latencyP99": 937.0944626205373,
      "errorRate": 0.06238206607505603,
      "requestsPerMin": 1251.383980876406,
      "tokensPerMin": 150187.5467677581,
      "usage": 44.41788573206915,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 94.57558277330124,
        "normalizedScore": 94.71170226550329,
        "percentile": 86.5948718868458,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.87391631239812,
      "latencyP50": 202.40199653302278,
      "latencyP95": 330.07601044051415,
      "latencyP99": 806.706006094114,
      "errorRate": 0.05996191779650928,
      "requestsPerMin": 540.0427173282493,
      "tokensPerMin": 108633.08873505783,
      "usage": 79.9577952295711,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 94.44109595799841,
        "normalizedScore": 93.32713723116663,
        "percentile": 84.02913170479819,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.51199687473635,
      "latencyP50": 194.66538530355578,
      "latencyP95": 411.2432237359575,
      "latencyP99": 659.1121602623966,
      "errorRate": 0.014519245112707703,
      "requestsPerMin": 1052.8455441677775,
      "tokensPerMin": 186621.47352175944,
      "usage": 33.82957656499893,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 90.08312267065529,
        "normalizedScore": 87.86034819456619,
        "percentile": 98.47384698851079,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.7822233691389,
      "latencyP50": 238.76721476015518,
      "latencyP95": 302.13809806071777,
      "latencyP99": 802.6449382682129,
      "errorRate": 0.05159246954683692,
      "requestsPerMin": 1292.0494395507362,
      "tokensPerMin": 69188.18602625508,
      "usage": 37.61261027247791,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 93.98218455330685,
        "normalizedScore": 86.51711405862594,
        "percentile": 93.71058660037686,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.72608058190933,
      "latencyP50": 215.29318019816566,
      "latencyP95": 304.3660687287065,
      "latencyP99": 896.755462765665,
      "errorRate": 0.011463828623974593,
      "requestsPerMin": 549.3220078303317,
      "tokensPerMin": 107158.02531304819,
      "usage": 34.31454129630903,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 90.83089560532977,
        "normalizedScore": 90.78529740229243,
        "percentile": 87.79213867904612,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.77322729578306,
      "latencyP50": 156.70492907605177,
      "latencyP95": 411.1707972113529,
      "latencyP99": 607.389570548232,
      "errorRate": 0.05195966531045251,
      "requestsPerMin": 1466.3904569911524,
      "tokensPerMin": 87942.60703735592,
      "usage": 69.06002925181431,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.1463823316693,
        "normalizedScore": 91.93336535332847,
        "percentile": 77.76229984512939,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.64225759338827,
      "latencyP50": 222.9377149032691,
      "latencyP95": 472.41678806129613,
      "latencyP99": 858.6556321969886,
      "errorRate": 0.00236908789575927,
      "requestsPerMin": 1453.7783274659973,
      "tokensPerMin": 190169.28011090445,
      "usage": 40.143017910137814,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.52845076796453,
        "normalizedScore": 92.34561267447074,
        "percentile": 97.34708728359814,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.75673847012398,
      "latencyP50": 159.88749653362086,
      "latencyP95": 324.4244965131379,
      "latencyP99": 958.6365169930762,
      "errorRate": 0.0764653828468551,
      "requestsPerMin": 1039.0869041030192,
      "tokensPerMin": 193458.40367593712,
      "usage": 36.68446552339044,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 94.24957411880209,
        "normalizedScore": 90.98287497136519,
        "percentile": 78.44858927842495,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.69010485490668,
      "latencyP50": 214.73314728747854,
      "latencyP95": 412.26540391145784,
      "latencyP99": 882.8223524652778,
      "errorRate": 0.09348569912261358,
      "requestsPerMin": 1909.3287588347623,
      "tokensPerMin": 121482.77281095176,
      "usage": 32.01589279678155,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 91.9499908569116,
        "normalizedScore": 94.66640165743438,
        "percentile": 80.08138687175935,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.89324179793108,
      "latencyP50": 221.5538797293935,
      "latencyP95": 389.8923456257685,
      "latencyP99": 885.0715850131633,
      "errorRate": 0.06618757751077653,
      "requestsPerMin": 1189.193323219505,
      "tokensPerMin": 178565.6099802421,
      "usage": 85.56948516767501,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 86.96384790763595,
        "normalizedScore": 91.51888666398027,
        "percentile": 78.07404529038773,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.5997141707641,
      "latencyP50": 175.89027124275214,
      "latencyP95": 483.7955376906283,
      "latencyP99": 865.0416852246711,
      "errorRate": 0.08975095335072128,
      "requestsPerMin": 1871.070441055807,
      "tokensPerMin": 58854.63378839275,
      "usage": 53.29193872378973,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 85.96936157927406,
        "normalizedScore": 89.96396793991148,
        "percentile": 75.03998109340554,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.82781704341997,
      "latencyP50": 235.72055213064948,
      "latencyP95": 300.46902836423993,
      "latencyP99": 937.722969762783,
      "errorRate": 0.03223455595878699,
      "requestsPerMin": 1751.9761987778918,
      "tokensPerMin": 193438.10890962087,
      "usage": 68.40019458354203,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.39783045222772,
        "normalizedScore": 92.0533010035305,
        "percentile": 78.84361017926621,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.85959842098804,
      "latencyP50": 168.93913739487522,
      "latencyP95": 355.47007484107814,
      "latencyP99": 916.6796561035313,
      "errorRate": 0.03667653576862271,
      "requestsPerMin": 1943.4632144867796,
      "tokensPerMin": 109531.53619604638,
      "usage": 81.57856600668082,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 74.57939439252897,
        "normalizedScore": 69.33959779853345,
        "percentile": 83.84930639286345,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.89668034549358,
      "latencyP50": 158.58150378102386,
      "latencyP95": 307.29479503417735,
      "latencyP99": 848.2705835755381,
      "errorRate": 0.0023993202293895125,
      "requestsPerMin": 814.9996416233353,
      "tokensPerMin": 70351.29787620594,
      "usage": 45.17007954523183,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 67.9362824075437,
        "normalizedScore": 68.28567416980604,
        "percentile": 75.70490197129004,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.61121759800437,
      "latencyP50": 201.96008410668028,
      "latencyP95": 460.31043670211113,
      "latencyP99": 997.5482803481179,
      "errorRate": 0.09630212512936354,
      "requestsPerMin": 893.2363921613368,
      "tokensPerMin": 54008.07321507908,
      "usage": 42.602721022888275,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.22250845844489,
        "normalizedScore": 66.64847155518515,
        "percentile": 89.35438407940029,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.55872767395034,
      "latencyP50": 248.84441203940506,
      "latencyP95": 449.6653175961527,
      "latencyP99": 930.1008019330255,
      "errorRate": 0.04772379505403819,
      "requestsPerMin": 606.8357345615015,
      "tokensPerMin": 118341.0068537598,
      "usage": 36.38735241379695,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.13577506077505,
        "normalizedScore": 73.07215960650404,
        "percentile": 78.07419876111497,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.80512176401133,
      "latencyP50": 239.15180003810764,
      "latencyP95": 465.13256916189255,
      "latencyP99": 826.5910935359476,
      "errorRate": 0.03189479205698229,
      "requestsPerMin": 1868.4367825018398,
      "tokensPerMin": 107420.22724509033,
      "usage": 30.470622497129522,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 71.55631885112577,
        "normalizedScore": 66.47065715972994,
        "percentile": 76.94162303533653,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.51423433437448,
      "latencyP50": 189.8711023721557,
      "latencyP95": 494.66353861158296,
      "latencyP99": 778.357025443238,
      "errorRate": 0.08641639157227116,
      "requestsPerMin": 1488.328402652443,
      "tokensPerMin": 53168.71597821229,
      "usage": 73.62504588885088,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.25767346687368,
        "normalizedScore": 66.46704876311625,
        "percentile": 79.04608545189186,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.80569290165026,
      "latencyP50": 199.44222672460972,
      "latencyP95": 324.5297106286549,
      "latencyP99": 767.1902676984828,
      "errorRate": 0.034982444994184285,
      "requestsPerMin": 530.7808908218387,
      "tokensPerMin": 120015.5109882509,
      "usage": 88.33763339946337,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.52555254861412,
        "normalizedScore": 70.08222714852488,
        "percentile": 91.49338379181137,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.66464420643776,
      "latencyP50": 238.6727827459903,
      "latencyP95": 411.2769369212996,
      "latencyP99": 633.3173022118903,
      "errorRate": 0.09261134221015335,
      "requestsPerMin": 1986.6578024760674,
      "tokensPerMin": 107765.25937695042,
      "usage": 47.336832181901386,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 91.3492353442026,
        "normalizedScore": 90.93070547388865,
        "percentile": 81.90722319060642,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.89559698762666,
      "latencyP50": 198.3341671176869,
      "latencyP95": 380.54420664343706,
      "latencyP99": 738.5273106488074,
      "errorRate": 0.021592879712973856,
      "requestsPerMin": 1117.4096511834514,
      "tokensPerMin": 180093.5834730723,
      "usage": 62.875098218613715,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 92.9707438441816,
        "normalizedScore": 85.01340426777502,
        "percentile": 97.01847882415584,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.67444169617814,
      "latencyP50": 218.09659205213,
      "latencyP95": 415.77628457698256,
      "latencyP99": 828.4828022768827,
      "errorRate": 0.009317100877706942,
      "requestsPerMin": 1000.488367309488,
      "tokensPerMin": 53348.20647432066,
      "usage": 46.29080693632175,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 69.98922717833423,
        "normalizedScore": 70.9374660643626,
        "percentile": 75.73535996251229,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.57306345680644,
      "latencyP50": 187.84039364067175,
      "latencyP95": 479.80603354347363,
      "latencyP99": 964.922210473271,
      "errorRate": 0.03347969474840142,
      "requestsPerMin": 1504.577056943279,
      "tokensPerMin": 114939.07981160903,
      "usage": 64.39810734144368,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 67.98641140192186,
        "normalizedScore": 71.44081567847843,
        "percentile": 92.60609815303991,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.63199521514248,
      "latencyP50": 204.23458094612755,
      "latencyP95": 321.89912224811883,
      "latencyP99": 663.6927005048431,
      "errorRate": 0.01969914467383418,
      "requestsPerMin": 525.9568310088773,
      "tokensPerMin": 191443.0876772052,
      "usage": 67.78210462059974,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 78.13591666338097,
        "normalizedScore": 75.52525156896117,
        "percentile": 90.05319497335638,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.804Z"
    },
    "createdAt": "2025-08-14T15:51:59.804Z",
    "updatedAt": "2025-08-14T15:51:59.804Z"
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
      "availability": 99.77616079400555,
      "latencyP50": 244.35273267525247,
      "latencyP95": 490.10905496684416,
      "latencyP99": 891.5361747674253,
      "errorRate": 0.004082647137710427,
      "requestsPerMin": 1169.2711879980066,
      "tokensPerMin": 169684.95315169994,
      "usage": 54.75811158209784,
      "checkedAt": "2025-08-14T15:51:59.804Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 93.25822875005255,
        "normalizedScore": 89.82006649981875,
        "percentile": 98.70340442126243,
        "evaluationDate": "2025-08-14T15:51:59.804Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.84733111149993,
      "latencyP50": 205.89514586822747,
      "latencyP95": 394.6845807542064,
      "latencyP99": 783.9488274644083,
      "errorRate": 0.05688452260069581,
      "requestsPerMin": 1240.2019983593734,
      "tokensPerMin": 169846.340497465,
      "usage": 76.57875227431146,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 87.32904997648168,
        "normalizedScore": 86.12089146752459,
        "percentile": 83.84036199805755,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.59974145836316,
      "latencyP50": 240.56850104889148,
      "latencyP95": 400.98777648985686,
      "latencyP99": 909.0134448121875,
      "errorRate": 0.060188363425963745,
      "requestsPerMin": 617.9178290569172,
      "tokensPerMin": 127033.27630524461,
      "usage": 71.32669356537781,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 76.6660995148994,
        "normalizedScore": 72.06166881056828,
        "percentile": 77.36281164738114,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.53952256230997,
      "latencyP50": 166.33203223758602,
      "latencyP95": 485.80250417286345,
      "latencyP99": 968.1786626101527,
      "errorRate": 0.09092397609243451,
      "requestsPerMin": 1600.4788377499906,
      "tokensPerMin": 186177.98207408833,
      "usage": 28.214709907314578,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 89.0939570901829,
        "normalizedScore": 85.5112725301688,
        "percentile": 96.35993821236815,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.75361465449713,
      "latencyP50": 165.5441927865103,
      "latencyP95": 321.51114028664074,
      "latencyP99": 795.8771826927356,
      "errorRate": 0.08499136861783235,
      "requestsPerMin": 1609.9027574326028,
      "tokensPerMin": 165902.29859262868,
      "usage": 89.8288659261133,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 68.97571488906756,
        "normalizedScore": 70.70128207755889,
        "percentile": 98.7766801007061,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.7348354328704,
      "latencyP50": 172.60408783490286,
      "latencyP95": 498.9533500046948,
      "latencyP99": 853.5041997752026,
      "errorRate": 0.05862500418506727,
      "requestsPerMin": 1577.2998658549939,
      "tokensPerMin": 179595.75631320733,
      "usage": 84.1749292699449,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 72.5139939401736,
        "normalizedScore": 74.6873019500245,
        "percentile": 97.75036173750678,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.89404921408574,
      "latencyP50": 171.69446018870892,
      "latencyP95": 349.5932568572154,
      "latencyP99": 748.271242919052,
      "errorRate": 0.0372251301461076,
      "requestsPerMin": 1467.2581512001416,
      "tokensPerMin": 125341.45378449262,
      "usage": 29.354520095261535,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 69.98018010458708,
        "normalizedScore": 65.99360616944065,
        "percentile": 79.85998631018172,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.69669491487646,
      "latencyP50": 211.19283226181312,
      "latencyP95": 302.0676586663687,
      "latencyP99": 708.9837483577662,
      "errorRate": 0.022768229121563666,
      "requestsPerMin": 1900.9085713481,
      "tokensPerMin": 168265.71425428666,
      "usage": 53.15878106585065,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 80.4910883121394,
        "normalizedScore": 89.72605055741555,
        "percentile": 80.31817188297065,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.8391256379522,
      "latencyP50": 235.1061966472551,
      "latencyP95": 335.0930731969672,
      "latencyP99": 960.1614035119286,
      "errorRate": 0.09533965878549469,
      "requestsPerMin": 922.3340785967863,
      "tokensPerMin": 101113.3715913314,
      "usage": 42.84677874497513,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 88.00974105358667,
        "normalizedScore": 88.24085748038519,
        "percentile": 88.9258076039267,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.89940088873264,
      "latencyP50": 225.29645766282334,
      "latencyP95": 441.23517382847785,
      "latencyP99": 866.7358813250867,
      "errorRate": 0.03994428479056558,
      "requestsPerMin": 1741.2129858064247,
      "tokensPerMin": 100249.30613615262,
      "usage": 63.590726491217545,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 80.23073412130351,
        "normalizedScore": 87.31465951430143,
        "percentile": 86.41702588699374,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.81039381105202,
      "latencyP50": 215.6979094844105,
      "latencyP95": 321.1977591428985,
      "latencyP99": 653.9031299667623,
      "errorRate": 0.043540249964489956,
      "requestsPerMin": 591.2201132808092,
      "tokensPerMin": 194025.67594062083,
      "usage": 50.25181540732237,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 71.81418801247459,
        "normalizedScore": 71.48827839079102,
        "percentile": 83.15424261881196,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.80564118390842,
      "latencyP50": 204.29626850401831,
      "latencyP95": 466.25827827246826,
      "latencyP99": 840.9066565553633,
      "errorRate": 0.04114428943536528,
      "requestsPerMin": 1828.0607586725307,
      "tokensPerMin": 176853.41822565984,
      "usage": 20.368818792251602,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 65.17246587806767,
        "normalizedScore": 69.86461576881464,
        "percentile": 95.82232375780934,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.53070658169803,
      "latencyP50": 205.87386203501157,
      "latencyP95": 337.5060480721868,
      "latencyP99": 985.8928818142282,
      "errorRate": 0.09930120971096341,
      "requestsPerMin": 1588.7702748577494,
      "tokensPerMin": 189478.06353185143,
      "usage": 29.32197954779221,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 71.15747370634588,
        "normalizedScore": 65.71866354824273,
        "percentile": 96.4145405406579,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.66286404695562,
      "latencyP50": 221.17060694768446,
      "latencyP95": 329.0067906642059,
      "latencyP99": 908.8537377716382,
      "errorRate": 0.05363251463395782,
      "requestsPerMin": 1484.821479506485,
      "tokensPerMin": 52090.21215365138,
      "usage": 58.20360407916043,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 76.15333865223342,
        "normalizedScore": 84.01612811200896,
        "percentile": 88.9344533080899,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.55024935348966,
      "latencyP50": 175.80236152408435,
      "latencyP95": 352.4184257946303,
      "latencyP99": 741.3491419305772,
      "errorRate": 0.008096874404246735,
      "requestsPerMin": 1128.0319359320802,
      "tokensPerMin": 123943.62103565317,
      "usage": 33.09207393276911,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 83.34151568054094,
        "normalizedScore": 82.01096568752666,
        "percentile": 84.53611568295175,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.50075449174551,
      "latencyP50": 239.34218294363083,
      "latencyP95": 341.024632780442,
      "latencyP99": 817.2738245193273,
      "errorRate": 0.041253779365907906,
      "requestsPerMin": 1157.9660010850084,
      "tokensPerMin": 117810.8468485952,
      "usage": 48.55234258447064,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 81.73059310584155,
        "normalizedScore": 84.71324948853606,
        "percentile": 77.54757588865569,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.674573686019,
      "latencyP50": 247.46185006043845,
      "latencyP95": 316.3520159602673,
      "latencyP99": 613.6122334405238,
      "errorRate": 0.04520315452834325,
      "requestsPerMin": 977.0666656978908,
      "tokensPerMin": 118985.20603545323,
      "usage": 50.60601002802305,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 84.98035776045816,
        "normalizedScore": 78.49484537682463,
        "percentile": 82.83559215380126,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.52490072344375,
      "latencyP50": 179.93410904208528,
      "latencyP95": 483.2815566884858,
      "latencyP99": 875.4059356600819,
      "errorRate": 0.08978891070129524,
      "requestsPerMin": 1201.2624979398354,
      "tokensPerMin": 63853.94077534172,
      "usage": 41.4643028620669,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 77.9591358551134,
        "normalizedScore": 78.11869775136417,
        "percentile": 90.89229491621187,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.51656565308245,
      "latencyP50": 189.21366666869693,
      "latencyP95": 394.52538695447726,
      "latencyP99": 651.9411201843568,
      "errorRate": 0.016406171780501456,
      "requestsPerMin": 1262.0560900375453,
      "tokensPerMin": 57057.63678850819,
      "usage": 50.33583182225898,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 76.77845276655201,
        "normalizedScore": 79.04083030312653,
        "percentile": 79.51625770541317,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.71556619977049,
      "latencyP50": 214.64934481100337,
      "latencyP95": 318.66138536284706,
      "latencyP99": 663.4059717808449,
      "errorRate": 0.008793320225286028,
      "requestsPerMin": 1666.3172792930495,
      "tokensPerMin": 164500.1782267408,
      "usage": 50.757441729555566,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 83.12445937157858,
        "normalizedScore": 79.38127614410323,
        "percentile": 75.0155775546816,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.68109164310563,
      "latencyP50": 151.57930216659878,
      "latencyP95": 381.64503867020176,
      "latencyP99": 757.5970188415926,
      "errorRate": 0.07903084485085513,
      "requestsPerMin": 826.1645910000209,
      "tokensPerMin": 144816.89977664332,
      "usage": 66.62527640763045,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 79.75556903954993,
        "normalizedScore": 83.85651611503899,
        "percentile": 96.40506219123172,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.81460675293432,
      "latencyP50": 197.17258614403866,
      "latencyP95": 361.70864099653113,
      "latencyP99": 775.6333959001176,
      "errorRate": 0.0351919697852501,
      "requestsPerMin": 1079.537978812915,
      "tokensPerMin": 71940.77578960787,
      "usage": 83.35667059411415,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 82.67576578411125,
        "normalizedScore": 76.9848228293285,
        "percentile": 92.43176453469502,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
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
      "availability": 99.83785155640219,
      "latencyP50": 220.74305508207917,
      "latencyP95": 424.2767559540953,
      "latencyP99": 784.2734038643509,
      "errorRate": 0.0474009224978581,
      "requestsPerMin": 1748.4865516728662,
      "tokensPerMin": 140150.90839682313,
      "usage": 23.800681569988715,
      "checkedAt": "2025-08-14T15:51:59.805Z"
    },
    "benchmarks": [
      {
        "suite": "MMLU",
        "suiteSlug": "mmlu",
        "score": 78.9805495080396,
        "normalizedScore": 75.88979780106396,
        "percentile": 77.4460785226625,
        "evaluationDate": "2025-08-14T15:51:59.805Z",
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
      "effectiveFrom": "2025-08-14T15:51:59.805Z"
    },
    "createdAt": "2025-08-14T15:51:59.805Z",
    "updatedAt": "2025-08-14T15:51:59.805Z"
  }
];

export class TempDataService {
  static async getAllModels(filters: any = {}) {
    console.log('🔄 Using synced API data from TempDataService')
    
    let filteredModels = [...models]

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
    
    const totalModels = models.length
    const activeModels = models.filter(m => m.isActive).length
    const operationalModels = models.filter(m => m.status.status === 'operational').length
    const degradedModels = models.filter(m => m.status.status === 'degraded').length
    const outageModels = models.filter(m => m.status.status === 'outage').length
    const avgAvailability = models.reduce((sum, m) => sum + m.status.availability, 0) / models.length

    return {
      totalModels,
      activeModels,
      providers: providers.length,
      avgAvailability: Math.round(avgAvailability * 10) / 10,
      operationalModels,
      degradedModels,
      outageModels,
      totalBenchmarks: models.reduce((sum, m) => sum + m.benchmarks.length, 0),
      lastUpdated: new Date(),
    }
  }
}
