# AdiParse - ADI URL Utility Service

This project extracts the minimal required code from the Accumulate Wallet project to support `opIdResource.opIdInfo.adiInfo.bankOnLedger_Url()` functionality.

## Next Steps
Include Bank On Ledger fetch demo
Host sample on OperateID web site
 

## Features

- Generate BankOnLedger URLs from identity URLs
- Generate Qoboto URLs from identity URLs
- **NEW:** Fetch real data from Qoboto API including:
  - Logo URLs (`logoUrl`)
  - Section descriptions (`sectionMain1Description`)
  - Background image URLs (`sectionMain1Background2ImageUrl`)
- Smart caching system for API responses
- Development mode with mock data for testing
- Support for different network configurations
- Configurable API base URL
- Minimal, standalone JavaScript utility classes

## Quick Start

### Basic Usage

```javascript
// Get BankOnLedger URL
const bankUrl = AdiParse.getBankOnLedgerUrl("sunstream.acme");
console.log(bankUrl); // https://sunstream.BankOnLedger.com/?current-network=mainnet

// Get Qoboto URL
const qobotoUrl = AdiParse.getQobotoUrl("sunstream.acme");
console.log(qobotoUrl); // https://sunstream.Qoboto.com/?current-network=mainnet

// Get Logo URL from API (async)
const logoUrl = await AdiParse.getLogoUrl("sunstream.acme");
console.log(logoUrl); // Real logo URL from Qoboto API

// Get Description from API (async)
const description = await AdiParse.getSectionMain1Description("sunstream.acme");
console.log(description); // Real description from Qoboto API

// Get Background Image URL from API (async)
const backgroundImageUrl = await AdiParse.getSectionMain1Background2ImageUrl("sunstream.acme");
console.log(backgroundImageUrl); // Real background image URL from Qoboto API

// Get all data in one efficient call
const allData = await AdiParse.getAllMainData("sunstream.acme");
console.log(allData);
// Returns: { logoUrl, sectionMain1Description, sectionMain1Background2ImageUrl, rawData }
```

### Advanced Usage (Original Chained Method)

```javascript
// Get the full opIdResource object
const opIdResource = AdiParse.getOpIdResource("sunstream.acme");
if (opIdResource) {
    const bankUrl = opIdResource.opIdInfo.adiInfo.bankOnLedger_Url();
    const qobotoUrl = opIdResource.opIdInfo.adiInfo.qoboto_Url();
    const logoUrl = await opIdResource.logoUrl(); // Original method
    const description = await opIdResource.sectionMain1Description();
    const backgroundImageUrl = await opIdResource.sectionMain1Background2ImageUrl();
}
```

### API Configuration

```javascript
// Configure API base URL (default: "https://localhost:7033")
AdiParse.setApiBaseUrl("https://your-custom-api.com");

// Enable/disable development mode (default: enabled for testing)
AdiParse.setDevelopmentMode(false); // Use real API
AdiParse.setDevelopmentMode(true);  // Use mock data

// Enable/disable debug logging (default: enabled)
AdiParse.setDebugMode(true);  // Show detailed console logs
AdiParse.setDebugMode(false); // Quiet mode

// Clear cache for specific identity or all data
AdiParse.clearCache("sunstream.acme"); // Clear specific identity
AdiParse.clearCache(); // Clear all cache
```

### Network Configuration

```javascript
// Set network (default is "mainnet")
AdiParse.setNetwork("kermit");

// Get current network
const currentNetwork = AdiParse.getNetwork();
```

### Logo Customization

```javascript
// Get the opIdResource for advanced logo management
const opIdResource = AdiParse.getOpIdResource("sunstream.acme");

// Set a custom logo URL for testing/development
opIdResource.setCustomLogoUrl("https://example.com/custom-logo.png");

// Clear logo cache to force refresh
opIdResource.clearLogoCache();

// Get logo URL (will use custom if set, otherwise default)
const logoUrl = await opIdResource.logoUrl();
```

## Supported Identity URL Formats

- `sunstream.acme`
- `acc://sunstream.acme`
- `sunstream` (automatically appends `.acme`)

## Files Structure

