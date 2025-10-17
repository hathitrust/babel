Assuming working directory is `babel`...

To run tests:
prove -r imgsrv/t

To run coverage with HTML report:
cover -report html -ignore_re '^imgsrv/t' -ignore_re '^imgsrv/lib/PDF' -ignore_re '^imgsrv/lib/Font' -test -make 'prove -r imgsrv/t; exit $?'
