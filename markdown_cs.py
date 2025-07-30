import json

data_file = [
    'vote/questions_gemma_vote.json',
    'vote/questions_qwen3_no_thinking_vote.json'
]

for file in data_file:
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    def escape_tildes(text):
        return text.replace('~', r'\~')

    for item in data:
        if 'model_answer' in item:
            item['model_answer'] = escape_tildes(item['model_answer'])

    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
