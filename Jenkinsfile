pipeline {
    agent {
        kubernetes {
            label 'tenantops-builder'
            defaultContainer 'docker'
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: tenantops-builder
spec:
  serviceAccountName: jenkins
  containers:
  - name: docker
    image: docker:24-dind
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
  - name: helm
    image: alpine/helm:latest
    command:
    - cat
    tty: true
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
"""
        }
    }

    environment {
        DOCKERHUB_USER    = 'hemantsingh1023'
        DOCKERHUB_CREDS   = credentials('dockerhub-credentials')
        IMAGE_TAG         = "v${BUILD_NUMBER}"
        GIT_REPO          = 'https://github.com/hemantTsingh/tenantOPS.git'
        HELM_RELEASE      = 'tenantops'
        HELM_NAMESPACE    = 'tenantops'
        HELM_CHART_PATH   = 'helm/tenant-stack'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                echo '========== Checking out source code =========='
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.IMAGE_TAG = "v${BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    echo "Building image tag: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        container('docker') {
                            echo '========== Building Frontend Image =========='
                            sh """
                                docker build \
                                    -t ${DOCKERHUB_USER}/tenantops-frontend:${IMAGE_TAG} \
                                    -t ${DOCKERHUB_USER}/tenantops-frontend:latest \
                                    services/frontend/
                            """
                        }
                    }
                }
                stage('Build API') {
                    steps {
                        container('docker') {
                            echo '========== Building API Image =========='
                            sh """
                                docker build \
                                    -t ${DOCKERHUB_USER}/tenantops-api:${IMAGE_TAG} \
                                    -t ${DOCKERHUB_USER}/tenantops-api:latest \
                                    services/tenant-api/
                            """
                        }
                    }
                }
                stage('Build Collector') {
                    steps {
                        container('docker') {
                            echo '========== Building Collector Image =========='
                            sh """
                                docker build \
                                    -t ${DOCKERHUB_USER}/tenantops-collector:${IMAGE_TAG} \
                                    -t ${DOCKERHUB_USER}/tenantops-collector:latest \
                                    services/metrics-collector/
                            """
                        }
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                container('docker') {
                    echo '========== Pushing Images to DockerHub =========='
                    sh """
                        echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin

                        docker push ${DOCKERHUB_USER}/tenantops-frontend:${IMAGE_TAG}
                        docker push ${DOCKERHUB_USER}/tenantops-frontend:latest

                        docker push ${DOCKERHUB_USER}/tenantops-api:${IMAGE_TAG}
                        docker push ${DOCKERHUB_USER}/tenantops-api:latest

                        docker push ${DOCKERHUB_USER}/tenantops-collector:${IMAGE_TAG}
                        docker push ${DOCKERHUB_USER}/tenantops-collector:latest

                        echo 'All images pushed successfully'
                    """
                }
            }
        }

        stage('Update Helm Values') {
            steps {
                echo '========== Updating Helm Chart Image Tags =========='
                sh """
                    sed -i 's|tag: .*|tag: ${IMAGE_TAG}|g' ${HELM_CHART_PATH}/values.yaml
                    grep 'tag:' ${HELM_CHART_PATH}/values.yaml
                """
            }
        }

        stage('Deploy to EKS') {
            steps {
                container('helm') {
                    echo '========== Deploying to EKS via Helm =========='
                    sh """
                        helm upgrade --install ${HELM_RELEASE} ./${HELM_CHART_PATH} \
                            --namespace ${HELM_NAMESPACE} \
                            --create-namespace \
                            --set frontend.tag=${IMAGE_TAG} \
                            --set api.tag=${IMAGE_TAG} \
                            --set collector.tag=${IMAGE_TAG} \
                            --wait \
                            --timeout 5m
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                container('kubectl') {
                    echo '========== Verifying Deployment =========='
                    sh """
                        kubectl rollout status deployment/tenantops-frontend -n ${HELM_NAMESPACE} --timeout=3m
                        kubectl rollout status deployment/tenantops-api -n ${HELM_NAMESPACE} --timeout=3m
                        kubectl rollout status deployment/tenantops-collector -n ${HELM_NAMESPACE} --timeout=3m
                        echo ''
                        echo '========== Current Pod Status =========='
                        kubectl get pods -n ${HELM_NAMESPACE}
                        echo ''
                        echo '========== Services =========='
                        kubectl get svc -n ${HELM_NAMESPACE}
                    """
                }
            }
        }

        stage('Commit Updated Values') {
            steps {
                echo '========== Committing Updated Helm Values to Git =========='
                sh """
                    git config user.email "jenkins@tenantops.io"
                    git config user.name "Jenkins CI"
                    git add ${HELM_CHART_PATH}/values.yaml
                    git commit -m "ci: update image tags to ${IMAGE_TAG} [skip ci]" || echo 'No changes to commit'
                    git push origin main || echo 'Push failed - ArgoCD will sync from current state'
                """
            }
        }
    }

    post {
        success {
            echo """
            ============================================
             Deployment Successful!
             Image Tag: ${IMAGE_TAG}
             Namespace: ${HELM_NAMESPACE}
             Commit: ${GIT_COMMIT_SHORT}
            ============================================
            """
        }
        failure {
            echo """
            ============================================
             Deployment FAILED!
             Build: ${BUILD_NUMBER}
             Check logs above for details
            ============================================
            """
        }
        always {
            container('docker') {
                sh 'docker logout || true'
            }
            cleanWs()
        }
    }
}
