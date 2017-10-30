make idea 17.10.27
start in 17.10.29

현재 기능: crontab에 해당 쉘스크립트 만들어서 등록시켜두면, 원하는 위치에 내가 원하는 파일이름으로 결과 리포트 뽑아줌..
예정된 기능: 메일로 해당 리포트를 보내준다.

## runScript.sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node "${DIR}/vultr_checker.js" --api-key [my-api-key] \
                               --email [my-email-address] \
                               --save-path "${HOME}/vultr_checker_report.txt"

## crontab

* 23 * * * ./runScript.sh >> vultrChecker.log 2>&1
