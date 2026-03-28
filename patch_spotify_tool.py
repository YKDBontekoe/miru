import re

with open('backend/app/infrastructure/external/spotify_tool.py', 'r') as f:
    content = f.read()

content = content.replace(
'''def _run_async_in_sync(coro: typing.Coroutine[typing.Any, typing.Any, str]) -> str:''',
'''def _run_async_in_sync(coro: typing.Coroutine[typing.Any, typing.Any, typing.Any]) -> typing.Any:''')

with open('backend/app/infrastructure/external/spotify_tool.py', 'w') as f:
    f.write(content)
