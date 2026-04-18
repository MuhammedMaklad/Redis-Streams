import {status} from "http-status"


export class AppError extends Error {
  public readonly statusCode:number;
  public readonly isOperational:boolean;
  public readonly errors?:any[];

  constructor(
    message:string,
    statusCode:number = status.INTERNAL_SERVER_ERROR,
    isOperational:boolean = true,
    errors?:any[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors ?? [];
  }
}
