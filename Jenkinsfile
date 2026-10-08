pipeline {
    agent any

    environment {
        CI = 'true'
        NPM_CONFIG_AUDIT = 'false'
        NPM_CONFIG_FUND = 'false'
    }

    stages {
        // ---------- CHECKOUT ----------
        stage('Checkout') {
            steps {
                echo '📥 Code checked out from Git'
                sh 'ls -la'
            }
        }

        // ---------- BACKEND ----------
        stage('Backend: Install deps') {
            steps {
                dir('backend') {
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm install --no-audit --no-fund'
                }
            }
        }

        stage('Backend: Build') {
            steps {
                dir('backend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Backend: Tests') {
            steps {
                dir('backend') {
                    echo '🧪 Running backend Jest tests...'
                    sh 'npm test -- --runInBand'
                }
            }
        }

        // ---------- FRONTEND ----------
        stage('Frontend: Install deps') {
            steps {
                dir('frontend') {
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm install --no-audit --no-fund'
                }
            }
        }

        stage('Frontend: Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build -- --configuration production'
                }
            }
        }

        // ---------- DOCKER ----------
        stage('Docker: Build images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Docker: Deploy') {
            steps {
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose up -d'
            }
        }

        // ---------- VERIFY ----------
        stage('Health check') {
            steps {
                sh '''
                    set -e

                    echo "⏳ Waiting for backend to be ready..."
                    BACKEND_OK=0

                    for i in $(seq 1 30); do
                        if docker exec emp_backend wget -q -O- http://127.0.0.1:3000/api/health > /dev/null 2>&1; then
                            echo "✅ Backend healthy after $i attempt(s)"
                            BACKEND_OK=1
                            break
                        fi

                        echo "  attempt $i/30 failed — retrying in 2s..."
                        sleep 2
                    done

                    if [ "$BACKEND_OK" -ne 1 ]; then
                        echo "❌ Backend never became healthy"
                        exit 1
                    fi

                    echo "⏳ Waiting for frontend to be ready..."
                    FRONTEND_OK=0

                    for i in $(seq 1 30); do
                        if docker exec emp_frontend wget -q -O- http://127.0.0.1/ > /dev/null 2>&1; then
                            echo "✅ Frontend healthy after $i attempt(s)"
                            FRONTEND_OK=1
                            break
                        fi

                        echo "  attempt $i/30 failed — retrying in 2s..."
                        sleep 2
                    done

                    if [ "$FRONTEND_OK" -ne 1 ]; then
                        echo "❌ Frontend never became healthy"
                        exit 1
                    fi

                    echo "🎉 All services healthy!"
                '''
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline succeeded!'
            sh 'docker compose ps || true'
        }

        failure {
            echo '❌ Pipeline failed!'
            echo '--- Backend logs ---'
            sh 'docker compose logs --tail=50 backend || true'

            echo '--- Frontend logs ---'
            sh 'docker compose logs --tail=50 frontend || true'

            echo '--- Postgres logs ---'
            sh 'docker compose logs --tail=50 postgres || true'
        }

        always {
            echo '--- Container status ---'
            sh 'docker compose ps || true'
        }
    }
}