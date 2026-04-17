import {status} from "http-status"


export class AppError extends Error {
  private readonly statusCode:number;
  private readonly isOperational:boolean;
  private readonly errors?:any[];

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