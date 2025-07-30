-- CreateEnum
CREATE TYPE "TaskNoteStatus" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "TaskStatusNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "TaskNoteStatus" NOT NULL DEFAULT 'INFO',
    "taskId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskStatusNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskStatusNote" ADD CONSTRAINT "TaskStatusNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusNote" ADD CONSTRAINT "TaskStatusNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
