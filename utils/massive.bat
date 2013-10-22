echo on

set SEMMANTIC_EXEC=C:\Users\gimenete\AppData\Local\PlasticSCM4\semanticmerge\codeexternalparserreplay.exe
set PARSER_EXEC=C:\Users\gimenete\Documents\semanticmerge\run.js
set NODE_PATH="C:\Program Files\nodejs\node.exe"
set SRC="C:\Users\gimenete\Documents\semanticmerge\massivein"
set DST="C:\Users\gimenete\Documents\semanticmerge\massiveout"

%SEMMANTIC_EXEC% -s=%SRC% -r=%DST% -ep="\"%PARSER_EXEC%\"" -vm=%NODE_PATH% -fe=*.js
