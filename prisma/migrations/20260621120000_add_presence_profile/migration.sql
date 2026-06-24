-- AlterTable
ALTER TABLE "Presence" ADD COLUMN "nickname" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Presence" ADD COLUMN "aboutMe" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Presence" ADD COLUMN "avatar" TEXT NOT NULL DEFAULT 'neutral';
ALTER TABLE "Presence" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Remove ephemeral defaults so new rows must supply profile on join.
ALTER TABLE "Presence" ALTER COLUMN "nickname" DROP DEFAULT;
ALTER TABLE "Presence" ALTER COLUMN "avatar" DROP DEFAULT;
ALTER TABLE "Presence" ALTER COLUMN "tags" DROP DEFAULT;
