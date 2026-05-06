export interface JwtPayload {
  sub: string;
  roles: string[];
}

export interface CurrentUserPayload {
  userId: string;
  employeeId: string | null;
  roles: string[];
}
