-- CreateTable
CREATE TABLE "ScriptureQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "acknowledgment" TEXT NOT NULL,
    "canonical" TEXT NOT NULL,
    "passages" TEXT NOT NULL,
    "practicalStep" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptureQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
