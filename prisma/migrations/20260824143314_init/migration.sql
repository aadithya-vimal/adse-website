-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'AI, ML AND DATA SCIENCE',
    "specialization" TEXT,
    "image" TEXT,
    "userId" INTEGER,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "classSectionId" INTEGER NOT NULL,
    "teacherId" INTEGER,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "subjectId" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "StudentStatus" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSection_name_key" ON "ClassSection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_teacherId_idx" ON "Subject"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_storedName_key" ON "Document"("storedName");

-- CreateIndex
CREATE INDEX "Document_subjectId_idx" ON "Document"("subjectId");

-- CreateIndex
CREATE INDEX "StudentStatus_studentId_idx" ON "StudentStatus"("studentId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatus" ADD CONSTRAINT "StudentStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatus" ADD CONSTRAINT "StudentStatus_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
