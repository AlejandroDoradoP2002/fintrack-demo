import os, requests, openai
from dotenv import load_dotenv
import os
import requests
import pandas as pd
from typing import Dict, List
from .claude_analyzer_agent import FinancialAnalyticsAPI
load_dotenv()#loading the .env file

API_KEY = os.getenv("OPENAI_API_KEY")
BUSINESS_NEWS = os.getenv("buss_news_api")
client = openai.OpenAI(api_key=API_KEY)


def get_news_today():
    # print(BUSINESS_NEWS)
    response = requests.get(f"https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey={BUSINESS_NEWS}")
    print(response.status_code)
    if response.status_code == 200:
        news_data = response.json()
        articles = news_data['articles']
        # print(len(articles))
        headlines = [article['description'] for article in articles if article['description']]
        # headlines = headlines[:10] if len(headlines) > 10 else headlines
        counter = 1
        result = "Here is the news for today:\n"
        for headline in headlines:
            result += f"News {counter}: {headline}\n"
            counter += 1
        # print(len(result))
        # print(result)
        return result
    else:
        return "Error fetching news"
    

# Example usage
def get_userData_analysis(sample_purchases: List[Dict], budgets=[]) -> str:
    
    # Get the API key from environment variable or pass it directly
    # Example: export ANTHROPIC_API_KEY="your-api-key-here"
    
    # Initialize the API client
    client = FinancialAnalyticsAPI()
    
    # Get current month analysis
    current_month_analysis =  "Current Month Analysis:" + client.get_current_month_data(sample_purchases, budgets)
    
    
    # Get YTD analysis
    ytd_analysis ="\n\n\nYear-to-Date Analysis:\n" + client.get_ytd_data(sample_purchases)
    print(current_month_analysis + ytd_analysis)
    return current_month_analysis + ytd_analysis





