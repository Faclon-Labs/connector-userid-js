/**
 * IO Connect SDK - Main Entry Point
 * 
 * This file exports the DataAccess class for interacting with the IoSense platform.
 */

import DataAccess from "./connectors/DataAccess.js";

// Export the DataAccess class as the default export
export default DataAccess;

// Also export as a named export for compatibility
export { DataAccess };

/**
 * Quick start guide:
 * 
 * Import and initialize the SDK:
 * 
 * ```
 * import DataAccess from 'io_connect';
 * 
 * const dataAccess = new DataAccess({
 *   userId: 'YOUR_USER_ID',
 *   dataUrl: 'datads.iosense.io',
 *   dsUrl: 'ds-server.iosense.io',
 *   onPrem: false,
 *   tz: 'UTC',
 *   logTime: true,
 *   logger: console
 * });
 * 
 * // Example: Get user information
 * const userInfo = await dataAccess.getUserInfo();
 * console.log(userInfo);
 * ```
 * 
 * See the examples directory for more usage examples.
 */

// For testing or direct usage via Node.js
if (process.argv[1] === import.meta.url) {
  console.log('IO Connect SDK - Test Mode');
  console.log('-------------------------');
  console.log('This file is not meant to be run directly.');
  console.log('Please import the DataAccess class in your application.');
  console.log('');
  console.log('Example:');
  console.log('import DataAccess from "io_connect";');
  console.log('');
  console.log('const dataAccess = new DataAccess({');
  console.log('  userId: "YOUR_USER_ID",');
  console.log('  dataUrl: "datads.iosense.io",');
  console.log('  dsUrl: "ds-server.iosense.io"');
  console.log('});');
}

// The commented-out example code from the original file is preserved below as reference:

/*
const dataAccess = new DataAccess({
    userId: '645a159222722a319ca5f5ad',
    dataUrl: 'datads.iosense.io',
    dsUrl: 'ds-server.iosense.io',
    onPrem: false,
    tz: 'UTC',
    logTime: true,
    logger: console
});

// console.log('USER INFO', JSON.stringify(await dataAccess.getUserInfo(false)));
// console.log('DEVICE DETAILS', JSON.stringify(await dataAccess.getDeviceDetails(false)));
// console.log('DEVICE META DATA', JSON.stringify(await dataAccess.getDeviceMetaData("PTH_1009", false)));
// console.log('TIME TO UNIX', JSON.stringify(dataAccess.timeToUnix('2023-06-14T12:00:00Z', 'UTC')));
// console.log('CURSOR BATCHES', JSON.stringify(await dataAccess.getCursorBatches({ deviceId: 'APRPLC_A1', 'startTime': 1747294380000, endTime: 1747380780000, sensorList: ['D19'] })));
// console.log('FIRST DP', JSON.stringify(await dataAccess.getFirstDp({ deviceId: 'APRPLC_A3', startTime: 1747098989000 })));
// console.log('GET DP', JSON.stringify(await dataAccess.getDp({ deviceId: 'APRPLC_A3', sensorList: ['D19'], startTime: 1738408857000, endTime: 1738409397000 })));
// console.log('DATA QUERY', JSON.stringify(await dataAccess.dataQuery({ deviceId: 'APRPLC_A3', sensorList: ['D19'], startTime: 1738408857000, endTime: 1738409397000 })));
// console.log('FETCH CONSUPTION', JSON.stringify(await dataAccess.fetchConsumption({ deviceId: 'APRPLC_A3', sensor: 'D19', startTime: '2025-02-01T11:20:57Z', endTime: '2025-02-02T11:20:57Z' })));
// console.log('LOAD ENTITIES', JSON.stringify(await dataAccess.getLoadEntities()));
// console.log('FILTERED OPERATION DATA', JSON.stringify(await dataAccess.getFilteredOperationData({ deviceId: 'APRPLC_A3', sensorList: ['D19'], startTime: '2025-02-01T11:20:57Z', endTime: '2025-02-01T11:29:57Z', operation: 'min' })));
*/
