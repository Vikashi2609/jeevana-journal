import { createFileRoute } from '@tanstack/react-router';
import { useJournal } from '@/lib/store';
import { JournalRenderer } from '@/components/journal/JournalRenderer';

export const Route = createFileRoute('/journal/$id/flipbook')({
  component: FlipbookRoute,
  meta: () => [
    {
      title: 'Flipbook — Jeevana E-Journal'
    },
    {
      name: 'description',
      content: 'Read the finished journal as a digital flipbook, page by page.'
    }
  ]
});

function FlipbookRoute() {
  const { id } = Route.useParams();
  const { journal } = useJournal(id);

  if (!journal) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading journal...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <JournalRenderer journal={journal} />
    </div>
  );
}