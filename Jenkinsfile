pipeline {
    agent {
        kubernetes {
            label 'tenantops-builder'
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: tenantops-builder
spec:
  serviceAccountName: jenkins
  containers:
  - name: kaniko-frontend
    image: gcr.io/kaniko-project/executor:debug
    command: [sleep]
    args: ['9999999']
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  - name: kaniko-api
    image: gcr.io/kaniko-project/executor:debug
    command: [sleep]
    args: ['9999999']
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  - name: kaniko-collector
    image: gcr.io/kaniko-project/executor:debug
    command: [sleep]
    args: ['9999999']
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  - name: trivy
    image: aquasec/trivy:latest
    command: [cat]
    tty: true
  - name: helm
    image: alpine/helm:latest
    command: [cat]
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command: [cat]
    tty: true
  volumes:
  - name: docker-config
    secret:
      secretName: dockerhub-secret
      items:
      - key: .dockerconfigjson
        path: config.json
"""
        }
    }

    environment {
        DOCKERHUB_USER = 'hemantsingh1023'
        HELM_RELEASE   = 'tenantops'
        K8S_NAMESPACE  = 'tenantops'
        HELM_CHART     = 'helm/tenant-stack'
        IMAGE_TAG      = "v${BUILD_NUMBER}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                echo '=========================================='
                echo '  Stage 1: Checkout'
                echo '=========================================='
                checkout scm
                script {
                    sh 'git config --global --add safe.directory ${WORKSPACE} || true'
                    env.GIT_SHORT   = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_AUTHOR  = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
                    env.GIT_MESSAGE = sh(script: 'git log -1 --pretty=%s', returnStdout: true).trim()
                    env.IMAGE_TAG   = "v${BUILD_NUMBER}-${env.GIT_SHORT}"
                    echo "Image Tag : ${env.IMAGE_TAG}"
                    echo "Author    : ${env.GIT_AUTHOR}"
                    echo "Commit    : ${env.GIT_MESSAGE}"
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Frontend') {
                    steps {
                        container('kaniko-frontend') {
                            echo '===== Building Frontend ====='
                            sh """
                                /kaniko/executor \
                                    --context=${WORKSPACE}/services/frontend \
                                    --dockerfile=${WORKSPACE}/services/frontend/Dockerfile \
                                    --destination=${DOCKERHUB_USER}/tenantops-frontend:${IMAGE_TAG} \
                                    --destination=${DOCKERHUB_USER}/tenantops-frontend:latest \
                                    --cache=true \
                                    --cache-ttl=24h \
                                    --snapshot-mode=redo
                            """
                        }
                    }
                }
                stage('API') {
                    steps {
                        container('kaniko-api') {
                            echo '===== Building API ====='
                            sh """
                                /kaniko/executor \
                                    --context=${WORKSPACE}/services/tenant-api \
                                    --dockerfile=${WORKSPACE}/services/tenant-api/Dockerfile \
                                    --destination=${DOCKERHUB_USER}/tenantops-api:${IMAGE_TAG} \
                                    --destination=${DOCKERHUB_USER}/tenantops-api:latest \
                                    --cache=true \
                                    --cache-ttl=24h \
                                    --snapshot-mode=redo
                            """
                        }
                    }
                }
                stage('Collector') {
                    steps {
                        container('kaniko-collector') {
                            echo '===== Building Collector ====='
                            sh """
                                /kaniko/executor \
                                    --context=${WORKSPACE}/services/metrics-collector \
                                    --dockerfile=${WORKSPACE}/services/metrics-collector/Dockerfile \
                                    --destination=${DOCKERHUB_USER}/tenantops-collector:${IMAGE_TAG} \
                                    --destination=${DOCKERHUB_USER}/tenantops-collector:latest \
                                    --cache=true \
                                    --cache-ttl=24h \
                                    --snapshot-mode=redo
                            """
                        }
                    }
                }
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                container('trivy') {
                    echo '=========================================='
                    echo '  Stage 3: Security Scan with Trivy'
                    echo '=========================================='
                    sh """
                        echo '--- Scanning Frontend ---'
                        trivy image \
                            --exit-code 0 \
                            --severity HIGH,CRITICAL \
                            --no-progress \
                            --format table \
                            ${DOCKERHUB_USER}/tenantops-frontend:${IMAGE_TAG} || true

                        echo '--- Scanning API ---'
                        trivy image \
                            --exit-code 0 \
                            --severity HIGH,CRITICAL \
                            --no-progress \
                            --format table \
                            ${DOCKERHUB_USER}/tenantops-api:${IMAGE_TAG} || true

                        echo '--- Scanning Collector ---'
                        trivy image \
                            --exit-code 0 \
                            --severity HIGH,CRITICAL \
                            --no-progress \
                            --format table \
                            ${DOCKERHUB_USER}/tenantops-collector:${IMAGE_TAG} || true
                    """
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                container('helm') {
                    echo '=========================================='
                    echo '  Stage 4: Deploy to EKS via Helm'
                    echo '=========================================='
                    sh """
                        helm upgrade --install ${HELM_RELEASE} ./${HELM_CHART} \
                            --namespace ${K8S_NAMESPACE} \
                            --create-namespace \
                            --set frontend.tag=${IMAGE_TAG} \
                            --set api.tag=${IMAGE_TAG} \
                            --set collector.tag=${IMAGE_TAG} \
                            --atomic \
                            --cleanup-on-fail \
                            --wait \
                            --timeout 5m \
                            --history-max 5
                    """
                }
            }
        }

        stage('Verify') {
            steps {
                container('kubectl') {
                    echo '=========================================='
                    echo '  Stage 5: Verify Deployment'
                    echo '=========================================='
                    sh """
                        kubectl rollout status deployment/tenantops-frontend -n ${K8S_NAMESPACE} --timeout=3m
                        kubectl rollout status deployment/tenantops-api -n ${K8S_NAMESPACE} --timeout=3m
                        kubectl rollout status deployment/tenantops-collector -n ${K8S_NAMESPACE} --timeout=3m
                        echo ''
                        echo '=== Pod Status ==='
                        kubectl get pods -n ${K8S_NAMESPACE} -o wide
                        echo ''
                        echo '=== Services ==='
                        kubectl get svc -n ${K8S_NAMESPACE}
                        echo ''
                        echo '=== Deployed Images ==='
                        kubectl get pods -n ${K8S_NAMESPACE} -o jsonpath='{range .items[*]}{.metadata.name}{": "}{range .spec.containers[*]}{.image}{" "}{end}{"\n"}{end}'
                    """
                }
            }
        }
    }

    post {
        success {
            echo """
            ============================================
             DEPLOYMENT SUCCESSFUL
             Build     : #${BUILD_NUMBER}
             Image Tag : ${IMAGE_TAG}
             Namespace : ${K8S_NAMESPACE}
             Author    : ${GIT_AUTHOR}
             Commit    : ${GIT_MESSAGE}
            ============================================
            """
        }
        failure {
            echo """
            ============================================
             DEPLOYMENT FAILED
             Build     : #${BUILD_NUMBER}
             Image Tag : ${IMAGE_TAG}
             Check logs above for details
            ============================================
            """
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}
