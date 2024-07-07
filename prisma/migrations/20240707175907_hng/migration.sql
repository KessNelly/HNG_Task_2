-- DropIndex
DROP INDEX "User_userId_key";

-- DropIndex
DROP INDEX "organization_orgId_key";

-- CreateTable
CREATE TABLE "_OrganizationMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrganizationMembers_AB_unique" ON "_OrganizationMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_OrganizationMembers_B_index" ON "_OrganizationMembers"("B");

-- AddForeignKey
ALTER TABLE "_OrganizationMembers" ADD CONSTRAINT "_OrganizationMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationMembers" ADD CONSTRAINT "_OrganizationMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "organization"("orgId") ON DELETE CASCADE ON UPDATE CASCADE;
