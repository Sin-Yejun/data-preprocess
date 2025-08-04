import asyncio, json, os
from pathlib import Path
from typing import Optional, List

from openai import AsyncOpenAI
from pydantic import BaseModel, Field, ValidationError, field_validator

# ────────────────────────────────────────────────────────────────────
# 1) Pydantic 모델 정의
# ────────────────────────────────────────────────────────────────────
class QAItem(BaseModel):
    id: str = Field(..., description="e.g. ko_120")
    language: str = Field(..., pattern="^(ko|en|ja|zh-Hant|id)$")
    question: str
    model_answer: str
    is_correct: Optional[bool] = Field(
        None, description="True if model_answer is 100% correct")

    # id가 101–125 사이에 해당하는지 편의 메서드
    def needs_grading(self) -> bool:
        try:
            num = int(self.id.split("_")[-1])
            return 101 <= num <= 125
        except ValueError:
            return False

    # optional: model_answer 공백 정리
    @field_validator("model_answer", mode="before")
    @classmethod
    def strip_answer(cls, v: str) -> str:
        return v.strip()

# ────────────────────────────────────────────────────────────────────
# 2) OpenAI 설정
# ────────────────────────────────────────────────────────────────────
client = AsyncOpenAI()  # 환경변수 OPENAI_API_KEY 필요

PROMPT = """\
You are a strict grader for very short arithmetic or workout-volume questions.
Return exactly "True" if the student's answer is 100 % correct; otherwise return "False".

Question: {question}
Student answer: {answer}

Respond only True or False.
"""

# ────────────────────────────────────────────────────────────────────
# 3) 채점 로직
# ────────────────────────────────────────────────────────────────────
async def grade_item(item: QAItem) -> QAItem:
    """id 101‑125에 해당하는 항목만 OpenAI로 채점한다."""
    if not item.needs_grading():  # 패스 스루
        return item

    resp = await client.chat.completions.create(
        model="gpt-4.1",       # 필요 시 변경
        messages=[{"role": "user",
                   "content": PROMPT.format(
                       question=item.question,
                       answer=item.model_answer)}],
        temperature=0,
        max_tokens=1,
    )
    verdict = resp.choices[0].message.content.strip().lower()
    item.is_correct = verdict.startswith("true")
    return item

# ────────────────────────────────────────────────────────────────────
# 4) 메인 파이프라인
# ────────────────────────────────────────────────────────────────────
async def main(src="calculation_gemma.json", dst="calculation_gemma_scored.json"):
    # 4‑1. 입력 로드 및 검증
    raw = json.loads(Path(src).read_text(encoding="utf-8"))
    try:
        qa_items: List[QAItem] = [QAItem.model_validate(obj) for obj in raw]
    except ValidationError as e:
        print("❌ JSON 형식 오류:", e)
        return

    # 4‑2. 비동기 채점
    graded_items = await asyncio.gather(*(grade_item(q) for q in qa_items))

    # 4‑3. 직렬화 & 저장
    out_json = [q.model_dump(mode="json", exclude_none=True)
                for q in graded_items]
    Path(dst).write_text(json.dumps(out_json, ensure_ascii=False, indent=2),
                         encoding="utf-8")
    print(f"✅ 채점 완료 → {dst}")

if __name__ == "__main__":
    asyncio.run(main())
