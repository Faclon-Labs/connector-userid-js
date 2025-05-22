import axios from "axios";
import {
  CLUSTER_AGGREGATION,
  CONSUMPTION_URL,
  CURSOR_LIMIT,
  GET_CURSOR_BATCHES_URL,
  GET_DEVICE_DETAILS_URL,
  GET_DEVICE_METADATA_URL,
  GET_DP_URL,
  GET_FILTERED_OPERATION_DATA,
  GET_FIRST_DP,
  GET_LOAD_ENTITIES,
  GET_USER_INFO_URL,
  INFLUXDB_URL,
  MAX_RETRIES,
  RETRY_DELAY,
  TRIGGER_URL,
} from "../utils/constants.js";
import Logger from "../utils/store.js";

export default class DataAccess {
  /**
   * Class constructor for DataAccess.
   * @param {Object} options - Configuration options for DataAccess.
   * @param {string} options.userId - The user ID to use for API requests.
   * @param {string} options.dataUrl - The data URL for the API.
   * @param {string} options.dsUrl - The DS URL for the API.
   * @param {boolean} [options.onPrem=false] - Whether the API is on-premises or Live.
   * @param {string} [options.tz="UTC"] - Timezone to use for logging.
   * @param {boolean} [options.logTime=false] - Whether to log time taken for requests.
   * @param {Object} [options.logger=null] - Logger instance to use for logging.
   */

  constructor({
    userId,
    dataUrl,
    dsUrl,
    onPrem = false,
    tz = "UTC",
    logTime = false,
    logger = null,
  }) {
    this.userId = userId;
    this.dataUrl = dataUrl;
    this.dsUrl = dsUrl;
    this.onPrem = onPrem;
    this.tz = tz;
    this.logTime = logTime;
    this.logger = new Logger(logger, "", logTime);
  }

  /**
 * Helper function to format error messages
 * @param {Object} response - The axios response object
 * @param {string} url - The URL that was requested
 * @returns {string} Formatted error message
 */
  errorMessage(response, url) {
    if (!response) return `URL: ${url}`;
    return `Status: ${response?.status || 'unknown'}, URL: ${url}`;
  }

  /**
   * Fetches user info from the API using axios.
   * @param {boolean} [onPremOverride=null] - Whether to override the onPrem flag.
   * @returns {Promise<Object>} - User info object or empty object on error.
   * @example
   * const dataAccess = new DataAccess({
   *   userId: "my_user_id",
   *   dataUrl: "data.url.com",
   *   dsUrl: "example_ds.com"
   * });
   * const userInfo = await dataAccess.getUserInfo(true);
   * console.log(userInfo) -> {"_id":"61de7cad3ba65478ecf109f1","email":"gurunadhpukkalla@gmail.com","organisation":{"_id":"5b0d386f82d7525268dfbe06","orgID":"Faclon_Labs","orgName":"Faclon Labs","hostname":"iosense.io","phone":9833429903},"timeCreated":"2022-01-12T07:01:01.379Z","userDetail":{"personalDetails":{"name":{"first":"Gurunadh","last":"Pukkalla"},"phone":{"number":"8639910739","internationalNumber":"+91 8639910739","dialCode":"91","countryCode":"in","e164Number":"+918639910739","name":"India"},"profilePicUrl":"","gender":"male"},"_id":"61de7cad3ba65478ecf109f4"}}
   *
   * @throws {Error} If an error occurs during the HTTP request, such as a network issue or timeout.
   * @throws {Error} If an unexpected error occurs during metadata retrieval, such as parsing JSON data or other unexpected issues.
   */
  async getUserInfo(onPremOverride = null) {

    // Based on On Prem We will use either http or https protocol
    let onPrem = onPremOverride !== null ? onPremOverride : this.onPrem;
    const protocol = onPrem ? "http" : "https";
    // Construct the URL for the API request
    const url = GET_USER_INFO_URL.replace("{protocol}", protocol).replace(
      "{data_url}",
      this.dataUrl
    );
    // Log the API response time
    this.logger.message = `API ${url} response time:`;
    this.logger.startTimer();
    // Make the API request using axios
    try {
      const response = await axios.get(url, {
        headers: {
          userID: this.userId,
        },
      });
      // Check if the response contains the expected data
      if (!response.data || !response.data.data) {
        throw new Error('Missing "data" in response');
      }
      // Return the user info from the response
      return response.data.data;
    } catch (error) {
      // Handle errors that occur during the API request
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const server = error.response?.headers?.server || "Unknown Server";
      const body = error.response?.data || error.message;
      // Log the error details
      this.logger.error(
        `[EXCEPTION] ${error.name}: 
[STATUS CODE] ${status}
[URL] ${url}
[SERVER INFO] ${server}
[RESPONSE] ${JSON.stringify(body)}
      `.trim()
      );
      return {};
    } finally {
      this.logger.endTimer();
    }
  }
  /**
   * Fetches device details from the API using axios.
   * @param {boolean} [onPremOverride=null] - Whether to override the onPrem flag.
   * @returns {Promise<Object>} - Device details object or empty object on error.
   * 
   * @example
   * const dataAccess = new DataAccess({userId: "my_user_id", dataUrl: "data.url.com", dsUrl: "example_ds.com"});
   * const deviceDetails = await dataAccess.getDeviceDetails(true);
   * console.log(deviceDetails) -> [{"devID":"FLVM_A87","devTypeID":"ST65_VIBRATION_SENSOR"},{"devID":"FLVM_A20","devTypeID":"ST65_VIBRATION_SENSOR"},{"devID":"COACH_211041","devTypeID":"WSPS"},{"devID":"FLVM_A86","devTypeID":"ST65_VIBRATION_SENSOR"},{"devID":"FLVA_A33","devTypeID":"ST65_ASSET"},{"devID":"NLCM_A9","devTypeID":"TEMP_HUMID"},{"devID":"MA2308FM_A19","devTypeID":"CUSTOM_SECTIONS_01"},{"devID":"KSBEM_A2","devTypeID":"KSB_MOVB_01"},{"devID":"KPSEM_B6","devTypeID":"ENERGY443"},{"devID":"KSBEM_A1","devTypeID":"CUSTOM_SECTIONS_01"},{"devID":"KSBEM_B1","devTypeID":"KSB_MOVB_01"},{"devID":"STM_03024029","devTypeID":"STEAM_TRAP3"},{"devID":"FLVA_A34","devTypeID":"ST65_ASSET"},{"devID":"APAREM_E1","devTypeID":"ENERGYCUSTOM"},{"devID":"67470ad0fd2f640e48954536","devTypeID":"VISION"},{"devID":"DEMO","devTypeID":"FLOWMETER_093"},{"devID":"CUSTOMTABLES03","devTypeID":"CUSTOM_TABLE03"},{"devID":"MN254FM_B4","devTypeID":"FLOW07"}]
   * 
   * @throws {Error} If an error occurs during the HTTP request, such as a network issue or timeout.
   * @throws {Error} If an unexpected error occurs during metadata retrieval, such as parsing JSON data or other unexpected issues.
   */
  async getDeviceDetails(onPremOverride = null) {
    // Based on On Prem We will use either http or https protocol
    let onPrem = onPremOverride !== null ? onPremOverride : this.onPrem;
    const protocol = onPrem ? "http" : "https";
    // Construct the URL for the API request
    const url = GET_DEVICE_DETAILS_URL.replace("{protocol}", protocol).replace(
      "{data_url}",
      this.dataUrl
    );
    // Log the API response time
    this.logger.message = `API ${url} response time:`;
    this.logger.startTimer();
    // Make the API request using axios
    try {
      const response = await axios.get(url, {
        headers: {
          userID: this.userId,
        },
      });
      // Check if the response contains the expected data
      if (!response.data || !response.data.data) {
        throw new Error('Missing "data" in response');
      }
      // Return the device details from the response
      return response.data.data;
    } catch (error) {
      // Handle errors that occur during the API request
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const server = error.response?.headers?.server || "Unknown Server";
      const body = error.response?.data || error.message;
      // Log the error details
      this.logger.error(
        `[EXCEPTION] ${error.name}:
[STATUS CODE] ${status}
[URL] ${url}
[SERVER INFO] ${server}
[RESPONSE] ${JSON.stringify(body)}
      `.trim()
      );
      return {};
    } finally {
      this.logger.endTimer();
    }
  }
  /**
   * Fetches device metadata from the API using axios.
   * @param {string} deviceID - The ID of the device to fetch metadata for.
   * @param {boolean} [onPremOverride=null] - Whether to override the onPrem flag.
   * @returns {Promise<Object>} - Device metadata object or empty object on error.
   * 
   * @example
   * const dataAccess = new DataAccess({userId: "my_user_id", dataUrl: "data.url.com", dsUrl: "example_ds.com"});
   * const deviceMetaData = await dataAccess.getDeviceMetaData("device_id", true);
   * console.log(deviceMetaData) -> {"location":{"latitude":25.9249385,"longitude":71.4969736},"tags":["PTH_1009"],"addedOn":"2023-05-08T19:16:46.808Z","widgets":[],"_id":"645a159222722a319ca5f5d6","sensors":[{"sensorId":"PT1","sensorName":"Inlet  Temperature"},{"sensorId":"PT2","sensorName":"Outlet Temperature"},{"sensorId":"S1","sensorName":"S1"},{"sensorId":"RSSI","sensorName":"Network Strength"}],"devID":"PTH_1009","devName":"PTH_1009","params":{"PT1":[{"paramName":"m","paramValue":"1"},{"paramName":"c","paramValue":0},{"paramName":"min","paramValue":"-200"},{"paramName":"max","paramValue":10000},{"paramName":"automation","paramValue":false}],"PT2":[{"paramName":"m","paramValue":"1"},{"paramName":"c","paramValue":0},{"paramName":"min","paramValue":"-200"},{"paramName":"max","paramValue":10000},{"paramName":"automation","paramValue":false}],"S1":[{"paramName":"automation","paramValue":false}],"RSSI":[{"paramName":"automation","paramValue":false}]},"devTypeID":"STEAM_TRAP","devTypeName":"Steam Trap","topic":"devicesIn/PTH_1009/data","canUserEdit":true,"star":false,"unit":{"PT1":["°C"],"PT2":["°C"],"S1":[],"RSSI":[]},"unitSelected":{"PT1":"°C","PT2":"°C","S1":"","RSSI":""},"properties":[{"propertyName":"connectionTimeout","propertyValue":"4000"},{"propertyName":"automation","propertyValue":false},{"propertyName":"breakdownTimeout","propertyValue":"7200"},{"propertyName":"inletPressure","propertyValue":"5 Bar"},{"propertyName":"baseLineInletTemperature","propertyValue":"95°C"},{"propertyName":"outletPressure","propertyValue":"5 Bar"},{"propertyName":"baseLineOutletTemperature","propertyValue":"95°C"},{"propertyName":"Steam Condition","propertyValue":0},{"propertyName":"Degree of Superheat","propertyValue":0},{"propertyName":"Type of trap","propertyValue":0},{"propertyName":"Make of Trap","propertyValue":0},{"propertyName":"Model of Trap","propertyValue":0},{"propertyName":"Trap Size","propertyValue":0},{"propertyName":"Trap Location","propertyValue":0},{"propertyName":"Condensate Recovery","propertyValue":0},{"propertyName":"Condensate Recovery Name","propertyValue":0},{"propertyName":"Boiler Name","propertyValue":0},{"propertyName":"Trap Location Number","propertyValue":0},{"propertyName":"Trap Area Name","propertyValue":0},{"propertyName":"Acoustics","propertyValue":0},{"propertyName":"Condensate Load","propertyValue":0},{"propertyName":"Steam Leak","propertyValue":0},{"propertyName":"Orifice Diameter","propertyValue":0}],"added_by":"645a159222722a319ca5f5ad","config":[],"geoFences":[],"custom":{"PT1":[{"customShow":"Raw Variable","customVariable":"PTH_1009_PT1"},{"customShow":"Processed Reading","customVariable":"1*PTH_1009_PT1+0"}],"PT2":[{"customShow":"Raw Variable","customVariable":"PTH_1009_PT2"},{"customShow":"Processed Reading","customVariable":"1*PTH_1009_PT2+0"}],"S1":[{"customShow":"Raw Variable","customVariable":"PTH_1009_S1"},{"customShow":"Processed Reading","customVariable":"1*PTH_1009_S1+0"}],"RSSI":[{"customShow":"Raw Variable","customVariable":"PTH_1009_RSSI"},{"customShow":"Processed Reading","customVariable":"1*PTH_1009_RSSI+0"}]},"__v":0,"isHidden":false}
   * 
   * @throws {Error} If an error occurs during the HTTP request, such as a network issue or timeout.
   * @throws {Error} If an unexpected error occurs during metadata retrieval, such as parsing JSON data or other unexpected issues.
   */
  async getDeviceMetaData(deviceID, onPremOverride = null) {
    // Based on On Prem We will use either http or https protocol
    let onPrem = onPremOverride !== null ? onPremOverride : this.onPrem;
    const protocol = onPrem ? "http" : "https";
    // Construct the URL for the API request
    const url = GET_DEVICE_METADATA_URL.replace("{protocol}", protocol)
      .replace("{data_url}", this.dataUrl)
      .replace("{device_id}", deviceID);
    // Log the API response time
    this.logger.message = `API ${url} response time:`;
    this.logger.startTimer();
    // Make the API request using axios
    try {
      const response = await axios.get(url, {
        headers: {
          userID: this.userId,
        },
      });
      // Check if the response contains the expected data
      if (!response.data || !response.data.data) {
        throw new Error('Missing "data" in response');
      }
      // Return the device metadata from the response
      return response.data.data;
    } catch (error) {
      // Handle errors that occur during the API request
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const server = error.response?.headers?.server || "Unknown Server";
      const body = error.response?.data || error.message;
      // Log the error details
      this.logger.error(
        `[EXCEPTION] ${error.name}:
[STATUS CODE] ${status}
[URL] ${url}
[SERVER INFO] ${server}
[RESPONSE] ${JSON.stringify(body)}
      `.trim()
      );
      return {};
    } finally {
      this.logger.endTimer();
    }
  }

