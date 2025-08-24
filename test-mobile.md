# Mobile Testing Guide for Cone Counter

## Quick Mobile Debug Steps

### 1. Test Mobile Health Endpoint
```bash
# Test the mobile health endpoint
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15" \
  http://localhost:3000/api/mobile-health
```

### 2. Test Stats Endpoint (Unauthenticated)
```bash
# Test stats endpoint without auth (should return 401)
curl -H "User-Agent: Mozilla/5.0 (Android 10; Mobile)" \
  http://localhost:3000/api/stats
```

### 3. Check Mobile Console
- Open Chrome DevTools on desktop
- Toggle device toolbar (mobile view)
- Check Console tab for errors
- Look for network failures

### 4. Common Mobile Issues & Solutions

#### Issue: Stats not loading on mobile
**Possible Causes:**
- Firebase initialization timing issues
- Network connectivity problems
- CORS issues on mobile browsers
- Token refresh failures

**Debug Steps:**
1. Triple-tap the header to open mobile debug panel
2. Check viewport size and connection info
3. Verify localStorage/sessionStorage availability
4. Check if cookies are enabled

#### Issue: Authentication fails on mobile
**Possible Causes:**
- Token expiration during slow network
- Firebase Auth not ready when API calls are made
- Mobile browser security restrictions

**Debug Steps:**
1. Check network tab for 401 responses
2. Verify Firebase initialization timing
3. Test token refresh manually

#### Issue: API calls fail silently
**Possible Causes:**
- Network timeouts
- CORS preflight failures
- Mobile browser caching issues

**Debug Steps:**
1. Check network tab for failed requests
2. Verify CORS headers in response
3. Test with different mobile browsers

### 5. Mobile-Specific Testing

#### Test on Different Mobile Browsers:
- Chrome Mobile
- Safari Mobile
- Firefox Mobile
- Samsung Internet

#### Test Different Network Conditions:
- WiFi
- 4G/5G
- Slow 3G (Chrome DevTools)
- Offline mode

#### Test Different Mobile Devices:
- iPhone (iOS)
- Android phone
- iPad (tablet)
- Android tablet

### 6. Debug Commands

#### Check Server Logs:
```bash
# View server logs
docker logs cone-counter

# Follow logs in real-time
docker logs -f cone-counter
```

#### Test Firebase Config:
```bash
# Test Firebase config endpoint
curl http://localhost:3000/api/firebase-config
```

#### Test Authentication:
```bash
# Test auth endpoint
curl -H "Authorization: Bearer INVALID_TOKEN" \
  http://localhost:3000/api/auth-test
```

### 7. Mobile Debug Component

The app now includes a mobile debug component accessible by:
1. Triple-tapping the header
2. Shows viewport size, connection info
3. Displays browser capabilities
4. Provides timestamp for debugging

### 8. Common Solutions

#### If Stats Still Don't Load:
1. **Clear browser cache** on mobile device
2. **Restart the mobile app** (close and reopen)
3. **Check network connectivity** on mobile
4. **Verify Firebase project** is accessible
5. **Check server logs** for mobile-specific errors

#### If Authentication Fails:
1. **Sign out and sign back in** on mobile
2. **Check Firebase Auth** configuration
3. **Verify service account** credentials
4. **Check CORS settings** in Firebase

#### If API Calls Timeout:
1. **Increase timeout values** in mobile code
2. **Add retry logic** for failed requests
3. **Implement offline detection**
4. **Add request queuing** for poor connections

### 9. Performance Monitoring

#### Mobile Performance Metrics:
- Time to first byte (TTFB)
- API response times
- Firebase initialization time
- Authentication latency

#### Monitoring Tools:
- Chrome DevTools Performance tab
- Network tab timing
- Console performance marks
- Custom timing measurements

### 10. Emergency Debug Mode

If all else fails, enable emergency debug mode:

```typescript
// Add to frontend/src/api.ts
const DEBUG_MODE = true; // Set to true for mobile debugging

if (DEBUG_MODE) {
  console.log('DEBUG MODE: All API calls will be logged');
  console.log('DEBUG MODE: Network errors will be detailed');
  console.log('DEBUG MODE: Firebase state will be monitored');
}
```

This will provide detailed logging for mobile debugging scenarios.
