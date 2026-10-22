-- The initial migration predates the User model. Keep this migration safe for
-- both a fresh database and a database created with the old schema.
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

UPDATE "User" SET "role" = 'mechanic' WHERE "role" = 'staff';
