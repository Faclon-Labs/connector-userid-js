# IO Connect

A JavaScript SDK for connecting to and interacting with the IoSense platform data services.

## Installation

```bash
# Clone the repository
git clone https://github.com/Faclon-Labs/connector-userid-js.git

# Install dependencies
cd connector-userid-js
npm install
```

## Configuration

The SDK requires a few configuration parameters to connect to your IoSense platform:

```javascript
import DataAccess from "./io_connect/index.js";

const dataAccess = new DataAccess({
    userId: 'YOUR_USER_ID',
    dataUrl: 'datads.iosense.io',  // Your data service URL
    dsUrl: 'ds-server.iosense.io',  // Your DS server URL
    onPrem: false,  // Set to true for on-premise installations
    tz: 'UTC',  // Timezone (UTC or Asia/Kolkata)
    logTime: true,  // Enable request time logging
    logger: console  // Logger to use (defaults to console)
});
```

## Features

- User information retrieval
- Device metadata access
- Real-time and historical data queries
- Cursor-based batch data retrieval
- Consumption data analysis
- Time conversion utilities
- Load entity information
- Filtered operation data
- Cluster aggregation

## Usage Examples

See the [examples](./io_connect/examples/) directory for detailed usage examples.

### Basic Usage

```javascript
// Get user information
const userInfo = await dataAccess.getUserInfo();
console.log('User Info:', userInfo);

// Get device details
const deviceDetails = await dataAccess.getDeviceDetails();
console.log('Device Details:', deviceDetails);

// Get device metadata for a specific device
const deviceMetadata = await dataAccess.getDeviceMetaData('DEVICE_ID');
console.log('Device Metadata:', deviceMetadata);

// Convert time string to Unix timestamp
const unixTime = dataAccess.timeToUnix('2023-06-14T12:00:00Z', 'UTC');
console.log('Unix Timestamp:', unixTime);

// Get data points for specific sensors and time range
const dataPoints = await dataAccess.getDp({
    deviceId: 'DEVICE_ID',
    sensorList: ['SENSOR_ID'],
    startTime: 1738408857000,
    endTime: 1738409397000
});
console.log('Data Points:', dataPoints);
```

## Supported Methods

| Category | Methods |
|----------|---------|
| **Metadata** | `getUserInfo()`, `getDeviceDetails()`, `getDeviceMetaData()`, `getLoadEntities()` |
| **Data Access** | `getDp()`, `getFirstDp()`, `dataQuery()`, `getCursorBatches()`, `fetchConsumption()` |
| **Analytics** | `getFilteredOperationData()`, `clusterAggregation()` |
| **Utilities** | `timeToUnix()`, `triggerParameter()` |

## Error Handling

The SDK includes robust error handling with detailed logging. All methods return empty objects or arrays when errors occur, allowing your application to continue functioning.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC