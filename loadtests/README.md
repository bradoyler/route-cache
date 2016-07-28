# Load Tests

## Test 1A - no cache, low volume
Load: 20 requests, 2 concurrent users 

Cache TTL: disable

#### Start

```sh
$ node loadtests/app -TTL disabled
```

In new terminal

#### Execute ApacheBench CLI

```sh
$ ab -n20 -c2 http://localhost:3000/
```

#### Results 
(with a slow (900ms) route)

```
Server Hostname:        localhost
Server Port:            3000

Document Path:          /
Document Length:        48 bytes

Concurrency Level:      2
Time taken for tests:   9.086 seconds
Complete requests:      20
Failed requests:        0
Total transferred:      4860 bytes
HTML transferred:       960 bytes
Requests per second:    2.20 [#/sec] (mean)
Time per request:       908.628 [ms] (mean)
Time per request:       454.314 [ms] (mean, across all concurrent requests)
Transfer rate:          0.52 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.1      0       0
Processing:   905  908   6.1    907     926
Waiting:      904  908   5.3    906     923
Total:        905  909   6.1    907     926

```

## Test 1B - 5 sec cache, low volume
Load: 20 requests, 2 concurrent users

Cache TTL: 5 seconds

#### Start

```sh
$ node loadtests/app -TTL 5
```

In new terminal

#### Execute ApacheBench CLI

```sh
$ ab -n20 -c2 http://localhost:3000/
```

#### Results 
(with a slow (900ms) route)

```
Server Hostname:        localhost
Server Port:            3000

Document Path:          /
Document Length:        48 bytes

Concurrency Level:      2
Time taken for tests:   0.941 seconds
Complete requests:      20
Failed requests:        0
Total transferred:      4860 bytes
HTML transferred:       960 bytes
Requests per second:    21.26 [#/sec] (mean)
Time per request:       94.065 [ms] (mean)
Time per request:       47.032 [ms] (mean, across all concurrent requests)
Transfer rate:          5.05 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.0      0       0
Processing:     1   94 285.1      1     928
Waiting:        1   93 284.0      1     925
Total:          1   94 285.1      1     928

```



## Test 2 - 5 sec cache, high volume
Load: 2000 requests, 20 concurrent users

Cache TTL: 5 seconds

#### Start

```sh
$ node loadtests/app -TTL 5
```

In new terminal

#### Execute ApacheBench CLI

```sh
$ ab -n2000 -c20 http://localhost:3000/
```

#### Results 
(with a slow (900ms) route)

```
Server Software:        
Server Hostname:        localhost
Server Port:            3000

Document Path:          /
Document Length:        48 bytes

Concurrency Level:      20
Time taken for tests:   1.984 seconds
Complete requests:      2000
Failed requests:        0
Total transferred:      486000 bytes
HTML transferred:       96000 bytes
Requests per second:    1007.87 [#/sec] (mean)
Time per request:       19.844 [ms] (mean)
Time per request:       0.992 [ms] (mean, across all concurrent requests)
Transfer rate:          239.17 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.3      0       4
Processing:     2   19  92.8      9     937
Waiting:        1   19  92.2      9     931
Total:          5   20  92.9      9     937

```
