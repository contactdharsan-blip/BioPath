# Render CLI Commands Reference

This document shows the exact CLI commands used to debug and verify your deployment.

## Authentication

```bash
# Check current user
render whoami
# Output:
# Email: contactdharsan@gmail.com
```

## Service Management

```bash
# List all services
render services -o text

# Get service details
render services -o json | jq '.[]' | grep -i "biopath"

# Restart service
render restart srv-d6d3tdnfte5s73d58ui0

# Get service URL
render services | grep -i "biopath"
```

## Deployment Management

```bash
# List deployments for a service
render deploys list srv-d6d3tdnfte5s73d58ui0 -o text

# Get latest deployment status
render deploys list srv-d6d3tdnfte5s73d58ui0 -o text | head -5

# Trigger new deployment
render deploys create -r srv-d6d3tdnfte5s73d58ui0

# Cancel running deployment
render deploys cancel <deployment-id>
```

## Log Management

```bash
# View recent logs
render logs -r srv-d6d3tdnfte5s73d58ui0 --limit 100 -o text

# Stream logs in real-time
render logs -r srv-d6d3tdnfte5s73d58ui0 --tail

# Get logs from specific time period
render logs -r srv-d6d3tdnfte5s73d58ui0 --start "2026-02-22T00:30:00Z" -o text

# Search logs for errors
render logs -r srv-d6d3tdnfte5s73d58ui0 --limit 200 -o text | grep -i "error\|fail"
```

## Environment Variables

```bash
# View environment variables (currently no CLI command)
# Use Render Dashboard: https://dashboard.render.com

# Or set via CLI (if available in newer versions)
# render env set -r srv-d6d3tdnfte5s73d58ui0 DEBUG=true
```

## Debugging Commands Used

### 1. Check Service Status
```bash
render services -o text
# Shows: Name, Project, Environment, Type, ID
```

### 2. Get Deployment History
```bash
render deploys list srv-d6d3tdnfte5s73d58ui0 -o text
# Shows: Status, Commit, Trigger, Created, Finished, ID
```

### 3. View Build & Startup Logs
```bash
render logs -r srv-d6d3tdnfte5s73d58ui0 --limit 300 -o text
# Shows: Full Docker build output, dependency installation, startup sequence
```

### 4. Test Endpoints
```bash
# Health check
curl https://biopath-alby.onrender.com/health

# API info
curl https://biopath-alby.onrender.com/api

# Frontend
curl https://biopath-alby.onrender.com/
```

### 5. Monitor Active Logs
```bash
render logs -r srv-d6d3tdnfte5s73d58ui0 --tail
# Shows: Real-time incoming requests and responses
```

## Key Service ID Reference

- **Service**: BioPath
- **Service ID**: srv-d6d3tdnfte5s73d58ui0
- **Project**: My project
- **Environment**: Production
- **Region**: Oregon
- **URL**: https://biopath-alby.onrender.com

## Common Workflows

### Workflow 1: After Code Push
```bash
# 1. Check deployment status
render deploys list srv-d6d3tdnfte5s73d58ui0 -o text

# 2. Monitor logs while deploying
render logs -r srv-d6d3tdnfte5s73d58ui0 --tail

# 3. Test endpoints once done
curl https://biopath-alby.onrender.com/health
```

### Workflow 2: Troubleshooting Errors
```bash
# 1. Get recent logs
render logs -r srv-d6d3tdnfte5s73d58ui0 --limit 100 -o text

# 2. Search for errors
render logs -r srv-d6d3tdnfte5s73d58ui0 --limit 100 -o text | grep -i "error"

# 3. Check deployment history
render deploys list srv-d6d3tdnfte5s73d58ui0 -o text

# 4. If needed, restart
render restart srv-d6d3tdnfte5s73d58ui0
```

### Workflow 3: Environment Changes
```bash
# 1. Update in Render Dashboard: https://dashboard.render.com
# 2. Trigger deployment
render deploys create -r srv-d6d3tdnfte5s73d58ui0

# 3. Monitor logs
render logs -r srv-d6d3tdnfte5s73d58ui0 --tail

# 4. Verify changes
curl https://biopath-alby.onrender.com/health
```

## Dashboard Access

**URL**: https://dashboard.render.com
**Service Page**: https://dashboard.render.com/web/srv-d6d3tdnfte5s73d58ui0

## Tips & Tricks

1. **Export environment for scripting**:
   ```bash
   export SERVICE_ID="srv-d6d3tdnfte5s73d58ui0"
   render logs -r $SERVICE_ID --tail
   ```

2. **Get JSON output for processing**:
   ```bash
   render services -o json | jq '.[0].service.dashboardUrl'
   ```

3. **Check deployment without interactive prompt**:
   ```bash
   render deploys list srv-d6d3tdnfte5s73d58ui0 -o text --confirm
   ```

4. **Tail logs and grep simultaneously**:
   ```bash
   render logs -r srv-d6d3tdnfte5s73d58ui0 --tail | grep -i "error\|warning"
   ```

---

## Need Help?

View help for any command:
```bash
render --help
render services --help
render deploys --help
render logs --help
```

Or visit: https://render.com/docs
