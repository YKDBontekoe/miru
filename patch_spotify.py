import re

with open('backend/app/infrastructure/external/spotify.py', 'r') as f:
    content = f.read()

content = content.replace(
'''        if seed_artists: params["seed_artists"] = seed_artists
        if seed_genres: params["seed_genres"] = seed_genres
        if seed_tracks: params["seed_tracks"] = seed_tracks''',
'''        if seed_artists:
            params["seed_artists"] = seed_artists
        if seed_genres:
            params["seed_genres"] = seed_genres
        if seed_tracks:
            params["seed_tracks"] = seed_tracks''')

with open('backend/app/infrastructure/external/spotify.py', 'w') as f:
    f.write(content)


with open('backend/app/infrastructure/external/spotify_tool.py', 'r') as f:
    content = f.read()

content = content.replace(
'''from app.infrastructure.external.spotify import (
    get_currently_playing,
    get_recently_played,
    search_spotify,
)''',
'''from app.infrastructure.external.spotify import (
    add_tracks_to_playlist,
    create_playlist,
    get_currently_playing,
    get_recently_played,
    get_recommendations,
    search_spotify,
)''')

content = content.replace(
'''from app.infrastructure.external.spotify import (
    add_tracks_to_playlist,
    create_playlist,
    get_recommendations,
)''',
'')

with open('backend/app/infrastructure/external/spotify_tool.py', 'w') as f:
    f.write(content)
