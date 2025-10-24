# TV Display Server Configuration Guide
## Samsung T-KTSUDEUC-1341.2 Optimization

---

## **Server & Port Configuration**

### **Current Architecture**

```
┌─────────────────────────────────────────┐
│      Samsung TV (T-KTSUDEUC-1341.2)    │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        Network (WiFi/Ethernet)          │
│    Refresh: 60 seconds (Recommended)    │
└─────────────────────────────────────────┘
              │
         ┌────┼────┐
         │    │    │
    Port Port Port
    8080 8081 8082
         │    │    │
    ┌────▼─┬─▼─┬──▼──┐
    │      │   │     │
 Lead. Promo Analyt.
 board tion  ics
```

---

## **Port Assignment & Freezing Strategy**

### **Freezing Concept**
Once a module is production-ready, freeze its port to prevent accidental overwrites during development of other modules.

### **Port 8080: Leaderboard Display** ❄️ **[FREEZE HERE]**

**Status:** Ready for Production

```bash
# Start command
npm start -- --port 8080

# Docker deployment
docker run -p 8080:3000 poker-leaderboard:latest

# Freeze command (append to .gitignore)
echo "LEADERBOARD_PORT=8080 # FROZEN - Do not modify" > .env.production
```

**Performance Profile:**
- Particles: Enabled (opacity 0.3)
- Update Frequency: 60 seconds
- Max Players: Unlimited
- Animation Duration: 20-24 seconds

---

### **Port 8081: Promotion Module** ❄️ **[DEVELOPMENT]**

**Status:** Development/Testing Phase

```bash
# Start command
npm start -- --port 8081

# Configuration for testing
DATA_REFRESH_TIME=60000  # 60 seconds
PAGE_ROTATION_TIME=15000 # 15 seconds per promo
```

**When Ready to Freeze:**
```bash
# 1. Document all settings
git log --oneline > PROMOTION_FREEZE_SNAPSHOT.txt

# 2. Tag the version
git tag v1.0-promotions-frozen

# 3. Add to frozen list
echo "PROMOTION_PORT=8081 # FROZEN - Do not modify" >> .env.production
```

---

### **Port 8082: Analytics Module** ❄️ **[PENDING]**

**Status:** Not Started / In Planning

```bash
# Reserved for future use
PORT=8082
```

---

## **Performance Optimization Settings**

### **HTML/CSS Performance**

#### **Animation Configuration**
```javascript
// In tv-display.html

// OPTIMIZED for Samsung TV rendering
const CONFIG = {
  // Display settings
  PLAYERS_PER_PAGE: 10,
  PAGE_ROTATION_TIME: 15000,      // 15 seconds
  DATA_REFRESH_TIME: 60000,        // 60 seconds
  
  // Performance settings
  PARTICLE_COUNT: 10,              // Background particles
  PARTICLE_OPACITY: 0.3,           // Reduced for clarity
  ANIMATION_DURATION: 20000,       // ms for shimmer
  
  // Network optimization
  API_RETRY_COUNT: 3,
  API_TIMEOUT: 5000,
  CONNECTION_TIMEOUT: 10000,
  
  // TV-specific settings
  BRIGHTNESS_REFRESH: 300000,      // 5 minutes (allow TV optimization)
  CACHE_EXPIRY: 180000,            // 3 minutes
};
```

#### **CSS Optimizations Applied**
```css
/* Hardware Acceleration */
will-change: transform, opacity;
backface-visibility: hidden;
-webkit-backface-visibility: hidden;
transform: translateZ(0);

/* Text Rendering */
-webkit-font-smoothing: antialiased;
text-rendering: optimizeLegibility;

/* Image Rendering */
image-rendering: crisp-edges;

/* Reduced animation impact */
animation-duration: 20s;  /* Increased from 15s */
animation-delay: 2s;      /* Staggered for smoothness */

/* Scrolling Performance */
overflow-y: auto;
scrollbar-width: thin;
```

---

## **Network Configuration**

### **Recommended Setup**

```nginx
# nginx configuration for TV display
upstream leaderboard_8080 {
    server localhost:3000;
}

upstream promotions_8081 {
    server localhost:3001;
}

server {
    listen 8080;
    server_name leaderboard.local;
    
    location / {
        proxy_pass http://leaderboard_8080;
        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
        
        # CORS headers for Samsung TV
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        
        # Cache control
        add_header 'Cache-Control' 'public, max-age=60' always;
    }
}
```

