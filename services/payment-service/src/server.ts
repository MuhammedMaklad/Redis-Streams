import express, { type Express } from "express";
import { ErrorHandlerMiddleware } from "./middlewares/errorHandler.middleware";
import { NotFoundMiddleware } from "./middlewares/notFound.middleware";

const app: Express = express();

app.use(express.json());

app.get("/api/v1/payment/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

app.use(ErrorHandlerMiddleware);
app.use(NotFoundMiddleware);

export default app;
