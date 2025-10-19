pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'your-registry.azurecr.io'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/energy-planet-backend"
        WEBAPP_IMAGE = "${DOCKER_REGISTRY}/energy-planet-webapp"
        IMAGE_TAG = "${env.GIT_COMMIT.take(7)}"
        KUBECONFIG = credentials('kubeconfig-prod')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run typecheck'
                    sh 'npm run test'
                }
            }
        }

        stage('Test Webapp') {
            steps {
                dir('webapp') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run typecheck'
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh """
                                docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest .
                            """
                        }
                    }
                }
                stage('Build Webapp') {
                    steps {
                        dir('webapp') {
                            sh """
                                docker build -t ${WEBAPP_IMAGE}:${IMAGE_TAG} -t ${WEBAPP_IMAGE}:latest .
                            """
                        }
                    }
                }
            }
        }

        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-registry-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo \$DOCKER_PASS | docker login ${DOCKER_REGISTRY} -u \$DOCKER_USER --password-stdin
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        docker push ${WEBAPP_IMAGE}:${IMAGE_TAG}
                        docker push ${WEBAPP_IMAGE}:latest
                    """
                }
            }
        }

        stage('Run Database Migrations') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    kubectl --kubeconfig=\${KUBECONFIG} apply -f k8s/migrations-job.yaml
                    kubectl --kubeconfig=\${KUBECONFIG} wait --for=condition=complete --timeout=300s job/db-migration
                """
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    kubectl --kubeconfig=\${KUBECONFIG} set image deployment/backend backend=${BACKEND_IMAGE}:${IMAGE_TAG}
                    kubectl --kubeconfig=\${KUBECONFIG} set image deployment/webapp webapp=${WEBAPP_IMAGE}:${IMAGE_TAG}
                    kubectl --kubeconfig=\${KUBECONFIG} rollout status deployment/backend --timeout=300s
                    kubectl --kubeconfig=\${KUBECONFIG} rollout status deployment/webapp --timeout=300s
                """
            }
        }

        stage('Run Smoke Tests') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    curl -f https://api.energyplanet.game/health || exit 1
                    echo "Smoke tests passed"
                """
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            // TODO: Send notification to Slack/Telegram
        }
        cleanup {
            sh 'docker system prune -f'
            cleanWs()
        }
    }
}