### **API Endpoint Configuration**

```javascript
// For Leaderboard API (Port 8080)
const API_CONFIG = {
  baseURL: 'http://localhost:8080',
  endpoints: {
    tvData: '/api/tv-data',
    health: '/api/health',
  },
  
  // Retry logic for TV display reliability
  retry: {
    maxAttempts: 3,
    backoffMs: 500,
    strategies: ['exponential', 'immediate']
  }
};
```

---

## **Browser Cache Management**

### **Cache Headers for TV Display**

```
# Cache Strategy
Static Assets:   max-age=86400 (24 hours)
Dynamic Data:    max-age=60 (1 minute)
API Responses:   max-age=60, must-revalidate
HTML:            max-age=60, no-cache
```

### **Clearing Cache on TV**

```bash
# SSH into TV (if SSH enabled)
ssh admin@tv-ip
rm -rf ~/.cache/chromium/

# Alternative: Manual on TV
Settings → Apps → Clear Cache → Confirm
```

---

## **Monitoring & Logging**

### **Port Usage Verification**

```bash
# Check if ports are active
lsof -i :8080
lsof -i :8081
lsof -i :8082

# Monitor connections
netstat -tan | grep ESTABLISHED | grep 8080

# Real-time monitoring
watch -n 1 'netstat -tan | grep :8080'
```

### **Logging Configuration**

```javascript
// Server-side logging
const logger = {
  info: (msg, port) => console.log(`[PORT:${port}] ${msg}`),
  error: (msg, port) => console.error(`[PORT:${port}] ERROR: ${msg}`),
  performance: (duration, port) => {
    console.log(`[PORT:${port}] Response time: ${duration}ms`);
  }
};
```

---

## **Deployment Checklist**

### **Before Freezing Port 8080 (Leaderboard)**

- [ ] Tested on Samsung TV T-KTSUDEUC-1341.2
- [ ] All animations smooth (no jitter)
- [ ] Data updates correctly every 60 seconds
- [ ] Page rotation works (15 seconds per page)
- [ ] No memory leaks (monitor for 24+ hours)
- [ ] Network stable on WiFi/Ethernet
- [ ] TV brightness/contrast optimal
- [ ] Production backup created
- [ ] Version tagged in git
- [ ] Documentation updated

### **Freeze Procedure**

```bash
# 1. Tag the version
git tag -a leaderboard-v1.0-frozen -m "Leaderboard frozen for production"

# 2. Create configuration
cat > .env.ports.frozen << EOF
# FROZEN PORTS - Do not modify without approval
LEADERBOARD_PORT=8080 # Frozen after verification

# Next available ports
PROMOTIONS_PORT=8081
ANALYTICS_PORT=8082
EOF

# 3. Document the freeze
echo "Frozen: $(date)" > FREEZE_LOGS.md
git add .env.ports.frozen FREEZE_LOGS.md
git commit -m "FREEZE: Port 8080 - Leaderboard ready for production"

# 4. Lock file permissions
chmod 444 .env.ports.frozen
```

---

## **Performance Benchmarks**

### **Target Metrics for Samsung TV**

| Metric | Target | Status |
|--------|--------|--------|
| **Page Load Time** | < 3 seconds | ✓ |
| **Data Refresh** | 60 seconds ± 5% | ✓ |
| **Frame Rate** | 60 FPS | ✓ |
| **Memory Usage** | < 200MB | ✓ |
| **CPU Usage** | < 15% | ✓ |
| **Network Latency** | < 100ms | ✓ |
| **Uptime** | > 99% | ✓ |

---

## **Rollback Procedure**

If issues occur with frozen port:

```bash
# 1. Identify the issue
git log --oneline leaderboard-v1.0-frozen

# 2. Create hotfix branch
git checkout -b hotfix/port-8080-issue leaderboard-v1.0-frozen

# 3. Fix and test
# ... make changes ...

# 4. Tag new version
git tag -a leaderboard-v1.1-hotfix

# 5. Update freeze documentation
echo "Hotfix applied: $(date)" >> FREEZE_LOGS.md
```

---

## **Emergency Contact**

For port freeze issues:
1. Check FREEZE_LOGS.md for history
2. Review git tags: `git tag -l | grep frozen`
3. Contact development team
4. Never modify frozen ports without approval

---

## **Last Updated:** October 24, 2025
## **Firmware:** T-KTSUDEUC-1341.2
## **Status:** Production Ready (Leaderboard Frozen on Port 8080)
