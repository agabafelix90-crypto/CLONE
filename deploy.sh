#!/bin/bash

echo "========================================="
echo "Medical Health Management System"
echo "Full Stack Production Deployment"
echo "========================================="

echo
echo "Step 1: Building Frontend..."
cd "$(dirname "$0")"
if [ -d "dist" ]; then
    rm -rf dist
fi
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed!"
    exit 1
fi
echo "✓ Frontend built successfully"

echo
echo "Step 2: Checking Backend Dependencies..."
cd backend
npm install --production
if [ $? -ne 0 ]; then
    echo "ERROR: Backend dependencies installation failed!"
    exit 1
fi
echo "✓ Backend dependencies installed"

echo
echo "Step 3: Setting up Production Environment..."
cd ..
if [ ! -f ".env.production" ]; then
    echo "Creating production environment file..."
    cp .env .env.production
    echo "PORT=4000" >> .env.production
    echo "NODE_ENV=production" >> .env.production
fi
echo "✓ Production environment configured"

echo
echo "Step 4: Creating Production Startup Script..."
cat > start-production.sh << 'EOF'
#!/bin/bash

echo "Starting Medical Health Management System..."
echo
echo "========================================"
echo "Starting Backend Server..."
echo "========================================"
cd backend
npm start &
BACKEND_PID=$!
sleep 3

echo
echo "========================================"
echo "Starting Frontend Server..."
echo "========================================"
cd ..
npm run serve &
FRONTEND_PID=$!

echo
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo
echo "Frontend: http://localhost:4173"
echo "Backend:  http://localhost:4000"
echo "API Health: http://localhost:4000/api/health"
echo
echo "Press Ctrl+C to stop servers..."
echo

# Wait for Ctrl+C
trap "echo; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✓ All servers stopped'; exit" INT
wait
EOF

chmod +x start-production.sh
echo "✓ Production startup script created"

echo
echo "========================================"
echo "DEPLOYMENT COMPLETE!"
echo "========================================"
echo
echo "To start the production system:"
echo "  1. Run: ./start-production.sh"
echo "  2. Or manually:"
echo "     - Backend:  cd backend && npm start"
echo "     - Frontend: npm run serve"
echo
echo "Production URLs:"
echo "  - Frontend: http://localhost:4173"
echo "  - Backend:  http://localhost:4000"
echo "  - Health Check: http://localhost:4000/api/health"
echo
echo "Environment files:"
echo "  - Frontend: .env.production"
echo "  - Backend: backend/.env"
echo