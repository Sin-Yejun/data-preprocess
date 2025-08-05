import json
import pandas as pd

INPUT_PATH = "final_data/QA_qwen3_no_thinking_scored.jsonl"  # 실제 경로로 수정

with open(INPUT_PATH, encoding="utf-8") as f:
    data = [json.loads(line) for line in f]

df = pd.DataFrame(data)

df["num"] = df["id"].str.split("_").str[1].astype(int)
df = df[df["num"] <= 100]

df["lang"] = df["id"].str.split("_").str[0]

# 분석 대상 점수 열
cols = ["accuracy", "relevance", "explanatory_power", "fluency", "creativity"]

# 1) 언어별 평균
lang_means = df.groupby("lang")[cols].mean()

# 2) 행 평균: 언어별 5개 지표의 평균
lang_means["row_mean"] = lang_means.mean(axis=1)

# 3) 열 평균: 전체 언어를 통틀어 지표별 평균
col_means = lang_means[cols].mean().to_frame().T
col_means.index = ["column_mean"]

# 4) 두 결과 붙이기
summary = pd.concat([lang_means, col_means])

# 소수 둘째 자리로 보기 좋게
summary = summary.round(2)


print(summary.to_csv())
