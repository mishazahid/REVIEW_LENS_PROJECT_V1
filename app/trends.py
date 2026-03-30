import pandas as pd
import numpy as np
from typing import Dict, List, Optional


class TrendAnalyzer:
    """Analyze sentiment and topic trends over time."""

    def analyze_sentiment_trends(self, df: pd.DataFrame) -> Dict:
        """Track sentiment changes over time (monthly)."""
        if "date" not in df.columns or "sentiment" not in df.columns:
            return {}

        df = df.dropna(subset=["date"])
        if len(df) == 0:
            return {}

        df["month"] = df["date"].dt.to_period("M").astype(str)

        monthly = []
        for month in sorted(df["month"].unique()):
            month_df = df[df["month"] == month]
            counts = month_df["sentiment"].value_counts().to_dict()
            total = len(month_df)
            monthly.append({
                "month": month,
                "total": int(total),
                "positive": int(counts.get("positive", 0)),
                "neutral": int(counts.get("neutral", 0)),
                "negative": int(counts.get("negative", 0)),
                "avg_rating": round(float(month_df["rating"].mean()), 2) if "rating" in month_df.columns else None,
                "positive_pct": round(counts.get("positive", 0) / total * 100, 1) if total > 0 else 0,
                "negative_pct": round(counts.get("negative", 0) / total * 100, 1) if total > 0 else 0,
            })

        return {"monthly_sentiment": monthly}

    def analyze_rating_trends(self, df: pd.DataFrame) -> Dict:
        """Track average rating over time."""
        if "date" not in df.columns or "rating" not in df.columns:
            return {}

        df = df.dropna(subset=["date"])
        if len(df) == 0:
            return {}

        df["month"] = df["date"].dt.to_period("M").astype(str)

        monthly_ratings = []
        for month in sorted(df["month"].unique()):
            month_df = df[df["month"] == month]
            monthly_ratings.append({
                "month": month,
                "avg_rating": round(float(month_df["rating"].mean()), 2),
                "count": int(len(month_df)),
                "min_rating": int(month_df["rating"].min()),
                "max_rating": int(month_df["rating"].max()),
            })

        return {"monthly_ratings": monthly_ratings}

    def detect_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detect unusual spikes in negative sentiment."""
        if "date" not in df.columns or "sentiment" not in df.columns:
            return []

        df = df.dropna(subset=["date"])
        if len(df) == 0:
            return []

        df["month"] = df["date"].dt.to_period("M").astype(str)

        monthly_neg = []
        for month in sorted(df["month"].unique()):
            month_df = df[df["month"] == month]
            neg_pct = len(month_df[month_df["sentiment"] == "negative"]) / len(month_df) * 100
            monthly_neg.append({"month": month, "negative_pct": neg_pct})

        if len(monthly_neg) < 3:
            return []

        # Detect months where negative % is >1.5 std above mean
        neg_values = [m["negative_pct"] for m in monthly_neg]
        mean_neg = np.mean(neg_values)
        std_neg = np.std(neg_values)

        anomalies = []
        for m in monthly_neg:
            if std_neg > 0 and m["negative_pct"] > mean_neg + 1.5 * std_neg:
                anomalies.append({
                    "month": m["month"],
                    "negative_pct": round(m["negative_pct"], 1),
                    "avg_negative_pct": round(mean_neg, 1),
                    "severity": "high" if m["negative_pct"] > mean_neg + 2 * std_neg else "moderate",
                })

        return anomalies

    def get_all_trends(self, df: pd.DataFrame) -> Dict:
        """Get all trend data combined."""
        sentiment_trends = self.analyze_sentiment_trends(df)
        rating_trends = self.analyze_rating_trends(df)
        anomalies = self.detect_anomalies(df)

        return {
            **sentiment_trends,
            **rating_trends,
            "anomalies": anomalies,
        }
