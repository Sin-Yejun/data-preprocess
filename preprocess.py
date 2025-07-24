import os
import json

# 입출력 경로 설정
folder_path = "QA_json"
output_path = "QAdata.jsonl"

# 결과를 저장할 리스트
qa_entries = []
total_count = 0

# 지정된 폴더의 모든 JSON 파일을 순회합니다.
for filename in os.listdir(folder_path):
    if filename.endswith(".json"):
        file_path = os.path.join(folder_path, filename)
        count = 0
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                # 각 줄의 JSON 데이터를 불러옵니다.
                data = json.loads(line.strip())
                
                # 'question'과 'answer'를 추출하여 새로운 딕셔너리를 만듭니다.
                qa_pair = {
                    "question": data["question"],
                    "answer": data["answer"]
                }
                qa_entries.append(qa_pair)
                count += 1
        print(f"'{filename}' 파일에서 {count}개의 항목을 처리했습니다.")
        total_count += count

# jsonl 형식(한 줄에 하나의 JSON 객체)으로 저장합니다.
with open(output_path, "w", encoding="utf-8") as f:
    for entry in qa_entries:
        # 딕셔너리를 JSON 문자열로 변환하여 파일에 씁니다.
        json.dump(entry, f, ensure_ascii=False)
        f.write("\n")

print(f"\n총 {total_count}개의 항목을 '{output_path}' 파일에 저장했습니다.")