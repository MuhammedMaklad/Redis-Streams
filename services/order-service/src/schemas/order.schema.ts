import {z, type ZodNumber, type ZodObject, type ZodString} from "zod";
import type {$strip} from "zod/v4/core";


export const CreateOrderSchema : ZodObject<{
  body: ZodObject<{
    userId: ZodString
    productId: ZodString
    amount: ZodNumber
  }, $strip>
}, $strip> = z.object({
  body: z.object({
    userId: z.string(),
    productId: z.string(),
    amount: z.number().gte(0),
  })
})


export type CreateOrderInput = z.infer<typeof CreateOrderSchema>['body'];
