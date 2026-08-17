-- Drop the premium tier: RGPV Connect is free and open-source.
ALTER TABLE "User" DROP COLUMN "isPremium";
