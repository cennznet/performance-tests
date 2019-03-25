# Substrate performance test script

Performance test script for the blockchain node based on Substrate.
This script only sends transfer transactions to the nodes. All cennznet nodes need to be launched manually.

## Before Test

__Install node__

Need the node version later then 10.

__Install dependancies__

Go to the repo folder and install.
```bash
npm install
```

__Launch cennznet nodes__

Mannually launch cennznet nodes for the following tests. Refer to [https://github.com/cennznet/cennznet-node](https://github.com/cennznet/cennznet-node) for more details.

__Topup test addresses__

This command will call a script to top up all test addresses. The top-up action is the transfer transaction from inheret account of node to test addresses.
```bash
node src/run --topup -i 10 -e local -s 0 -c 1000 --ws=ws://127.0.0.1:9944
# parameters:
#   --topup:    Run topup program.
#   --ws:   Websocket server ip and port, default ip is 'ws://127.0.0.1:9944'.
#   -i:    Transaction interval (ms).
#   -e:    Environment, 'local' or 'dev', default is 'local'. (Their inherent accounts are different)
#   -s:    Start position of the address list, default is 0.
#   -c:    Count of addresses needs to be topup, default is 1000.
```

## Usage

__One-time test__

In this test, each user will only send one transaction then stop.
```bash
# Go to the project folder and run
node src/run --once --user=10 --nodeSelect=random --ws=ws://127.0.0.1:9944 --ws=ws://127.0.0.1:9944
# parameters:
#   --ws:           Websocket server ip and port, default is 'ws://127.0.0.1:9944'.
#                   Multiple ws servers: Connect to multiple ws servers using more additional '--ws=...', e.g. '--ws=ws://127.0.0.1:9944 --ws=ws://localhost:8844'
#   --nodeSelect:   Transaction will be sent in a 'sequence' or 'random' way to each ws server, default is 'sequence'.
#   --once: Each user send only one transaction.
#   --user: User count.
```

__Scheduled load test__
```bash
# Go to the project folder and run
node src/run --user=13 --startuser=10 --pacingtime=1 --rampuprate=1 --stairuser=5 --stairholdtime=60 --finalholdtime=600 --ws=ws://127.0.0.1:9944 --ws=ws://127.0.0.1:9955 --nodeSelect=random
# parameters:
#   --ws:           Websocket server ip and port, default is 'ws://127.0.0.1:9944'.
#                   Multiple ws servers: Connect to multiple ws servers using more additional '--ws=...', e.g. '--ws=ws://127.0.0.1:9944 --ws=ws://localhost:8844'
#   --nodeSelect:   Transaction will be sent in a 'sequence' or 'random' way to each ws server, default is 'sequence'.
#   --user:         User count
#   --startuser:    Default user count at the start of test.
#   --pacingtime:   The interval before a user send another transaction.
#   --rampuprate:   The user count to be injected in one second.
#   --stairuser:    The user count for each stair. When the stair reached, it will hold for defined time (stairholdtime).
#   --stairholdtime: Holding time for each 'stairuser' when the stair reached.
#   --finalholdtime: The holding time after all users arrive.
```

## Docker Image

Run the test from a docker image.

__Build an image__  
```bash
# Build an image named 'perftest_substrate'
docker build -t perftest_substrate .
```

__Command to run the test__

**Note**: When running via docker locally, **ws ip** cannot be omitted, and use 'docker.for.mac.localhost' instead of 'localhost or 127.0.0.1'.

```bash
# Topup
docker run perftest_substrate --topup -i 10 -e local -s 0 -c 1000 --ws ws://docker.for.mac.localhost:9944

# One-time test
docker run perftest_substrate --ws=ws://docker.for.mac.localhost:9944 --once --user=10

# Scheduled load test
docker run perftest_substrate --ws=ws://docker.for.mac.localhost:9944 --user=13 --startuser=10 --pacingtime=1 --rampuprate=1 --stairuser=5 --stairholdtime=60 --finalholdtime=600 
```


