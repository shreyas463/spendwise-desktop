# SpendWise Desktop

A comprehensive cross-platform desktop application for personal finance management. Upload your bank and credit card statements, get intelligent transaction categorization, and gain deep insights into your spending patterns through interactive visualizations and natural language queries.

## ✨ Features

### 📊 Data Management
- **CSV Upload & Parsing**: Import transactions from bank/credit card statements with automatic format detection
- **Automatic Categorization**: Rule-based categorization with fallback to local LLM (Ollama) for intelligent classification
- **Transaction Storage**: Persist normalized data in PostgreSQL with full transaction history

### 📈 Analytics & Visualizations
- **Spend by Category**: Interactive donut chart showing current month's spending breakdown
- **Monthly Trends**: Line chart tracking spending patterns over the last 6 months
- **Top Merchants Insight**: Bar chart and list highlighting your highest-spend merchants
- **Stacked Category View**: Stacked bar chart showing category composition evolution over time
- **Composed KPI Chart**: Combined monthly totals (bar) and transaction counts (line) for comprehensive overview

### 🔍 Transaction Management
- **Transaction Table**: Search and filter through all transactions with real-time updates
- **Recent Transactions**: Quick access to your latest financial activity

### 🤖 AI-Powered Insights
- **Chat with Data**: Natural-language queries that translate to structured analytics
- Ask questions like "What did I spend on groceries last month?" and get instant insights

### 🎨 User Experience
- **Theming**: Light/Dark mode with customizable accent colors
- **Settings Persistence**: All preferences saved across sessions

### 📤 Export & Alerts
- **CSV Export**: Download analytics data (categories, trends, merchants) for external analysis
- **Budget Alerts** *(Coming Soon)*: Set category spending limits with intelligent notifications

## 🛠 Tech Stack

### Frontend/Desktop
- **Electron** - Cross-platform desktop application framework
- **React + Vite** - Modern UI with fast development experience
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Recharts** - Composable charting library for data visualization

### Backend/Microservices (Spring Boot 3, Java 21)
- **Gateway Service** - API gateway for request routing and load balancing
- **Ingest Service** - CSV processing and database ingestion
- **Categorizer Service** - Rule-based and LLM-powered transaction categorization
- **Analytics Service** - Data aggregations and business insights
- **Chat Service** - Natural language to SQL/DSL translation for analytics

### Database & Infrastructure
- **PostgreSQL 16** - Primary data storage with ACID compliance
- **Flyway** - Database migration management
- **Spring Data JPA** - Data access layer with repository pattern

### AI & Machine Learning
- **Ollama** - Local LLM inference (Mistral / LLaMA 3 / Phi-3)
- **Local Processing** - Privacy-first approach with no data leaving your device

### Development & DevOps
- **Docker Compose** - Local development environment (Postgres + pgAdmin)
- **Maven** - Multi-module build system
- **Cursor** - AI-assisted development environment

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- Docker & Docker Compose
- Ollama (for local LLM features)

### Installation
1. Clone the repository
2. Set up the database: `docker-compose up -d`
3. Install dependencies: `npm install`
4. Start the application: `npm run dev`

## 📱 Screenshots

*Coming soon - Interactive charts and intuitive interface previews*

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

- [ ] Budget alerts and notifications
- [ ] Multi-currency support
- [ ] Investment tracking integration
- [ ] Mobile companion app
- [ ] Advanced ML categorization models
