import requests
import json

r = requests.get('https://oss.exercisedb.dev/swagger')
if r.status_code == 200:
    swagger = r.json()
    paths = swagger.get('paths', {})
    print(json.dumps(paths, indent=2))
else:
    print("Failed to get swagger:", r.status_code)
