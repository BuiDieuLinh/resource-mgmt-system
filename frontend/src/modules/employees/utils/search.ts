export const normalizeString = (str: string = ''): string => {
  return str
    .normalize('NFD') // tách dấu ra khỏi ký tự
    .replace(/[\u0300-\u036f]/g, '') // xoá toàn bộ dấu
    .replace(/đ/g, 'd') // xử lý riêng tiếng Việt
    .replace(/Đ/g, 'd')
    .toLowerCase() // về lowercase
    .trim() // bỏ space đầu cuối
    .replace(/\s+/g, ' '); // gộp nhiều space thành 1
};
