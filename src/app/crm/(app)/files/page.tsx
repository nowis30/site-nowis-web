import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { FilesPage } from '@/features/crm/components/files/FilesPage';

export default async function CrmFilesPage() {
  await requireCrmSession();

  const files = await prisma.document.findMany({
    include: { uploadedBy: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <FilesPage
      files={files.map((item) => ({
        id: item.id,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        linkedType: item.linkedType,
        linkedId: item.linkedId,
        createdAt: item.createdAt.toISOString(),
        uploadedBy: item.uploadedBy,
      }))}
    />
  );
}
