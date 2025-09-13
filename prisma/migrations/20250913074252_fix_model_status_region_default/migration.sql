/*
  Warnings:

  - Made the column `region` on table `model_status` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."model_status" ALTER COLUMN "region" SET NOT NULL,
ALTER COLUMN "region" SET DEFAULT 'global';
