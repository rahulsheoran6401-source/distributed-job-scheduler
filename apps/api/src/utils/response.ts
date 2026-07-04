import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
}

export const sendSuccess = <T>(res: Response, message: string, data?: T, meta?: any, statusCode = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode = 500, meta?: any) => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    meta,
  };
  return res.status(statusCode).json(response);
};
