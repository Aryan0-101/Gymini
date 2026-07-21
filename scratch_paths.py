import requests
import json

r = requests.get('https://oss.exercisedb.dev/swagger')
paths = r.json().get('paths', {})
print([p for p in paths.keys()])
