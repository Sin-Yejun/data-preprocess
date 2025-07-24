

import json
import os
import html

def create_direct_html_comparison():
    languages = {
        "ko": "Korean",
        "en": "English",
        "ja": "Japanese",
        "zh-Hant": "Traditional Chinese"
    }
    model_files = {
        "gemma": "/Users/yejunsin/Documents/data-preprocess/QA/generated_questions_100_v1_gemma.json",
        "microsoft": "/Users/yejunsin/Documents/data-preprocess/QA/generated_questions_100_v1_microsoft.json",
        "qwen": "/Users/yejunsin/Documents/data-preprocess/QA/generated_questions_100_v1_qwen.json"
    }
    output_dir = "/Users/yejunsin/Documents/data-preprocess/comparison"
    output_html_path = os.path.join(output_dir, "index.html")

    # --- Load all model data ---
    model_data = {}
    try:
        for model, file_path in model_files.items():
            with open(file_path, 'r', encoding='utf-8') as f:
                model_data[model] = json.load(f)
    except FileNotFoundError as e:
        print(f"Error: Could not find a source file: {e.filename}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from a file.")
        return

    # --- HTML Head and Style ---
    html_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Model Answer Comparison</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; background-color: #f0f2f5; color: #1c1e21; }
        h1 { text-align: center; color: #1c1e21; padding: 20px 0; }
        .container { max-width: 1200px; margin: auto; padding: 20px; }
        .tab { overflow: hidden; border-bottom: 1px solid #ccc; background-color: #fff; }
        .tab button { background-color: inherit; float: left; border: none; outline: none; cursor: pointer; padding: 14px 16px; transition: 0.3s; font-size: 17px; border-bottom: 3px solid transparent; }
        .tab button:hover { background-color: #f1f1f1; }
        .tab button.active { border-bottom: 3px solid #0056b3; color: #0056b3; font-weight: bold; }
        .tabcontent { display: none; padding: 20px 0; border-top: none; }
        .question-block { background-color: #fff; margin-bottom: 25px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        .question-title { font-size: 1.5em; color: #0056b3; margin-top: 0; line-height: 1.4; }
        .answers-container { display: flex; flex-direction: row; gap: 20px; justify-content: space-between; }
        .answer-card { border: 1px solid #e1e1e1; border-radius: 8px; padding: 20px; width: 31%; background-color: #f9f9f9; flex-grow: 1; }
        .answer-card h4 { margin-top: 0; color: #333; border-bottom: 2px solid #0056b3; padding-bottom: 10px; font-size: 1.1em; }
        .markdown-content { font-size: 1em; line-height: 1.6; }
        .markdown-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .markdown-content th, .markdown-content td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .markdown-content th { background-color: #f2f2f2; }
        .markdown-content ul, .markdown-content ol { padding-left: 20px; }
        .markdown-content blockquote { border-left: 4px solid #ccc; padding-left: 15px; color: #666; margin-left: 0; font-style: italic; }
        .markdown-content pre { background-color: #f5f5f5; padding: 12px; border-radius: 5px; overflow-x: auto; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; font-size: 0.95em; }
        .markdown-content code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; background-color: #eee; padding: 3px 5px; border-radius: 4px; }
        .markdown-content pre code { background-color: transparent; padding: 0; }
        @media (max-width: 900px) {
            .answers-container { flex-direction: column; }
            .answer-card { width: 100%; }
        }
    </style>
</head>
<body>
<div class="container">
<h1>Model Answer Comparison (First 5 Questions)</h1>
<div class="tab">
'''

    # --- Tab Buttons ---
    is_first_tab = True
    for code, name in languages.items():
        active_id = 'id="defaultOpen"' if is_first_tab else ''
        html_content += f'<button class="tablinks" onclick="openLanguage(event, \'{code}\')" {active_id}>{name}</button>\n'
        is_first_tab = False
    html_content += '</div>\n'

    # --- Tab Content ---
    for lang_code, lang_name in languages.items():
        html_content += f'<div id="{lang_code}" class="tabcontent">\n'
        
        # Get the first 5 questions for the current language from the gemma file
        lang_questions = [q for q in model_data['gemma'] if q['language'] == lang_code][:5]

        for question_data in lang_questions:
            question_id = question_data['id']
            question_text = question_data['question']

            html_content += f'''
            <div class="question-block">
                <h2 class="question-title">{html.escape(question_id)}:<br>{html.escape(question_text)}</h2>
                <div class="answers-container">
            '''

            for model_name in ['gemma', 'microsoft', 'qwen']:
                answer = "Answer not found."
                # Find the corresponding answer in this model's data
                for item in model_data[model_name]:
                    if item.get('id') == question_id:
                        answer = item.get('model_answer', "Answer not found.")
                        break
                
                html_content += f'''
                    <div class="answer-card">
                        <h4>{model_name.capitalize()}</h4>
                        <div class="markdown-content">{html.escape(answer)}</div>
                    </div>
                '''

            html_content += '''
                </div>
            </div>
            '''
        html_content += '</div>\n'

    # --- HTML Footer and Script ---
    html_content += '''
</div>
<script>
function openLanguage(evt, langName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(langName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.markdown-content').forEach(function(element) {
        element.innerHTML = marked.parse(element.textContent || "");
    });
    document.getElementById("defaultOpen").click();
});
</script>
</body>
</html>
'''

    with open(output_html_path, 'w', encoding='utf-8') as f_html:
        f_html.write(html_content)
    print(f"Successfully created {output_html_path}")

if __name__ == "__main__":
    create_direct_html_comparison()
