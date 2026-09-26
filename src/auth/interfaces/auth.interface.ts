export class IAuthUser {
  id: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface IJwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}