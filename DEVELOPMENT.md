# Development Guide

This guide will help you set up and develop the SpendWise Desktop application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Java 21+** - [Download](https://adoptium.net/)
- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- **Maven 3.8+** - [Download](https://maven.apache.org/download.cgi)
- **Ollama** (optional, for LLM features) - [Download](https://ollama.ai/download)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spendwise-desktop
   ```

2. **Run the development setup script**
   ```bash
   chmod +x scripts/dev.sh
   ./scripts/dev.sh
   ```

This will:
- Start PostgreSQL and pgAdmin
- Install frontend dependencies
- Start the development server

## Manual Setup

### 1. Database Setup

Start the development database:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

Access pgAdmin at http://localhost:8080:
- Email: `admin@spendwise.com`
- Password: `admin123`

### 2. Frontend Development

Install dependencies and start the development server:
```bash
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

### 3. Backend Development

Each microservice can be run independently:

```bash
# Gateway Service
cd gateway-service
mvn spring-boot:run

# Ingest Service
cd ingest-service
mvn spring-boot:run

# Categorizer Service
cd categorizer-service
mvn spring-boot:run

# Analytics Service
cd analytics-service
mvn spring-boot:run

# Chat Service
cd chat-service
mvn spring-boot:run
```

### 4. Ollama Setup (Optional)

For LLM features, set up Ollama:

```bash
chmod +x scripts/setup-ollama.sh
./scripts/setup-ollama.sh
```

## Project Structure

```
spendwise-desktop/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Application pages
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API services
│   └── utils/                    # Utility functions
├── electron/                     # Electron main process
├── gateway-service/              # API Gateway microservice
├── ingest-service/               # CSV processing service
├── categorizer-service/          # Transaction categorization
├── analytics-service/            # Data analytics
├── chat-service/                 # Natural language chat
├── shared/                       # Shared models and utilities
├── database/                     # Database scripts and migrations
└── scripts/                      # Development and build scripts
```

## Development Workflow

### Frontend Development

1. **Component Development**
   - Create components in `src/components/`
   - Use TypeScript for type safety
   - Follow Tailwind CSS for styling

2. **State Management**
   - Use React Context for global state
   - Custom hooks for component logic
   - Local state for component-specific data

3. **API Integration**
   - Services in `src/services/`
   - Use fetch or axios for HTTP requests
   - Handle loading and error states

### Backend Development

1. **Microservice Architecture**
   - Each service is independent
   - Shared models in `shared/` module
   - RESTful API design

2. **Database**
   - PostgreSQL with Flyway migrations
   - JPA entities for data modeling
   - Repository pattern for data access

3. **Testing**
   - Unit tests with JUnit 5
   - Integration tests with TestContainers
   - API tests with MockMvc

## Available Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Backend Scripts
- `mvn clean install` - Build all modules
- `mvn spring-boot:run` - Run a specific service
- `mvn test` - Run tests

### Utility Scripts
- `./scripts/dev.sh` - Start development environment
- `./scripts/build.sh` - Build for production
- `./scripts/setup-ollama.sh` - Setup Ollama models

## Configuration

### Environment Variables

Create `.env` files for different environments:

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8081
VITE_APP_NAME=SpendWise Desktop (Dev)

# .env.production
VITE_API_BASE_URL=https://api.spendwise.com
VITE_APP_NAME=SpendWise Desktop
```

### Database Configuration

Database connection settings are in `application.yml` files:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/spendwise_dev
    username: spendwise
    password: spendwise123
```

## Testing

### Frontend Testing
```bash
npm run test
```

### Backend Testing
```bash
mvn test
```

### Integration Testing
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Debugging

### Frontend Debugging
- Use React Developer Tools
- Browser DevTools for network requests
- Console logging for debugging

### Backend Debugging
- IDE debugger for Java services
- Actuator endpoints for health checks
- Logging with SLF4J

## Deployment

### Development Build
```bash
./scripts/build.sh
```

### Production Build
```bash
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Check if ports 5173, 8080-8085 are available
   - Use `lsof -i :PORT` to check port usage

2. **Database connection issues**
   - Ensure PostgreSQL is running
   - Check connection credentials
   - Verify network connectivity

3. **Ollama not working**
   - Ensure Ollama service is running
   - Check if models are downloaded
   - Verify API endpoint accessibility

### Getting Help

- Check the logs in `logs/` directory
- Use `docker-compose logs SERVICE_NAME` for service logs
- Review the troubleshooting section in README.md

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
