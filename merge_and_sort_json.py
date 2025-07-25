import json

# Define the language order for sorting
language_order = {
    'ko': 0,
    'en': 1,
    'ja': 2,
    'zh-Hant': 3
}

def get_id_num(item):
    try:
        return int(item.get('id', '0_0').split('_')[1])
    except (ValueError, IndexError):
        return 0

# --- Process v3 data (IDs 1-25) ---
with open('generated_questions_100_v3_gemma.json', 'r', encoding='utf-8') as f:
    data1 = json.load(f)

# --- Process v4 data (IDs 26-50) ---
with open('generated_questions_100_v4_gemma.json', 'r', encoding='utf-8') as f:
    data2 = json.load(f)

# Group data by language to re-index correctly
grouped_by_lang_v4 = {}
for item in data2:
    lang = item.get('language')
    if lang not in grouped_by_lang_v4:
        grouped_by_lang_v4[lang] = []
    grouped_by_lang_v4[lang].append(item)

data2_reindexed = []
for lang, items in grouped_by_lang_v4.items():
    # Sort items within the language group by original ID to ensure order
    sorted_items = sorted(items, key=get_id_num)
    
    # Re-index starting from 26
    counter = 26
    for item in sorted_items:
        item['id'] = f"{lang}_{counter:03d}"
        counter += 1
        data2_reindexed.append(item)

# --- Process questions_qwen2.5.json data (IDs 51-100) ---
with open('questions_gemma.json', 'r', encoding='utf-8') as f:
    data3 = json.load(f)

# Merge the data
merged_data = data1 + data2_reindexed + data3

# Final sort of the merged data by language and new ID
final_sorted_data = sorted(
    merged_data,
    key=lambda x: (language_order.get(x.get('language'), 99), get_id_num(x))
)

# Write the final data to a new file
with open('QA_gemma.json', 'w', encoding='utf-8') as f:
    json.dump(final_sorted_data, f, ensure_ascii=False, indent=2)

print("Files merged and sorted successfully with corrected IDs into questions_qwen2.5_merged.json")