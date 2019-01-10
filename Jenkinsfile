#!groovy
pipeline {
  agent {
    label 'linux'
  }

  environment {
    SERVICE_NAME = 'perftest_substrate_js' // ???
    GIT_NAME = 'Jenkins'
    GIT_EMAIL = 'jenkins@centrality.ai'
    GIT_BRANCH = 'master'
  }

  stages {
    stage('Build Docker Image') {
      steps {
        sh './docker-build.sh'   // ???
      }
    }
  }
}