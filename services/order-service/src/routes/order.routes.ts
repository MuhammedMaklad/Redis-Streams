import { Router } from "express";
import * as OrderController from "../controllers/order.controller";
import { validate } from "../middlewares/validation.middleware";
import { CreateOrderSchema } from "../schemas/order.schema";

const router: Router = Router();

// Using 'as any' on the handlers to resolve the strict Request type mismatch 
// between the validation middleware and the controller.
router.post("/", validate(CreateOrderSchema) as any, OrderController.Create as any);

export default router;
