#!groovy
pipeline {
  agent {
    label 'linux'
  }

  environment {
    SERVICE_NAME = 'perftest_substrate' // image name
    GIT_NAME = 'Jenkins'
    GIT_EMAIL = 'jenkins@centrality.ai'
    GIT_BRANCH = 'master'
  }

  stages {
    stage('Build Docker Image') {
      steps {
        echo 'build image...'
        sh 'docker build -t perftest_substrate .' 

        // echo 'clean useless images...'
        // sh 'set +e' // ignore error below
        // sh 'docker rmi $(sudo docker images --filter "dangling=true" -q --no-trunc) -f'
        // sh 'set -e'

        // echo 'list all images...'
        // sh 'docker images ls'
      }
    }

    stage('Run test') {
      steps {
        sh 'docker run perftest_substrate --once --user=10 --ws=ws://3.1.51.215:9944'   
      }
    }
  }
}