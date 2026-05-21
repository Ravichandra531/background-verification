import prisma from '../src/config/database.js';
import { decrypt } from '../src/utils/encryption.js';
import { hashPanForLookup } from '../src/utils/fieldHash.js';
import { normalizePan, isValidPan } from '../src/utils/documentValidation.js';

async function main(): Promise<void> {
  const candidates = await prisma.candidate.findMany({
    where: { panHash: null },
    select: { id: true, panNumber: true },
  });

  for (const candidate of candidates) {
    const pan = decrypt(candidate.panNumber);
    if (!pan || !isValidPan(pan)) {
      console.warn(`Skipping ${candidate.id}: invalid or missing PAN`);
      continue;
    }
    const panHash = hashPanForLookup(normalizePan(pan));
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { panHash },
    });
    console.log(`Updated panHash for ${candidate.id}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
