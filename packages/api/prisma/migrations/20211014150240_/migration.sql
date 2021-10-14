-- CreateEnum
CREATE TYPE "EmployeeAsEnum" AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE');

-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_userId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessPost" DROP CONSTRAINT "BusinessPost_businessId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessPost" DROP CONSTRAINT "BusinessPost_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessPost" DROP CONSTRAINT "BusinessPost_userId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- CreateTable
CREATE TABLE "EmployeeValue" (
    "id" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "as" "EmployeeAsEnum" NOT NULL DEFAULT E'EMPLOYEE',

    CONSTRAINT "EmployeeValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "EmployeeValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPost" ADD CONSTRAINT "BusinessPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPost" ADD CONSTRAINT "BusinessPost_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPost" ADD CONSTRAINT "BusinessPost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeValue" ADD CONSTRAINT "EmployeeValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "Value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
