
import json
import os

def merge_and_sort(calculation_file, qa_file, output_file):
    """
    Merges a calculation JSON file with a QA JSON file, sorts the merged data by ID,
    and writes the result to a new file.
    """
    try:
        with open(calculation_file, 'r', encoding='utf-8') as f:
            calc_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {calculation_file} not found.")
        return

    try:
        with open(qa_file, 'r', encoding='utf-8') as f:
            qa_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {qa_file} not found.")
        qa_data = []  # Start with an empty list if the QA file doesn't exist

    # Combine the data
    merged_data = qa_data + calc_data

    # Define the desired language order
    language_order = {
        'ko': 0,
        'en': 1,
        'ja': 2,
        'zh-Hant': 3
    }

    # Sort the merged data
    # The primary sorting key is the language order, the secondary is the numeric part of the id
    final_sorted_data = sorted(
        merged_data,
        key=lambda x: (language_order.get(x.get('language'), 99), int(x.get('id', '0_0').split('_')[1]))
    )


    # Write the sorted data to the output file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_sorted_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully merged {calculation_file} and {qa_file} into {output_file}")


if __name__ == "__main__":
    # Get the absolute path of the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the file pairs
    file_pairs = [
        ("calculation_gemma.json", "final_data/QA_gemma.json"),
        ("calculation_qwen2.5.json", "final_data/QA_qwen2.5.json"),
        ("calculation_qwen3.json", "final_data/QA_qwen3.json")
    ]

    for calc_file, qa_file in file_pairs:
        # Construct absolute paths for the files
        abs_calc_file = os.path.join(script_dir, calc_file)
        abs_qa_file = os.path.join(script_dir, qa_file)
        
        # The output file will be the same as the QA file, effectively overwriting it
        merge_and_sort(abs_calc_file, abs_qa_file, abs_qa_file)
