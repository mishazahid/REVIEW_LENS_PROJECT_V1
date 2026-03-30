import os
import io
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict

from .data_processor import DataProcessor
from .sentiment import SentimentAnalyzer
from .topics import TopicExtractor
from .summarizer import ReviewSummarizer
from .prioritizer import ComplaintPrioritizer
from .trends import TrendAnalyzer
from .comparator import ProductComparator

app = FastAPI(title="Review Intelligence API", version="1.0.0")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for the current analysis session
analysis_state = {
    "df": None,
    "columns": None,
    "eda": None,
    "sentiment_dist": None,
    "sentiment_by_product": None,
    "model_metrics": None,
    "topics": None,
    "aspects": None,
    "summaries": None,
    "priorities": None,
    "trends": None,
    "comparison": None,
    "executive_summary": None,
    "word_frequencies": None,
}

processor = DataProcessor()
sentiment_analyzer = SentimentAnalyzer()
topic_extractor = TopicExtractor()
summarizer = ReviewSummarizer()
prioritizer = ComplaintPrioritizer()
trend_analyzer = TrendAnalyzer()
comparator = ProductComparator()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "has_data": analysis_state["df"] is not None}


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV file and auto-detect columns."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    processor.load_from_dataframe(df)
    detected = processor.detect_columns()

    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "detected_mapping": detected,
    }


@app.post("/api/load-sample")
def load_sample_dataset():
    """Load the built-in sample dataset."""
    sample_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample_reviews.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample dataset not found")

    df = processor.load_csv(sample_path)
    detected = processor.detect_columns()

    return {
        "filename": "sample_reviews.csv",
        "rows": len(df),
        "columns": list(df.columns),
        "detected_mapping": detected,
    }


class ColumnMapping(BaseModel):
    review_text: Optional[str] = None
    rating: Optional[str] = None
    product: Optional[str] = None
    date: Optional[str] = None
    title: Optional[str] = None


@app.post("/api/analyze")
def run_analysis(mapping: Optional[ColumnMapping] = None):
    """Run the full analysis pipeline."""
    if processor.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Upload or load sample first.")

    column_map = mapping.dict() if mapping else processor.column_mapping

    # Step 1: Clean data
    df = processor.clean_data(column_map)

    # Step 2: EDA
    eda = processor.get_eda_stats()
    word_freq = processor.get_word_frequencies()

    # Step 3: Sentiment analysis
    df = sentiment_analyzer.analyze_textblob(df)
    df = sentiment_analyzer.analyze_rating_based(df)
    model_metrics = sentiment_analyzer.train_ml_model(df)
    sentiment_dist = sentiment_analyzer.get_sentiment_distribution(df)
    sentiment_by_product = sentiment_analyzer.get_sentiment_by_product(df)

    # Step 4: Topic extraction
    topics = topic_extractor.extract_topics_lda(df)
    aspects = topic_extractor.extract_aspects(df)
    keyword_freq = topic_extractor.get_keyword_frequencies(df)

    # Step 5: Summarization
    summaries = summarizer.summarize_all(df)

    # Step 6: Prioritization
    priorities = prioritizer.prioritize(df, aspects)
    priority_summary = prioritizer.get_priority_summary(priorities)

    # Step 7: Trends
    trends = trend_analyzer.get_all_trends(df)

    # Step 8: Product comparison
    comparison = comparator.compare_products(df)

    # Step 9: Executive summary
    exec_summary = summarizer.generate_executive_summary(df, aspects, trends)

    # Store in state
    analysis_state.update({
        "df": df,
        "columns": column_map,
        "eda": eda,
        "sentiment_dist": sentiment_dist,
        "sentiment_by_product": sentiment_by_product,
        "model_metrics": model_metrics,
        "topics": topics,
        "aspects": aspects,
        "keyword_frequencies": keyword_freq,
        "summaries": summaries,
        "priorities": priorities,
        "priority_summary": priority_summary,
        "trends": trends,
        "comparison": comparison,
        "executive_summary": exec_summary,
        "word_frequencies": word_freq,
    })

    return {"status": "success", "total_reviews": len(df)}


@app.get("/api/dashboard")
def get_dashboard():
    """Get all dashboard data in one call."""
    if analysis_state["df"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")

    return {
        "eda": analysis_state["eda"],
        "sentiment_distribution": analysis_state["sentiment_dist"],
        "sentiment_by_product": analysis_state["sentiment_by_product"],
        "model_metrics": analysis_state["model_metrics"],
        "topics": analysis_state["topics"],
        "aspects": analysis_state["aspects"],
        "keyword_frequencies": analysis_state.get("keyword_frequencies", []),
        "summaries": analysis_state["summaries"],
        "priorities": analysis_state["priorities"],
        "priority_summary": analysis_state.get("priority_summary"),
        "trends": analysis_state["trends"],
        "comparison": analysis_state["comparison"],
        "executive_summary": analysis_state["executive_summary"],
        "word_frequencies": analysis_state["word_frequencies"],
    }


@app.get("/api/eda")
def get_eda():
    if analysis_state["eda"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")
    return analysis_state["eda"]


@app.get("/api/sentiment")
def get_sentiment():
    if analysis_state["sentiment_dist"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")
    return {
        "distribution": analysis_state["sentiment_dist"],
        "by_product": analysis_state["sentiment_by_product"],
        "model_metrics": analysis_state["model_metrics"],
    }


@app.get("/api/topics")
def get_topics():
    if analysis_state["topics"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")
    return {
        "topics": analysis_state["topics"],
        "aspects": analysis_state["aspects"],
    }


@app.get("/api/priorities")
def get_priorities():
    if analysis_state["priorities"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")
    return {
        "priorities": analysis_state["priorities"],
        "summary": analysis_state.get("priority_summary"),
    }


@app.get("/api/trends")
def get_trends():
    if analysis_state["trends"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")
    return analysis_state["trends"]


@app.get("/api/comparison")
def get_comparison():
    if analysis_state["comparison"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")
    return analysis_state["comparison"]


@app.get("/api/summaries")
def get_summaries():
    if analysis_state["summaries"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")
    return {
        "summaries": analysis_state["summaries"],
        "executive_summary": analysis_state["executive_summary"],
    }


@app.get("/api/reviews")
def get_reviews(product: Optional[str] = None, sentiment: Optional[str] = None, page: int = 1, per_page: int = 20):
    """Get paginated reviews with optional filters."""
    if analysis_state["df"] is None:
        raise HTTPException(status_code=400, detail="No analysis run yet")

    df = analysis_state["df"]

    if product:
        df = df[df["product"] == product]
    if sentiment:
        df = df[df["sentiment"] == sentiment]

    total = len(df)
    start = (page - 1) * per_page
    end = start + per_page
    page_df = df.iloc[start:end]

    reviews = []
    for _, row in page_df.iterrows():
        reviews.append({
            "review_text": str(row.get("review_text", "")),
            "rating": int(row["rating"]) if "rating" in row and pd.notna(row["rating"]) else None,
            "sentiment": str(row.get("sentiment", "")),
            "product": str(row.get("product", "")),
            "date": str(row["date"].date()) if "date" in row and pd.notna(row.get("date")) else None,
            "polarity": round(float(row.get("polarity", 0)), 3) if "polarity" in row else None,
        })

    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


# Serve React static files in production
static_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        """Serve React app for all non-API routes."""
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
