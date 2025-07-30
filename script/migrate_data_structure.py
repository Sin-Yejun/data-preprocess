import json
import os

def migrate_data():
    """
    Migrates the data structures of votes.json and user_votes.json to a new,
    more scalable format. It creates a new questions.json file to map IDs
    to question texts and rewrites the original files into a new format
    grouped by language.
    """
    # --- Configuration ---
    # Assumes the script is in a 'script' subdirectory of the project root.
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    user_votes_path = os.path.join(project_root, 'user_votes.json')
    votes_path = os.path.join(project_root, 'votes.json')
    questions_path = os.path.join(project_root, 'questions.json')
    
    # Output paths for the new files to avoid overwriting original data
    new_user_votes_path = os.path.join(project_root, 'user_votes_new.json')
    new_votes_path = os.path.join(project_root, 'votes_new.json')

    # --- Load existing data ---
    try:
        with open(user_votes_path, 'r', encoding='utf-8') as f:
            user_votes_data = json.load(f)
        with open(votes_path, 'r', encoding='utf-8') as f:
            votes_data = json.load(f)
    except FileNotFoundError as e:
        print(f"Error: Could not find input file {e.filename}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from file. Details: {e}")
        return

    # --- 1. Create questions.json and a mapping from question text to new ID ---
    questions = {}
    question_to_id_map = {}
    counters = {}

    for question_text, details in votes_data.items():
        # Use language from details, default to 'en' if missing
        lang = details.get("language", "en")
        
        if lang not in counters:
            counters[lang] = 1
            questions[lang] = {}
            
        # Generate a new ID, e.g., q001, q002
        q_id = f"q{counters[lang]:03d}"
        
        questions[lang][q_id] = question_text
        question_to_id_map[question_text] = {"lang": lang, "id": q_id}
        
        counters[lang] += 1

    # --- 2. Transform votes.json ---
    new_votes = {}
    for question_text, details in votes_data.items():
        if question_text in question_to_id_map:
            map_info = question_to_id_map[question_text]
            lang, q_id = map_info["lang"], map_info["id"]
            
            # Copy details but exclude the now-redundant 'language' key
            new_details = {k: v for k, v in details.items() if k != "language"}
            
            if lang not in new_votes:
                new_votes[lang] = {}
            new_votes[lang][q_id] = new_details

    # --- 3. Transform user_votes.json ---
    new_user_votes = {}
    for user_id, votes in user_votes_data.items():
        new_user_votes[user_id] = {}
        for question_text, details in votes.items():
            if question_text in question_to_id_map:
                map_info = question_to_id_map[question_text]
                lang, q_id = map_info["lang"], map_info["id"]
                model = details.get("model")
                
                if lang not in new_user_votes[user_id]:
                    new_user_votes[user_id][lang] = {}
                
                new_user_votes[user_id][lang][q_id] = model

    # --- 4. Write new files ---
    try:
        with open(questions_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        
        with open(new_votes_path, 'w', encoding='utf-8') as f:
            json.dump(new_votes, f, ensure_ascii=False, indent=2)
            
        with open(new_user_votes_path, 'w', encoding='utf-8') as f:
            json.dump(new_user_votes, f, ensure_ascii=False, indent=2)
            
        print("Migration successful!")
        print(f"New files created: {os.path.basename(questions_path)}, {os.path.basename(new_votes_path)}, {os.path.basename(new_user_votes_path)}")
        print("Please review the new files. If they are correct, you can manually replace the old files with the new ones.")

    except IOError as e:
        print(f"Error writing files: {e}")

if __name__ == "__main__":
    migrate_data()
