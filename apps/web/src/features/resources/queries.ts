import { type ResourceType } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

/** A subject option within the catalogue, flattened for filter dropdowns. */
export interface SubjectOption {
  id: number;
  name: string;
  code: string | null;
  branch: string;
  semester: number;
  course: string;
}

/** A single approved, student-contributed resource ready for display. */
export interface ResourceListItem {
  id: string;
  title: string;
  unitName: string | null;
  pdfUrl: string;
  rating: number;
  ratingCount: number;
  subject: string;
  uploader: string;
  createdAt: string;
}

/**
 * Flatten the academic catalogue into a list of subjects with their course /
 * branch / semester context, suitable for populating the resource-browser
 * filters. Ordered for stable, predictable dropdowns.
 */
export async function getSubjectOptions(): Promise<SubjectOption[]> {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      semester: {
        select: {
          number: true,
          branch: {
            select: { name: true, year: { select: { course: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  return subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    branch: subject.semester.branch.name,
    semester: subject.semester.number,
    course: subject.semester.branch.year.course.name,
  }));
}

/**
 * List approved resources of a given type (NOTE or PAPER), optionally filtered
 * by subject. Newest first, then highest rated.
 */
export async function getResources(
  type: ResourceType,
  subjectId?: number,
): Promise<ResourceListItem[]> {
  const resources = await prisma.resource.findMany({
    where: {
      type,
      status: 'APPROVED',
      ...(subjectId ? { subjectId } : {}),
    },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    select: {
      id: true,
      title: true,
      unitName: true,
      pdfUrl: true,
      rating: true,
      ratingCount: true,
      createdAt: true,
      subject: { select: { name: true } },
      uploader: { select: { name: true } },
    },
  });

  return resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    unitName: resource.unitName,
    pdfUrl: resource.pdfUrl,
    rating: resource.rating,
    ratingCount: resource.ratingCount,
    subject: resource.subject.name,
    uploader: resource.uploader.name,
    createdAt: resource.createdAt.toISOString(),
  }));
}
