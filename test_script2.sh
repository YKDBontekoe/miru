#!/bin/bash
          FAILURES=0
          for pid in "${PIDS[@]}"; do
            wait "$pid" || FAILURES=$((FAILURES+1))
          done
