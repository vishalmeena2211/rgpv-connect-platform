import { Download, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { type ResourceListItem } from './queries';

/** Empty-state copy varies by resource type. */
function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center text-sm text-muted-foreground">
        No {label} here yet. Be the first to contribute.
      </CardContent>
    </Card>
  );
}

/** Presentational grid of resource cards with a download link and rating. */
export function ResourceGrid({
  resources,
  emptyLabel,
}: {
  resources: ResourceListItem[];
  emptyLabel: string;
}) {
  if (resources.length === 0) return <EmptyState label={emptyLabel} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {resources.map((resource) => (
        <Card key={resource.id} className="flex flex-col">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">{resource.title}</CardTitle>
              {resource.ratingCount > 0 ? (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Star className="size-3 fill-current" />
                  {resource.rating.toFixed(1)}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {resource.subject}
              {resource.unitName ? ` · ${resource.unitName}` : ''}
            </p>
          </CardHeader>
          <CardContent className="mt-auto flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">by {resource.uploader}</span>
            <Button asChild size="sm" variant="outline">
              <a href={resource.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download />
                Open
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
