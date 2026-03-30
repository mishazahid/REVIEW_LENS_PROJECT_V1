import os
import pandas as pd
from typing import Dict, List, Optional


class ReviewSummarizer:
    """Generate summaries using OpenAI LLM with rule-based fallback."""

    def __init__(self):
        self.openai_client = None
        self._init_openai()

    def _init_openai(self):
        try:
            from openai import OpenAI
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
        except ImportError:
            pass

    def _llm_summarize(self, prompt: str) -> Optional[str]:
        """Call OpenAI API for summarization."""
        if not self.openai_client:
            return None
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert e-commerce analyst. Provide concise, actionable insights from customer review data. Be specific and data-driven."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=500,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            return None

    def summarize_product(self, df: pd.DataFrame, product: str) -> Dict:
        """Generate a summary for a specific product."""
        product_df = df[df["product"] == product] if "product" in df.columns else df

        if len(product_df) == 0:
            return {"product": product, "summary": "No reviews found."}

        total = len(product_df)
        avg_rating = round(float(product_df["rating"].mean()), 2) if "rating" in product_df.columns else None

        sentiment_counts = {}
        if "sentiment" in product_df.columns:
            sentiment_counts = product_df["sentiment"].value_counts().to_dict()

        positives = []
        negatives = []
        if "sentiment" in product_df.columns:
            pos_reviews = product_df[product_df["sentiment"] == "positive"]["clean_text"].tolist()
            neg_reviews = product_df[product_df["sentiment"] == "negative"]["clean_text"].tolist()
            positives = self._extract_key_phrases(pos_reviews, top_n=5)
            negatives = self._extract_key_phrases(neg_reviews, top_n=5)

        # Try LLM summary
        sample_reviews = product_df["review_text"].head(15).tolist()
        llm_prompt = (
            f"Summarize these {total} customer reviews for '{product}' "
            f"(avg rating: {avg_rating}/5). Focus on key strengths, weaknesses, and patterns.\n\n"
            f"Sample reviews:\n" + "\n".join(f"- {r}" for r in sample_reviews)
        )
        llm_summary = self._llm_summarize(llm_prompt)

        # Fallback summary
        pos_count = sentiment_counts.get("positive", 0)
        neg_count = sentiment_counts.get("negative", 0)
        neu_count = sentiment_counts.get("neutral", 0)

        fallback = (
            f"Based on {total} reviews, {product} has an average rating of {avg_rating}/5. "
            f"Sentiment breakdown: {pos_count} positive ({round(pos_count/total*100)}%), "
            f"{neu_count} neutral ({round(neu_count/total*100)}%), "
            f"{neg_count} negative ({round(neg_count/total*100)}%)."
        )
        if positives:
            fallback += f" Key strengths: {', '.join(positives[:3])}."
        if negatives:
            fallback += f" Main concerns: {', '.join(negatives[:3])}."

        return {
            "product": product,
            "total_reviews": total,
            "avg_rating": avg_rating,
            "sentiment": {k: int(v) for k, v in sentiment_counts.items()},
            "key_positives": positives,
            "key_negatives": negatives,
            "summary": llm_summary or fallback,
            "llm_generated": llm_summary is not None,
        }

    def summarize_all(self, df: pd.DataFrame) -> Dict:
        """Generate summaries for all products."""
        if "product" not in df.columns:
            return {"overall": self.summarize_product(df, "All Products")}

        summaries = {}
        for product in df["product"].unique():
            summaries[str(product)] = self.summarize_product(df, product)

        total = len(df)
        avg_rating = round(float(df["rating"].mean()), 2) if "rating" in df.columns else None
        best_product = max(summaries.items(), key=lambda x: x[1].get("avg_rating", 0) or 0)
        worst_product = min(summaries.items(), key=lambda x: x[1].get("avg_rating", 5) or 5)

        summaries["_overall"] = {
            "total_reviews": total,
            "total_products": len(df["product"].unique()),
            "avg_rating": avg_rating,
            "best_rated": {"product": best_product[0], "rating": best_product[1].get("avg_rating")},
            "worst_rated": {"product": worst_product[0], "rating": worst_product[1].get("avg_rating")},
        }

        return summaries

    def generate_executive_summary(self, df: pd.DataFrame, aspects: Dict, trends: Dict) -> str:
        """Generate a high-level executive summary."""
        total = len(df)

        # Gather context for LLM
        context_parts = []
        if "sentiment" in df.columns:
            pos_pct = round(len(df[df["sentiment"] == "positive"]) / total * 100)
            neg_pct = round(len(df[df["sentiment"] == "negative"]) / total * 100)
            context_parts.append(f"Total reviews: {total}. Positive: {pos_pct}%, Negative: {neg_pct}%.")

        if aspects:
            top_aspects = list(aspects.keys())[:5]
            aspect_details = []
            for a in top_aspects:
                d = aspects[a]
                aspect_details.append(f"{a}: {d.get('mention_count')} mentions, avg rating {d.get('avg_rating')}")
            context_parts.append("Top aspects: " + "; ".join(aspect_details))

        if "product" in df.columns:
            for product in df["product"].unique():
                p_df = df[df["product"] == product]
                context_parts.append(f"{product}: {len(p_df)} reviews, avg {round(float(p_df['rating'].mean()), 2)}/5")

        llm_prompt = (
            "Generate a concise executive summary (3-5 sentences) of this e-commerce review analysis. "
            "Highlight key findings, top concerns, and recommendations.\n\n"
            + "\n".join(context_parts)
        )
        llm_summary = self._llm_summarize(llm_prompt)

        if llm_summary:
            return llm_summary

        # Fallback
        parts = []
        if "sentiment" in df.columns:
            pos_pct = round(len(df[df["sentiment"] == "positive"]) / total * 100)
            neg_pct = round(len(df[df["sentiment"] == "negative"]) / total * 100)
            parts.append(f"Across {total} reviews, {pos_pct}% are positive and {neg_pct}% are negative.")

        if aspects:
            top_aspects = list(aspects.keys())[:3]
            parts.append(f"Most discussed topics: {', '.join(top_aspects)}.")
            worst = min(aspects.items(), key=lambda x: x[1].get("avg_rating", 5) or 5)
            parts.append(f"Lowest rated aspect: {worst[0]} (avg {worst[1].get('avg_rating')}/5).")

        if trends and "monthly_sentiment" in trends:
            monthly = trends["monthly_sentiment"]
            if len(monthly) >= 2:
                recent = monthly[-1]
                prev = monthly[-2]
                if recent.get("negative", 0) > prev.get("negative", 0):
                    parts.append("Warning: Negative sentiment is trending upward in the most recent period.")
                elif recent.get("positive", 0) > prev.get("positive", 0):
                    parts.append("Positive sentiment has improved in the most recent period.")

        return " ".join(parts)

    def _extract_key_phrases(self, texts: List[str], top_n: int = 5) -> List[str]:
        if not texts:
            return []

        from collections import Counter
        phrases = Counter()
        stop_words = {
            "the", "a", "an", "is", "it", "and", "or", "but", "in", "on", "at",
            "to", "for", "of", "with", "by", "this", "that", "was", "very", "i",
            "my", "me", "we", "you", "its", "not", "so", "just", "also", "really",
        }

        for text in texts:
            words = str(text).lower().split()
            words = [w for w in words if w not in stop_words and len(w) > 2]
            for i in range(len(words) - 1):
                phrase = f"{words[i]} {words[i+1]}"
                phrases[phrase] += 1

        return [phrase for phrase, _ in phrases.most_common(top_n)]
