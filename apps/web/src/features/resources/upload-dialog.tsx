'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/upload-client';
import { formatBytes } from '@/lib/utils';

import { resubmitResource, startUpload, submitResource } from './actions';

export interface SubjectChoice {
  id: number;
  code: string | null;
  name: string;
  semester: number;
  branchCode: string | null;
}

/** Recent exam sessions, newest first: Jun 2026, Dec 2025, … */
function recentSessions(count = 8): string[] {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() >= 6 ? 'Jun' : 'Dec';
  if (month === 'Dec') year -= 1;
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(`${month} ${year}`);
    if (month === 'Jun') {
      month = 'Dec';
      year -= 1;
    } else month = 'Jun';
  }
  return out;
}

type Editing = { id: string; title: string; unitName: string | null; session: string | null; subjectId: number; type: 'NOTE' | 'PAPER' };

/**
 * Upload notes or a paper, or fix one a reviewer sent back. The subject is
 * pre-picked from the student's branch and semester.
 */
export function UploadDialog({
  subjects,
  defaultSubjectId,
  defaultType = 'NOTE',
  editing,
  trigger,
}: {
  subjects: SubjectChoice[];
  defaultSubjectId?: number;
  defaultType?: 'NOTE' | 'PAPER';
  editing?: Editing;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'NOTE' | 'PAPER'>(editing?.type ?? defaultType);
  const [subjectId, setSubjectId] = useState<number | ''>(editing?.subjectId ?? defaultSubjectId ?? '');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [unitName, setUnitName] = useState(editing?.unitName ?? '');
  const [session, setSession] = useState(editing?.session ?? recentSessions()[0]!);
  const [file, setFile] = useState<File | null>(null);
  const [own, setOwn] = useState(Boolean(editing));
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const bySemester = useMemo(() => {
    const groups = new Map<string, SubjectChoice[]>();
    for (const s of subjects) {
      const key = `${s.branchCode ?? ''} · Semester ${s.semester}`;
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    return [...groups.entries()];
  }, [subjects]);

  function submit() {
    setError(null);
    if (!subjectId) return setError('Pick the subject.');
    if (!editing && !file) return setError('Choose a file.');
    startTransition(async () => {
      const details = { subjectId, title, unitName: unitName || undefined, session: type === 'PAPER' ? session : undefined, declaredOwnWork: own as true };
      if (editing) {
        const result = await resubmitResource(editing.id, details);
        if (!result.ok) return setError(result.error);
        toast.success('Sent for review again.');
      } else {
        const start = await startUpload({ contentType: file!.type, size: file!.size });
        if (!start.ok) return setError(start.error);
        try {
          setProgress(0);
          await uploadFile(start.target, file!, setProgress);
        } catch {
          setProgress(null);
          return setError('The upload stopped. Check your connection and try again.');
        }
        const result = await submitResource({ ...details, type, key: start.target.key });
        setProgress(null);
        if (!result.ok) return setError(result.error);
        toast.success('Sent for review. Usually under two days.');
      }
      setOpen(false);
      setFile(null);
      router.push('/uploads');
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Upload />
            Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Fix and send again' : type === 'NOTE' ? 'Upload notes' : 'Upload a paper'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Change what the reviewer pointed out. It goes back into the review queue.'
              : 'PDF or photos, up to 25 MB. Other verified students see it after a quick review.'}
          </DialogDescription>
        </DialogHeader>
        {!editing ? (
          <div className="grid grid-cols-2 gap-1 rounded-[11px] bg-muted p-[3px]">
            {(['NOTE', 'PAPER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`h-8 rounded-[9px] text-[13px] font-medium ${type === t ? 'bg-card shadow-card' : 'text-muted-foreground'}`}
              >
                {t === 'NOTE' ? 'Notes' : 'Previous-year paper'}
              </button>
            ))}
          </div>
        ) : null}
        <Field label="Subject" htmlFor="upload-subject" hint="Picked from your branch and semester. Change it if this is for another subject.">
          <Select id="upload-subject" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))}>
            <option value="">Choose a subject</option>
            {bySemester.map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `${s.code} · ` : ''}
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        {type === 'PAPER' ? (
          <Field label="Exam session" htmlFor="upload-session">
            <Select id="upload-session" value={session} onChange={(e) => setSession(e.target.value)}>
              {recentSessions().map((s) => (
                <option key={s} value={s}>
                  {s} end semester
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label={type === 'NOTE' ? 'What they cover' : 'Title'} htmlFor="upload-title">
          <Input id="upload-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder={type === 'NOTE' ? 'Unit 2 · classification, decision trees, k-NN' : 'Theory of Computation, end semester'} />
        </Field>
        {type === 'NOTE' ? (
          <Field label="Units (optional)" htmlFor="upload-unit">
            <Input id="upload-unit" value={unitName} onChange={(e) => setUnitName(e.target.value)} maxLength={60} placeholder="Unit 2" />
          </Field>
        ) : null}
        {!editing ? (
          <Field label="File" htmlFor="upload-file">
            <label
              htmlFor="upload-file"
              className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-input bg-subtle px-3 text-center text-[13px] text-muted-foreground hover:border-primary"
            >
              <Upload className="size-4" />
              {file ? `${file.name} (${formatBytes(file.size)})` : 'Choose a PDF or photo'}
            </label>
            <input id="upload-file" type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
        ) : null}
        {progress != null ? <Progress value={progress} /> : null}
        <Checkbox id="upload-own" checked={own} onChange={(e) => setOwn(e.target.checked)} label="These are my own notes or I have permission to share them. Shared with my name on them." />
        {error ? <p className="text-[13px] text-destructive" role="alert">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !own}>
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            {editing ? 'Send again' : 'Send for review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
