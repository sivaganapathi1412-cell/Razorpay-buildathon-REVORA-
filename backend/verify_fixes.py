import urllib.request
import json
import time

def run_tests():
    print("=== 1. VERIFYING BACKEND CATALOG API ===")
    req = urllib.request.urlopen("http://localhost:8000/api/v1/products?limit=120")
    assert req.getcode() == 200
    products = json.loads(req.read().decode("utf-8"))
    print(f"Total active products returned by API: {len(products)}")

    cats = {}
    for p in products:
        c = p["category"]
        cats[c] = cats.get(c, 0) + 1
    for c, count in sorted(cats.items()):
        print(f"  - {c}: {count} products")

    # Verify canonical hero product
    hero = next((p for p in products if p["sku"] == "REV-SHOE-01"), None)
    assert hero is not None, "REV-SHOE-01 missing!"
    print(f"Canonical Hero Product: {hero['name']} (SKU: {hero['sku']}, Price: INR {hero['price']}, Img: {hero['image_url']})")

    print("\n=== 2. VERIFYING ALL 100 PRODUCT IMAGES OVER HTTP (PORT 3000) ===")
    latencies = []
    failures = []
    start_all = time.time()
    for p in products:
        img_url = f"http://localhost:3000{p['image_url']}"
        t0 = time.time()
        try:
            r = urllib.request.urlopen(img_url)
            content = r.read()
            dur_ms = (time.time() - t0) * 1000
            latencies.append(dur_ms)
            if r.getcode() != 200 or len(content) < 500:
                failures.append((p['sku'], img_url, r.getcode(), len(content)))
        except Exception as e:
            failures.append((p['sku'], img_url, str(e)))

    total_time = time.time() - start_all
    print(f"Fetched {len(products)} images in {total_time:.2f}s")
    print(f"Image HTTP Latency: Min={min(latencies):.1f}ms, Max={max(latencies):.1f}ms, Avg={sum(latencies)/len(latencies):.1f}ms")
    print(f"Image Load Failures: {len(failures)}")
    assert len(failures) == 0, f"Failures: {failures}"

    print("\n=== 3. VERIFYING CUSTOMER & OWNER AUTH APIS ===")
    # Customer login
    data = json.dumps({"email": "rahul.sharma@demo.revora.ai", "password": "password123"}).encode("utf-8")
    req = urllib.request.Request("http://localhost:8000/api/v1/customer/login", data=data, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    cust_auth = json.loads(res.read().decode("utf-8"))
    print(f"Customer Login Success: customer_id={cust_auth.get('customer', {}).get('id')}, token={cust_auth.get('token', '')[:16]}...")

    # Merchant login
    data = json.dumps({"email": "owner@revora.demo", "password": "demo_password_123"}).encode("utf-8")
    req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=data, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    merchant_auth = json.loads(res.read().decode("utf-8"))
    print(f"Merchant Login Success: user={merchant_auth.get('user', {}).get('email')}, token={merchant_auth.get('access_token', '')[:16]}...")

    print("\n=== 4. VERIFYING FRONTEND GATEWAY HTML (PORT 3000) ===")
    req = urllib.request.urlopen("http://localhost:3000/")
    html = req.read().decode("utf-8")
    assert "REVORA" in html
    assert "CUSTOMER" in html or "portal-customer-btn" in html
    assert "STORE OWNER" in html or "portal-owner-btn" in html
    print("Frontend Root Response Verified: Gateway HTML rendered with dual portals.")

    req = urllib.request.urlopen("http://localhost:3000/login")
    login_html = req.read().decode("utf-8")
    assert "REVORA" in login_html
    print("Frontend Login Route Verified: Unified Gateway rendered at /login.")

    print("\n>>> ALL SYSTEM VERIFICATIONS PASSED 100% <<<")

if __name__ == "__main__":
    run_tests()
