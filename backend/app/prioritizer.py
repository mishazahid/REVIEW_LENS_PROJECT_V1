import pandas as pd
import numpy as np
from typing import Dict, List


class ComplaintPrioritizer:
    """Prioritize complaints based on frequency, severity, and trends."""

    def prioritize(self, df: pd.DataFrame, aspects: Dict) -> List[Dict]:
        """Score and rank issues by priority."""
        if not aspects:
            return []

        priorities = []
        total_reviews = len(df)

        for aspect, data in aspects.items():
            mention_count = data.get("mention_count", 0)
            avg_rating = data.get("avg_rating", 3.0) or 3.0
            sentiment = data.get("sentiment", {})
            neg_count = sentiment.get("negative", 0)

            # Frequency score (0-40): how often the issue is mentioned
            freq_score = min(40, (mention_count / total_reviews) * 100)

            # Severity score (0-35): based on avg rating (lower = more severe)
            severity_score = max(0, (5 - avg_rating) / 5 * 35)

            # Negativity score (0-25): ratio of negative mentions
            neg_ratio = neg_count / mention_count if mention_count > 0 else 0
            neg_score = neg_ratio * 25

            total_score = round(freq_score + severity_score + neg_score, 1)

            priority_level = "low"
            if total_score >= 50:
                priority_level = "critical"
            elif total_score >= 35:
                priority_level = "high"
            elif total_score >= 20:
                priority_level = "medium"

            priorities.append({
                "aspect": aspect,
                "priority_score": total_score,
                "priority_level": priority_level,
                "mention_count": mention_count,
                "avg_rating": avg_rating,
                "negative_mentions": neg_count,
                "frequency_score": round(freq_score, 1),
                "severity_score": round(severity_score, 1),
                "negativity_score": round(neg_score, 1),
                "sample_complaints": data.get("sample_reviews", [])[:2],
            })

        priorities.sort(key=lambda x: x["priority_score"], reverse=True)
        return priorities

    def get_priority_summary(self, priorities: List[Dict]) -> Dict:
        """Summarize priority distribution."""
        levels = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for p in priorities:
            levels[p["priority_level"]] += 1

        return {
            "total_issues": len(priorities),
            "distribution": levels,
            "top_issue": priorities[0] if priorities else None,
        }
