# echo "host: $1";
# echo "endpoind: $2";
ab -c 350 -n 10000 "$1$2"


# test api point
# sh benchmark.sh http://127.0.0.1:1234 /api?param1=12
# sh benchmark.sh http://127.0.0.1:1235 /api?param1=12

# test render about html
# sh benchmark.sh http://127.0.0.1:1234 /api/web/about
# sh benchmark.sh http://127.0.0.1:1235 /api/web/about

# test list 100 users
# sh benchmark.sh http://127.0.0.1:1234 /api/user
# sh benchmark.sh http://127.0.0.1:1235 /api/user

# test render portfolio html
# sh benchmark.sh http://127.0.0.1:1234 /api/web/portfolio
# sh benchmark.sh http://127.0.0.1:1235 /api/web/portfolio