// Quick diagnostic script to test UUID serialization from Prisma
import { prisma } from '@/lib/prisma';

async function testUuidSerialization() {
  try {
    console.log('🔍 Testing UUID serialization...\n');

    // Fetch a single song request with contact
    const item = await prisma.songRequest.findFirst({
      include: {
        contact: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!item) {
      console.log('⚠️  No song requests found in database');
      return;
    }

    console.log('📦 Raw Prisma Data Types:');
    console.log(`  item.id type: ${typeof item.id}`);
    console.log(`  item.id value: ${item.id}`);
    console.log(`  item.id constructor: ${item.id?.constructor?.name}`);
    console.log(`  item.id is Uint8Array: ${item.id instanceof Uint8Array}`);

    console.log(`\n  item.contact.id type: ${typeof item.contact.id}`);
    console.log(`  item.contact.id value: ${item.contact.id}`);
    console.log(`  item.contact.id constructor: ${item.contact.id?.constructor?.name}`);
    console.log(`  item.contact.id is Uint8Array: ${item.contact.id instanceof Uint8Array}`);

    // Test String() conversion
    console.log('\n✏️  String() Conversion Results:');
    console.log(`  String(item.id): "${String(item.id)}"`);
    console.log(`  String(item.contact.id): "${String(item.contact.id)}"`);

    // Test JSON serialization
    console.log('\n🔗 JSON Serialization Test:');
    try {
      const mapped = {
        id: String(item.id),
        contactId: String(item.contact.id),
        contact: {
          id: String(item.contact.id),
          fullName: item.contact.fullName,
          email: item.contact.email,
        },
      };
      const json = JSON.stringify(mapped);
      console.log(`  ✅ Successfully serialized: ${json.substring(0, 100)}...`);
    } catch (error) {
      console.log(`  ❌ Serialization failed: ${error.message}`);
    }

    // Test status enum
    console.log('\n📋 Status Enum Check:');
    console.log(`  item.status type: ${typeof item.status}`);
    console.log(`  item.status value: ${item.status}`);
    console.log(`  item.status constructor: ${item.status?.constructor?.name}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUuidSerialization();
