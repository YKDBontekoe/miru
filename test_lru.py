import functools

@functools.lru_cache(maxsize=100)
def sync_func(x):
    return x*2
