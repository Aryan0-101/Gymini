import requests
import json
r = requests.get('https://oss.exercisedb.dev/api/v1/exercises?limit=50&offset=3000')
print(r.status_code)
try:
    print(len(r.json().get('data', [])))
    print(r.json().get('data', [])[0]['name'])
except Exception as e:
    print(e)
