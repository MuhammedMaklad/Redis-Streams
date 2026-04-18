import type {RequestHandler} from "express";
import {status} from "http-status"
const handler:RequestHandler = (req, res) => {
    return res.status(status.NOT_FOUND).json({
    msg:"Path Not Found"
  })
}

export {
  handler as NotFoundMiddleware
}
