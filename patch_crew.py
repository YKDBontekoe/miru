import re

with open('backend/app/domain/chat/crew_orchestrator.py', 'r') as f:
    content = f.read()

content = content.replace(
'''from app.infrastructure.external.spotify_tool import (
    SpotifyCurrentlyPlayingTool,
    SpotifyRecentlyPlayedTool,
    SpotifySearchTool,
)''',
'''from app.infrastructure.external.spotify_tool import (
    SpotifyCurrentlyPlayingTool,
    SpotifyRecentlyPlayedTool,
    SpotifySearchTool,
    SpotifyCreatePlaylistTool,
    SpotifyAddTracksToPlaylistTool,
    SpotifyGetRecommendationsTool,
)''')

content = content.replace(
'''                if integration.id == "spotify":
                    from app.infrastructure.external.spotify import SPOTIFY_API_BASE

                    access_token = integration.config.get("access_token") if integration.config else None
                    if access_token:
                        crew_tools.append(SpotifyCurrentlyPlayingTool(access_token=access_token))
                        crew_tools.append(SpotifyRecentlyPlayedTool(access_token=access_token))
                        crew_tools.append(SpotifySearchTool(access_token=access_token))''',
'''                if integration.id == "spotify":
                    from app.infrastructure.external.spotify import SPOTIFY_API_BASE

                    access_token = integration.config.get("access_token") if integration.config else None
                    if access_token:
                        crew_tools.append(SpotifyCurrentlyPlayingTool(access_token=access_token))
                        crew_tools.append(SpotifyRecentlyPlayedTool(access_token=access_token))
                        crew_tools.append(SpotifySearchTool(access_token=access_token))
                        crew_tools.append(SpotifyCreatePlaylistTool(access_token=access_token))
                        crew_tools.append(SpotifyAddTracksToPlaylistTool(access_token=access_token))
                        crew_tools.append(SpotifyGetRecommendationsTool(access_token=access_token))''')

with open('backend/app/domain/chat/crew_orchestrator.py', 'w') as f:
    f.write(content)
