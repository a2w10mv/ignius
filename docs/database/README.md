# PostgreSQL Database Setup

The app optionally uses PostgreSQL for user accounts and progress synchronization.

## Schema

```sql
CREATE DATABASE db_users;

\c db_users;

CREATE TABLE tbl_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_progress JSONB DEFAULT '{}'::jsonb
);
```

## Structure of `user_progress`

`user_progress` is stored as JSONB with the following format:

```json
{
  "Progress": {
    "Lesson1": "Finished",
    "Lesson2": "Not Started"
  },
  "QuizProgress": {
    "Quiz1": "Finished"
  },
  "QuizScores": {
    "Quiz1": 100
  }
}
```
