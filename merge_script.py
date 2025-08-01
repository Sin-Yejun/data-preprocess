import json
import os

# Define file paths
base_path = '/Users/yejunsin/Documents/data-preprocess'
questions_file = os.path.join(base_path, 'questions.json')
questions_id_file = os.path.join(base_path, 'questions_id.json')

# Read questions.json
try:
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    questions_data = []


# Read questions_id.json
with open(questions_id_file, 'r', encoding='utf-8') as f:
    questions_id_data = json.load(f)

# The user wants to start from id_051.
start_id = 51

# Update IDs in questions_id_data
for i, item in enumerate(questions_id_data):
    new_id_num = start_id + i
    item['id'] = f"id_{new_id_num:03d}"

# Merge data
merged_data = questions_data + questions_id_data

# Write back to questions.json
with open(questions_file, 'w', encoding='utf-8') as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

print(f"Successfully merged {len(questions_id_data)} questions into {questions_file}")