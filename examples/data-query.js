/**
 * Example: Retrieving Sensor Data
 * 
 * This example demonstrates how to retrieve sensor data using the IO Connect SDK.
 */

import DataAccess from '../index.js';

/**
 * Main function to demonstrate data retrieval
 */
async function main() {
  try {
    // Initialize the DataAccess connector with your configuration
    const dataAccess = new DataAccess({
      userId: 'YOUR_USER_ID', // Replace with your user ID
      dataUrl: 'datads.iosense.io',
      dsUrl: 'ds-server.iosense.io',
      onPrem: false,
      tz: 'UTC',
      logTime: true,
      logger: console
    });

    // Configuration for data query
    const deviceId = 'YOUR_DEVICE_ID'; // Replace with your device ID
    const sensorList = ['SENSOR_1', 'SENSOR_2']; // Replace with your sensor IDs
    
    // Use timeToUnix to convert time strings to timestamps
    // Example: Last 24 hours
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours ago
    
    console.log(`Querying data for device: ${deviceId}`);
    console.log(`Sensors: ${sensorList.join(', ')}`);
    console.log(`Time range: ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`);
    
    // Method 1: Get latest data points
    console.log('\n1. Getting latest data points...');
    const latestData = await dataAccess.getFirstDp({
      deviceId,
      sensorList,
      startTime,
      n: 5, // Number of data points to retrieve
      cal: true, // Apply calibration
      alias: false, // Use sensor IDs instead of aliases
      unix: true // Return timestamps in unix format
    });
    
    console.log('\nLatest data points:');
    console.log(JSON.stringify(latestData, null, 2));
    
    // Method 2: Get data points with cursor batches for large datasets
    console.log('\n2. Getting data with cursor batches...');
    const batchData = await dataAccess.getCursorBatches({
      deviceId,
      sensorList,
      startTime,
      endTime
    });
    
    console.log(`\nRetrieved ${batchData.length} cursor batches`);
    if (batchData.length > 0) {
      console.log('\nFirst batch sample:');
      console.log(JSON.stringify(batchData[0].slice(0, 2), null, 2));
    }
    
    // Method 3: Get consumption data
    console.log('\n3. Getting consumption data...');
    const consumptionData = await dataAccess.fetchConsumption({
      deviceId,
      sensor: sensorList[0],
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });
    
    console.log('\nConsumption data:');
    console.log(JSON.stringify(consumptionData, null, 2));
    
    // Method 4: Get filtered operation data
    console.log('\n4. Getting filtered operation data...');
    const filteredData = await dataAccess.getFilteredOperationData({
      deviceId,
      sensorList,
      operation: 'avg', // Can be 'min', 'max', 'avg', 'sum'
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });
    
    console.log('\nFiltered operation data:');
    console.log(JSON.stringify(filteredData, null, 2));
    
  } catch (error) {
    console.error('Error in example:', error.message);
  }
}

// Run the example
main().catch(console.error); 