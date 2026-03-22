#!/bin/bash
          PIDS=()
          for collection in backend/tests/postman/*.json; do
            if [[ "$collection" == *"00_setup_auth.json" ]] || [[ "$collection" == *"test_env.json" ]]; then
              continue
            fi
            echo "Starting Postman Collection: $collection"
            newman run "$collection" -e backend/tests/postman/test_env.json &
            PIDS+=($!)
          done
