// ============================================================
// PostgreSQL connection, matches the groupmate's schema:
//   database : db_users
//   table    : tbl_users (id, username, password, email, user_progress JSONB)
//   view     : getAllUsers
// ============================================================
import pg from "pg";
import { toProgressDto, isLegacyQuizLayout } from "@/lib/progress";

const { Pool } = pg;

let pool = globalThis.pgPool || null;

export function getPool() {
  if (!pool) {
    const isCloud =
      process.env.DATABASE_URL?.includes("neon.tech") ||
      process.env.DATABASE_URL?.includes("sslmode=require") ||
      process.env.NODE_ENV === "production";

    pool = process.env.DATABASE_URL
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: isCloud ? { rejectUnauthorized: false } : undefined,
          max: 5,
          connectionTimeoutMillis: 5000,
        })
      : new Pool({
          host: process.env.PGHOST || "localhost",
          port: Number(process.env.PGPORT || 5432),
          database: process.env.PGDATABASE || "db_users",
          user: process.env.PGUSER || "postgres",
          password: process.env.PGPASSWORD || "postgres",
          max: 5,
          connectionTimeoutMillis: 4000,
        });
    pool.on("error", (err) =>
      console.error("[pg] idle client error:", err.message),
    );

    if (process.env.NODE_ENV !== "production") {
      globalThis.pgPool = pool;
    }
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

export const DB_ERROR_MESSAGE =
  "Database not reachable. Make sure PostgreSQL is running and the db_users database exists (see db/setup.sql).";

// Old five-quiz records are rewritten once, so later single-key updates
// (POST /api/progress) don't land on a record that still reads as old.
export async function upgradeStoredProgress(userId, stored) {
  const progress = toProgressDto(stored);
  if (isLegacyQuizLayout(stored)) {
    try {
      await query(
        "UPDATE tbl_users SET user_progress = $2::jsonb WHERE id = $1",
        [userId, JSON.stringify(progress)],
      );
    } catch (err) {
      console.error("[progress upgrade]", err.message);
    }
  }
  return progress;
}

// Default user_progress JSONB, same shape as the documentation example
export function defaultProgress(lessonKeys, quizIds) {
  const Progress = {};
  lessonKeys.forEach((k) => (Progress[k] = "NotStarted"));
  const QuizProgress = {};
  const QuizScores = {};
  quizIds.forEach((q) => {
    QuizProgress[q] = "NotStarted";
    QuizScores[q] = 0;
  });
  return { Progress, QuizProgress, QuizScores };
}
