#!/bin/bash
# ============================================
# Neon PostgreSQL Migration - Quick Commands
# ============================================
# Usage: bash QUICK_MIGRATION_COMMANDS.sh [phase]
# Phases: setup, migrate, deploy, validate, rollback

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Prisma
    if ! npx prisma --version &> /dev/null; then
        log_warning "Prisma not found, installing..."
        npm install -D prisma @prisma/client
    fi
    
    log_success "Prerequisites check passed"
}

# Phase 1: Setup
phase_setup() {
    log_info "Starting Phase 1: Neon Setup"
    
    # Backup current env
    if [ -f .env.local ]; then
        cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
        log_success "Backed up .env.local"
    fi
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set. Please add to .env.local:"
        echo "DATABASE_URL=\"postgresql://[user]:[password]@[project].pooler.us-east-2.aws.neon.tech/[database]?sslmode=require\""
        echo "DIRECT_URL=\"postgresql://[user]:[password]@[project].us-east-2.aws.neon.tech/[database]?sslmode=require\""
        exit 1
    fi
    
    # Test connection
    log_info "Testing database connection..."
    npx prisma db pull --force
    
    if [ $? -eq 0 ]; then
        log_success "Database connection successful!"
        
        # Run connection test script
        if [ -f scripts/test-neon-connection.js ]; then
            node scripts/test-neon-connection.js
        fi
    else
        log_error "Database connection failed"
        exit 1
    fi
}

# Phase 2: Migrate
phase_migrate() {
    log_info "Starting Phase 2: Database Migration"
    
    # Check DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set"
        exit 1
    fi
    
    # Run migrations
    log_info "Running Prisma migrations..."
    npx prisma migrate deploy
    
    if [ $? -ne 0 ]; then
        log_error "Migration failed"
        exit 1
    fi
    
    log_success "Migrations completed"
    
    # Run seed
    log_info "Seeding database..."
    npx prisma db seed
    
    if [ $? -eq 0 ]; then
        log_success "Database seeded successfully"
    else
        log_warning "Seeding failed, but continuing..."
    fi
    
    # Verify data
    log_info "Verifying data..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function check() {
        const providers = await prisma.provider.count();
        const models = await prisma.model.count();
        console.log('Providers:', providers);
        console.log('Models:', models);
        await prisma.\$disconnect();
    }
    check();
    "
}

# Phase 3: Deploy
phase_deploy() {
    log_info "Starting Phase 3: Vercel Deployment"
    
    # Check git status
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes"
        read -p "Do you want to commit them? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "feat: migrate to Neon PostgreSQL"
        fi
    fi
    
    # Push to git
    log_info "Pushing to git..."
    git push origin master
    
    # Trigger Vercel deployment
    if command -v vercel &> /dev/null; then
        log_info "Triggering Vercel deployment..."
        vercel --prod --no-wait
    else
        log_info "Vercel CLI not found, deployment will trigger automatically via git push"
    fi
    
    log_success "Deployment triggered"
    echo "Check deployment at: https://vercel.com/dashboard"
}

# Phase 4: Validate
phase_validate() {
    log_info "Starting Phase 4: Validation"
    
    # Set API URL
    API_URL=${API_URL:-"https://ai-server-information.vercel.app"}
    
    # Check status endpoint
    log_info "Checking /api/v1/status..."
    response=$(curl -s "$API_URL/api/v1/status")
    datasource=$(echo $response | grep -o '"dataSource":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$datasource" = "database" ]; then
        log_success "API is using database! ✅"
    else
        log_error "API is using: $datasource (expected: database)"
        exit 1
    fi
    
    # Check models endpoint
    log_info "Checking /api/v1/models..."
    models_response=$(curl -s "$API_URL/api/v1/models")
    model_count=$(echo $models_response | grep -o '"id"' | wc -l)
    
    if [ $model_count -gt 0 ]; then
        log_success "Found $model_count models"
    else
        log_error "No models found"
        exit 1
    fi
    
    # Run comprehensive validation
    if [ -f scripts/migration-validation.js ]; then
        log_info "Running comprehensive validation..."
        API_URL=$API_URL node scripts/migration-validation.js
    fi
    
    log_success "Validation completed!"
}

# Phase 5: Rollback
phase_rollback() {
    log_warning "Starting Rollback Procedure"
    
    read -p "Are you sure you want to rollback? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi
    
    log_info "Setting DATA_SOURCE to github..."
    
    # Update .env.local
    if [ -f .env.local ]; then
        sed -i.bak 's/DATA_SOURCE=database/DATA_SOURCE=github/' .env.local
        log_success "Updated .env.local"
    fi
    
    # If Vercel CLI is available
    if command -v vercel &> /dev/null; then
        log_info "Updating Vercel environment variable..."
        vercel env rm DATA_SOURCE production --yes 2>/dev/null || true
        echo "github" | vercel env add DATA_SOURCE production
        
        log_info "Triggering redeployment..."
        vercel --prod --force
    else
        log_warning "Please manually update DATA_SOURCE=github in Vercel Dashboard"
        log_warning "Then trigger a redeployment"
    fi
    
    log_success "Rollback initiated"
}

# Main execution
main() {
    echo "============================================"
    echo "  Neon PostgreSQL Migration Tool"
    echo "============================================"
    echo
    
    check_prerequisites
    
    case "${1:-}" in
        setup)
            phase_setup
            ;;
        migrate)
            phase_migrate
            ;;
        deploy)
            phase_deploy
            ;;
        validate)
            phase_validate
            ;;
        rollback)
            phase_rollback
            ;;
        all)
            log_info "Running all phases..."
            phase_setup
            phase_migrate
            phase_deploy
            sleep 30  # Wait for deployment
            phase_validate
            ;;
        *)
            echo "Usage: $0 [setup|migrate|deploy|validate|rollback|all]"
            echo
            echo "Phases:"
            echo "  setup    - Configure and test Neon connection"
            echo "  migrate  - Run database migrations and seeding"
            echo "  deploy   - Deploy to Vercel"
            echo "  validate - Validate the deployment"
            echo "  rollback - Rollback to GitHub data source"
            echo "  all      - Run all phases sequentially"
            exit 1
            ;;
    esac
    
    echo
    log_success "Phase completed successfully!"
}

# Run main function
main "$@"