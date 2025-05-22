// src/Logger.js

export default class Logger {
    constructor(logger = null, message = '', logTime = false) {
      this.logger = logger;
      this.message = message;
      this.logTime = logTime;
      this.interval = 0;
      this.start = 0;
    }
  
    /**
     * Start the timer using Date.now()
     */
    startTimer() {
      if (this.logTime) {
        this.start = Date.now(); // Time in ms
      }
    }
  
    /**
     * End the timer and log duration
     */
    endTimer() {
      if (this.logTime && this.start > 0) {
        const end = Date.now();
        this.interval = (end - this.start) / 1000; // seconds
        this.info(`[NETWORK] ${this.message} ${this.interval.toFixed(4)} seconds`);
      }
    }
  
    info(log) {
      if (this.logger?.info) {
        this.logger.info(log);
      } else {
        console.log(log);
      }
    }
  
    error(log) {
      if (this.logger?.error) {
        this.logger.error(log);
      } else {
        console.error(log);
      }
    }
  
    /**
     * Display an in-place updating log on the same console line
     * @param {string} log
     */
    displayLog(log) {
      console.log(`${log}`);
    }
  }
  