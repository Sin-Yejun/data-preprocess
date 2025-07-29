
import json

def get_id_lang_num(item):
    """Extracts language and numeric part from ID."""
    try:
        parts = item['id'].split('_')
        lang = parts[0]
        num_str = parts[-1]
        return lang, int(num_str)
    except (ValueError, KeyError, IndexError):
        return None, None

def merge_into_existing_file():
    """
    Merges specific data from a source file into a target file,
    sorts the combined data, and overwrites the target file.
    """
    source_filename = 'generated_questions_100_v4_qwen3_no_thinking.json'
    target_filename = 'merged_questions_by_language.json'
    id_range = (26, 50)

    # Read the target file first
    try:
        with open(target_filename, 'r', encoding='utf-8') as f:
            target_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"Error reading or decoding {target_filename}. Starting with an empty list.")
        target_data = []

    # Read the source file and filter the data
    new_data = []
    try:
        with open(source_filename, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
            for item in source_data:
                lang, num = get_id_lang_num(item)
                if num is not None and id_range[0] <= num <= id_range[1]:
                    # Reconstruct the id to have a consistent format with 3 digits
                    item['id'] = f"{lang}_{num:03d}"
                    new_data.append(item)
    except FileNotFoundError:
        print(f"Error: Source file not found - {source_filename}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {source_filename}")
        return

    # Combine the existing data with the new data
    combined_data = target_data + new_data

    # Define a language order for sorting
    lang_order = {'ko': 0, 'en': 1, 'ja': 2, 'zh-Hant': 3}

    # Sort the combined data
    # Primary key: language
    # Secondary key: numeric part of id
    def sort_key(item):
        lang, num = get_id_lang_num(item)
        return (lang_order.get(lang, 99), num)

    sorted_data = sorted(combined_data, key=sort_key)

    # Write the sorted data back to the target file
    with open(target_filename, 'w', encoding='utf-8') as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully merged new data into {target_filename} and re-sorted.")

if __name__ == '__main__':
    merge_into_existing_file()
