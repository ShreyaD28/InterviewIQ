import mongoose from "mongoose";

function appendDefaultQuery(uri) {
  let u = uri.replace(/\r/g, "").trim();
  if (!u) return u;
  if (!u.includes("?")) {
    const idx = u.indexOf("://");
    const afterProtocol = idx >= 0 ? u.slice(idx + 3) : u;
    const slashIdx = afterProtocol.indexOf("/");
    const pathAfterSlash =
      slashIdx >= 0 ? afterProtocol.slice(slashIdx + 1) : "";
    const hasDbPath = pathAfterSlash.length > 0;
    // Never use "/?" after .../dbname — MongoDB treats the DB name as "dbname/" (invalid).
    if (hasDbPath) {
      u = `${u}?retryWrites=true&w=majority`;
    } else {
      u = u.endsWith("/")
        ? `${u}?retryWrites=true&w=majority`
        : `${u}/?retryWrites=true&w=majority`;
    }
  } else if (!/([?&])retryWrites=/.test(u)) {
    u += (u.endsWith("&") || u.endsWith("?") ? "" : "&") + "retryWrites=true&w=majority";
  }
  if (u.startsWith("mongodb+srv:") && !u.includes("authSource=")) {
    u += "&authSource=admin";
  }
  return u;
}

function resolveMongoUri() {
  const user = process.env.MONGODB_USER?.replace(/\r/g, "").trim();
  const passRaw = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST?.replace(/\r/g, "").trim();
  if (user && passRaw !== undefined && passRaw !== "" && host) {
    const cleanHost = host.replace(/^mongodb\+srv:\/\//, "").replace(/\/$/, "");
    const u = encodeURIComponent(user);
    const p = encodeURIComponent(String(passRaw).replace(/\r/g, ""));
    return appendDefaultQuery(`mongodb+srv://${u}:${p}@${cleanHost}`);
  }
  const url = process.env.MONGODB_URL?.replace(/\r/g, "").trim();
  if (!url) {
    throw new Error(
      "Set MONGODB_URL or MONGODB_USER, MONGODB_PASSWORD, and MONGODB_HOST (see server/docker-compose.yml for local MongoDB)."
    );
  }
  return appendDefaultQuery(url);
}

const connectDb = async () => {
  try {
    const uri = resolveMongoUri();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
    console.log("DataBase Connected");
  } catch (error) {
    console.log(`DataBase Error ${error}`);
    const msg = String(error?.message ?? "");
    if (error?.code === 8000 || error?.code === 18 || msg.includes("bad auth")) {
      console.log(
        "MongoDB rejected the username/password. In Atlas: Database Access → edit your database user → reset password, then update MONGODB_URL or MONGODB_PASSWORD in server/.env (use encodeURIComponent-safe vars if the password has @, #, or /)."
      );
    } else if (msg.includes("ECONNREFUSED") || msg.includes("querySrv ENOTFOUND")) {
      console.log(
        'If you use local MongoDB, run from the server folder: npm run mongo:up  (then MONGODB_URL=mongodb://127.0.0.1:27017/interviewiq in .env).'
      );
    }
  }
};

export default connectDb;
