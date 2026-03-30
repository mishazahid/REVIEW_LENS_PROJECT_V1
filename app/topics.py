import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation, NMF
from collections import Counter
import re


class TopicExtractor:
    """Extract topics and aspects from reviews using TF-IDF and LDA."""

    def __init__(self):
        self.lda_model = None
        self.vectorizer = None
        self.feature_names = None

    # Predefined aspect keywords for e-commerce
    ASPECT_KEYWORDS = {
        "battery": ["battery", "charge", "charging", "power", "drain", "dies"],
        "screen": ["screen", "display", "resolution", "bright", "blurry", "pixels"],
        "delivery": ["delivery", "shipping", "arrived", "delayed", "fast", "package", "packaging"],
        "quality": ["quality", "build", "durable", "broke", "defective", "cracked", "sturdy"],
        "price": ["price", "value", "expensive", "cheap", "worth", "money", "budget", "overpriced"],
        "sound": ["sound", "audio", "speaker", "volume", "music", "tinny", "bass"],
        "performance": ["fast", "slow", "speed", "performance", "lag", "responsive", "loading"],
        "camera": ["camera", "photo", "picture", "video", "image"],
        "customer_service": ["service", "support", "return", "refund", "replacement", "customer"],
        "design": ["design", "look", "size", "weight", "lightweight", "compact", "portable"],
        "software": ["software", "update", "app", "apps", "interface", "alexa", "feature"],
        "connectivity": ["wifi", "bluetooth", "connection", "disconnect", "connect", "wireless"],
    }

    def extract_topics_lda(self, df: pd.DataFrame, n_topics: int = 5, n_words: int = 8) -> Dict:
        """Extract topics using LDA."""
        if "clean_text" not in df.columns:
            return {}

        self.vectorizer = CountVectorizer(
            max_features=3000, stop_words="english", min_df=2, max_df=0.95
        )
        doc_term_matrix = self.vectorizer.fit_transform(df["clean_text"])
        self.feature_names = self.vectorizer.get_feature_names_out()

        self.lda_model = LatentDirichletAllocation(
            n_components=n_topics, random_state=42, max_iter=20
        )
        self.lda_model.fit(doc_term_matrix)

        topics = {}
        for idx, topic in enumerate(self.lda_model.components_):
            top_word_indices = topic.argsort()[-n_words:][::-1]
            top_words = [self.feature_names[i] for i in top_word_indices]
            topics[f"Topic {idx + 1}"] = {
                "words": top_words,
                "weight": round(float(topic[top_word_indices].sum()), 2),
            }

        return topics

    def extract_aspects(self, df: pd.DataFrame) -> Dict:
        """Extract predefined aspects and their frequency/sentiment."""
        if "clean_text" not in df.columns:
            return {}

        aspect_results = {}
        for aspect, keywords in self.ASPECT_KEYWORDS.items():
            mask = df["clean_text"].apply(
                lambda text: any(kw in str(text).lower() for kw in keywords)
            )
            matching = df[mask]
            if len(matching) > 0:
                sentiment_counts = {}
                if "sentiment" in df.columns:
                    sentiment_counts = matching["sentiment"].value_counts().to_dict()

                avg_rating = None
                if "rating" in matching.columns:
                    avg_rating = round(float(matching["rating"].mean()), 2)

                aspect_results[aspect] = {
                    "mention_count": int(len(matching)),
                    "percentage": round(len(matching) / len(df) * 100, 1),
                    "avg_rating": avg_rating,
                    "sentiment": {k: int(v) for k, v in sentiment_counts.items()},
                    "sample_reviews": matching["review_text"].head(3).tolist(),
                }

        # Sort by mention count
        aspect_results = dict(
            sorted(aspect_results.items(), key=lambda x: x[1]["mention_count"], reverse=True)
        )
        return aspect_results

    def get_keyword_frequencies(self, df: pd.DataFrame) -> List[Dict]:
        """Get keyword frequencies for topic visualization."""
        if "clean_text" not in df.columns:
            return []

        all_keywords = []
        for aspect, keywords in self.ASPECT_KEYWORDS.items():
            for text in df["clean_text"]:
                for kw in keywords:
                    if kw in str(text).lower():
                        all_keywords.append(kw)

        counts = Counter(all_keywords)
        return [{"keyword": k, "count": c, "aspect": self._get_aspect(k)}
                for k, c in counts.most_common(30)]

    def _get_aspect(self, keyword: str) -> str:
        for aspect, keywords in self.ASPECT_KEYWORDS.items():
            if keyword in keywords:
                return aspect
        return "other"
