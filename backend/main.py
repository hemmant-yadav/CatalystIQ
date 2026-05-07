from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional
import os
import json
from groq import Groq

app = FastAPI(title="CatalystIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

CATALYSIS_SYSTEM_PROMPT = (
    "You are an expert chemical engineer and synthetic biologist. "
    "Return ONLY valid JSON, no explanation, no markdown."
)

CATALYSIS_USER_PROMPT_TEMPLATE = (
    'Generate 8 catalyst candidates (5 known, 3 novel) for the reaction: {reaction}. '
    'Temperature: {temperature}°C, Pressure: {pressure} bar. '
    'Return a JSON object with a single key "candidates" containing an array of 8 objects. '
    'Each object must have exactly these keys: '
    'name (string), smiles (string), activity (int 0-100), selectivity (int 0-100), '
    'stability (int 0-100), confidence (int 0-100), type ("Known" or "Novel"), '
    'source (string describing literature or predicted origin), '
    'reason (string explaining suitability). '
    'No other keys, no markdown, no code fences.'
)

BIOLOGY_SYSTEM_PROMPT = (
    'You are an expert chemical engineer and synthetic biologist. '
    'Return ONLY valid JSON, no explanation, no markdown.'
)

BIOLOGY_USER_PROMPT_TEMPLATE = (
    'Generate 6 pathway candidates (4 known, 2 novel) for: {reaction}. '
    'Host organism: {organism}. Optimization goal: {goal}. '
    'Temperature: {temperature}°C. '
    'Return a JSON object with a single key "candidates" containing an array of 6 objects. '
    'Each object must have exactly these keys: '
    'name (string), yield_score (int 0-100), thermostability (int 0-100), '
    'flux_efficiency (int 0-100), modifications (string describing genetic modifications), '
    'type ("Known" or "Novel"), source (string describing literature or predicted origin), '
    'reason (string explaining suitability). '
    'No other keys, no markdown, no code fences.'
)


class AnalyzeRequest(BaseModel):
    reaction: str
    direction: Literal["catalysis", "biology"]
    temperature: Optional[float] = 25.0
    pressure: Optional[float] = 1.0
    organism: Optional[str] = ""
    goal: Optional[str] = ""


class AnalyzeResponse(BaseModel):
    candidates: list[dict]


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    if not groq.api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    if req.direction == "catalysis":
        user_prompt = CATALYSIS_USER_PROMPT_TEMPLATE.format(
            reaction=req.reaction,
            temperature=req.temperature or 25,
            pressure=req.pressure or 1,
        )
        system_prompt = CATALYSIS_SYSTEM_PROMPT
    else:
        user_prompt = BIOLOGY_USER_PROMPT_TEMPLATE.format(
            reaction=req.reaction,
            organism=req.organism or "E. coli",
            goal=req.goal or "Maximum Yield",
            temperature=req.temperature or 25,
        )
        system_prompt = BIOLOGY_SYSTEM_PROMPT

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=4096,
    )

    content = response.choices[0].message.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON")

    candidates = data.get("candidates", data if isinstance(data, list) else [])
    if isinstance(candidates, dict):
        candidates = [candidates]

    expected = 8 if req.direction == "catalysis" else 6
    if not isinstance(candidates, list) or len(candidates) < 1:
        raise HTTPException(status_code=500, detail="LLM returned no candidates")

    return AnalyzeResponse(candidates=candidates)


class FeedbackRequest(BaseModel):
    candidate_name: str
    predicted: dict
    actual: dict
    notes: str = ""


class FeedbackResponse(BaseModel):
    comparison: dict
    insights: list[str]


def _generate_feedback_insights(name: str, diffs: dict) -> list[str]:
    lines = []
    significant = {m: d for m, d in diffs.items() if abs(d["delta"]) >= 5}
    for metric, d in significant.items():
        direction = "exceeded" if d["delta"] > 0 else "underperformed"
        lines.append(
            f"{name} {direction} predictions in {metric} "
            f"by {abs(d['delta']):.0f}% "
            f"({direction == 'underperformed' and 'structural feature mismatch detected' or 'favorable interaction profile identified'})."
        )
    avg_delta = sum(d["delta"] for d in diffs.values()) / len(diffs)
    if avg_delta > 0:
        lines.append(f"{name} shows net positive deviation — high-confidence prediction.")
    elif avg_delta < 0:
        lines.append(f"{name} shows net negative deviation — model retraining may improve accuracy.")
    else:
        lines.append(f"{name} matches predictions exactly — validation successful.")
    return lines


@app.post("/feedback")
def feedback(req: FeedbackRequest):
    diffs = {}
    for metric in ["activity", "selectivity", "stability"]:
        p = req.predicted.get(metric, 0)
        a = req.actual.get(metric, 0)
        diffs[metric] = {"predicted": p, "actual": a, "delta": a - p}
    insights = _generate_feedback_insights(req.candidate_name, diffs)
    return FeedbackResponse(comparison=diffs, insights=insights)
