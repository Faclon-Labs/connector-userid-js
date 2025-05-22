// src/constants.js

export const VERSION = '1.0.0';

// Timezones (using string identifiers; use Luxon or Intl for actual parsing)
export const TIMEZONES = {
  UTC: 'UTC',
  IST: 'Asia/Kolkata'
};

/* ----------------------------- MQTT HANDLER ------------------------------- */
export const MAX_CHUNK_SIZE = 1000;
export const SLEEP_TIME = 1;

/* ----------------------------- DATA ACCESS -------------------------------- */
export const GET_USER_INFO_URL = '{protocol}://{data_url}/api/metaData/user';
export const GET_DEVICE_DETAILS_URL = '{protocol}://{data_url}/api/metaData/allDevices';
export const GET_DEVICE_METADATA_URL = '{protocol}://{data_url}/api/metaData/device/{device_id}';
export const GET_DP_URL = '{protocol}://{data_url}/api/apiLayer/getLimitedDataMultipleSensors/';
export const GET_FIRST_DP = '{protocol}://{data_url}/api/apiLayer/getMultipleSensorsDPAfter';
export const GET_LOAD_ENTITIES = '{protocol}://{data_url}/api/metaData/getAllClusterData';
export const INFLUXDB_URL = '{protocol}://{data_url}/api/apiLayer/getAllData';
export const GET_CURSOR_BATCHES_URL = '{protocol}://{data_url}/api/apiLayer/getCursorOfBatches';
export const CONSUMPTION_URL = '{protocol}://{data_url}/api/apiLayer/getStartEndDPV2';
export const TRIGGER_URL = '{protocol}://{data_url}/api/expression-schedular/user-trigger-with-title';
export const CLUSTER_AGGREGATION = '{protocol}://{data_url}/api/widget/clusterData';
export const GET_FILTERED_OPERATION_DATA = '{protocol}://{data_url}/api/consumption/getOperationDataWithTime';

export const MAX_RETRIES = 15;
export const RETRY_DELAY = [2, 4];
export const CURSOR_LIMIT = 25000;