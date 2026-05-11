#!/bin/bash
set -e

TENANTOPS_API="${TENANTOPS_API:-http://13.203.64.25:4000}"
SERVER_NAME="${SERVER_NAME:-$(hostname)}"
INTERVAL="${INTERVAL:-30}"
AGENT_DIR="/opt/tenantops-agent"

echo "============================================"
echo " TenantOPS Agent Installer"
echo " API:    $TENANTOPS_API"
echo " Server: $SERVER_NAME"
echo "============================================"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    OS=$(uname -s)
fi
echo "[OK] OS: $OS $OS_VERSION"

# Detect Python
if command -v python3 &>/dev/null; then
    PYTHON=$(command -v python3)
    PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    echo "[OK] Python $PY_VERSION at $PYTHON"
elif command -v python &>/dev/null; then
    PYTHON=$(command -v python)
    PY_VERSION=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    echo "[OK] Python $PY_VERSION at $PYTHON"
else
    echo "[ERROR] Python not found. Installing..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get update -qq && apt-get install -y python3 python3-pip -qq
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
        yum install -y python3 python3-pip -q
    elif [ "$OS" = "amzn" ]; then
        yum install -y python3 python3-pip -q
    else
        echo "[ERROR] Cannot install Python automatically on $OS"
        exit 1
    fi
    PYTHON=$(command -v python3)
    PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
fi

mkdir -p $AGENT_DIR

# Strategy 1 — try venv with correct version package
echo "[1/4] Setting up isolated Python environment..."
VENV_OK=false

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y python${PY_VERSION}-venv python${PY_VERSION}-distutils 2>/dev/null || \
    apt-get install -y python3-venv python3-distutils 2>/dev/null || true
fi

if python3 -m venv $AGENT_DIR/venv 2>/dev/null; then
    echo "[OK] venv created successfully"
    VENV_OK=true
fi

# Strategy 2 — try virtualenv
if [ "$VENV_OK" = "false" ]; then
    echo "[INFO] venv failed, trying virtualenv..."
    if command -v pip3 &>/dev/null; then
        pip3 install virtualenv -q 2>/dev/null || true
    elif command -v pip &>/dev/null; then
        pip install virtualenv -q 2>/dev/null || true
    fi
    if python3 -m virtualenv $AGENT_DIR/venv 2>/dev/null; then
        echo "[OK] virtualenv created"
        VENV_OK=true
    fi
fi

# Strategy 3 — use system python with user install
if [ "$VENV_OK" = "false" ]; then
    echo "[INFO] Using system Python with user packages..."
    mkdir -p $AGENT_DIR/lib
    $PYTHON -m pip install --user --quiet psutil requests 2>/dev/null || \
    $PYTHON -m pip install --user --quiet psutil requests --break-system-packages 2>/dev/null || true
    PYTHON_BIN=$PYTHON
    USE_SYSTEM=true
fi

# Set python and pip paths
if [ "$VENV_OK" = "true" ]; then
    PYTHON_BIN=$AGENT_DIR/venv/bin/python
    PIP_BIN=$AGENT_DIR/venv/bin/pip
    echo "[2/4] Installing packages in venv..."
    $PIP_BIN install --quiet --upgrade pip 2>/dev/null || true
    $PIP_BIN install --quiet psutil requests
else
    PYTHON_BIN=$PYTHON
    echo "[2/4] Packages installed in user space"
fi

# Verify psutil available
if ! $PYTHON_BIN -c "import psutil" 2>/dev/null; then
    echo "[ERROR] psutil not available. Trying one more method..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y python3-psutil -qq 2>/dev/null || true
    fi
fi

if ! $PYTHON_BIN -c "import psutil, requests" 2>/dev/null; then
    echo "[ERROR] Required packages could not be installed"
    exit 1
fi

echo "[OK] All packages available"

# Write agent script
echo "[3/4] Writing agent..."
cat > $AGENT_DIR/agent.py << PYEOF
import psutil
import requests
import time
import socket
import subprocess
import os
import json

TENANTOPS_API = os.environ.get("TENANTOPS_API", "$TENANTOPS_API")
SERVER_NAME = os.environ.get("SERVER_NAME", "$SERVER_NAME")
INTERVAL = int(os.environ.get("INTERVAL", "$INTERVAL"))

def get_docker_containers():
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}|{{.Status}}|{{.Image}}"],
            capture_output=True, text=True
        )
        containers = []
        for line in result.stdout.strip().split("\n"):
            if "|" in line:
                parts = line.split("|")
                containers.append({"name": parts[0], "status": parts[1], "image": parts[2] if len(parts) > 2 else ""})
        return containers
    except:
        return []

def get_top_processes():
    try:
        procs = []
        for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "status"]):
            try:
                procs.append({
                    "pid": p.info["pid"],
                    "name": p.info["name"],
                    "cpu": round(p.info["cpu_percent"] or 0, 2),
                    "memory": round(p.info["memory_percent"] or 0, 2),
                    "status": p.info["status"]
                })
            except:
                pass
        return sorted(procs, key=lambda x: x["cpu"], reverse=True)[:10]
    except:
        return []

