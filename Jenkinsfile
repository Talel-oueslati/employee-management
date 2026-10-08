pipeline {
    agent any

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Code checked out from Git'
                sh 'ls -la'
            }
        }

        stage('Install backend deps') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build backend') {
            steps {
                dir('backend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Install frontend deps') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build -- --configuration production'
                }
            }
        }

        stage('Build Docker images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy with docker compose') {
            steps {
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose up -d'
            }
        }

        stage('Health check') {
            steps {
                sh 'sleep 20'
                sh 'curl -f http://localhost:3000/api/health || exit 1'
                sh 'curl -f http://localhost:4200 || exit 1'
            }
        }
    }

    post {
        success { echo '🎉 Pipeline succeeded!' }
        failure { echo '❌ Pipeline failed!' }
        always  { sh 'docker compose ps || true' }
    }
}