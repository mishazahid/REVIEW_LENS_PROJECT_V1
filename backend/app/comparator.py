import pandas as pd
from typing import Dict, List


class ProductComparator:
    """Compare products based on sentiment, ratings, and aspects."""

    def compare_products(self, df: pd.DataFrame, products: List[str] = None) -> Dict:
        """Generate a comparison of multiple products."""
        if "product" not in df.columns:
            return {}

        if products is None:
            products = df["product"].unique().tolist()

        comparison = {}
        for product in products:
            product_df = df[df["product"] == product]
            if len(product_df) == 0:
                continue

            sentiment_counts = {}
            if "sentiment" in product_df.columns:
                sentiment_counts = product_df["sentiment"].value_counts().to_dict()

            total = len(product_df)
            pos_count = sentiment_counts.get("positive", 0)
            neg_count = sentiment_counts.get("negative", 0)

            comparison[str(product)] = {
                "total_reviews": total,
                "avg_rating": round(float(product_df["rating"].mean()), 2) if "rating" in product_df.columns else None,
                "sentiment": {
                    "positive": int(pos_count),
                    "neutral": int(sentiment_counts.get("neutral", 0)),
                    "negative": int(neg_count),
                },
                "positive_pct": round(pos_count / total * 100, 1) if total > 0 else 0,
                "negative_pct": round(neg_count / total * 100, 1) if total > 0 else 0,
                "satisfaction_score": round((pos_count / total * 100) - (neg_count / total * 100), 1) if total > 0 else 0,
            }

        # Rank products
        ranked = sorted(comparison.items(), key=lambda x: x[1].get("satisfaction_score", 0), reverse=True)
        for rank, (product, data) in enumerate(ranked, 1):
            comparison[product]["rank"] = rank

        return comparison

    def get_comparison_matrix(self, df: pd.DataFrame, aspects: Dict) -> Dict:
        """Create an aspect-based comparison matrix across products."""
        if "product" not in df.columns:
            return {}

        products = df["product"].unique().tolist()
        matrix = {}

        from .topics import TopicExtractor
        extractor = TopicExtractor()

        for product in products:
            product_df = df[df["product"] == product]
            product_aspects = extractor.extract_aspects(product_df)
            matrix[str(product)] = {}
            for aspect, data in product_aspects.items():
                matrix[str(product)][aspect] = {
                    "mentions": data.get("mention_count", 0),
                    "avg_rating": data.get("avg_rating"),
                }

        return matrix
