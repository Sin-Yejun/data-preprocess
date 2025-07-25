# grading_pipeline.py
from __future__ import annotations

import json
import os
import time
from typing import List

from pydantic import BaseModel, Field, ValidationError
from tqdm import tqdm

from google import genai
from google.genai import types

import os
os.environ["GEMINI_API_KEY"] = "AIzaSyCJY8QvCppVV18s5aHZ-uGAg21EGpwq_XM"


# ---------------------------------------------------------------------------
# 1. Pydantic schema
# ---------------------------------------------------------------------------
class EvaluationScores(BaseModel):
    """Five rubric dimensions scored 0‑20 (inclusive)."""

    accuracy: int = Field(
        ..., ge=0, le=20, description="How factually correct the answer is."
    )
    relevance: int = Field(
        ..., ge=0, le=20, description="How well the answer matches the intent and scope of the question."
    )
    explanatory_power: int = Field(
        ..., ge=0, le=20, description="How well the answer provides reasoning, justification, or logical clarity."
    )
    fluency: int = Field(
        ..., ge=0, le=20, description="How grammatically fluent, coherent, and natural the language is."
    )
    creativity: int = Field(
        ..., ge=0, le=20, description="How original or insightful the response is beyond the obvious."
    )

# ---------------------------------------------------------------------------
# 2. Prompt builder
# ---------------------------------------------------------------------------
def _build_prompt(item: dict) -> str:
    schema_example = {
        "accuracy": 17,
        "relevance": 19,
        "explanatory_power": 16,
        "fluency": 18,
        "creativity": 15,
    }
    return (
        "You are an expert grader. Evaluate the model's answer to the given question "
        "along five criteria, each on a 0‑20 scale (0 = very poor, 20 = perfect).\n"
        "Respond **only** with JSON matching *exactly* the following schema (no markdown, quotes, or extra keys):\n"
        f"{json.dumps(schema_example)}\n\n"
        f"Question (language={item['language']}):\n{item['question']}\n\n"
        f"Model Answer:\n{item['model_answer']}\n"
    )

# ---------------------------------------------------------------------------
# 3. Batch driver
# ---------------------------------------------------------------------------
def main(
    input_path: str = "final_data/QA_qwen3.json",
    output_path: str = "final_data/QA_qwen3_scored.json",
):
    # (1) 인증
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("Set GEMINI_API_KEY environment variable.")
    client = genai.Client(api_key=api_key)

    # (2) 로드
    with open(input_path, "r", encoding="utf-8") as f:
        samples: List[dict] = json.load(f)

    # (3) 인라인 요청 구성
    inline_requests = []
    for item in samples:
        prompt = _build_prompt(item)
        inline_requests.append(
            {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}],
                    }
                ],
                "config": {
                    "response_mime_type": "application/json",
                    "response_schema": EvaluationScores,
                },
            }
        )

    # (4) 배치 생성
    batch_job = client.batches.create(
        model="models/gemini-2.5-pro",    
        src=inline_requests,
        config={"display_name": f"grading-{int(time.time())}"},
    )  # :contentReference[oaicite:0]{index=0}

    job_name = batch_job.name
    print(f"Batch job created: {job_name}")

    # (5) 상태 폴링
    done_states = {
        "BATCH_STATE_SUCCEEDED",
        "BATCH_STATE_FAILED",
        "BATCH_STATE_CANCELLED",
    }
    running_state = "BATCH_STATE_RUNNING"

    with tqdm(total=len(samples), desc="Batch processing") as pbar:
        while True:
            job = client.batches.get(name=job_name)

            # 진행 중 상태 처리
            if job.state == running_state and hasattr(job, "state_info"):
                stats = job.state_info.task_stats
                processed = stats.succeeded_count + stats.failed_count
                pbar.n = int(processed)
                pbar.refresh()

            # 완료 상태 확인
            if job.state in done_states:
                if job.state == "BATCH_STATE_SUCCEEDED":
                    pbar.n = pbar.total
                    pbar.refresh()
                break

            time.sleep(5)

    # (6) 결과 파싱 (inline 결과)
    results = []
    for idx, inline_resp in enumerate(tqdm(job.dest.inlined_responses, desc="Parsing responses")):  # :contentReference[oaicite:1]{index=1}
        if inline_resp.response:
            try:
                raw_json = json.loads(inline_resp.response.text)
                score = EvaluationScores.model_validate(raw_json)
                results.append({"id": samples[idx]["id"], **score.model_dump()})
            except (json.JSONDecodeError, ValidationError) as e:
                results.append({"id": samples[idx]["id"], "error": str(e)})
        else:  # API 단에서 에러난 항목
            results.append({"id": samples[idx]["id"], "error": inline_resp.error})

    # (7) 저장
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✔︎ Saved {len(results)} evaluations → {output_path}")


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    main()