  /**
   * Convert a given time to Unix timestamp in milliseconds.
   *
   * @param {string|number|Date|null} time - The time to be converted. It can be a string in ISO 8601 format,
   *                                         a Unix timestamp in milliseconds, or a Date object.
   *                                         If null or undefined, the current time in the specified timezone is used.
   * @param {string|Intl.DateTimeFormat} timezone - The timezone to use (e.g., 'America/New_York', 'UTC').
   *                                               This is used when time is not provided or doesn't have timezone info.
   * @returns {number} The Unix timestamp in milliseconds.
   * @throws {Error} If the provided Unix timestamp is not in milliseconds or if there are mismatched offset times.
   *
   * @example
   * // Returns Unix timestamp for the specified date in milliseconds
   * const dataAccess = new DataAccess();
   * const unixTime = dataAccess.timeToUnix('2023-06-14T12:00:00Z', 'UTC');
   * unixTime -> 1686744000000
   */
  timeToUnix(time = null, timezone = "UTC") {
    // If time is not provided, use the current time in the specified timezone
    if (time === null || time === undefined) {
      // Create a date in the current timezone
      const now = new Date();
      return now.getTime();
    }

    // If time is already in Unix timestamp format (number)
    if (typeof time === "number") {
      // Validate that it's in milliseconds (>10 digits)
      if (time <= 0 || String(time).length <= 10) {
        throw new Error(
          "Unix timestamp must be a positive integer in milliseconds, not seconds."
        );
      }
      return time;
    }

    // If time is in string format, convert it to a Date object
    let dateObj;
    if (typeof time === "string") {
      // Parse the string into a Date object
      dateObj = new Date(time);

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date string: ${time}`);
      }
    } else if (time instanceof Date) {
      dateObj = time;
    } else {
      throw new Error("Time must be a string, number, Date object, or null");
    }

    // Check for timezone mismatches
    // Note: JavaScript's Date object doesn't directly support comparing timezone offsets like Python
    // This is a simplified approach for JavaScript

    // Return the Unix timestamp in milliseconds
    return dateObj.getTime();
  }

  /**
   * Gets a cleaned table from a DataFrame equivalent
   *
   * @param {Object} options - Configuration options
   * @param {Array<Object>} options.data - Array of objects representing the data (equivalent to pandas DataFrame)
   * @param {boolean} options.alias - Whether to use aliases
   * @param {boolean} options.cal - Whether to apply calibration
   * @param {string} options.deviceId - The device ID
   * @param {Array<string>} options.sensorList - List of sensors to include
   * @param {boolean} options.onPrem - Whether the data is on-premises
   * @param {boolean} options.unix - Whether to use Unix timestamps
   * @param {Object|null} [options.metadata=null] - Optional metadata
   * @param {boolean} [options.pivotTable=true] - Whether to pivot the table
   * @returns {Array<Object>} - The cleaned data
   * @example
   * const dataAccess = new DataAccess({userId: "my_user_id", dataUrl: "data.url.com", dsUrl: "example_ds.com"});
   * const cleanedData = dataAccess.getCleanedTable({data})
   * console.log(cleanedData) -> [{"time":1686744000000,"sensor":"PT1","value":25},{"time":1686744000000,"sensor":"PT2","value":30}]
   * @throws {Error} If the data is not in the expected format or if there are issues with the processing.
   * @throws {Error} If the sensorList is empty or if the deviceId is not found.
   */
  getCleanedTable({
    data,
    alias = false,
    cal = false,
    deviceId,
    sensorList,
    onPrem = false,
    unix = false,
    metadata = null,
    pivotTable = true,
  }) {
    // console.log('getCleanedTable data', data)
    // Create a deep copy of the input data to avoid modifying the original
    let cleanedData = JSON.parse(JSON.stringify(data));

    // Implementation would depend on specific processing requirements
    // Here is a skeleton of the function with common data processing operations:
    // console.error({cleanedData,sensorList})
    // 1. Filter the data based on sensorList
    if (sensorList && sensorList.length > 0) {
      // Assuming we have sensor field in each data row
      cleanedData = cleanedData.filter(
        (row) =>
          sensorList.includes(row.sensor) || sensorList.includes(row.sensorId)
      );
    }
    // console.log('after sensorList filtering ', cleanedData);
    // 2. Apply device-specific processing
    if (deviceId) {
      // Filter or process by device ID if needed
      cleanedData = cleanedData.filter((row) => row.deviceId === deviceId);
    }
    // console.log('after device specific processing ', cleanedData);
    // 3. Apply calibration if requested
    if (cal) {
      cleanedData = cleanedData.map((row) => {
        // Apply calibration formula/logic here
        // This would depend on specific calibration requirements
        return row;
      });
    }
    // console.log('after calibration ', cleanedData);
    // 4. Process timestamps if unix format is requested
    if (unix) {
      cleanedData = cleanedData.map((row) => {
        // Convert timestamp to Unix format (assuming row.timestamp exists)
        if (row.timestamp) {
          // Assuming timeToUnix function is available
          row.timestamp = timeToUnix(row.timestamp);
        }
        return row;
      });
    }
    // console.log('after unix conversion ', cleanedData);
    // 5. Apply aliases if requested
    if (alias && metadata && metadata.aliases) {
      // Replace field names with their aliases
      cleanedData = cleanedData.map((row) => {
        const newRow = {};
        Object.keys(row).forEach((key) => {
          const aliasKey = metadata.aliases[key] || key;
          newRow[aliasKey] = row[key];
        });
        return newRow;
      });
    }

    // 6. Create pivot table if requested
    if (pivotTable) {
      // This is a simplified version of pivoting
      // In a real implementation, you'd need a more complex logic depending on your data structure
      const pivotedData = [];
      const timestamps = [...new Set(cleanedData.map((row) => row.timestamp || row.time ))];

      timestamps.forEach((timestamp) => {
        const rowsAtTimestamp = cleanedData.filter(
          (row) => row.timestamp || row.time === timestamp
        );
        const pivotedRow = { timestamp };

        rowsAtTimestamp.forEach((row) => {
          // Assuming each row has a 'sensor' and 'value' field
          // This is highly dependent on the actual data structure
          if (row.sensor && row.value !== undefined) {
            pivotedRow[row.sensor] = row.value;
          }
        });

        pivotedData.push(pivotedRow);
      });
      // console.log('after pivoting ', pivotedData);
      return pivotedData;
    }
    // console.log({cleanedData})
    return cleanedData;
  }

  /**
 * Fetches sensor data in batches for a specified device within a time range.
 *
 * @param {Object} options - The options for fetching cursor batches
 * @param {string} options.deviceId - The ID of the device
 * @param {number|string|Date} options.startTime - The start time for the query (can be a string, number, or Date)
 * @param {number|string|Date} options.endTime - The end time for the query (can be a string, number, or Date)
 * @param {Array<string>} [options.sensorList=null] - List of sensor IDs to query data for. Defaults to all sensors if not provided
 * @param {boolean} [options.onPrem=null] - Indicates if the operation is on-premise. Defaults to class attribute if not provided
 * @param {Object} [options.metadata=null] - Additional metadata related to sensors or calibration parameters
 * @param {string} options.userId - The user ID for authentication
 * @param {string} options.dataUrl - The data URL for API calls
 * @param {Object} options.logger - Logger object for tracking execution
 * @param {boolean} options.logTime - Whether to log execution time
 * @returns {Promise<Object>} A promise that resolves to a JSON payload containing the retrieved sensor data for the device
 * @example
 * const dataAccess = new DataAccess({ userId: "my_user_id", dataUrl: "data.url.com", dsUrl: "example_ds.com" });
 * const sensorData = await dataAccess.getCursorBatches({deviceId : 'APRPLC_A1', startTime :1736754168000, endTime : 1747122189000, sensorList : ['19']});
 * console.log(sensorData) -> {"counts":[{"time":"2025-05-15T07:33:00.000Z","count":2739}],"timeStamps":[{"firstDPTime":1747294381282,"lastDPTime":1747380751256}]}
 * 
 * @throws {Error} If no sensor data is available or if there's an issue with the request
 * @throws {Error} If the API response indicates an unsuccessful operation
 */
  async getCursorBatches({
    deviceId,
    startTime,
    endTime,
    sensorList = null,
    onPrem = null,
    metadata = null,
  }) {
    try {
      // Fetch metadata if sensorList is not provided
      if (!sensorList) {
        // Retrieve metadata if it is also not provided as an argument
        if (!metadata) {
          metadata = await this.getDeviceMetaData(deviceId);
          console.error({metadata});
        }

        // Extract sensor IDs from metadata and assign to sensorList
        if (metadata && metadata.sensors) {
          sensorList = metadata.sensors.map(sensor => sensor.sensorId);
        }
      }

      // Ensure sensorList is not empty, throw an exception if no sensors are found
      if (!sensorList || sensorList.length === 0) {
        throw new Error("No sensor data available.");
      }

      // Join sensor IDs into a comma-separated string to pass as a parameter
      const sensorValues = sensorList.join(',');

      // Determine protocol based on onPrem setting
      if (onPrem === null) {
        onPrem = this.onPrem; // Use default setting if not explicitly provided
      }
      const protocol = onPrem ? "http" : "https";

      // Construct the URL for the API call using the chosen protocol
      const url = GET_CURSOR_BATCHES_URL
        .replace('{protocol}', protocol)
        .replace('{data_url}', this.dataUrl);

      // Convert times to milliseconds if they're not already
      const startTimeMs = typeof startTime === 'number' ? startTime : this.timeToUnix(startTime);
      const endTimeMs = typeof endTime === 'number' ? endTime : this.timeToUnix(endTime);


      // Log operation start time if logging is enabled
      const startLogTime = Date.now();
      if (this.logger && typeof this.logger.startTimer === 'function') {
        this.logger.startTimer();
      }

      // Make the axios request to retrieve sensor data for the specified time range
      const response = await axios.get(url, {
        headers: {
          'userID': this.userId
        },
        params: {
          device: deviceId,
          sensor: sensorValues,
          sTime: startTimeMs * 1000000, // Convert ms to ns
          eTime: endTimeMs * 1000000,   // Convert ms to ns
          limit: CURSOR_LIMIT
        }
      });

      // Log operation duration if logging is enabled
      if (this.logger && typeof this.logger.info === 'function') {
        this.logger.info(`API ${url} response time: ${Date.now() - startLogTime}ms`);
      }

      console.error({ response: response.data })

      // With axios, the JSON response is automatically parsed
      const responseContent = response.data;

      // Check if the API response indicates a failure
      if (!responseContent.success && responseContent.success !== undefined) {
        throw new Error('API reported unsuccessful operation');
      }

      // Return the extracted payload if successful
      return responseContent.data || {};

    } catch (error) {
      // Log the appropriate error based on its type
      if (this.logger) {
        if (error.response) {
          // The request was made and the server responded with a status code outside of 2xx
          this.logger.error(`[EXCEPTION] ${error.constructor.name}: Request failed with status ${error.response.status}`);
        } else if (error.request) {
          // The request was made but no response was received
          this.logger.error(`[EXCEPTION] ${error.constructor.name}: No response received`);
        } else {
          // Something happened in setting up the request that triggered an Error
          this.logger.error(`[EXCEPTION] ${error.constructor.name}: ${error.message}`);
        }
      }

      // Return empty object to match Python function behavior
      return {};
    }
  }

  formatSensorData(data) {
    const result = [];
    for (const sensorData of Object.values(data || {})) {
      if (Array.isArray(sensorData)) {
        sensorData.forEach(({ time, sensor, value }) =>
          result.push({ time, sensor, value })
        );
      } else if (sensorData?.time && sensorData?.sensor) {
        result.push({
          time: sensorData.time,
          sensor: sensorData.sensor,
          value: sensorData.value,
        });
      }
    }
    return result;
  }

/**
 * Retrieves the first datapoint(s) for specified sensors on a device starting from a given time.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.deviceId - The ID of the device to fetch data from
 * @param {Array<string>} [options.sensorList=null] - List of sensor IDs. If null, fetches data for all sensors
 * @param {boolean} [options.cal=true] - Whether to apply calibration to sensor values
 * @param {(string|number|Date)} [options.startTime=null] - The time from which to start fetching data
 * @param {boolean} [options.alias=false] - Whether to use sensor aliases instead of IDs
 * @param {boolean} [options.unix=false] - Whether to return timestamps in Unix format
 * @param {boolean} [options.onPrem=null] - Whether to use on-premise API endpoints
 * @returns {Promise<Array>} Array of datapoints with time and sensor values
 * 
 * @example
 * // Get first datapoint for all sensors on a device
 * const data = await dataAccess.getFirstDp({ deviceId: 'APRPLC_A3', startTime: 1747098989000 });
 * 
 * console.log(data) -> [{"D2":"5","D19":"1.18","D20":"55862.76","Status":"0","RSSI":"22"}]
 * 
 * @throws {Error} If parameter 'n' is less than 1
 * @throws {Error} If the specified device is not found in the account
 * @throws {Error} If no sensor data is available for the device
 * @throws {Error} If the API request fails or returns an error response
 */
  async getFirstDp({
    deviceId,
    sensorList = null,
    cal = true,
    startTime = null,
    n = 1,
    alias = false,
    unix = false,
    onPrem = null,
  }) {
    try {
      if (n < 1) throw new Error("Parameter 'n' must be ≥ 1");

      onPrem = onPrem ?? this.onPrem;
      const protocol = onPrem ? 'http' : 'https';
      const url = GET_FIRST_DP.replace("{protocol}", protocol).replace("{data_url}", this.dataUrl);

      // Verify device
      const devices = await this.getDeviceDetails(onPrem);
      const deviceIds = devices.map(d => d.devID);
      if (!deviceIds.includes(deviceId)) {
        throw new Error(`Device ${deviceId} not added in account`);
      }

      // Get sensor list
      let metadata = null;
      if (!sensorList) {
        metadata = await this.getDeviceMetaData(deviceId, onPrem);
        sensorList = metadata?.sensors?.map(s => s.sensorId) || [];
        if (sensorList.length === 0) throw new Error("No sensor data available.");
      }

      const unixStart = Math.floor(this.timeToUnix(startTime) / 1000);
      const params = {
        device: deviceId,
        sensor: sensorList.join(','),
        time: unixStart,
      };
      // console.error({ url })
      const t0 = Date.now();
      const response = await axios.get(url, { params });
      this.logger.info(`API ${url} response time: ${Date.now() - t0}ms`);

      const responseData = response.data;
      if (responseData.success) {
        throw new Error(this.errorMessage(responseData, url));
      }

      const formattedData = this.formatSensorData(responseData[0]);
      // console.log('formattedData ___________________', { formattedData });
      return formattedData.length
        ? this.getCleanedTable({
          data: formattedData,
          alias,
          cal,
          deviceId: false,
          sensorList,
          onPrem,
          unix,
          metadata,
          pivotTable: false
        })
        : [];

    } catch (err) {
      this.logger.error(`[EXCEPTION] ${err.name || 'Error'}: ${err.message}`);
      return [];
    }
  }


  /**
 * Retrieves datapoint(s) for specified sensors on a device up until a given end time.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.deviceId - The ID of the device to fetch data from
 * @param {Array<string>} [options.sensorList=null] - List of sensor IDs. If null, fetches data for all sensors
 * @param {number} [options.n=1] - Number of datapoints to fetch
 * @param {boolean} [options.cal=true] - Whether to apply calibration to sensor values
 * @param {(string|number|Date)} [options.endTime=null] - The time up until which to fetch data
 * @param {boolean} [options.alias=false] - Whether to use sensor aliases instead of IDs
 * @param {boolean} [options.unix=false] - Whether to return timestamps in Unix format
 * @param {boolean} [options.onPrem=null] - Whether to use on-premise API endpoints
 * @returns {Promise<Array>} Array of datapoints with time and sensor values
 * 
 * @example
 * // Get last datapoint for all sensors on a device
 * const data = await dataAccess.getDp({ deviceId: 'APRPLC_A3', sensorList: ['D19'], n: 5, startTime: 1747294380000, endTime: 1747380780000 });
 * 
 * console.log(data) -> [{"time":"2024-04-06T04:59:26.000Z","sensor":"D19","value":"2.5"},{"time":"2024-04-06T04:58:26.000Z","sensor":"D19","value":"5.13"},{"time":"2024-04-06T04:57:26.000Z","sensor":"D19","value":"15.05"},{"time":"2024-04-06T04:56:26.000Z","sensor":"D19","value":"14.39"},{"time":"2024-04-06T04:55:26.000Z","sensor":"D19","value":"14.1"},{"time":"2024-04-06T04:54:26.000Z","sensor":"D19","value":"14.44"},{"time":"2024-04-06T04:53:26.000Z","sensor":"D19","value":"14.4"},{"time":"2024-04-06T04:52:26.000Z","sensor":"D19","value":"14.48"},{"time":"2024-04-06T04:51:26.000Z","sensor":"D19","value":"14.3"}]
 * 
 * @throws {Error} If parameter 'n' is less than 1
 * @throws {Error} If the specified device is not found in the account
 * @throws {Error} If no sensor data is available for the device
 * @throws {Error} If the API request fails or returns an error response
 */
  async getDp({
    deviceId,
    sensorList = null,
    n = 1,
    cal = true,
    endTime = null,
    alias = false,
    unix = false,
    onPrem = null,
  }) {
    try {
      if (n < 1) throw new Error("Parameter 'n' must be ≥ 1");

      onPrem = onPrem ?? this.onPrem;
      const protocol = onPrem ? 'http' : 'https';
      const url = GET_DP_URL.replace("{protocol}", protocol).replace("{data_url}", this.dataUrl);

      // Validate device
      const devices = await this.getDeviceDetails(onPrem);
      if (!devices.some(d => d.devID === deviceId)) {
        throw new Error(`Device ${deviceId} not added in account`);
      }

      // Get sensor list and metadata
      let metadata = null;
      if (!sensorList) {
        metadata = await this.getDeviceMetaData(deviceId, onPrem);
        sensorList = metadata?.sensors?.map(s => s.sensorId) || [];
        if (sensorList.length === 0) throw new Error("No sensor data available.");
      }

      const unixEnd = Math.floor(this.timeToUnix(endTime) / 1000);
      let allData = [];

      // Process each sensor individually with cursor-based pagination
      for (const sensor of sensorList) {
        let cursor = { end: unixEnd, limit: n };
        let retry = 0;

        while (cursor.end) {
          try {
            const params = {
              device: deviceId,
              sensor: sensor,
              eTime: cursor.end,
              lim: cursor.limit,
              cursor: 'true'
            };

            const t0 = Date.now();
            const response = await axios.get(url, { params });
            this.logger.info(`API ${url} response time: ${Date.now() - t0}ms`);

            const responseData = response.data;
            if (responseData.success) {
              throw new Error(this.errorMessage(responseData, url));
            }

            // Add data to collection
            if (responseData.data) {
              allData.push(...responseData.data);
            }

            // Update cursor for next iteration
            cursor = responseData.cursor;

          } catch (error) {
            retry++;
            this.logger.error(`[${error.name}] Retry ${retry}: ${error.message}`);

            if (retry >= MAX_RETRIES) {
              throw new Error(`Max retries reached while calling ${url}`);
            }

            const waitTime = retry > 5 ? RETRY_DELAY[1] : RETRY_DELAY[0];
            await this._sleep(waitTime);
          }
        }
      }

      // Process collected data if not empty
      if (allData.length > 0) {
        const formattedData = this.formatSensorData(allData);
        return this.getCleanedTable({
          data: formattedData,
          alias,
          cal,
          deviceId: false,
          sensorList,
          onPrem,
          unix,
          metadata,
          pivotTable: false
        });
      }

      return [];

    } catch (err) {
      this.logger.error(`[EXCEPTION] ${err.name || 'Error'}: ${err.message}`);
      return [];
    }
  }

  /**
 * Queries sensor data for a device within a specified time range, with optional parallel processing.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.deviceId - The ID of the device to query data from
 * @param {Array<string>} [options.sensorList=null] - List of sensor IDs. If null, fetches data for all sensors
 * @param {(string|number|Date)} [options.startTime=null] - Start time for the query range
 * @param {(string|number|Date)} [options.endTime=null] - End time for the query range
 * @param {boolean} [options.cal=true] - Whether to apply calibration to sensor values
 * @param {boolean} [options.alias=false] - Whether to use sensor aliases instead of IDs
 * @param {boolean} [options.unix=false] - Whether to return timestamps in Unix format
 * @param {boolean} [options.onPrem=null] - Whether to use on-premise API endpoints
 * @returns {Promise<Array>} Array of data points with timestamps and sensor values
 * 
 * @example * 
 * // Query D19 sensor data within a time range
 * const data = await dataAccess.dataQuery({ deviceId: 'APRPLC_A3', sensorList: ['D19'], startTime: 1738408857000, endTime: 1738409397000 });
 * 
 * data -> [{"timestamp":"2025-02-01T11:21:49.000Z","D19":"2.19"},{"timestamp":"2025-02-01T11:23:49.000Z","D19":"2.58"},{"timestamp":"2025-02-01T11:24:49.000Z","D19":"12.88"},{"timestamp":"2025-02-01T11:25:49.000Z","D19":"12.83"},{"timestamp":"2025-02-01T11:26:49.000Z","D19":"11.73"},{"timestamp":"2025-02-01T11:27:49.000Z","D19":"2.09"},{"timestamp":"2025-02-01T11:28:49.000Z","D19":"2.18"},{"timestamp":"2025-02-01T11:29:49.000Z","D19":"2.16"}]
 * 
 * @throws {Error} If the time range is invalid (start > end)
 * @throws {Error} If the specified device is not found in the account
 * @throws {Error} If no sensors are available for the device
 */
  async dataQuery({
    deviceId,
    sensorList = null,
    startTime = null,
    endTime = null,
    cal = true,
    alias = false,
    unix = false,
    onPrem = null,
  }) {
    try {
      onPrem = onPrem ?? this.onPrem;
      const startUnix = this.timeToUnix(startTime);
      const endUnix = this.timeToUnix(endTime);

      if (endUnix < startUnix) {
        throw new Error(`Invalid time range: start (${startTime}) > end (${endTime})`);
      }

      const devices = await this.getDeviceDetails(onPrem);
      if (!devices.some(d => d.devID === deviceId)) {
        throw new Error(`Device ${deviceId} not found in account`);
      }

      let metadata = null;
      if (!sensorList) {
        metadata = await this.getDeviceMetaData(deviceId, onPrem);
        sensorList = metadata?.sensors?.map(s => s.sensorId) || [];
        if (sensorList.length === 0) throw new Error("No sensors available.");
      }

      return await this._influxdb({
        deviceId,
        startTime: startUnix,
        endTime: endUnix,
        alias,
        cal,
        unix,
        sensorList,
        metadata,
        onPrem,
      });

    } catch (err) {
      this.logger.error(`[DATA_QUERY ERROR] ${err.name}: ${err.message}`);
      return [];
    }
  }

  async _influxdb({
    deviceId,
    startTime,
    endTime,
    alias = false,
    cal = true,
    unix = false,
    sensorList = [],
    metadata = null,
    onPrem = null,
  }) {
    const MAX_RETRIES = 8;
    const RETRY_DELAY = [2000, 10000]; // ms
    const CURSOR_LIMIT = 1000;

    try {
      onPrem = onPrem ?? this.onPrem;
      const protocol = onPrem ? 'http' : 'https';
      const url = INFLUXDB_URL.replace("{protocol}", protocol).replace("{data_url}", this.dataUrl);

      if (!sensorList || sensorList.length === 0) {
        if (!metadata) {
          metadata = await this.getDeviceMetadata(deviceId, onPrem);
        }
        sensorList = metadata?.sensors?.map(s => s.sensorId);
        if (!sensorList || sensorList.length === 0) {
          throw new Error("No sensor data available.");
        }
      }

      const sensorValues = sensorList.join(',');
      let cursor = { start: startTime, end: endTime };
      let allData = [];
      let retry = 0;

      this.logger.info(`🔍 Polling data for ${deviceId} from Influx...`);

      while (cursor?.start && cursor?.end) {
        try {
          const params = {
            device: deviceId,
            sensor: sensorValues,
            sTime: cursor.start,
            eTime: cursor.end,
            cursor: true,
            limit: CURSOR_LIMIT,
          };

          const startReq = Date.now();
          const response = await axios.get(url, { params });
          this.logger.info(`✅ API ${url} responded in ${Date.now() - startReq}ms`);

          const { data, cursor: newCursor, success } = response.data;
          if (success) throw new Error("Influx error: " + JSON.stringify(response.data));

          if (Array.isArray(data)) allData.push(...data);
          cursor = newCursor;

          this.logger.info(`📦 Fetched ${allData.length} data points so far.`);

        } catch (err) {
          retry++;
          this.logger.info(`[${err.name}] Retry ${retry}: ${err.message}`);
          if (retry < MAX_RETRIES) {
            const delay = retry > 5 ? RETRY_DELAY[1] : RETRY_DELAY[0];
            await this._sleep(delay);
          } else {
            throw new Error("Max retries reached fetching data.");
          }
        }
      }
      if (allData.length > 0) {
        console.error({ allData })
        return this.getCleanedTable({
          data: allData,
          alias,
          cal,
          deviceId: false,
          sensorList,
          onPrem,
          unix,
          metadata,
        });
      } else
        return [];

    } catch (err) {
      this.logger.error(`[INFLUXDB ERROR] ${err.name}: ${err.message}`);
      return [];
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
 * Fetches consumption data for a device's sensor within a specified time range with retry capability.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.deviceId - The ID of the device to fetch consumption data from
 * @param {string} options.sensor - The sensor ID to fetch consumption data for
 * @param {number} [options.interval=null] - Custom interval in seconds for data aggregation
 * @param {(string|number|Date)} [options.startTime=null] - Start time for the query range
 * @param {(string|number|Date)} [options.endTime=null] - End time for the query range
 * @param {boolean} [options.cal=true] - Whether to apply calibration to sensor values
 * @param {boolean} [options.alias=false] - Whether to use sensor aliases instead of IDs
 * @param {boolean} [options.unix=false] - Whether to return timestamps in Unix format
 * @param {boolean} [options.onPrem=null] - Whether to use on-premise API endpoints
 * @param {boolean} [options.disableInterval=false] - Whether to disable interval-based aggregation
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts on failure
 * @param {Array<number>} [options.retryDelay=[1000,3000]] - Delay in ms between retries [normal,extended]
 * @returns {Promise<Array<Object>>} Array of consumption data points with time and value properties
 * 
 * @example
 * // Get first 5 datapoints for specific sensors with Unix timestamps
 * const data = await dataAccess.getFirstDp({ deviceId: 'APRPLC_A3', sensor: 'D19', startTime: '2025-02-01T11:20:57Z', endTime: '2025-02-02T11:20:57Z' });
 * 
 * console.log(data) -> [{"time":"2025-02-01T11:20:49.000Z","value":"2.52"},{"time":"2025-02-02T11:20:49.000Z","value":"0.77"}]
 * 
 * @throws {Error} If the time range is invalid (start > end)
 * @throws {Error} If max retries are reached while calling the API
 * @throws {Error} If the API returns errors in the response
 */
async  fetchConsumption({
  deviceId,
  sensor,
  interval = null,
  startTime = null,
  endTime = null,
  cal = true,
  alias = false,
  unix = false,
  onPrem = null,
  disableInterval = false,
  maxRetries = 3,
  retryDelay = [1000, 3000], // in ms
}) {
  const self = this;
  try {
   const start = self.timeToUnix(startTime);
   const end = self.timeToUnix(endTime);
    if (end < start) {
      throw new Error(`Invalid time range: start_time(${startTime}) should be before end_time(${endTime}).`);
    }

    const protocol = onPrem ? 'http' : 'https';
    const url = CONSUMPTION_URL.replace('{protocol}',protocol).replace('{data_url}',this.dataUrl);

    const params = {
      device: deviceId,
      sensor: sensor,
      startTime: start,
      endTime: end,
      disableThreshold: disableInterval.toString(),
    };

    if (!disableInterval && interval) {
      params.customIntervalInSec = interval;
    }

    let attempt = 0;
    let response;

    while (attempt < maxRetries) {
      try {
        response = await axios.get(url, { params });
        if (response.data.errors) {
          throw new Error('API returned errors');
        }
        break; // success
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt >= maxRetries) {
          throw new Error(`Max retries reached while calling ${url}`);
        }
        const waitTime = attempt > 5 ? retryDelay[1] : retryDelay[0];
        await delay(waitTime);
      }
    }

    const responseData = response.data;

    // Convert response data to array of { time, value } objects
    const result = Object.entries(responseData).map(([_, val]) => ({
      time: unix ? (val.time || start) : new Date(val.time || start).toISOString(),
      value: val.value !== undefined ? val.value : null
    }));

    return result;
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    return [];
  }
}

/**
 * Fetches load entities from an API, handling pagination and optional filtering by cluster names.
 *
 * @param {Object} options - Optional parameters
 * @param {boolean} [options.onPrem] - Specifies whether to use on-premise settings for the request.
 *                                    Defaults to this.onPrem if not provided.
 * @param {Array} [options.clusters] - A list of cluster names to filter the results by.
 *                                    Defaults to null, which returns all clusters.
 * @returns {Promise<Array>} A list of load entities. If clusters are provided, only 
 *                           entities belonging to the specified clusters are returned.
 * 
 * @example
 * // Fetch all load entities using on-premise settings
 * const allEntities = await dataAccess.getLoadEntities();
 * 
 * console.log(allEntities) -> [{"name":"Energy Consumption ( HT )","id":"647efd403def74e774156162","devConfigs":[{"devId":"APREM_A1","percentage":100,"sensor":"D5"},{"devId":"APREM_A2","percentage":100,"sensor":"D5"},{"devId":"APREM_A3","percentage":100,"sensor":"D5"},{"devId":"APREM_A5","percentage":100,"sensor":"D5"}]},{"name":"Power Consumption (KWH)","id":"64916429aed625c0bf4d5401","devConfigs":[{"devId":"APRPLC_A1","percentage":100,"sensor":"D20"},{"devId":"APRPLC_B1","percentage":100,"sensor":"D20"},{"devId":"APRPLC_B3","percentage":100,"sensor":"D20"}]},{"name":"NOODLES","id":"649164a1aed625c0bf4d54cd","devConfigs":[{"devId":"APRPLC_A1","percentage":100,"sensor":"D20"}]},{"name":"PC BLOCK","id":"649164bc183296bc97f9ed94","devConfigs":[{"devId":"APRPLC_B1","percentage":100,"sensor":"D20"}]},{"name":"SNACKS BLOCK - COMMON HEADER","id":"649164d7aed625c0bf4d54f7","devConfigs":[{"devId":"APRPLC_A1","percentage":100,"sensor":"D19"}]},{"name":"BISCUITS BLOCK","id":"649165157ba2e6be6f984439","devConfigs":[{"devId":"APRPLC_B1","percentage":100,"sensor":"D20"}]},{"name":"Snacks Block Noodle","id":"649165364a5169c0b8b0b19f","devConfigs":[{"devId":"APRPLC_A1","percentage":100,"sensor":"D20"}]},{"name":"Incomer","id":"6491654f4a5169c0b8b0b1b3","devConfigs":[{"devId":"APRPLC_A1","percentage":100,"sensor":"D20"},{"devId":"APRPLC_B1","percentage":100,"sensor":"D20"},{"devId":"APRPLC_B3","percentage":100,"sensor":"D20"}]},{"name":"Snacks Block - N2","id":"6491655b7ba2e6be6f984479","devConfigs":[{"devId":"APRPLC_A2","percentage":100,"sensor":"D20"}]},{"name":"Atta","id":"649165894a5169c0b8b0b1e4","devConfigs":[{"devId":"APRPLC_B1","percentage":100,"sensor":"D20"}]},{"name":"Solar","id":"64916592183296bc97f9ee6b","devConfigs":[{"devId":"APRPLC_A1","percentage":100,"sensor":"D20"}]},{"name":"Utility Block - Boiler & ETP","id":"649165a5aed625c0bf4d55a3","devConfigs":[{"devId":"APRPLC_B3","percentage":100,"sensor":"D20"}]}]
 * 
 * // Fetch specific load entity details
 * const specificLoadEntity = await dataAccess.getLoadEntities({ clusters: ['649167b77ba2e6be6f98481a'] });
 * 
 * console.log(specificLoadEntity) -> [{"name":"DG 3","id":"649167b77ba2e6be6f98481a","devConfigs":[{"devId":"APRPLC_A1","percentage":100,"sensor":"D20"}]}]
 */
async getLoadEntities({ onPrem = null, clusters = null } = {}) {
  try {
    // Validate clusters input
    if (clusters !== null && clusters.length === 0) {
      throw new Error("No clusters provided.");
    }
    
    // If onPrem is not provided, use the default value from the class attribute
    if (onPrem === null) {
      onPrem = this.onPrem;
    }
    
    const protocol = onPrem ? "http" : "https";
    
    let pageCount = 1;
    let hasMore = true;
    const pageSize = 5;
    let retry = 0;
    
    let result = [];
    let response = null;
    
    // Construct API URL for data retrieval
    const baseUrl = GET_LOAD_ENTITIES.replace("{protocol}", protocol)
                                               .replace("{data_url}", this.dataUrl);
    
    const headers = { userID: this.userId };
    
    // Configure axios to not verify SSL certificates when using http protocol
    const axiosConfig = {
      headers: headers,
    };
    
    while (hasMore) {
      try {
        // this.logger.info(`API ${baseUrl}`);
        console.log(`${baseUrl}/${this.userId}/${pageCount}/${pageSize}`)
        
        response = await axios.get(
          `${baseUrl}/${this.userId}/${pageCount}/${pageSize}`, 
          axiosConfig
        );
        
        // this.logger.info(`API ${baseUrl} response time:`);
        
        // Parse the JSON response - Axios automatically parses JSON and puts it in response.data
        const responseData = response.data;
        if (responseData.error) {
          this.logger.error(this.errorMessage(response, baseUrl));
          return [];
        }
        // console.log('responseData', responseData);
        // Extend result with retrieved responseData
        result = [...result, ...responseData.data];
        
        // const totalCount = responseData.totalCount;
        // const clustersReceived = result.length;
        
        // // Break the loop if all clusters have been received
        // if (clustersReceived === totalCount) {
        //   break;
        // }
        
        // Update for next page
        const totalCount = responseData.totalCount;
        hasMore = result.length < totalCount;
        pageCount += 1;
        
      } catch (error) {
        retry += 1;
        this.logger.info(
          `[${error.name}] Retry Count: ${retry}, ${error.message} ${this.errorMessage(response, baseUrl)}`
        );
        
        if (retry < MAX_RETRIES) {
          const sleepTime = retry > 5 ? RETRY_DELAY[1] : RETRY_DELAY[0];
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        } else {
          throw new Error(
            `Max retries for data fetching from api-layer exceeded. ${this.errorMessage(response, baseUrl)}`
          );
        }
      }
    }
    // console.log('result', result);
    // Filter results by cluster names if provided
    if (clusters !== null) {
      return result.filter(item => clusters.includes(item.name) || clusters.includes(item.id));
    }
    
    return result;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      this.logger.error(`[AXIOS ERROR] ${error.name}: ${error.message}`);
    } else if (error instanceof Error) {
      this.logger.error(`[EXCEPTION] ${error.name}: ${error.message}`);
    } else {
      this.logger.error(`[EXCEPTION] ${error}`);
    }
    return [];
  }
}

/**
 * Triggers a parameter-based operation on the server by sending a list of titles.
 *
 * @param {Object} options - Parameters
 * @param {Array} options.titleList - A list of titles to be used for triggering the operation
 * @param {boolean} [options.onPrem] - Whether the operation is performed on-premises.
 *                                    If not provided, the class attribute value is used.
 * @returns {Promise<Array>} The data returned from the server after triggering the operation
 * 
 * @example
 * // Trigger a parameter operation with a list of titles
 * const result = await dataAccess.triggerParameter({
 *   titleList: ["Title1", "Title2", "Title3"]
 * });
 */
async triggerParameter({ titleList, onPrem = null } = {}) {
  try {
    // If onPrem is not provided, use the default value from the class attribute
    if (onPrem === null) {
      onPrem = this.onPrem;
    }
    
    const protocol = onPrem ? "http" : "https";
    let response = null;
    let retry = 0;
    
    // Construct API URL for data retrieval
    const url = TRIGGER_URL.replace("{protocol}", protocol)
                                     .replace("{data_url}", this.dataUrl);
    
    const headers = { "Content-Type": "application/json" };
    
    const payload = { 
      userID: this.userId, 
      title: titleList 
    };
    
    // Configure axios to not verify SSL certificates when using http protocol
    const axiosConfig = {
      headers: headers,
      httpsAgent: onPrem ? new https.Agent({ rejectUnauthorized: false }) : undefined
    };
    
    while (true) {
      try {
        this.logger.time(`API ${url} response time:`);
        
        response = await axios.put(url, payload, axiosConfig);
        
        this.logger.timeEnd(`API ${url} response time:`);
        
        // Parse the JSON response
        const responseData = response.data;
        
        if (responseData.error) {
          throw new Error("Error in response data");
        }
        
        break;
        
      } catch (error) {
        retry += 1;
        this.logger.error(
          `[${error.name}] Retry Count: ${retry}, ${error.message} ${errorMessage(response, url)}`
        );
        
        if (retry < constants.MAX_RETRIES) {
          const sleepTime = retry > 5 ? constants.RETRY_DELAY[1] : constants.RETRY_DELAY[0];
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        } else {
          throw new Error(
            `Max retries for data fetching from api-layer exceeded. ${errorMessage(response, url)}`
          );
        }
      }
    }
    
    return response.data.data;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      this.logger.error(`[AXIOS ERROR] ${error.name}: ${error.message}`);
    } else if (error instanceof TypeError || error instanceof SyntaxError) {
      this.logger.error(`[EXCEPTION] ${error.name}: ${error.message}`);
    } else if (error instanceof Error) {
      this.logger.error(`[EXCEPTION] ${error.name}: ${error.message}`);
    } else {
      this.logger.error(`[EXCEPTION] ${error}`);
    }
    return [];
  }
}

/**
 * Performs an aggregation operation on a cluster over a specified time range.
 *
 * @param {Object} options - Parameters
 * @param {string} options.clusterId - The ID of the cluster to aggregate data for
 * @param {string} options.clusterType - The type of the cluster ("normalCluster", "fixedValue", "productionEntity", "demandCluster")
 * @param {string} options.operator1 - The primary aggregation operator
 * @param {string} options.operator2 - The secondary aggregation operator
 * @param {(string|number|Date)} options.startTime - The start time for the aggregation
 * @param {(string|number|Date)} [options.endTime] - The end time for the aggregation
 * @param {boolean} [options.unix=false] - Whether to return time in Unix format
 * @param {boolean} [options.onPrem] - Whether to perform the operation on-premises
 * @returns {Promise<Object>} The aggregated data as a DataFrame-like object
 * 
 * @example
 * // Perform aggregation on a normal cluster with sum and mean operators
 * const result = await dataAccess.clusterAggregation({
 *   clusterId: "cluster_456",
 *   clusterType: "normalCluster",
 *   operator1: "sum",
 *   operator2: "mean",
 *   startTime: "2024-09-01T00:00:00Z",
 *   endTime: "2024-09-10T23:59:59Z"
 * });
 * 
 * console.log(result) -> {"data":[["2024-09-01T00:00:00Z",100]],"columns":["time","value"]}
 */
async clusterAggregation({ 
  clusterId, 
  clusterType, 
  operator1, 
  operator2, 
  startTime, 
  endTime, 
  unix = false, 
  onPrem = null 
} = {}) {
  try {
    // If onPrem is not provided, use the default value from the class attribute
    if (onPrem === null) {
      onPrem = this.onPrem;
    }
    
    const protocol = onPrem ? "http" : "https";
    let response = null;
    
    // Construct API URL for data retrieval
    const url = CLUSTER_AGGREGATION.replace("{protocol}", protocol)
                                           .replace("{data_url}", this.dataUrl);
    
    // Convert start_time and end_time to Unix timestamps
    const startTimeUnix = this.timeToUnix(startTime);
    const endTimeUnix = this.timeToUnix(endTime);
    
    // Validate that the start time is before the end time
    if (endTimeUnix < startTimeUnix) {
      throw new Error(`Invalid time range: startTime(${startTime}) should be before endTime(${endTime}).`);
    }
    
    let retry = 0;
    const headers = { "Content-Type": "application/json", "userID": this.userId };
    
    const payload = {
      clusterType: clusterType,
      operator1: operator1,
      operator2: operator2,
      startTime: startTimeUnix,
      endTime: endTimeUnix,
      userID: this.userId,
      clusterID: clusterId
    };
    
    // Configure axios to not verify SSL certificates when using http protocol
    const axiosConfig = {
      headers: headers,
      httpsAgent: onPrem ? new https.Agent({ rejectUnauthorized: false }) : undefined
    };
    
    while (true) {
      try {
        this.logger.time(`API ${url} response time:`);
        
        response = await axios.put(url, payload, axiosConfig);
        
        this.logger.timeEnd(`API ${url} response time:`);
        
        // Parse the JSON response
        const responseData = response.data;
        
        if (responseData.errors) {
          throw new Error("Error in response data");
        }
        
        break;
        
      } catch (error) {
        retry += 1;
        this.logger.error(
          `[${error.name}] Retry Count: ${retry}, ${error.message} ${errorMessage(response, url)}`
        );
        
        if (retry < constants.MAX_RETRIES) {
          const sleepTime = retry > 5 ? constants.RETRY_DELAY[1] : constants.RETRY_DELAY[0];
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        } else {
          throw new Error(
            `Max retries for data fetching from api-layer exceeded. ${errorMessage(response, url)}`
          );
        }
      }
    }
    
    // Create a DataFrame-like object with the response data
    const data = response.data.data;
    let result = {
      data: [[data.time, data.value]],
      columns: ["time", "value"]
    };
    
    // Convert time to a Date object
    let timeValue = new Date(result.data[0][0]);
    
    // Convert time to Unix timestamp if required
    if (unix) {
      result.data[0][0] = timeValue.getTime();
    } else {
      // Convert time to the timezone set in this.tz
      // JavaScript doesn't have a direct equivalent to pandas timezone conversion,
      // so we'll use the built-in Date methods to convert to the local timezone
      if (this.tz) {
        timeValue = new Date(timeValue.toLocaleString('en-US', { timeZone: this.tz }));
      }
      result.data[0][0] = timeValue;
    }
    
    return result;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      this.logger.error(`[AXIOS ERROR] ${error.name}: ${error.message}`);
    } else if (error instanceof TypeError || error instanceof SyntaxError) {
      this.logger.error(`[EXCEPTION] ${error.name}: ${error.message}`);
    } else if (error instanceof Error) {
      this.logger.error(`[EXCEPTION] ${error.name}: ${error.message}`);
    } else {
      this.logger.error(`[EXCEPTION] ${error}`);
    }
    return { data: [], columns: ["time", "value"] };
  }
}

/**
 * Retrieves filtered operation data for a specific device over a specified time range.
 *
 * @param {Object} options - Parameters
 * @param {string} options.deviceId - The ID of the device for which data is to be fetched
 * @param {Array} [options.sensorList] - List of sensors to retrieve data from
 * @param {string} [options.operation] - Operation to apply to the data ("min", "max", "last", "first")
 * @param {string} [options.filterOperator] - Filter operator (">", "<", "<=", ">=", "!=", "==", "><", "<>")
 * @param {string} [options.threshold] - Threshold value for filtering sensor data
 * @param {(string|number|Date)} options.startTime - The start time for data retrieval
 * @param {(string|number|Date)} [options.endTime] - The end time for data retrieval
 * @param {Object} [options.df] - A DataFrame-like object containing sensor configurations
 * @param {boolean} [options.cal=true] - Whether to apply calibration to the data
 * @param {boolean} [options.alias=false] - Whether to return sensor names as aliases
 * @param {boolean} [options.unix=false] - Whether to return time in Unix format
 * @param {boolean} [options.onPrem] - Whether to fetch data from an on-premises system
 * @returns {Promise<Object>} A DataFrame-like object containing the retrieved sensor data
 * 
 * @example
 * // Fetch the minimum value for sensors on device 'device_123' between two timestamps
 * const data = dataAccess.getFilteredOperationData({ deviceId: 'APRPLC_A3', sensorList: ['D19'], startTime: '2025-02-01T11:20:57Z', endTime: '2025-02-01T11:29:57Z', operation: 'min' })
 * console.log(data) -> [{"D19":2.09}]
 * 
 * @throws {Error} If the time range is invalid (start > end)
 * @throws {Error} If the specified device is not found in the account
 * @throws {Error} If the DataFrame does not contain the required columns
 */
async getFilteredOperationData({
  deviceId,
  sensorList = null,
  operation = null,
  filterOperator = null,
  threshold = null,
  startTime,
  endTime,
  df = null,
  cal = true,
  alias = false,
  unix = false,
  onPrem = null
} = {}) {
  try {
    let metadata = null;
    let response = null;
    
    // If onPrem is not provided, use the default value from the class attribute
    if (onPrem === null) {
      onPrem = this.onPrem;
    }
    
    const protocol = onPrem ? "http" : "https";
    
    // Convert start_time and end_time to Unix timestamps
    const startTimeUnix = this.timeToUnix(startTime);
    const endTimeUnix = this.timeToUnix(endTime);
    
    // Validate that the start time is before the end time
    if (endTimeUnix < startTimeUnix) {
      throw new Error(`Invalid time range: startTime(${startTime}) should be before endTime(${endTime}).`);
    }
    
    const dfDevices = await this.getDeviceDetails({ onPrem });
  
    // Check if the device is added in the account
    if (!dfDevices.some(device => device.devID === deviceId)) {
      throw new Error(`Message: Device ${deviceId} not added in account`);
    }
    
    // Initialize the request body with userID, startTime, and endTime
    const requestBody = {
      userID: this.userId,
      startTime: startTimeUnix,
      endTime: endTimeUnix,
      devConfig: []
    };
    
    if (df !== null) {
      // Check if all required columns are present in the DataFrame
      const requiredColumns = ["sensor", "operation"];
      if (!requiredColumns.every(column => df.columns.includes(column))) {
        throw new Error(`DataFrame must contain the following columns: ${requiredColumns.join(', ')}`);
      }
      
      // Check for duplicates in the 'sensor' column
      const sensors = df.data.map(row => {
        const sensorIndex = df.columns.indexOf("sensor");
        return row[sensorIndex];
      });
      if ((new Set(sensors)).size !== sensors.length) {
        throw new Error("Duplicate values detected in the 'sensor' column. Please ensure all sensor entries are unique.");
      }
      
      // Check if filter_operator and threshold columns are both present or both absent
      const hasFilterOperator = df.columns.includes("filter_operator");
      const hasThreshold = df.columns.includes("threshold");
      
      if (hasFilterOperator !== hasThreshold) {
        throw new Error("Both 'filter_operator' and 'threshold' columns must be present together or not at all.");
      } else if (hasFilterOperator && hasThreshold) {
        // Check for consistency in null values
        const filterOpIdx = df.columns.indexOf("filter_operator");
        const thresholdIdx = df.columns.indexOf("threshold");
        
        for (let i = 0; i < df.data.length; i++) {
          const hasFilterOp = df.data[i][filterOpIdx] != null;
          const hasThresholdVal = df.data[i][thresholdIdx] != null;
          
          if (hasFilterOp !== hasThresholdVal) {
            throw new Error("Inconsistent null values: If 'filter_operator' is present in a row, 'threshold' must also be present in that row, and vice versa.");
          }
        }
      }
      
      sensorList = [];
      
      // Iterate through each row in the DataFrame to build the request body
      for (let i = 0; i < df.data.length; i++) {
        const row = {};
        for (let j = 0; j < df.columns.length; j++) {
          row[df.columns[j]] = df.data[i][j];
        }
        
        sensorList.push(row.sensor);
        
        // Basic sensor configuration with mandatory fields
        const sensorConfig = {
          devID: deviceId,
          sensorID: row.sensor,
          operation: row.operation
        };
        
        // Conditionally add filter_operator and threshold if they are present and not empty
        const rowFilterOperator = row.filter_operator;
        const rowThreshold = row.threshold;
        
        if (rowFilterOperator != null && rowThreshold != null) {
          sensorConfig.operator = rowFilterOperator;
          sensorConfig.operatorValue = rowThreshold;
        }
        
        // Append the sensor configuration to devConfig
        requestBody.devConfig.push(sensorConfig);
      }
    } else {
      if (operation === null) {
        throw new Error("The 'operation' variable must be set.");
      }
      
      // Validate that both filter_operator and threshold are either both present or both absent
      if ((filterOperator === null) !== (threshold === null)) {
        throw new Error("Both filterOperator and threshold must be provided together or not at all.");
      }
      
      // Fetch metadata if sensorList is not provided
      if (sensorList === null) {
        metadata = await this.getDeviceMetadata(deviceId, { onPrem });
        sensorList = metadata.sensors.map(sensor => sensor.sensorId);
      }
      
      // Iterate through the sensorList to populate devConfig
      for (const sensorId of sensorList) {
        // Create the configuration dictionary for each sensor
        const sensorConfig = {
          devID: deviceId,
          sensorID: sensorId,
          operation: operation
        };
        
        // Add filter_operator and operatorValue only if they are both present
        if (filterOperator !== null && threshold !== null) {
          sensorConfig.operator = filterOperator;
          sensorConfig.operatorValue = threshold;
        }
        
        // Append the configuration to devConfig
        requestBody.devConfig.push(sensorConfig);
      }
    }
    
    // Construct API URL for data retrieval
    const url = GET_FILTERED_OPERATION_DATA.replace("{protocol}", protocol)
                                                   .replace("{data_url}", this.dataUrl);
    let retry = 0;
    
    // Configure axios to not verify SSL certificates when using http protocol
    const axiosConfig = {
      headers: { userID: this.userId },
      httpsAgent: onPrem ? new https.Agent({ rejectUnauthorized: false }) : undefined
    };
    
    while (true) {
      try {
        this.logger.info(`API ${url} response time:`);
        
        response = await axios.put(url, requestBody, axiosConfig);
        
        this.logger.endTimer(`API ${url} response time:`);
        
        // Parse the JSON response
        const responseData = response.data;

        // console.log('response data', {responseData})
        
        if (responseData.errors) {
          throw new Error("Error in response data");
        }
        
        break;
        
      } catch (error) {
        retry += 1;
        this.logger.error(
          `[${error.name}] Retry Count: ${retry}, ${error.message} ${response, url}`
        );
        
        if (retry < MAX_RETRIES) {
          const sleepTime = retry > 5 ? RETRY_DELAY[1] : RETRY_DELAY[0];
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        } else {
          throw new Error(
            `Max retries for data fetching from api-layer exceeded. ${response, url}`
          );
        }
      }
    }
    
    const retrievedSensors = [];
    const timeList = [];
    const valueList = [];
    
    for (const sensor of sensorList) {
      // console.log('sensor', {sensor})
      let currentOperation = operation;
      
      if (df !== null) {
        const sensorIdx = df.columns.indexOf("sensor");
        const operationIdx = df.columns.indexOf("operation");
        
        for (let i = 0; i < df.data.length; i++) {
          if (df.data[i][sensorIdx] === sensor) {
            currentOperation = df.data[i][operationIdx];
            break;
          }
        }
      }
      
      const info = response.data.data[`${deviceId}_${sensor}_${currentOperation}`];
      
      if (info) {
        retrievedSensors.push(sensor);
        timeList.push(info.time);
        valueList.push(info.value);
      }
    }
    
    if (valueList.length === 0) {
      return { data: [], columns: [] };
    }
    
    // Create a DataFrame-like structure
    const dataFrame = []
    
    for (let i = 0; i < retrievedSensors.length; i++) {
      dataFrame.push({ sensor: retrievedSensors[i], time: timeList[i], value: valueList[i], deviceId });
    }
    
    // Clean the table
    if (dataFrame.length > 0) {
      // console.log('cleaning table', {dataFrame})
      return this.getCleanedTable({
        data: dataFrame,
        alias,
        cal,
        deviceId,
        sensorList,
        onPrem,
        unix,
        metadata
      });
    }
    
    return result;
    
  } catch (error) {
    // console.error(`[ERROR] ${error}`);
    if (axios.isAxiosError(error)) {
      this.logger.error(`[AXIOS ERROR] ${error.name}: ${error.message}`);
    } else if (error instanceof TypeError || error instanceof SyntaxError) {
      this.logger.error(`[EXCEPTION] ${error.name}: ${error.message}`);
    } else if (error instanceof Error) {
      this.logger.error(`[EXCEPTION] ${error.name}: ${error.message}`);
    } else {
      this.logger.error(`[EXCEPTION] ${error}`);
    }
    return { data: [], columns: [] };
  }
}


}