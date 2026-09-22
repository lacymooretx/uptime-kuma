#!/usr/bin/env python3
"""Provision the OPNsense firmware-update dead-man's-switch monitor in Uptime Kuma.

Companion to ~/code/vultr-proxmox/scripts/opnsense/opnsense-update-monitor.py,
which runs on the firewall (VM 100) every 6 hours and pushes here.

Why a PUSH monitor and not an HTTP poll of the OPNsense API:
  A poller can only answer "does the firewall report updates?" -- and on
  2026-06-13 the firewall's own checker wedged and reported "up to date" for two
  months. A push monitor alerts on the ABSENCE of a heartbeat, so the checker
  dying is itself an alert. That is the failure mode we actually got burned by.

Idempotent: if a monitor with MONITOR_NAME already exists it is updated in place
and its existing pushToken is preserved (so the firewall side keeps working).

Usage:
  python3 scripts/provision-opnsense-update-monitor.py [--dry-run]

On success it prints the push URL to paste into the firewall's
/usr/local/etc/opnsense-update-monitor.conf.
"""

from __future__ import annotations

import argparse
import base64
import json
import secrets
import string
import sys
import urllib.error
import urllib.request
from pathlib import Path

API_BASE = "https://uptime.aspendora.com"

MONITOR_NAME = "OPNsense pve-atl-01 - firmware current (dead-mans switch)"

# The firewall pushes every 6h (cron at :17). Kuma expects a beat every 6h;
# one retry hour later; then it alerts. resendInterval=4 re-nags roughly daily
# so a genuinely pending update does not scroll off the top of Pushover.
MONITOR = {
    "type": "push",
    "name": MONITOR_NAME,
    "interval": 21600,        # 6 h  -- expected heartbeat period
    "retryInterval": 3600,    # 1 h  -- grace before declaring DOWN
    "resendInterval": 4,      # re-notify every 4 down-checks (~24 h)
    "maxretries": 1,
    "active": True,
    "upsideDown": False,
    "accepted_statuscodes": ["200-299"],
    "description": (
        "Heartbeat from VM 100 (OPNsense). The firewall runs a LIVE "
        "`configctl firmware check` every 6h and pushes the verdict here.\n\n"
        "DOWN means one of:\n"
        "  - package/firmware updates are pending\n"
        "  - a reboot is required\n"
        "  - a MAJOR upgrade is available / the branch is EOL\n"
        "  - the firmware checker is wedged (stale cache -- the 2026-06-13 bug)\n"
        "  - no heartbeat at all: cron gone, script wiped by an upgrade, or "
        "the firewall is down\n\n"
        "Runbook: ~/code/vultr-proxmox/docs/opnsense-update-monitoring.md"
    ),
}

NOTIFICATION_IDS = {"1": True}   # Pushover - Aspendora (default channel)


def load_api_key() -> str:
    """Resolve the Kuma API key, expanding shell-style $VAR refs in the .env."""
    secrets_file = Path.home() / ".secrets" / ".env"
    if not secrets_file.exists():
        sys.exit("~/.secrets/.env missing")
    raw: dict[str, str] = {}
    for line in secrets_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        raw[key.strip()] = val.strip().strip('"').strip("'")

    def resolve(val: str, depth: int = 0) -> str:
        if depth > 5 or not val.startswith("$"):
            return val
        return resolve(raw.get(val[1:], ""), depth + 1)

    for name in ("UPTIME_KUMA_BOOTSTRAP_API_KEY", "UPTIME_ASPENDORA_KUMA_API_KEY"):
        if name in raw and (val := resolve(raw[name])):
            return val
    sys.exit("Couldn't resolve a Kuma API key from ~/.secrets/.env")


def kuma(method: str, path: str, api_key: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"{API_BASE}{path}",
        method=method,
        headers={
            "Authorization": "Basic " + base64.b64encode(f":{api_key}".encode()).decode(),
            "Content-Type": "application/json",
            "Accept": "application/json",
            # Cloudflare rejects the default urllib UA.
            "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/130.0.0.0 Safari/537.36"),
        },
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        sys.exit(f"{method} {path} -> HTTP {exc.code}: {exc.read().decode()[:500]}")


def gen_push_token(length: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def find_existing(api_key: str) -> dict | None:
    data = kuma("GET", "/api/v1/monitors", api_key)["data"]
    monitors = list(data.values()) if isinstance(data, dict) else data
    for mon in monitors:
        if mon.get("name") == MONITOR_NAME:
            return mon
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    api_key = load_api_key()
    existing = find_existing(api_key)

    payload = dict(MONITOR)
    payload["notificationIDList"] = NOTIFICATION_IDS

    if existing:
        # Preserve the token -- the firewall already has it in its conf file.
        payload["pushToken"] = existing.get("pushToken") or gen_push_token()
        payload["id"] = existing["id"]
        action = f"UPDATE monitor id={existing['id']}"
    else:
        payload["pushToken"] = gen_push_token()
        action = "CREATE monitor"

    if args.dry_run:
        shown = dict(payload)
        shown["pushToken"] = shown["pushToken"][:6] + "..."
        print(f"[dry-run] would {action}:")
        print(json.dumps(shown, indent=2))
        return 0

    if existing:
        kuma("PUT", f"/api/v1/monitors/{existing['id']}", api_key, payload)
        monitor_id = existing["id"]
    else:
        result = kuma("POST", "/api/v1/monitors", api_key, payload)
        monitor_id = result["data"]["monitorID"]

    push_url = f"{API_BASE}/api/push/{payload['pushToken']}"
    print(f"{action.split()[0].title()}d monitor id={monitor_id}")
    print()
    print("Put this in /usr/local/etc/opnsense-update-monitor.conf on VM 100:")
    print(f"  KUMA_PUSH_URL={push_url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
