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
    DOCKER_IMAGE_NAME = 'perftest_substrate'
  }

  stages {
    stage('Build Docker Image') {
      steps {
        
        echo 'build image...'
        sh 'docker build -t ${DOCKER_IMAGE_NAME} .' 

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
        echo 'Topup test address...'
        sh 'docker run ${DOCKER_IMAGE_NAME} --topup -i 50 -e local -s 0 -c 10 --ws=ws://3.1.51.215:9944'

        echo 'Run one-time test...'
        sh 'docker run ${DOCKER_IMAGE_NAME} --once --user=10 --ws=ws://3.1.51.215:9944'   

        echo 'Run simnple load test...'
        sh 'docker run ${DOCKER_IMAGE_NAME} --user=10 -startuser=1 --pacingtime=1 --rampuprate=1 --stairuser=5 --stairholdtime=30 --finalholdtime=60 --ws=ws://3.1.51.215:9944'
      }
    }
  }
}