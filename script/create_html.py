import json
import os
import html

def create_comparison_html():
    # --- Configuration ---
    languages = {
        "ko": "Korean",
        "en": "English",
        "ja": "Japanese",
        "zh-Hant": "Traditional Chinese"
    }
    models = {
        "gemma": "Gemma",
        "qwen2.5": "Qwen 2.5",
        "qwen3": "Qwen 3"
    }
    model_files = {
        "gemma": "QA_gemma.json",
        "qwen2.5": "QA_qwen2.5.json",
        "qwen3": "QA_qwen3.json"
    }
    categories = {
        "General": (1, 50),
        "Exercise": (51, 100),
        "Calculation": (101, 125)
    }
    data_dir = "/Users/yejunsin/Documents/data-preprocess/final_data"
    output_html_path = "/Users/yejunsin/Documents/data-preprocess/index.html"

    # --- Data Loading ---
    questions = {}
    for model_key, filename in model_files.items():
        file_path = os.path.join(data_dir, filename)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                model_data = json.load(f)
            for item in model_data:
                q_id = item['id']
                if q_id not in questions:
                    questions[q_id] = {
                        'question': item['question'],
                        'language': item.get('language', 'unknown'),
                        'answers': {}
                    }
                questions[q_id]['answers'][model_key] = {
                    'answer': item['model_answer'],
                    'is_correct': item.get('is_correct')
                }
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Warning: Could not process file {file_path}. Error: {e}")

    # --- HTML Generation ---
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Model Answer Correctness Comparison</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; background-color: #f0f2f5; color: #1c1e21; }
        .container { max-width: 1200px; margin: auto; padding: 20px; }
        h1 { text-align: center; color: #1c1e21; padding: 20px 0; }
        
        /* Main Language Tabs */
        .lang-tab { overflow: hidden; border-bottom: 1px solid #ccc; background-color: #fff; }
        .lang-tab button { background-color: inherit; float: left; border: none; outline: none; cursor: pointer; padding: 14px 16px; transition: 0.3s; font-size: 17px; border-bottom: 3px solid transparent; }
        .lang-tab button:hover { background-color: #f1f1f1; }
        .lang-tab button.active { border-bottom: 3px solid #0056b3; color: #0056b3; font-weight: bold; }
        .lang-tabcontent { display: none; padding-top: 10px; }

        /* Category Tabs */
        .category-tab { overflow: hidden; border-bottom: 1px solid #ddd; margin-bottom: 15px; }
        .category-tab button { background-color: #f9f9f9; float: left; border: 1px solid #ddd; border-bottom: none; outline: none; cursor: pointer; padding: 10px 12px; transition: 0.3s; font-size: 15px; margin-right: 5px; border-radius: 5px 5px 0 0; }
        .category-tab button:hover { background-color: #e9e9e9; }
        .category-tab button.active { background-color: #fff; border-bottom: 1px solid #fff; color: #0056b3; font-weight: 600; }
        .category-tabcontent { display: none; }

        .question-block { background-color: #fff; margin-bottom: 25px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        .question-title { font-size: 1.5em; color: #0056b3; margin-top: 0; }
        .answers-container { display: flex; flex-direction: row; gap: 20px; justify-content: space-between; }
        .answer-card { border: 1px solid #e1e1e1; border-radius: 8px; padding: 20px; width: 31%; background-color: #f9f9f9; flex-grow: 1; }
        .answer-card h4 { margin-top: 0; color: #333; border-bottom: 2px solid #0056b3; padding-bottom: 10px; font-size: 1.1em; display: flex; justify-content: space-between; align-items: center; }
        .correctness-indicator { font-size: 1.2em; }
        .correct { color: green; }
        .incorrect { color: red; }
        .markdown-content { font-size: 1em; line-height: 1.6; }
        .markdown-content * { max-width: 100%; }
        @media (max-width: 900px) {
            .answers-container { flex-direction: column; }
            .answer-card { width: 100%; }
        }
    </style>
</head>
<body>
<div class="container">
    <h1>Model Answer Correctness Comparison</h1>
    <div class="lang-tab">
"""

    # --- Language Tab Buttons ---
    is_first_lang = True
    # Sort languages to have Korean first, then others alphabetically
    sorted_languages = sorted(languages.items(), key=lambda item: (item[0] != 'ko', item[1]))
    for code, name in sorted_languages:
        active_id = 'id="defaultOpenLang"' if is_first_lang else ''
        html_content += f'<button class="lang-tablinks" onclick="openLang(event, \'{code}\')" {active_id}>{name}</button>'
        is_first_lang = False
    html_content += '</div>'

    # --- Language Tab Content ---
    for lang_code, lang_name in sorted_languages:
        html_content += f'<div id="{lang_code}" class="lang-tabcontent">'
        
        # --- Category Tab Buttons ---
        html_content += f'<div class="category-tab">'
        is_first_cat = True
        for cat_name, _ in categories.items():
            cat_id = f"{lang_code}-{cat_name}"
            default_class = "defaultOpenCat" if is_first_cat and lang_code == 'ko' else "" # Only default for Korean General
            onclick_js = f"openCategory(event, '{cat_id}', '{lang_code}')"
            html_content += f'<button class="category-tablinks {lang_code}-cat-link {default_class}" onclick="{onclick_js}">{cat_name}</button>'
            is_first_cat = False
        html_content += '</div>'

        # --- Category Tab Content ---
        for cat_name, (start, end) in categories.items():
            cat_id = f"{lang_code}-{cat_name}"
            html_content += f'<div id="{cat_id}" class="category-tabcontent">'
            
            lang_q_ids = sorted(
                [q_id for q_id, q_data in questions.items() if q_data['language'] == lang_code and start <= int(q_id.split('_')[-1]) <= end],
                key=lambda q_id: int(q_id.split('_')[-1])
            )

            if not lang_q_ids:
                html_content += f'<p>No questions found for {lang_name} in {cat_name}.</p>'
            else:
                for q_id in lang_q_ids:
                    q_data = questions[q_id]
                    question_title = q_data['question']
                    q_num = q_id.split('_')[-1].lstrip('0')
                    
                    html_content += f"""
                    <div class="question-block">
                        <h2 class="question-title">Q{q_num}: {html.escape(question_title)}</h2>
                        <div class="answers-container">
                    """
                    for model_key, model_name in models.items():
                        answer_data = q_data['answers'].get(model_key)
                        indicator_html = ''
                        # Check specifically for questions 101-125 for the indicator
                        if 101 <= int(q_num) <= 125:
                            if answer_data and answer_data.get('is_correct') is not None:
                                if answer_data['is_correct']:
                                    indicator_html = '<span class="correctness-indicator correct">✔</span>'
                                else:
                                    indicator_html = '<span class="correctness-indicator incorrect">❌</span>'
                        
                        html_content += f'<div class="answer-card">'
                        html_content += f'<h4>{model_name}{indicator_html}</h4>'
                        if answer_data:
                            answer_text = answer_data['answer']
                            html_content += f'<div class="markdown-content" data-markdown>{html.escape(answer_text)}</div>'
                        else:
                            html_content += '<p>No answer from this model.</p>'
                        html_content += '</div>'
                    html_content += """
                        </div>
                    </div>
                    """
            html_content += '</div>'
        html_content += '</div>'

    # --- HTML Footer and Script ---
    html_content += """
</div>
<script>
function openLang(evt, langName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("lang-tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("lang-tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(langName).style.display = "block";
    evt.currentTarget.className += " active";

    // Open the default category tab for the selected language
    let defaultCat = document.querySelector(`#${langName} .defaultOpenCat`);
    if (defaultCat) {
        defaultCat.click();
    } else {
        // Fallback to click the first category tab if default not found
        let firstCat = document.querySelector(`#${langName} .category-tablinks`);
        if (firstCat) {
            firstCat.click();
        }
    }
}

function openCategory(evt, catName, langCode) {
    let i, tabcontent, tablinks;
    tabcontent = document.querySelectorAll(`#${langCode} .category-tabcontent`);
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.querySelectorAll(`#${langCode} .category-tablinks`);
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(catName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.markdown-content').forEach(function(element) {
        element.innerHTML = marked.parse(element.textContent || element.innerText);
    });
    let defaultLang = document.getElementById("defaultOpenLang");
    if (defaultLang) {
        defaultLang.click();
    }
});
</script>
</body>
</html>
"""
    with open(output_html_path, 'w', encoding='utf-8') as f_html:
        f_html.write(html_content)
    print(f"Successfully created {output_html_path}")

if __name__ == "__main__":
    create_comparison_html()
