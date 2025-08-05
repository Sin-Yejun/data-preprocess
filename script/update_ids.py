
import json

file_path = '/Users/yejunsin/Documents/data-preprocess/generated_questions_100_v4_qwen3_no_thinking.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for item in data:
        try:
            parts = item['id'].split('_')
            lang = parts[0]
            num_str = parts[-1]
            num = int(num_str)
            new_num = num + 25
            item['id'] = f"{lang}_{new_num:03d}"
        except (ValueError, KeyError, IndexError):
            print(f"Could not process id: {item.get('id')}")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully updated IDs in {file_path}")

except FileNotFoundError:
    print(f"Error: File not found at {file_path}")
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from {file_path}")

