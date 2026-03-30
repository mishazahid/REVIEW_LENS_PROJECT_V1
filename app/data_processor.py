import pandas as pd
import numpy as np
import re
from typing import Optional, Dict, List, Tuple


class DataProcessor:
    """Handles data ingestion, cleaning, and preprocessing."""

    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.column_mapping: Dict[str, str] = {}

    def load_csv(self, file_path: str) -> pd.DataFrame:
        self.df = pd.read_csv(file_path)
        return self.df

    def load_from_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        self.df = df.copy()
        return self.df

    def detect_columns(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Optional[str]]:
        """Auto-detect which columns map to review_text, rating, product, date."""
        if df is not None:
            self.df = df
        if self.df is None:
            raise ValueError("No data loaded")

        cols = [c.lower().strip() for c in self.df.columns]
        original_cols = list(self.df.columns)
        detected = {"review_text": None, "rating": None, "product": None, "date": None, "title": None}

        # Review text detection
        text_keywords = ["review", "text", "comment", "feedback", "body", "content", "description"]
        for i, col in enumerate(cols):
            if any(kw in col for kw in text_keywords) and ("rating" not in col):
                detected["review_text"] = original_cols[i]
                break
        if not detected["review_text"]:
            # Fallback: find longest average string column
            str_cols = self.df.select_dtypes(include=["object"]).columns
            if len(str_cols) > 0:
                avg_lens = {c: self.df[c].astype(str).str.len().mean() for c in str_cols}
                detected["review_text"] = max(avg_lens, key=avg_lens.get)

        # Rating detection
        rating_keywords = ["rating", "score", "stars", "star"]
        for i, col in enumerate(cols):
            if any(kw in col for kw in rating_keywords):
                detected["rating"] = original_cols[i]
                break

        # Product detection
        product_keywords = ["product", "name", "item", "brand", "asin"]
        for i, col in enumerate(cols):
            if any(kw in col for kw in product_keywords) and ("user" not in col):
                detected["product"] = original_cols[i]
                break

        # Date detection
        date_keywords = ["date", "time", "timestamp", "created"]
        for i, col in enumerate(cols):
            if any(kw in col for kw in date_keywords):
                detected["date"] = original_cols[i]
                break

        # Title detection
        title_keywords = ["title", "summary", "subject", "heading"]
        for i, col in enumerate(cols):
            if any(kw in col for kw in title_keywords):
                detected["title"] = original_cols[i]
                break

        self.column_mapping = detected
        return detected

    def clean_data(self, column_mapping: Optional[Dict[str, str]] = None) -> pd.DataFrame:
        """Clean and preprocess the dataframe."""
        if self.df is None:
            raise ValueError("No data loaded")

        if column_mapping:
            self.column_mapping = column_mapping

        df = self.df.copy()

        # Standardize column names
        rename_map = {}
        for standard_name, original_name in self.column_mapping.items():
            if original_name and original_name in df.columns:
                rename_map[original_name] = standard_name
        df = df.rename(columns=rename_map)

        # Remove duplicates based on review text
        if "review_text" in df.columns:
            df = df.drop_duplicates(subset=["review_text"], keep="first")
            df = df.dropna(subset=["review_text"])
            df["review_text"] = df["review_text"].astype(str)
            # Clean text
            df["clean_text"] = df["review_text"].apply(self._clean_text)
            # Word count
            df["word_count"] = df["clean_text"].str.split().str.len()
            # Remove very short reviews (less than 3 words)
            df = df[df["word_count"] >= 3]

        # Clean rating
        if "rating" in df.columns:
            df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
            df = df.dropna(subset=["rating"])
            df["rating"] = df["rating"].astype(int)

        # Parse date
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce")

        df = df.reset_index(drop=True)
        self.df = df
        return df

    def _clean_text(self, text: str) -> str:
        """Normalize and clean review text."""
        text = str(text).lower()
        text = re.sub(r"http\S+|www\S+", "", text)
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"[^a-zA-Z0-9\s.,!?'-]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def get_eda_stats(self) -> Dict:
        """Generate exploratory data analysis statistics."""
        if self.df is None:
            raise ValueError("No data loaded")

        df = self.df
        stats = {
            "total_reviews": len(df),
            "columns": list(df.columns),
        }

        if "rating" in df.columns:
            rating_dist = df["rating"].value_counts().sort_index().to_dict()
            stats["rating_distribution"] = {int(k): int(v) for k, v in rating_dist.items()}
            stats["average_rating"] = round(float(df["rating"].mean()), 2)

        if "product" in df.columns:
            product_counts = df["product"].value_counts().to_dict()
            stats["products"] = {str(k): int(v) for k, v in product_counts.items()}
            stats["total_products"] = df["product"].nunique()

        if "word_count" in df.columns:
            stats["avg_review_length"] = round(float(df["word_count"].mean()), 1)
            stats["min_review_length"] = int(df["word_count"].min())
            stats["max_review_length"] = int(df["word_count"].max())

        if "date" in df.columns:
            valid_dates = df["date"].dropna()
            if len(valid_dates) > 0:
                stats["date_range"] = {
                    "start": str(valid_dates.min().date()),
                    "end": str(valid_dates.max().date()),
                }

        return stats

    def get_word_frequencies(self, top_n: int = 30) -> List[Dict]:
        """Get most common words in reviews."""
        if self.df is None or "clean_text" not in self.df.columns:
            return []

        stop_words = {
            "the", "a", "an", "is", "it", "and", "or", "but", "in", "on", "at",
            "to", "for", "of", "with", "by", "from", "this", "that", "was", "were",
            "are", "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "will", "would", "could", "should", "may", "might", "can", "i", "my",
            "me", "we", "our", "you", "your", "he", "she", "they", "them", "its",
            "not", "no", "so", "very", "just", "also", "than", "then", "about",
            "up", "out", "if", "more", "some", "all", "one", "two", "into",
            "when", "what", "which", "who", "how", "each", "other", "there",
            "their", "only", "after", "before", "over", "such", "through",
            "as", "am", "get", "got", "really", "even", "much", "still",
        }

        all_words = " ".join(self.df["clean_text"]).split()
        word_counts = {}
        for word in all_words:
            if word not in stop_words and len(word) > 2:
                word_counts[word] = word_counts.get(word, 0) + 1

        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [{"word": w, "count": c} for w, c in sorted_words]
