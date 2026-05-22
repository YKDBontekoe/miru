from testcontainers.postgres import PostgresContainer

print("Attempting to start postgres container...")
try:
    with PostgresContainer("postgres:15-alpine") as postgres:
        print("Started! URL:", postgres.get_connection_url())
except Exception as e:
    print("Failed!", str(e))
