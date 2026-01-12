"""
Performance & Load Testing with Locust
Test the crypto platform under heavy load to evaluate scalability and latency
"""

from locust import HttpUser, task, between
import json
import random


class CryptoPlatformUser(HttpUser):
    """Simulates a real user interacting with the crypto platform"""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Called when a simulated user starts"""
        self.access_token = None
        self.user_id = None
        # Generate unique email for each simulated user
        user_number = random.randint(1, 100000)
        self.email = f"testuser{user_number}@example.com"
        self.password = "TestPass123!"
        self.signup()
        self.login()
    
    def signup(self):
        """Register a new user"""
        signup_data = {
            "name": f"Test User {random.randint(1, 100000)}",
            "email": self.email,
            "password": self.password
        }
        response = self.client.post("/api/auth/register/", json=signup_data)
        # If user already exists, that's fine, we'll login anyway
    
    def login(self):
        """Authenticate user"""
        credentials = {
            "email": self.email,
            "password": self.password
        }
        response = self.client.post("/api/auth/login/", json=credentials)
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access")
    
    def get_headers(self):
        """Return headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    @task(3)
    def get_assets(self):
        """Fetch list of assets - heavy traffic (weight: 3)"""
        self.client.get("/api/assets/", headers=self.get_headers(), name="/api/assets/")
    
    @task(2)
    def get_price_history(self):
        """Fetch price history for a random asset"""
        symbols = ["btc", "eth", "xrp", "bnb", "ada"]
        symbol = random.choice(symbols)
        self.client.get(
            f"/api/price-history/{symbol}/?range=7d",
            headers=self.get_headers(),
            name="/api/price-history/[symbol]"
        )
    
    @task(2)
    def get_ohlc_data(self):
        """Fetch OHLC candlestick data"""
        symbols = ["btc", "eth", "xrp", "bnb", "ada"]
        symbol = random.choice(symbols)
        self.client.get(
            f"/api/ohlc/{symbol}/?interval=1h&range=24h",
            headers=self.get_headers(),
            name="/api/ohlc/[symbol]"
        )
    
    @task(2)
    def get_heatmap(self):
        """Fetch market heatmap"""
        self.client.get(
            "/api/heatmap/?range=24h",
            headers=self.get_headers(),
            name="/api/heatmap/"
        )
    
    @task(1)
    def get_indicators(self):
        """Fetch technical indicators"""
        symbols = ["btc", "eth", "xrp"]
        symbol = random.choice(symbols)
        self.client.get(
            f"/api/indicators/{symbol}/",
            headers=self.get_headers(),
            name="/api/indicators/[symbol]"
        )
    
    @task(1)
    def get_alerts(self):
        """Fetch user alerts"""
        self.client.get(
            "/api/alerts/",
            headers=self.get_headers(),
            name="/api/alerts/"
        )
    
    @task(1)
    def get_portfolio(self):
        """Fetch virtual portfolio"""
        self.client.get(
            "/api/virtual-portfolio/",
            headers=self.get_headers(),
            name="/api/virtual-portfolio/"
        )
    
    @task(1)
    def get_notifications(self):
        """Fetch notifications"""
        self.client.get(
            "/api/notifications/",
            headers=self.get_headers(),
            name="/api/notifications/"
        )
    
    # Note: Create alert task commented out to reduce write load during testing
    # Uncomment if you want to test write operations
    # @task(1)
    # def create_alert(self):
    #     """Create a price alert"""
    #     alert_data = {
    #         "asset_id": 1,  # Bitcoin
    #         "condition": random.choice(["above", "below"]),
    #         "target_price": str(random.uniform(20000, 80000))
    #     }
    #     self.client.post(
    #         "/api/alerts/",
    #         json=alert_data,
    #         headers=self.get_headers(),
    #         name="/api/alerts/ [POST]"
    #     )



class AdminUser(HttpUser):
    """Simulates an admin user monitoring the system"""
    
    wait_time = between(2, 5)
    
    def on_start(self):
        """Admin login"""
        self.access_token = None
        self.login_admin()
    
    def login_admin(self):
        """Authenticate as admin"""
        credentials = {
            "email": "admin@example.com",
            "password": "admin123456"
        }
        response = self.client.post("/api/auth/admin-login/", json=credentials)
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access")
    
    def get_headers(self):
        """Return headers with admin auth"""
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    @task(2)
    def get_dashboard_stats(self):
        """Fetch admin dashboard statistics"""
        self.client.get(
            "/api/admin/dashboard/stats/",
            headers=self.get_headers(),
            name="/api/admin/dashboard/stats/"
        )
    
    @task(1)
    def get_users_list(self):
        """Fetch all users"""
        self.client.get(
            "/api/admin/users/",
            headers=self.get_headers(),
            name="/api/admin/users/"
        )
    
    @task(1)
    def get_metrics(self):
        """Fetch Prometheus metrics"""
        self.client.get(
            "/metrics/metrics",
            name="/metrics/metrics"
        )
