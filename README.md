🚀 TradeX — Real-Time Virtual Trading Platform
A high-performance virtual trading platform that simulates real-world market behavior with live data, interactive charts, and a complete trading experience.

🌍 Overview
TradeX is designed to replicate how modern trading platforms work — combining real-time data, responsive UI, and a custom-built charting system.
It goes beyond basic dashboards by implementing live updates, trading simulation, and system-level optimizations.

✨ Features
📊 Real-Time Market Data
Live stock data using yfinance
Tracks:
Price
Daily High / Low
% Change
Market Cap
Updates every 30 seconds (multi-threaded backend)


🌎 Global Asset Support
US Stocks (NASDAQ, NYSE)
Indian Stocks (NSE/BSE)
International assets (Asia, Europe)
Crypto assets


💱 Currency Normalization
Automatic conversion:
INR → USD
KRW → USD
Integrated forex rates (USD/INR, USD/KRW)


⚡ High-Performance Backend
Built with Flask
Thread-safe caching system for fast API responses
Background worker for continuous data fetching
Fault-tolerant handling (NaN/missing data safe)


📈 Custom Charting Engine
Built from scratch (no external chart libraries)
Features:
Crosshair tracking
OHLC data display
Dynamic tooltips
Full-screen chart mode
Drawing tools:
Trendlines
Horizontal/Vertical lines
Fibonacci retracement
Measurement tools


💼 Trading Simulation
Buy / Sell assets in real-time
Wallet balance tracking
Holdings management
Profit & Loss (PnL) calculation
Instant execution feedback


🎨 UI / UX
Modern dark-themed interface
Animated splash screen (GPU-optimized)
Real-time ticker animations
Responsive dashboard layout:
Sidebar asset explorer
Trading panel
Portfolio & orders


⚙️ Deployment Ready
Production-ready using Gunicorn
Clean API architecture
Scalable backend structure


🛠 Tech Stack
Backend: Flask
API: Flask-CORS
Data Source: yfinance
Server: Gunicorn
Frontend: HTML, CSS, JavaScript (Custom Engine)


🚀 Getting Started
1. Clone the repo
git clone https://github.com/your-username/tradex.git
cd tradex

2. Install dependencies
pip install -r requirements.txt

3. Run the app
python app.py

4. Open in browser
http://127.0.0.1:5000

🧭 How to Use
Select an asset from the sidebar
View live price + chart
Enter quantity
Click Buy or Sell
Track:
Wallet balance
Holdings
Profit/Loss

🧠 Key Engineering Highlights
Multi-threaded data pipeline (non-blocking UI)
Custom-built charting engine (no libraries)
Real-time updates with caching optimization
Global market + currency normalization system


📌 Future Improvements
WebSocket-based live streaming (instead of polling)
Order book simulation
Advanced indicators (MACD, RSI, etc.)
User authentication & persistence


🤝 Contributing
Pull requests are welcome. For major changes, open an issue first to discuss ideas.


📜 License

This project is open-source and available under the MIT License.

💬 Final Note
This project started as an experiment…
and turned into a full trading system.
