import json
with open('frontend/src/core/i18n/he.json', 'r') as f:
    he_data = json.load(f)

if 'chat' not in he_data:
    he_data['chat'] = {}
he_data['chat']['retry'] = "נסה שוב"

with open('frontend/src/core/i18n/he.json', 'w') as f:
    json.dump(he_data, f, indent=2)
