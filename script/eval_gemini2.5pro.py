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
    # (1) 인증 - 코드에서 API 키를 제거하고 환경 변수에서 직접 읽어오도록 합니다.
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. 'export GEMINI_API_KEY=...'를 실행해주세요.")
    
    # ★개선됨: configure를 사용하는 것이 최신 스타일이지만, client 방식도 여전히 유효합니다.
    # 코드를 최소한으로 수정하기 위해 기존 client 방식을 유지합니다.
    genai.configure(api_key=api_key)

    # (2) 로드
    with open(input_path, "r", encoding="utf-8") as f:
        samples: List[dict] = json.load(f)

    # (3) 요청 구성 (★개선됨: 더 명확한 변수명 사용)
    requests = []
    for item in samples:
        prompt = _build_prompt(item)
        requests.append(
            {
                "model": "models/gemini-3.5-pro",
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}],
                    }
                ],
                # 'generation_config' 대신 'config'를 사용하는 것은 배치 API의 특징일 수 있음
                # JSON 출력을 강제하는 이 방식은 매우 훌륭합니다.
                "generation_config": {
                    "response_mime_type": "application/json",
                    "response_schema": EvaluationScores,
                },
            }
        )

    # (4) 배치 생성
    # ★개선됨: create_batch_jobs는 여러 작업을 동시에 생성할 때 사용. 단일 작업은 이 방식이 더 명확.
    # requests 리스트를 직접 전달합니다.
    batch_job = genai.create_batch_request(
        requests=requests,
        # job 이름은 여기서 설정하지 않고, 반환된 객체에서 얻습니다.
    )

    job_name = batch_job.name
    print(f"Batch job created: {job_name}")

    # (5) 상태 폴링 (수정 없음, 잘 작성됨)
    done_states = {
        types.BatchJob.State.SUCCEEDED,
        types.BatchJob.State.FAILED,
        types.BatchJob.State.CANCELLED,
    }
    
    pbar_description = "Batch processing"
    with tqdm(total=len(samples), desc=pbar_description) as pbar:
        while True:
            # ★수정됨: 최신 스타일에 맞춰 get_batch_request 사용
            job = genai.get_batch_request(name=job_name)

            processed = job.metadata.progress.succeeded_count + job.metadata.progress.failed_count
            pbar.n = int(processed)
            pbar.set_description(f"{pbar_description} ({job.state.name})")
            pbar.refresh()

            if job.state in done_states:
                if job.state == types.BatchJob.State.SUCCEEDED:
                    pbar.n = pbar.total
                    pbar.refresh()
                break
            time.sleep(10) # API 호출 빈도를 줄이기 위해 10초로 늘리는 것을 권장

    # (6) 결과 파싱
    results = []
    if job.state == types.BatchJob.State.SUCCEEDED:
        # ★수정됨: 결과는 job.results에서 가져옵니다.
        for idx, response_part in enumerate(tqdm(job.results, desc="Parsing responses")):
            try:
                # 결과 JSON 문자열을 파싱
                raw_json = json.loads(response_part.text)
                score = EvaluationScores.model_validate(raw_json)
                results.append({"id": samples[idx]["id"], **score.model_dump()})
            except (json.JSONDecodeError, ValidationError) as e:
                results.append({"id": samples[idx]["id"], "error": str(e)})
            except Exception as e:
                results.append({"id": samples[idx]["id"], "error": f"An unexpected error occurred: {e}"})
    else:
        print(f"Batch job failed with state: {job.state.name}")
        results.append({"error": f"Batch job did not succeed. Final state: {job.state.name}", "details": str(job.error)})


    # (7) 저장 (수정 없음)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✔︎ Saved {len(results)} evaluations → {output_path}")


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    main()