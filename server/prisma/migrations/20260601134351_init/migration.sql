-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Couple" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "husbandId" TEXT NOT NULL,
    "wifeId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    CONSTRAINT "Couple_husbandId_fkey" FOREIGN KEY ("husbandId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Couple_wifeId_fkey" FOREIGN KEY ("wifeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Couple_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscipleRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discipleId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    CONSTRAINT "DiscipleRelationship_discipleId_fkey" FOREIGN KEY ("discipleId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DiscipleRelationship_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'anthropic',
    "encryptedApiKey" TEXT,
    "selectedModel" TEXT,
    CONSTRAINT "AdminSettings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "scriptureRef" TEXT,
    "instructions" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "assignedToId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Homework_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Homework_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeworkResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeworkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeworkResponse_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HomeworkResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "counselorId" TEXT NOT NULL,
    "subjectId" TEXT,
    "coupleId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionNote_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionNote_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "counselorId" TEXT NOT NULL,
    "contextId" TEXT,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatSession_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_husbandId_key" ON "Couple"("husbandId");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_wifeId_key" ON "Couple"("wifeId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscipleRelationship_discipleId_key" ON "DiscipleRelationship"("discipleId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSettings_adminId_key" ON "AdminSettings"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalChatSession_userId_key" ON "PersonalChatSession"("userId");
