#!/usr/bin/env bash

docker build -t $(cat IMAGE_NAME.txt) .