- `AdiParse.js` - Main utility class with all public methods
- `QobotoApiService.js` - **NEW:** API service for fetching real data from Qoboto
- `NetworkNameService.js` - Network configuration
- `IdentityFormatter.js` - Identity URL formatting
- `AdiStringHelper.js` - ADI parsing utilities
- `AdiUrlClass.js` - Core URL generation (contains `bankOnLedger_Url()`)
- `OpIdResourceClass.js` - **ENHANCED:** Now fetches real data from API
- `OpId*.js` - OpId service classes
- `demo.html` - **ENHANCED:** Interactive demo with API controls

## Demo

Open `demo.html` in a web browser to see the beautiful interactive demo featuring:
- **Modern Bootstrap 5 UI** with gradient themes
- **Beautiful Identity Card** displaying logo, links, background image, and description
- **Tabbed Interface** for Demo, Configuration, and Documentation
- **Network Selector** in the top-right corner
- **Responsive Design** that works on all devices

The demo page is inspired by modern blockchain identity platforms and provides an elegant way to visualize and interact with digital identities.

## Example Output

For identity `sunstream.acme`:
- **BankOnLedger URL**: `https://sunstream.BankOnLedger.com/?current-network=mainnet`
- **Qoboto URL**: `https://sunstream.Qoboto.com/?current-network=mainnet`
- **Logo URL**: Real logo from API (e.g., `https://pub-1c0e543900fc40318aa4c4aec39fb352.r2.dev/logo-sunstream.png`)
- **Description**: Real description from API (e.g., `"Welcome to sunstream's digital identity space..."`)
- **Background Image**: Real background from API (e.g., `https://images.unsplash.com/...`)

## API Endpoint Format

The service calls the Qoboto API in this format:
```
GET https://localhost:7033/api/v1/Qoboto/GetDataValue/All?DataAccountUrl={identityUrl}
```

Example:
```
GET https://localhost:7033/api/v1/Qoboto/GetDataValue/All?DataAccountUrl=sunstream.acme
```

Expected response format (returns a list):
```json
[
  {
    "name": "header",
    "headerTitle": "Some title..."
  },
  {
    "name": "main",
    "logoUrl": "https://example.com/logo.png",
    "sectionMain1Description": "Welcome to the platform...",
    "sectionMain1Background2ImageUrl": "https://example.com/background.jpg",
    "lastUpdated": "2024-01-01T00:00:00Z"
  },
  {
    "name": "footer",
    "footerText": "Footer content..."
  }
]
```

**Important:** The API returns a list of objects. AdiParse automatically finds the object with `name: "main"` and extracts the required fields (`logoUrl`, `sectionMain1Description`, `sectionMain1Background2ImageUrl`).

## Troubleshooting

### Data not loading from API?

1. **Enable Debug Mode** to see detailed console logs:
   ```javascript
   AdiParse.setDebugMode(true); // Enable detailed logging
   ```

2. **Check Console Logs** (press F12 in browser):
   - Look for `[QobotoApiService]` prefixed messages
   - Check the response data structure
   - Verify which sections are available (if "main" is not found, it will list available section names)

3. **Common Issues**:
   - **String Response**: If the API returns JSON as a string, AdiParse will automatically parse it
   - **Missing "main" section**: Check console for available section names
   - **CORS errors**: Ensure your API allows cross-origin requests
   - **Wrong URL**: Verify API base URL with `AdiParse.setApiBaseUrl()`

4. **Clear Cache** to force fresh API calls:
   ```javascript
   AdiParse.clearCache(); // Clear all cache
   ```

### Debug Output Example

When debug mode is enabled, you'll see logs like:
```
[QobotoApiService] Fetching Qoboto data from: https://localhost:7033/api/v1/Qoboto/GetDataValue/All?DataAccountUrl=sunstream.acme
[QobotoApiService] Response type: object
[QobotoApiService] Response is array: true
[QobotoApiService] Response is an array with 3 items
[QobotoApiService] Array item 0: { name: 'header', type: 'object', keys: [...] }
[QobotoApiService] Array item 1: { name: 'main', type: 'object', keys: [...] }
[QobotoApiService] Found main section: { name: 'main', logoUrl: '...', ... }
```