import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError, type ZodSchema } from "zod";
import { BadRequestError } from "../errors/BadRequest";

/**
 * A generic validation middleware that supports validating request body, query, and params.
 * It uses TypeScript generics to maintain type safety and ensures that transformed 
 * data (coerced types, defaults, etc.) is assigned back to the request object.
 *
 * @param schema - The Zod schema to validate against. Usually a z.object wrapping body/query/params.
 */
export const validate = (schema: ZodSchema): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request and get the parsed/transformed result
      const parsedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      }) as any;

      // Assign transformed data back to the request object
      // This is crucial for Zod features like .default(), .transform(), or z.coerce
      if (parsedData.body) req.body = parsedData.body;
      if (parsedData.query) req.query = parsedData.query;
      if (parsedData.params) req.params = parsedData.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Map Zod issues into a standardized, readable error format
        const errorDetails = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }));
        return next(new BadRequestError("Validation Failed", errorDetails));
      }

      // Pass any other unexpected errors to the next middleware
      next(error);
    }
  };
