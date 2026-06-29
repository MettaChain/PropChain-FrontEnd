# Audit Log Retention Policy

## Overview

The SecurityAuditLogger manages a local in-memory audit log with deterministic rotation and quota enforcement.

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| MAX_LOG_SIZE | 10,000 | Maximum number of log entries in memory |
| MAX_ALERT_SIZE | 1,000 | Maximum number of security alerts in memory |
| RETENTION_PERIOD_MS | 7 days | Maximum age of log entries before cleanup |
| EVICTION_THRESHOLD | 0.9 (90%) | Capacity threshold for eviction warning |

## Rotation Behavior

1. **LRU-by-time eviction**: When MAX_LOG_SIZE is exceeded, the oldest 30% of entries are evicted
2. **Warning**: A console warning is issued when storage reaches 90% capacity
3. **Remote export**: Evicted entries are exported to the remote sink (if configured) before removal
4. **Alert rotation**: When MAX_ALERT_SIZE is exceeded, alerts are sorted by recency and the oldest 30% are removed

## Remote Export

Set `NEXT_PUBLIC_AUDIT_EXPORT_URL` to enable remote export of evicted entries. The export is sent as a POST request with JSON body containing the entries, session ID, and timestamp.
