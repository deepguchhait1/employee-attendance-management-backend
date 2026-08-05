import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { startAttendanceAutoCheckoutJob } from "./jobs/attendance.job.js";
import { env } from "./config/env.js";

startAttendanceAutoCheckoutJob();
const app = express();

app.use(
  cors({
    origin: [env.FRONTEND_URL,"http://localhost:5173"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running Successfully",
  });
});
app.use(notFound);
app.use(errorHandler);

export default app;
