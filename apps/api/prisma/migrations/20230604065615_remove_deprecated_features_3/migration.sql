/*
  Warnings:

  - You are about to drop the column `adminRoleId` on the `DiscordRoles` table. All the data in the column will be lost.
  - You are about to drop the column `dispatchRoleId` on the `DiscordRoles` table. All the data in the column will be lost.
  - You are about to drop the column `emsFdRoleId` on the `DiscordRoles` table. All the data in the column will be lost.
  - You are about to drop the column `leoRoleId` on the `DiscordRoles` table. All the data in the column will be lost.
  - You are about to drop the column `leoSupervisorRoleId` on the `DiscordRoles` table. All the data in the column will be lost.
  - You are about to drop the column `taxiRoleId` on the `DiscordRoles` table. All the data in the column will be lost.
  - You are about to drop the column `towRoleId` on the `DiscordRoles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DiscordRoles" DROP CONSTRAINT "DiscordRoles_adminRoleId_fkey";

-- DropForeignKey
ALTER TABLE "DiscordRoles" DROP CONSTRAINT "DiscordRoles_dispatchRoleId_fkey";

-- DropForeignKey
ALTER TABLE "DiscordRoles" DROP CONSTRAINT "DiscordRoles_emsFdRoleId_fkey";

-- DropForeignKey
ALTER TABLE "DiscordRoles" DROP CONSTRAINT "DiscordRoles_leoRoleId_fkey";

-- DropForeignKey
ALTER TABLE "DiscordRoles" DROP CONSTRAINT "DiscordRoles_leoSupervisorRoleId_fkey";

-- DropForeignKey
ALTER TABLE "DiscordRoles" DROP CONSTRAINT "DiscordRoles_taxiRoleId_fkey";

-- DropForeignKey
ALTER TABLE "DiscordRoles" DROP CONSTRAINT "DiscordRoles_towRoleId_fkey";

-- AlterTable
ALTER TABLE "DiscordRoles" DROP COLUMN "adminRoleId",
DROP COLUMN "dispatchRoleId",
DROP COLUMN "emsFdRoleId",
DROP COLUMN "leoRoleId",
DROP COLUMN "leoSupervisorRoleId",
DROP COLUMN "taxiRoleId",
DROP COLUMN "towRoleId";
