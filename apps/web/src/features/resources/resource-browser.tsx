import { type ResourceType } from '@rgpv/shared';

import { getResources, getSubjectOptions } from './queries';
import { ResourceFilter } from './resource-filter';
import { ResourceGrid } from './resource-grid';

/**
 * Server-rendered browser shared by the notes and papers screens. Reads the
 * selected subject from the URL, loads the matching approved resources, and
 * renders the filter + grid together.
 */
export async function ResourceBrowser({
  type,
  emptyLabel,
  selectedSubject,
}: {
  type: ResourceType;
  emptyLabel: string;
  selectedSubject?: string;
}) {
  const subjectId = selectedSubject ? Number(selectedSubject) : undefined;
  const [subjects, resources] = await Promise.all([
    getSubjectOptions(),
    getResources(type, Number.isFinite(subjectId) ? subjectId : undefined),
  ]);

  return (
    <div className="space-y-6">
      <ResourceFilter subjects={subjects} />
      <ResourceGrid resources={resources} emptyLabel={emptyLabel} />
    </div>
  );
}
