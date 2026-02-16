import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def verify_sync():
    print("--- 🧪 Testing Sync API Logging ---")
    
    # 1. Fetch any material to use as ID
    res = requests.get(f"{BASE_URL}/api/clusters")
    tree = res.json()
    
    def find_first_material(node):
        # Check if it has db_id or type=material
        if node.get('type') == 'material' or 'db_id' in node: 
            return node
        for child in node.get('children', []):
            found = find_first_material(child)
            if found: return found
        return None

    mat = find_first_material(tree)
    if not mat:
        print("❌ No material found in tree.")
        return

    print(f"   🎯 Found Test Node. ID: '{mat.get('id')}'")
    print(f"      Current Parent in Tree: (We assume it's deep)")

    # 2. Send Sync Payload - Move to ROOT
    payload = [
        {"node_id": mat['id'], "parent_id": tree['id']}
    ]
    
    print(f"   📡 Sending Sync Payload (Move to Root): {payload}")
    
    try:
        res = requests.post(f"{BASE_URL}/api/clusters/sync", json=payload)
        res.raise_for_status()
        print("   ✅ Sync API Success.")
    except Exception as e:
        print(f"   ❌ Sync Failed: {e}")
        return

    # 3. Verify Persistence
    print("   🔍 Fetching Tree again to verify persistence...")
    res = requests.get(f"{BASE_URL}/api/clusters")
    new_tree = res.json()
    
    # Check if node is directly in root children
    found_in_root = False
    if 'children' in new_tree:
        for child in new_tree['children']:
            if child['id'] == mat['id']:
                found_in_root = True
                break
    
    if found_in_root:
        print("   ✅ SUCCESS! Node found in Root children.")
    else:
        print("   ❌ FAILURE! Node NOT found in Root children.")
        # Try to find it elsewhere to see if it exists at all
        def find_node(n, target_id):
            if n['id'] == target_id: return n
            for c in n.get('children', []):
                f = find_node(c, target_id)
                if f: return f
            return None
        
        found = find_node(new_tree, mat['id'])
        if found:
            print("      (Node exists but is nested somewhere else)")
        else:
            print("      (Node completely missing from tree!?)")

if __name__ == "__main__":
    verify_sync()
