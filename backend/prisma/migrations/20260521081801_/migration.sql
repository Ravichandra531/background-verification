/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[panHash]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Candidate_email_idx";

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "panHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_phone_key" ON "Candidate"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_panHash_key" ON "Candidate"("panHash");
