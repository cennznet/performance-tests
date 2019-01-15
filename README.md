# Substrate performance test script

Performance test script for the blockchain node based on Substrate

## Before Test

__Install node__

Need the node version later then 10.

__Install dependancies__

Go to the repo folder and install.
```bash
npm install
```

__Topup test addresses__
```bash
node src/run --topup -i 10 -e local -s 0 -c 1000 --ws=ws://3.1.51.215:9944
# parameters:
#   --topup:    Run topup program.
#   --ws:   Websocket server ip and port, default ip is 'ws://127.0.0.1:9944'.
#   -i:    Transaction interval (ms).
#   -e:    Environment, 'local' or 'dev', default is 'local'.
#   -s:    Start position of the address list, default is 0.
#   -c:    Count of addresses needs to be topup, default is 1000.
```

## Usage

__One-time test__
```bash
# Go to the project folder and run
node src/run --ws=ws://127.0.0.1:9944 --once --user=10
# parameters:
#   --ws:   Websocket server ip and port, default ip is 'ws://127.0.0.1:9944'.
#   --once: Each user send only one transaction.
#   --user: User count.
```

__Scheduled load test__
```bash
# Go to the project folder and run
node src/run --ws=ws://127.0.0.1:9944 --user=13 --startuser=10 --pacingtime=1 --rampuprate=1 --stairuser=5 --stairholdtime=60 --finalholdtime=600 
# parameters:
#   --ws:           Websocket server ip and port, default ip is 'ws://127.0.0.1:9944'.
#   --user:         User count
#   --startuser:    Default user count at the start of test.
#   --pacingtime:   The interval before a user send another transaction.
#   --rampuprate:   The user count to be injected in one second.
#   --stairuser:    The user count for each stair. When the stair reached, it will hold for defined time (stairholdtime).
#   --stairholdtime: Holding time for each 'stairuser' when the stair reached.
#   --finalholdtime: The holding time after all users arrive.
```

## Docker Image

__Build an image__  
```bash
# Build an image named 'perftest_substrate'
docker build -t perftest_substrate .
```

__Run__

**Note**: When running via docker locally, **ws ip** cannot be omitted, and use 'docker.for.mac.localhost' instead of 'localhost or 127.0.0.1'.

```bash
# Topup
docker run perftest_substrate --topup -i 10 -e local -s 0 -c 1000 --ws ws://3.1.51.215:9944

# One-time test
docker run perftest_substrate --ws=ws://docker.for.mac.localhost:9944 --once --user=10

# Scheduled load test
docker run perftest_substrate --ws=ws://docker.for.mac.localhost:9944 --user=13 --startuser=10 --pacingtime=1 --rampuprate=1 --stairuser=5 --stairholdtime=60 --finalholdtime=600 
```


