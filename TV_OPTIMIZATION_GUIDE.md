# Samsung TV Optimization Guide
## Model: T-KTSUDEUC-1341.2

### **Device Specifications**
- **Model/Software:** T-KTSUDEUC-1341.2
- **Sub-micom:** T-KTSUINTV-1003
- **e-Manual Version:** KM2DVBEUN-3.0.8
- **Supported Resolution:** UHD 4K (3840x2160), Full HD (1920x1080)

---

## **Part 1: TV Picture Settings Optimization**

### **Step 1: Access Picture Settings**
1. Press **MENU** on your remote control
2. Navigate to **Settings** → **Picture**
3. Follow the settings below for optimal display

### **Step 2: Picture Mode Selection**
- **Setting:** Choose **Filmmaker Mode** or **Movie Mode**
- **Purpose:** Ensures accurate color reproduction and disables artificial processing
- **Result:** Best image quality for detailed content like leaderboards

### **Step 3: Brightness & Backlight Adjustment**
Based on your room lighting conditions:

| Environment | Backlight | Brightness |
|-------------|-----------|-----------|
| **Bright Room** | 200+ cd/m² | 70-80% |
| **Normal Room** | 130-170 cd/m² | 60-70% |
| **Dark Room** | 100-130 cd/m² | 50-60% |

*Tip: For TV display showing 24/7, use Normal Room settings*

### **Step 4: Color Temperature**
1. Go to **Settings** → **Picture** → **Expert Settings**
2. Set **Color Tone:** `Warm2`
3. This provides industry-standard color accuracy

### **Step 5: Advanced Picture Settings**

| Setting | Value | Purpose |
|---------|-------|---------|
| **Gamma** | 2.2 | Standard viewing environment |
| **Local Dimming** | High | Enhanced contrast and deeper blacks |
| **Contrast Enhancer** | Off | Prevents over-processing artifacts |
| **Color Space** | Auto | Automatic detection |
| **Dynamic Contrast** | Low | Balanced enhancement |

### **Step 6: Disable Motion Processing**
1. Go to **Settings** → **Picture** → **Expert Settings**
2. Turn OFF: **Auto Motion Plus**
3. Turn OFF: **Picture Clarity** / **TruMotion**
4. **Purpose:** Reduces animation artifacts on static content

---

## **Part 2: Energy & Performance Settings**

### **Turn Off Energy Saving Features**
1. Navigate to **Settings** → **General & Privacy**
2. Select **Power and Energy Saving**
3. **DISABLE:**
   - ✗ Energy Saving Solution
   - ✗ Brightness Optimization
   - ✗ Screen Optimization (Automatic scheduling)

**Why:** These features can cause unexpected brightness changes during display

### **Screen Burn-in Protection**
1. Go to **Settings** → **General & Privacy** → **Screen Protection**
2. Set **Screen Fit:** `On`
3. Set **Screen Fit Time:** `5 minutes` (adjustable)
4. **Purpose:** Periodically adjusts display window to prevent burn-in on static leaderboards

---

## **Part 3: Display & Input Settings**

### **Picture Size Adjustment**
1. Press **MENU** → **Settings** → **Picture** → **Picture Size Settings**
2. Select: **16:9 Standard** (recommended for web display)
3. Alternative: **Custom** (if you need specific scaling)

### **HDMI Deep Color (if using HDMI)**
1. Go to **Settings** → **General & Privacy** → **External Device Manager**
2. Set **HDMI Mode:** `Enhanced`
3. **Purpose:** Full color depth for rich gradients used in the display

### **Auto Input Detection**
1. **Settings** → **General & Privacy** → **External Device Manager**
2. Enable **HDMI CEC** for remote compatibility
3. Set **Auto Power On:** `Off` (for dedicated display)

---

## **Part 4: Leaderboard-Specific Optimizations**

### **Web Display URL Configuration**

#### **For WiFi Connection:**
```
URL: https://hammerhead-app-f4ysx.ondigitalocean.app/tv
or
URL: http://[YOUR_LOCAL_IP]:3000/tv
```

#### **Settings per Environment:**

| Connection Type | Port | Refresh Rate | Notes |
|-----------------|------|--------------|-------|
| **WiFi (Stable)** | 8080 | 60 seconds | Recommended for setup |
| **Ethernet** | 80 | 60 seconds | Best for 24/7 operation |
| **USB Media** | N/A | 30 seconds | Local HTML file mode |

### **Recommended Display Refresh Configuration:**
```javascript
// In tv-display.html script section:
PAGE_ROTATION_TIME = 15000;  // 15 seconds per page
DATA_REFRESH_TIME = 60000;   // Update data every 60 seconds
SCREEN_OPTIMIZATION = 300000; // Allow TV optimization every 5 minutes
```

---

## **Part 5: Network & Connectivity**

### **For Best Performance:**

1. **Use Ethernet Connection** (if available)
   - More stable than WiFi
   - Recommended for continuous display
   - Connect to Router via Ethernet adapter

2. **WiFi Settings** (if Ethernet unavailable)
   - Band: **5GHz** (faster, more stable)
   - Channel: **Auto** or **36-48** (less interference)
   - Security: **WPA2** or **WPA3**