def get_logged_in_users():
    try:
        return [{"name": u.name, "terminal": u.terminal or "ssh"} for u in psutil.users()]
    except:
        return []

def get_journal_logs():
    logs = []
    try:
        result = subprocess.run(
            ["journalctl", "-n", "50", "--no-pager", "-o", "json",
             "--output-fields=MESSAGE,PRIORITY,SYSLOG_IDENTIFIER,_SYSTEMD_UNIT"],
            capture_output=True, text=True
        )
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            try:
                entry = json.loads(line)
                priority = int(entry.get("PRIORITY", 6))
                level = {0:"EMERGENCY",1:"ALERT",2:"CRITICAL",3:"ERROR",
                         4:"WARNING",5:"NOTICE",6:"INFO",7:"DEBUG"}.get(priority, "INFO")
                source = entry.get("SYSLOG_IDENTIFIER") or entry.get("_SYSTEMD_UNIT") or "system"
                message = entry.get("MESSAGE", "")
                if isinstance(message, list):
                    message = " ".join(str(m) for m in message)
                logs.append({"server": SERVER_NAME, "level": level, "message": str(message)[:500], "source": str(source)[:100]})
            except:
                pass
    except:
        pass
    return logs

def get_docker_logs():
    logs = []
    try:
        for c in get_docker_containers():
            result = subprocess.run(
                ["docker", "logs", "--tail", "5", "--timestamps", c["name"]],
                capture_output=True, text=True
            )
            for line in (result.stdout + result.stderr).strip().split("\n"):
                if line:
                    level = "ERROR" if "error" in line.lower() else "WARNING" if "warn" in line.lower() else "INFO"
                    logs.append({"server": SERVER_NAME, "level": level, "message": line[:300], "source": "docker:" + c["name"]})
    except:
        pass
    return logs

def send_logs(logs):
    for log in logs[:30]:
        try:
            requests.post(f"{TENANTOPS_API}/api/logs/syslogs", json=log, timeout=3)
        except:
            pass

def collect():
    try:
        cpu = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        net = psutil.net_io_counters()
        data = {
            "server": SERVER_NAME,
            "hostname": socket.gethostname(),
            "cpu_percent": cpu,
            "memory_total": mem.total,
            "memory_used": mem.used,
            "memory_percent": mem.percent,
            "disk_total": disk.total,
            "disk_used": disk.used,
            "disk_percent": disk.percent,
            "net_bytes_sent": net.bytes_sent,
            "net_bytes_recv": net.bytes_recv,
            "active_connections": len(psutil.net_connections()),
            "running_processes": len(psutil.pids()),
            "logged_in_users": get_logged_in_users(),
            "docker_containers": get_docker_containers(),
            "top_processes": get_top_processes(),
            "timestamp": time.time()
        }
        res = requests.post(f"{TENANTOPS_API}/api/agent/report", json=data, timeout=5)
        print(f"[agent] CPU:{cpu}% MEM:{mem.percent}% DISK:{disk.percent}% -> {res.status_code}", flush=True)
        logs = get_journal_logs() + get_docker_logs()
        send_logs(logs)
        print(f"[agent] Logs: {len(logs)}", flush=True)
    except Exception as e:
        print(f"[agent] Error: {e}", flush=True)

print(f"[agent] Starting on {socket.gethostname()} -> {TENANTOPS_API}", flush=True)
while True:
    collect()
    time.sleep(INTERVAL)
PYEOF

# Install systemd service
echo "[4/4] Installing systemd service..."
cat > /etc/systemd/system/tenantops-agent.service << SVCEOF
[Unit]
Description=TenantOPS Monitoring Agent
After=network.target

[Service]
Type=simple
Environment="TENANTOPS_API=$TENANTOPS_API"
Environment="SERVER_NAME=$SERVER_NAME"
Environment="INTERVAL=$INTERVAL"
ExecStart=$PYTHON_BIN $AGENT_DIR/agent.py
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tenantops-agent

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable tenantops-agent --quiet
systemctl restart tenantops-agent
sleep 5

if systemctl is-active --quiet tenantops-agent; then
    echo ""
    echo "============================================"
    echo " Agent running successfully"
    echo " Server:  $SERVER_NAME"
    echo " API:     $TENANTOPS_API"
    echo " Python:  $PYTHON_BIN"
    echo ""
    echo " Commands:"
    echo "   Status: systemctl status tenantops-agent"
    echo "   Logs:   journalctl -u tenantops-agent -f"
    echo "   Stop:   systemctl stop tenantops-agent"
    echo "   Remove: systemctl disable tenantops-agent && rm -rf $AGENT_DIR"
    echo "============================================"
else
    echo "[ERROR] Agent failed to start"
    journalctl -u tenantops-agent -n 20 --no-pager
    exit 1
fi
