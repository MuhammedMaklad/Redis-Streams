import status from "http-status";
import {AppError} from "./AppError";

export class BadRequestError extends AppError{

  constructor(message: string = "Bad Request Error", errors?:any[]) {
    super(message, status.BAD_REQUEST,true, errors);
  }

}