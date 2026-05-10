import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const db = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
});

export default db;