3. **Port Configuration** (per your rules)
   ```
   Module 1 (Leaderboard): Port 8080  [FREEZE after setup]
   Module 2 (Promotions): Port 8081   [FREEZE after setup]
   Module 3 (Analytics):  Port 8082   [FREEZE after setup]
   ```

---

## **Part 6: Audio Settings (Optional)**

If displaying in a venue with sound:

1. **Settings** → **Sound** → **Sound Mode:** `Game` (lowest latency)
2. **Volume:** `20-30%` (for background announcement sounds)
3. **Mute** if no audio is needed for display

---

## **Part 7: System Information & Monitoring**

### **Verify TV Settings:**
1. **Settings** → **Support** → **Contact Samsung**
2. Check current firmware: `T-KTSUDEUC 1341.2`
3. Sub-micom should show: `T-KTSUINTV-1003`

### **Monitor Performance:**
1. **Settings** → **General & Privacy** → **System Manager**
2. Check: Available Storage
3. Check: Memory status
4. Restart TV if performance degrades (weekly recommended)

---

## **Part 8: Maintenance & Optimization Schedule**

### **Daily:**
- ✓ Verify display is updating correctly
- ✓ Check for display artifacts
- ✓ Monitor for heat (TV should be cool to touch)

### **Weekly:**
- ✓ Power cycle TV (off for 30 seconds, then on)
- ✓ Clear TV cache: **Settings** → **Apps** → **Clear Cache**
- ✓ Verify network connection stability

### **Monthly:**
- ✓ Update TV firmware: **Settings** → **Support** → **Software Update**
- ✓ Review and reapply picture settings (can drift over time)
- ✓ Check for stuck pixels or display issues

### **Quarterly:**
- ✓ Full TV reset if performance issues persist
- ✓ Clean TV vents and ensure proper ventilation
- ✓ Update web application code if needed

---

## **Part 9: Troubleshooting**

### **Display Not Updating:**
1. Check WiFi/Ethernet connection
2. Verify URL in TV browser
3. Clear browser cache: **Settings** → **Apps** → **Clear Cache**
4. Restart TV

### **Color/Brightness Issues:**
1. Revert to Movie Mode settings
2. Reset all picture settings to default
3. Re-apply optimizations from Part 1

### **Animations Appear Choppy:**
1. Disable Auto Motion Plus (Part 1, Step 6)
2. Set Contrast Enhancer to Off
3. Reduce particle animation load (see Part 10)

### **TV Running Slow/Lag:**
1. Restart TV (power off for 30 seconds)
2. Clear cache and temporary files
3. Check available storage (15GB+ recommended)
4. Factory reset if issues persist

---

## **Part 10: HTML/CSS Optimization Notes**

### **Performance Enhancements Applied:**

```css
/* Hardware Acceleration */
transform: translateZ(0);
will-change: transform, opacity;
backface-visibility: hidden;

/* Text Rendering */
-webkit-font-smoothing: antialiased;
text-rendering: optimizeLegibility;

/* Image Rendering */
image-rendering: crisp-edges;
```

### **Resolution-Based Scaling:**
- **4K (3840x2160):** 28px font size
- **QHD (2560x1440):** 24px font size  
- **Full HD (1920x1080):** 20px font size
- **HD (1280x720):** 16px font size

### **Animation Performance:**
- Particles: Reduced opacity (0.3 → display stability)
- Cards: Shimmer duration increased (15s → 20s for smoothness)
- Border glow: Extended duration (8s → 12s to reduce flicker)

---

## **Part 11: Port Freezing Strategy**

Per your module requirements, follow this deployment process:

### **Phase 1: Development & Testing**
```
Port 8080: Leaderboard (Active Development)
- Test with full animations
- Verify all features
- Performance testing
```

### **Phase 2: Lock & Deploy**
```
FREEZE Port 8080: Leaderboard
- Document all settings
- Create backup
- Move to production monitoring

Port 8081: Promotion Module (Development)
- Follow same process
- Test independently
```

### **Phase 3: Final Configuration**
```
FREEZE Port 8081: Promotion

Port 8082: Analytics Module (Development)
```

---

## **Quick Reference Card**

```
┌─────────────────────────────────────────────┐
│ SAMSUNG TV T-KTSUDEUC-1341.2               │
│ Optimized for: Poker Club Leaderboard      │
├─────────────────────────────────────────────┤
│ Picture Mode:        Filmmaker             │
│ Brightness:          65%                   │
│ Color Tone:          Warm2                 │
│ Local Dimming:       High                  │
│ Auto Motion Plus:    OFF                   │
│ Energy Saving:       OFF                   │
│ Screen Burn In Prot: ON (5 min)            │
│ URL Refresh:         60 seconds            │
│ Connection:          Ethernet (preferred)  │
└─────────────────────────────────────────────┘
```

---

## **Support Resources**

- **Samsung Support:** https://www.samsung.com/support/
- **e-Manual PDF:** KM2DVBEUN-3.0.8 (available on Samsung support page)
- **Local Firmware Update:** Via USB in Settings → Support → Software Update
- **Contact Samsung Support:** Settings → Support → Contact Samsung

---

## **Last Updated:** October 24, 2025
## **Firmware Version:** T-KTSUDEUC-1341.2
## **Verified For:** Poker Club Leaderboard Display System
