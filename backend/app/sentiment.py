import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split


class SentimentAnalyzer:
    """Sentiment analysis using both baseline (TextBlob) and ML approaches."""

    def __init__(self):
        self.model = None
        self.vectorizer = None

    def analyze_textblob(self, df: pd.DataFrame) -> pd.DataFrame:
        """Baseline sentiment using TextBlob polarity."""
        df = df.copy()
        df["polarity"] = df["clean_text"].apply(lambda x: TextBlob(str(x)).sentiment.polarity)
        df["subjectivity"] = df["clean_text"].apply(lambda x: TextBlob(str(x)).sentiment.subjectivity)
        df["sentiment"] = df["polarity"].apply(self._polarity_to_label)
        return df

    def analyze_rating_based(self, df: pd.DataFrame) -> pd.DataFrame:
        """Derive sentiment from star ratings as ground truth."""
        df = df.copy()
        if "rating" in df.columns:
            df["sentiment_from_rating"] = df["rating"].apply(
                lambda r: "positive" if r >= 4 else ("negative" if r <= 2 else "neutral")
            )
        return df

    def train_ml_model(self, df: pd.DataFrame) -> Dict:
        """Train a TF-IDF + Logistic Regression sentiment classifier."""
        if "sentiment_from_rating" not in df.columns:
            df = self.analyze_rating_based(df)

        X = df["clean_text"].values
        y = df["sentiment_from_rating"].values

        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        X_tfidf = self.vectorizer.fit_transform(X)

        # If dataset is small, use all for training and report on training set
        if len(df) < 50:
            self.model = LogisticRegression(max_iter=1000, random_state=42)
            self.model.fit(X_tfidf, y)
            y_pred = self.model.predict(X_tfidf)
            accuracy = accuracy_score(y, y_pred)
            report = classification_report(y, y_pred, output_dict=True, zero_division=0)
            return {"accuracy": round(accuracy, 4), "report": report, "split": "full_dataset"}

        X_train, X_test, y_train, y_test = train_test_split(
            X_tfidf, y, test_size=0.2, random_state=42, stratify=y
        )

        self.model = LogisticRegression(max_iter=1000, random_state=42)
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

        return {"accuracy": round(accuracy, 4), "report": report, "split": "80_20"}

    def predict(self, texts: List[str]) -> List[str]:
        """Predict sentiment for new texts using trained model."""
        if self.model is None or self.vectorizer is None:
            return [self._polarity_to_label(TextBlob(t).sentiment.polarity) for t in texts]
        X = self.vectorizer.transform(texts)
        return list(self.model.predict(X))

    def get_sentiment_distribution(self, df: pd.DataFrame) -> Dict:
        """Get sentiment counts and percentages."""
        if "sentiment" not in df.columns:
            return {}

        counts = df["sentiment"].value_counts().to_dict()
        total = len(df)
        distribution = {}
        for label in ["positive", "neutral", "negative"]:
            count = counts.get(label, 0)
            distribution[label] = {
                "count": int(count),
                "percentage": round(count / total * 100, 1) if total > 0 else 0,
            }
        return distribution

    def get_sentiment_by_product(self, df: pd.DataFrame) -> Dict:
        """Sentiment breakdown per product."""
        if "sentiment" not in df.columns or "product" not in df.columns:
            return {}

        result = {}
        for product in df["product"].unique():
            product_df = df[df["product"] == product]
            counts = product_df["sentiment"].value_counts().to_dict()
            result[str(product)] = {
                "positive": int(counts.get("positive", 0)),
                "neutral": int(counts.get("neutral", 0)),
                "negative": int(counts.get("negative", 0)),
                "avg_rating": round(float(product_df["rating"].mean()), 2) if "rating" in product_df.columns else None,
            }
        return result

    def _polarity_to_label(self, polarity: float) -> str:
        if polarity > 0.1:
            return "positive"
        elif polarity < -0.1:
            return "negative"
        return "neutral"
