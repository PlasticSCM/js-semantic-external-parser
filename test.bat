echo off

set SEMMANTIC_PATH=C:\Users\gimenete\AppData\Local\PlasticSCM4\semanticmerge
set PARSER_DIR=C:\Users\gimenete\Documents\semanticmerge
set NODE_PATH=C:\Program Files\nodejs\node.exe
set TEST_FILES=C:\Users\gimenete\Documents\semanticmerge\testfiles

set EXTERNAL_PARSER="""%NODE_PATH%"" ""%PARSER_DIR%\run.js""

%SEMMANTIC_PATH%\semanticmergetool.exe -s=%TEST_FILES%\source.js -b=%TEST_FILES%\base.js -d=%TEST_FILES%\dest.js -r=%TEST_FILES%\result.js -emt=default -edt=default -ep=%EXTERNAL_PARSER%
