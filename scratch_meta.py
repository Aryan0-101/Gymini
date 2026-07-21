import requests
r = requests.get('https://oss.exercisedb.dev/api/v1/exercises?limit=100&offset=0')
print(r.json().get('meta'))
