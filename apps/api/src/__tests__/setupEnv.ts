process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://techpapy:techpapy@localhost:5432/techpapy_test?schema=public";
process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789-0123456789";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-0123456789-0123456789";
process.env.CORS_ORIGIN = "http://localhost:3000";
