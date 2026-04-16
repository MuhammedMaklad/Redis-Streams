import app from "./server"
import "./config/redis"
import {logger} from "./config/pino"


const port : number = (process.env.PORT ?? 3000) as number



app.listen(port, ()=> {
  logger.info(`Order Service is running on port ${port}\n URL: http://localhost:${port}/`);
  // console.log()
})

process.on("SIGINT", () => {
  logger.info("Order Service is shutting down...")
  // console.log("Order Service is shutting down...");
  process.exit(0);
})