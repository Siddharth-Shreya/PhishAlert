#!/usr/bin/env bash

./curl_api_tests.sh

source ../env/Scripts/Activate # For Windows only right now, will handle POSIX later
pytest -q -p no:warnings