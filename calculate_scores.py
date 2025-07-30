
import json

def calculate_scores(file_path):
    """
    Reads a JSON file, filters items by ID (101-125), and calculates the score
    for each language based on the 'is_correct' field.
    """
    scores = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for lang in ['ko', 'en', 'ja', 'zh-Hant']:
            lang_scores = 0
            for item in data:
                if item['id'].startswith(lang + '_'):
                    try:
                        num = int(item['id'].split('_')[1])
                        if 101 <= num <= 125:
                            if item.get('is_correct') is True:
                                lang_scores += 1
                    except (ValueError, IndexError):
                        continue
            scores[lang] = lang_scores
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}")
        return None
    return scores

def main():
    """
    Main function to calculate and print scores for the specified JSON files.
    """
    files_to_process = [
        "final_data/QA_gemma.json",
        "final_data/QA_qwen2.5.json",
        "final_data/QA_qwen3.json",
        "final_data/QA_qwen3_no_thiking.json"
    ]

    for file_path in files_to_process:
        print(f"Processing file: {file_path}")
        scores = calculate_scores(file_path)
        if scores:
            for lang, score in scores.items():
                print(f"  {lang}: {score}/25")
        print("-" * 20)

if __name__ == "__main__":
    main()
