import { type JwtPayload } from "../utils/jwt";

export type AuthInfo = {
  isAuthenticated: boolean;
  readerId: string | null;
  email: string | null;
  role: string | null;
  payload: JwtPayload | null;
};
