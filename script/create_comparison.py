import json
import os

def create_comparison_files():
    languages = ['ko', 'en', 'ja', 'zh-Hant']
    model_files = {
        "gemma": "/Users/yejunsin/Documents/data-preprocess/QA/generated_questions_100_v1_gemma.json",
        "microsoft": "/Users/yejunsin/Documents/data-preprocess/QA/generated_questions_100_v1_microsoft.json",
        "qwen": "/Users/yejunsin/Documents/data-preprocess/QA/generated_questions_100_v1_qwen.json"
    }

    model_data = {}
    for model, file_path in model_files.items():
        with open(file_path, 'r', encoding='utf-8') as f:
            model_data[model] = json.load(f)

    output_dir = "/Users/yejunsin/Documents/data-preprocess/comparison"
    os.makedirs(output_dir, exist_ok=True)

    for lang in languages:
        output_filename = os.path.join(output_dir, f"{lang}_comparison.md")
        with open(output_filename, 'w', encoding='utf-8') as f_out:
            f_out.write(f"# {lang.upper()} Model Answer Comparison\n\n")

            lang_questions = [q for q in model_data['gemma'] if q['language'] == lang]

            for question_data in lang_questions:
                question_id = question_data['id']
                question_text = question_data['question']

                f_out.write(f"## {question_id}: {question_text}\n\n")

                for model_name in ['gemma', 'microsoft', 'qwen']:
                    answer = "Answer not found."
                    for item in model_data[model_name]:
                        if item.get('id') == question_id:
                            answer = item.get('model_answer', "Answer not found.")
                            break
                    f_out.write(f"### {model_name.capitalize()} Answer:\n")
                    f_out.write(f"{answer}\n\n")

                f_out.write("---\n\n")

    print("Comparison files created successfully in the 'comparison' directory.")

if __name__ == "__main__":
    create_comparison_files()
