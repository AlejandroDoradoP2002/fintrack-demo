import os
import json
import requests
from datetime import datetime, timedelta
import pandas as pd
from typing import Dict, List
from tika import parser

class FinancialAnalyticsAPI:
    """
    A class to interact with Anthropic's Claude API for financial analytics.
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize with your Anthropic API key.
        """
        self.api_key = api_key or os.environ.get("anthropic_api")
        if not self.api_key:
            raise ValueError("API key must be provided or set as ANTHROPIC_API_KEY environment variable")
        
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
        
    def _format_financial_data(self, 
                              purchases: List[Dict], 
                              timeframe: str,
                              budgets: list[Dict] = []) -> str:
        """
        Format financial data for the API prompt.
        """
        purchases_str = json.dumps(purchases, indent=2)
        return f"""
        Here is financial data for {timeframe}:
        
        User purchases: {purchases_str}

        {f"Budgets: {budgets}" if budgets == [] else ""}
        
        Please analyze this financial data and provide:
        1. Breakdown of spending by category
        2. Total spending for the timeframe
        3. Top spending categories
        4. Any unusual spending patterns or anomalies
        5. Comparison to previous periods if available
        6. Recommendations for budget optimization
        
        Format the response in a clear and concise manner. If the User purchases data is not finiancial data, please respond with "No financial data provided."
        """
    
    def analyze_finances(self, 
                         purchases: List[Dict], 
                         timeframe: str = "current month",
                         budgets: list[Dict] = []) -> Dict:
        """
        Send financial data to Claude API and get analytics.
        
        Args:
            purchases: List of purchase dictionaries with at least 'amount' and 'category' keys
            timeframe: String describing the time period (e.g., "current month", "previous month", "YTD")
            
        Returns:
            Dictionary containing the financial analysis
        """
        prompt = self._format_financial_data(purchases, timeframe, budgets)
        
        payload = {
            "model": "claude-3-7-sonnet-20250219",
            "max_tokens": 4000,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"API request failed with status {response.status_code}: {response.text}")
            
        result = response.json()
        
        # Extract the assistant's message content
        analysis_text = result["content"][0]["text"]
        
        # Try to parse JSON from the response
        # try:
        #     # Find JSON in the response (might be wrapped in markdown code blocks)
        #     json_start = analysis_text.find('{')
        #     json_end = analysis_text.rfind('}') + 1
        #     if json_start >= 0 and json_end > json_start:
        #         json_str = analysis_text[json_start:json_end]
        #         analysis = json.loads(json_str)
        #     else:
        #         # If no JSON is found, return the raw text
        #         analysis = {"raw_analysis": analysis_text}
        # except json.JSONDecodeError:
        #     # If JSON parsing fails, return the raw text
        #     analysis = {"raw_analysis": analysis_text}
            
        return analysis_text

    def get_current_month_data(self, purchases: List[Dict], budgets=[]) -> Dict:
        """Get financial analytics for the current month."""
        now = datetime.now()
        current_month = now.strftime("%B %Y")
        return self.analyze_finances(purchases, f"current month ({current_month})", budgets)
    
    def get_previous_month_data(self, purchases: List[Dict], budgets=[]) -> Dict:
        """Get financial analytics for the previous month."""
        now = datetime.now()
        first_day = datetime(now.year, now.month, 1)
        last_month = first_day - timedelta(days=1)
        prev_month = last_month.strftime("%B %Y")
        return self.analyze_finances(purchases, f"previous month ({prev_month})", budgets)
    
    def get_ytd_data(self, purchases: List[Dict]) -> Dict:
        """Get year-to-date financial analytics."""
        now = datetime.now()
        year = now.year
        return self.analyze_finances(purchases, f"year-to-date ({year})")
    def filter_purchases_by_date(self, 
                               purchases: List[Dict], 
                               start_date: str = None, 
                               end_date: str = None) -> List[Dict]:
        """
        Filter purchases by date range.
        
        Args:
            purchases: List of purchase dictionaries
            start_date: Start date string in 'YYYY-MM-DD' format
            end_date: End date string in 'YYYY-MM-DD' format
            
        Returns:
            Filtered list of purchases
        """
        if not start_date and not end_date:
            return purchases
            
        filtered = []
        
        for purchase in purchases:
            purchase_date = purchase.get('date')
            if not purchase_date:
                continue
                
            if start_date and purchase_date < start_date:
                continue
                
            if end_date and purchase_date > end_date:
                continue
                
            filtered.append(purchase)
            
        return filtered
    
    def load_purchases_from_csv(agent, filepath) -> List[Dict]:
        """
        Load purchase data from a CSV file.

        Expected CSV format:
        date,amount,category,vendor
        2025-04-01,120.50,Groceries,Whole Foods
        ...

        Returns:
            List of purchase dictionaries
        """

        # print("from agent:", filepath)
        # print("rat:", rat)
        try:
            df = pd.read_csv(filepath)
            # Convert DataFrame to list of dictionaries
            purchases = df.to_dict('records')
            return purchases
        except Exception as e:
            print(f"Error loading CSV file: {e}")
            return []
    
    def load_purchases_any_type(filepath: str) -> str:
        try:
            parser = parser.from_file(filepath)
            return parser['content']
        except Exception as e:
            print(f"Error loading file: {e}")
            raise e
        