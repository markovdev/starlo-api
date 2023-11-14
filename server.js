const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");
const DB = process.env.DB_ATLAS.replace("<DB_PASS>", process.env.DB_PASS);
mongoose.set("strictQuery", false);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("[+] Database Connected Successfully!");
  });

const port = 80 || process.env.PORT;
app.listen(port, () => {
  console.log(`[+] App running on port ${port}`);
});
process.on("unhandledRejection", (err) => {
  console.error(err.name, err.message);
  console.log("[-] Caught an error 💥\nQuiting now...");
  process.exit(1);
});
