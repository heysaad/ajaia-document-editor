CREATE TYPE "DocumentShareRole" AS ENUM ('EDITOR');

CREATE TABLE "DocumentShare" (
  "documentId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "DocumentShareRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("documentId", "userId")
);

CREATE INDEX "Document_updatedAt_id_idx"
  ON "Document"("updatedAt" DESC, "id" DESC);

CREATE INDEX "DocumentShare_userId_documentId_idx"
  ON "DocumentShare"("userId", "documentId");

ALTER TABLE "DocumentShare"
  ADD CONSTRAINT "DocumentShare_documentId_fkey"
  FOREIGN KEY ("documentId")
  REFERENCES "Document"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "DocumentShare"
  ADD CONSTRAINT "DocumentShare_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
