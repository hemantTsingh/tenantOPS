import os
import time
import random
import requests
import schedule

API_URL = os.environ.get("API_URL", "http://tenant-api:4000")
INTERVAL = int(os.environ.get("COLLECT_INTERVAL", 30))
service_states = {}

def check_endpoint(url):
    try:
        start = time.time()
        res = requests.get(url, timeout=10)
        rt = int((time.time() - start) * 1000)
        return ("online" if res.status_code < 400 else "error"), rt
    except Exception as e:
        print(f"[collector] {url} unreachable: {e}")
        return "error", 0

def update_service(svc_id, status, response_time, uptime):
    try:
        requests.patch(
            f"{API_URL}/api/services/internal/{svc_id}",
            json={
                "status": status,
                "response_time": response_time,
                "uptime_percent": uptime,
                "cpu_usage": round(random.uniform(10, 85), 2),
                "memory_usage": round(random.uniform(20, 80), 2),
                "requests_per_min": random.randint(10, 500) if status == "online" else 0,
                "error_rate": round(random.uniform(0, 2), 2) if status == "online" else round(random.uniform(10, 50), 2)
            },
            timeout=5
        )
    except Exception as e:
        print(f"[collector] Update failed: {e}")

def create_incident(svc_id, svc_name, tenant_id):
    try:
        requests.post(
            f"{API_URL}/api/incidents/internal",
            json={
                "service_id": svc_id,
                "tenant_id": tenant_id,
                "title": f"{svc_name} is DOWN",
                "severity": "critical",
                "description": f"{svc_name} failed health check. Endpoint unreachable."
            },
            timeout=5
        )
        print(f"[collector] Incident created for {svc_name}")
    except Exception as e:
        print(f"[collector] Incident creation failed: {e}")

def resolve_incident(svc_id, svc_name):
    try:
        requests.post(
            f"{API_URL}/api/incidents/internal/resolve",
            json={"service_id": svc_id},
            timeout=5
        )
        print(f"[collector] Incident resolved for {svc_name}")
    except Exception as e:
        print(f"[collector] Incident resolve failed: {e}")


def check_alerts(svc, status, response_time, cpu, memory, error_rate):
    try:
        metrics = {
            "cpu_percent": cpu,
            "memory_percent": memory,
            "response_time": response_time,
            "error_rate": error_rate,
        }
        requests.post(
            f"{API_URL}/api/alerts/internal/check",
            json={
                "tenant_id": svc["tenant_id"],
                "service_id": svc["id"],
                "server": svc.get("endpoint", ""),
                "metrics": metrics
            },
            timeout=5
        )
    except Exception as e:
        print(f"[collector] Alert check failed: {e}")

def collect():
    print(f"[collector] Running check...")
    try:
        res = requests.get(f"{API_URL}/health", timeout=5)
        if res.status_code != 200:
            return
    except Exception as e:
        print(f"[collector] API unreachable: {e}")
        return

    try:
        svcs_res = requests.get(f"{API_URL}/api/services/internal/all", timeout=5)
        if svcs_res.status_code != 200:
            return
        services = svcs_res.json()
        print(f"[collector] Checking {len(services)} services")

        for svc in services:
            svc_id = svc["id"]
            svc_name = svc["name"]
            tenant_id = svc["tenant_id"]
            prev_status = service_states.get(svc_id, "unknown")

            if svc.get("endpoint"):
                status, response_time = check_endpoint(svc["endpoint"])
            else:
                status = "online"
                response_time = 0

            if status == "online":
                uptime = round(random.uniform(99.5, 100.0), 2)
            else:
                prev = float(svc.get("uptime_percent", 100))
                uptime = round(max(prev - round(random.uniform(0.1, 0.5), 2), 90.0), 2)

            update_service(svc_id, status, response_time, uptime)

            if prev_status == "online" and status == "error":
                create_incident(svc_id, svc_name, tenant_id)
            elif prev_status == "error" and status == "online":
                resolve_incident(svc_id, svc_name)

            service_states[svc_id] = status
            print(f"[collector] {svc_name} -> {status} {response_time}ms uptime:{uptime}%")

    except Exception as e:
        print(f"[collector] Error: {e}")

schedule.every(INTERVAL).seconds.do(collect)
print(f"[collector] Starting - polling every {INTERVAL}s")
collect()

while True:
    schedule.run_pending()
    time.sleep(1)
