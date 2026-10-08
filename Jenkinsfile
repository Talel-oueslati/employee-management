pipeline {
    agent any

    environment {
        CI = 'true'
        NPM_CONFIG_AUDIT = 'false'
        NPM_CONFIG_FUND = 'false'
    }

    stages {
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
                sh 'sleep 25'
                echo '🔎 Checking backend container...'
                sh 'docker exec emp_backend wget -q -O- http://localhost:3000/api/health || exit 1'
                echo '🔎 Checking frontend container...'
                sh 'docker exec emp_frontend wget -q -O- http://localhost/ > /dev/null || exit 1'
                echo '✅ All services healthy'
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