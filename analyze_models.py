import json

with open('data/models.json', 'r') as f:
    data = json.load(f)

print(f"Total models: {len(data['models'])}")

providers = {}
status_count = {'operational': 0, 'degraded': 0, 'outage': 0, 'unknown': 0}

for model in data['models']:
    provider_id = model.get('provider', {}).get('id', 'unknown')
    providers[provider_id] = providers.get(provider_id, 0) + 1
    
    status = model.get('status', {}).get('status', 'unknown')
    if status not in status_count:
        status = 'unknown'
    status_count[status] += 1

print("\n=== Provider Distribution ===")
for provider, count in sorted(providers.items(), key=lambda x: x[1], reverse=True):
    print(f"{provider}: {count} models")

print("\n=== Status Distribution ===")
for status, count in status_count.items():
    print(f"{status}: {count} models")

# Major providers
major_providers = ['openai', 'anthropic', 'google', 'meta', 'microsoft', 'amazon']
major_count = sum(providers.get(p, 0) for p in major_providers)
print(f"\nMajor providers: {major_count} models")
print(f"Others: {len(data['models']) - major_count} models")
