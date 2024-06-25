#!/bin/bash

grep -hIRP '^\s*(use|require)\s+.*?;' * | grep -vP '(use\s+constant|^\s*$|SDRROOT|\(|strict)'| cut -f 2 -d " ";
