import  express, {type Express} from "express"
import {ErrorHandlerMiddleware} from "./middlewares/errorHandler.middleware";
import {status} from "http-status"
import orderRoutes from "./routes/order.routes";
import { NotFoundMiddleware } from "./middlewares/notFound.middleware";

const app :Express =  express();

app.use(express.json());
app.use("/api/v1/order", orderRoutes);
app.use(ErrorHandlerMiddleware);
app.use(NotFoundMiddleware)


export default  app;