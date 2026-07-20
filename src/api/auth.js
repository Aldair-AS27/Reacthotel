import api from './axios';

export const login = async (email, password) => {
  // OAuth2PasswordBearer en FastAPI espera form-data, pero según tu Swagger 
  // acepta application/json en el body con un esquema LoginRequest.
  const response = await api.post('/auth/login', { email, password });
  return response.data; // { access_token, token_type }
};