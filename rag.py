"""Lightweight RAG retrieval for Moto Genie vehicle datasets.

The retriever converts each car/bike row into a searchable text document,
creates a TF-IDF vector index, and returns the most relevant rows for a
user query. Gemini is then given only the retrieved context to generate the
answer.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class VehicleRAG:
    """A local TF-IDF retriever over the Moto Genie vehicle datasets."""

    def __init__(self, cars_df: pd.DataFrame, bikes_df: pd.DataFrame):
        self.documents: List[str] = []
        self.metadata: List[Dict[str, Any]] = []
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            sublinear_tf=True,
        )
        self.matrix = None
        self._build_index(cars_df, bikes_df)

    @staticmethod
    def _clean_value(value: Any) -> str:
        if pd.isna(value):
            return "N/A"
        return str(value).strip()

    def _row_to_document(self, row: pd.Series, vehicle_type: str) -> str:
        parts = [f"Vehicle type: {vehicle_type}"]
        for key, value in row.to_dict().items():
            value = self._clean_value(value)
            if value and value.lower() != "nan":
                parts.append(f"{key}: {value}")
        return " | ".join(parts)

    def _build_index(self, cars_df: pd.DataFrame, bikes_df: pd.DataFrame) -> None:
        if not cars_df.empty:
            for _, row in cars_df.iterrows():
                self.documents.append(self._row_to_document(row, "car"))
                self.metadata.append({"type": "car", "data": row.to_dict()})

        if not bikes_df.empty:
            for _, row in bikes_df.iterrows():
                self.documents.append(self._row_to_document(row, "bike"))
                self.metadata.append({"type": "bike", "data": row.to_dict()})

        if self.documents:
            self.matrix = self.vectorizer.fit_transform(self.documents)

    def retrieve(
        self,
        query: str,
        top_k: int = 6,
        vehicle_type: Optional[str] = None,
        min_score: float = 0.03,
    ) -> List[Dict[str, Any]]:
        """Return relevant records with optional type filtering and a relevance floor."""
        if not query or self.matrix is None:
            return []

        query_vector = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vector, self.matrix).ravel()

        candidate_indices = range(len(self.metadata))
        if vehicle_type:
            normalized_type = vehicle_type.strip().lower()
            candidate_indices = [
                index for index, item in enumerate(self.metadata)
                if str(item.get("type", "")).strip().lower() == normalized_type
            ]

        ranked = sorted(
            candidate_indices,
            key=lambda index: float(scores[index]),
            reverse=True,
        )

        results: List[Dict[str, Any]] = []
        for index in ranked:
            score = float(scores[index])
            if score < max(0.0, min_score):
                break
            item = dict(self.metadata[index])
            item["score"] = round(score, 4)
            results.append(item)
            if len(results) >= max(1, top_k):
                break

        return results

    @staticmethod
    def format_context(results: List[Dict[str, Any]]) -> str:
        if not results:
            return "No relevant vehicle records were retrieved from the Moto Genie datasets."

        blocks = []
        for number, result in enumerate(results, start=1):
            vehicle_type = result["type"].upper()
            score = result.get("score", 0)
            blocks.append(
                f"RETRIEVED RECORD {number} ({vehicle_type}, relevance={score}):\n"
                f"{result['data']}"
            )
        return "\n\n".join(blocks)
