#!/bin/bash
isExistApp = 'pgrep node'
if [[ -n $isExistApp ]]; then
	taskkill /F /IM node.exe
fi