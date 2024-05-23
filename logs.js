import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const ENABLE_LOGS = process.env.ENABLE_LOGS === "true";

mongoose.connect(process.env.DB_URI, { dbName: process.env.DB_NAME });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("Connected to the database"));

const deviceSchema = new mongoose.Schema({
  platform: String,
  os: String,
  browser: String,
  version: String,
  source: String,
  ip: String,
  isMobile: Boolean,
  isDesktop: Boolean,
  isTablet: Boolean,
  isWindows: Boolean,
  isLinux: Boolean,
  isMac: Boolean,
});

const logSchema = new mongoose.Schema({
  device: deviceSchema,
  endpoint: String,
  timestamp: Date,
  status: Number,
  body: String,
  error: String,
});

const Log = mongoose.model("Log", logSchema);

const saveLog = async (req, { status = 200, body = "", error = "" } = {}) => {
  if (!ENABLE_LOGS) return;

  const device = req.useragent;

  const deviceData = {
    platform: device.platform,
    os: device.os,
    browser: device.browser,
    version: device.version,
    source: device.source,
    ip: req.ip,
    isMobile: device.isMobile,
    isDesktop: device.isDesktop,
    isTablet: device.isTablet,
    isWindows: device.isWindows,
    isLinux: device.isLinux,
    isMac: device.isMac,
  };

  const log = {
    device: deviceData,
    endpoint: req.originalUrl,
    timestamp: new Date(),
    status,
    body,
    error,
  };

  const newLog = new Log(log);
  await newLog.save();
};

const getLogs = async () => {
  const logs = await Log.find().select("-__v -device").sort({ timestamp: -1 });
  return logs;
};

const getLog = async (id) => {
  try {
    const log = await Log.findById(id).select("-__v");
    return log;
  } catch (e) {
    return null;
  }
};

export { saveLog, getLogs, getLog };
