import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def verify_update():
    print("1. Fetching first available result to get an ID...")
    try:
        res = requests.get(f"{BASE_URL}/api/results")
        if res.status_code != 200:
            print(f"FAILED: Could not fetch results. Status: {res.status_code}")
            return False
        
        data = res.json()
        if not data:
            print("FAILED: No data in database to test with.")
            return False
            
        # Find a suitable row (e.g., the first one)
        target_row = data[0]
        row_id = target_row.get('id')  # This matches the DB primary key
        # Note: If 'id' is not in to_dict(), we might need to check models.py or use 'row_number' if that's the PK?? 
        # Looking at app.py: MaterialData.query.get(row_id). The route uses <int:row_id>.
        # Let's check what keys are in target_row
        if 'id' not in target_row:
             # Fallback if 'id' isn't exposed in to_dict() but 'row_number' might be usable if it were PK, 
             # but app.py line 559 `material_entry = MaterialData` doesn't explicitly set ID, so it's auto-increment int.
             # And app.py line 831 return jsonify([r.to_dict() ...])
             # If to_dict doesn't verify ID, we might have trouble.
             print(f"WARNING: 'id' field missing in response. Keys: {target_row.keys()}")
             # If the model uses `id` as PK, to_dict usually includes it. 
             # Let's assume it IS there or we use 'row_number' if the user code conflated them. 
             # But the route `/api/results/<int:row_id>` calls `MaterialData.query.get(row_id)`, which is PK lookup.
             # If `id` key is missing, we can't test properly without guessing. 
             # Let's assuming it's available.
             pass

        print(f"Target Row ID: {row_id}, Current Desc: {target_row.get('item_description')}")
        
        original_desc = target_row.get('item_description')
        test_desc = original_desc + " [TEST]"
        
        print(f"2. Sending PUT request to update description to: '{test_desc}'")
        res_put = requests.put(f"{BASE_URL}/api/results/{row_id}", json={'item_description': test_desc})
        
        if res_put.status_code != 200:
            print(f"FAILED: PUT request failed. Status: {res_put.status_code}, Body: {res_put.text}")
            return False
            
        updated_row = res_put.json()
        if updated_row.get('item_description') == test_desc:
            print("SUCCESS: Description updated correctly.")
        else:
            print(f"FAILED: Description mismatch. Got: {updated_row.get('item_description')}")
            return False

        print("3. Reverting change...")
        requests.put(f"{BASE_URL}/api/results/{row_id}", json={'item_description': original_desc})
        print("Reverted.")
        return True

    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = verify_update()
    if not success:
        sys.exit(1)
