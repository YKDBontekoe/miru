with open('.github/workflows/flutter-web-smoke-test.yml', 'r') as f:
    content = f.read()

old_loop = """          # Wait for backend to be healthy
          echo "Waiting for backend..."
          for i in {1..30}; do
            if curl -s http://127.0.0.1:8000/health | grep -q "status"; then
              echo "Backend is up!"
              break
            fi
            sleep 1
          done"""

new_loop = """          # Wait for backend to be healthy
          echo "Waiting for backend..."
          backend_up=0
          for i in {1..30}; do
            if curl -s http://127.0.0.1:8000/health | grep -q "status"; then
              echo "Backend is up!"
              backend_up=1
              break
            fi
            sleep 1
          done

          if [ $backend_up -eq 0 ]; then
            echo "::error::Backend failed to start"
            EXIT 1
          fi"""

content = content.replace(old_loop, new_loop.replace('EXIT', 'exit'))

with open('.github/workflows/flutter-web-smoke-test.yml', 'w') as f:
    f.write(content)
