import requests
import time

CAS_API_KEY = "XBr7txDIgp8FNY3ziNqaqRFiTShZBdb3V3GN3QAb"

class CASClient:
    def __init__(self, key=CAS_API_KEY):
        self.key = key
        self.headers = {'x-api-key': key, 'User-Agent': 'Mozilla/5.0'}

    def search_and_detail(self, query):
        if not query or len(query) < 3: 
            return None, None
        try:
            res = requests.get("https://commonchemistry.cas.org/api/search",
                               params={'q': query}, headers=self.headers, timeout=10)
            if res.status_code == 200 and res.json().get('count', 0) > 0:
                rn = res.json()['results'][0]['rn']
                time.sleep(1.1)
                det = requests.get("https://commonchemistry.cas.org/api/detail",
                                   params={'cas_rn': rn}, headers=self.headers, timeout=10)
                syns = "|".join(det.json().get('synonyms', [])[:10]) if det.status_code == 200 else "N/A"
                return rn, syns
        except:
            pass
        return None, None
