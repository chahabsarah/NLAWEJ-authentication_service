pipeline {
    agent {
        docker {
            image 'node:18-alpine' // Utilise une image Docker avec Node.js préinstallé
            args '-u root:root'    // Optionnel si tu as des soucis de droits
        }
    }

    environment {
        DOCKER_IMAGE = "nlawej-authentication"
        DOCKER_TAG = "latest"
        REGISTRY = "docker.io/sarra1998"
        CREDENTIALS_ID = 'dockerhub-creds'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('MicroServicesBackend/authentication-service') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('MicroServicesBackend/authentication-service') {
                    sh 'npm test || true'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}", "MicroServicesBackend/authentication-service")
                }
            }
        }

        stage('Push to Registry') {
            when {
                expression { return env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master' }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: "${CREDENTIALS_ID}", usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                    sh """
                        echo "$PASSWORD" | docker login -u "$USERNAME" --password-stdin
                        docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${REGISTRY}/${DOCKER_IMAGE}:${DOCKER_TAG}
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished'
        }
    }
}
