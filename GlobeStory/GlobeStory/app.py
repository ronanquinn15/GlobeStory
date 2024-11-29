import requests, uuid, json

RAI = "https://prod-00.uksouth.logic.azure.com/workflows/ca0d346342204e40b89a887c38ef1a4b/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/travel/%7Blangauge%7D?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=dPeWrzDmZvG2Yt6mwJP3lxFqfs7gYD-5AabI1dm_SvY";

key = "AnQq0WHTxK9dMbkZBHLJscXVshw9MKms2YWkbN2vxV8FDpN6WQAPJQQJ99AKAClhwhEXJ3w3AAAbACOGI2UP"
trans_endpoint = "https://api.cognitive.microsofttranslator.com/"
location = "ukwest"
trans_path = '/translate'
constructed_url = trans_endpoint + trans_path
params = {
'api-version': '3.0',
'from': 'en',
'to': ['fr', 'ja', 'ar']
}
headers = {
'Ocp-Apim-Subscription-Key': key,
'Ocp-Apim-Subscription-Region': location,
'Content-type': 'application/json',
}

response_rai = requests.get(RAI)
response_rai_json = response_rai.json()
description = [{"text": item["description"]} for item in response_rai_json]

request = requests.post(constructed_url, params=params, headers=headers, json=description)
response = request.json()
print(json.dumps(response, sort_keys=True, ensure_ascii=False, indent=4,
separators=(',', ': ')))