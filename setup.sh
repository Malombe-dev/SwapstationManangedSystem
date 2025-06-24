#!/bin/bash
# setup.sh - Setup script for the Rider Management System

echo "🚀 Setting up Rider Management System with ML Analytics..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p {backend,frontend,ml-service}/{src,models,controllers,routes,utils}
mkdir -p ml-service/{models,data,notebooks}

# Create environment files
echo "🔧 Creating environment files..."

# Backend .env
cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password123@localhost:27017/rider_management?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ML_SERVICE_URL=http://localhost:5001
EOF

# Frontend .env
cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_SERVICE_URL=http://localhost:5001
GENERATE_SOURCEMAP=false
EOF

# ML Service .env
cat > ml-service/.env << EOF
MONGO_URI=mongodb://admin:password123@localhost:27017/rider_management?authSource=admin
PORT=5001
EOF

echo "✅ Environment files created!"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🐳 Docker is running!"

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB is healthy"
else
    echo "❌ MongoDB health check failed"
fi

# Check Backend
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API health check failed"
fi

# Check ML Service
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ ML Service is healthy"
else
    echo "❌ ML Service health check failed"
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

echo "
🎉 Setup complete!

📊 Access your applications:
- Frontend (React): http://localhost:3000
- Backend API: http://localhost:5000/api
- ML Service: http://localhost:5001
- MongoDB: mongodb://localhost:27017

🔍 To view logs:
- All services: docker-compose logs -f
- Specific service: docker-compose logs -f [service-name]

🛠️  To stop services:
- docker-compose down

📝 To restart services:
- docker-compose restart

🔄 To rebuild after changes:
- docker-compose build --no-cache
- docker-compose up -d

Happy coding! 🚀
"

# Optional: Seed sample data
read -p "Would you like to seed sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding sample data..."
    # Add your seeding script here
    curl -X POST http://localhost:5000/api/seed/sample-data
    echo "✅ Sample data seeded!"
fi