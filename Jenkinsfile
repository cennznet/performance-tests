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
        // build image
        sh 'docker build -t perftest_substrate' 
        
        // clean useless images
        set +e // ignore error below
        sh 'docker rmi $(sudo docker images --filter "dangling=true" -q --no-trunc) -f'
        set -e

        // list all images
        sh 'docker images ls'
      }
    }

    stage('Run test') {
      steps {
        sh 'docker run perftest_substrate --once --user=10 --ws=ws://3.1.51.215:9944'   
      }
    }
  }
}