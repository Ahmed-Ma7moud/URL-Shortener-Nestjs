export class IAuthUser {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export interface IJwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}