export class ResponseHelper {
  static success(data: any = null, message = 'Success', status = 200) {
    return {
      status,
      message,
      data,
    };
  }

  static error(message = 'Error', status = 500, data: any = null) {
    return {
      status,
      message,
      data,
    };
  }
}
