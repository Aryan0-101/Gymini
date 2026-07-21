import requests
import json

r = requests.get('https://oss.exercisedb.dev/swagger')
swagger = r.json()
paths = swagger.get('paths', {})

for path, methods in paths.items():
    if 'exercises' in path:
        print(f"Path: {path}")
        for m in methods:
            print(f"  Method: {m}")
            params = methods[m].get('parameters', [])
            for p in params:
                print(f"    Param: {p.get('name')} in {p.get('in')} type {p.get('schema', {}).get('type')}")
