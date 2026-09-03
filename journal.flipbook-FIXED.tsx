import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useJournal } from '@/lib/store';
import { useJournalPages } from '@/hooks/useJournalPages';
import FlipbookViewer from '@/components/journal/FlipbookViewer';
import { A4Page } from '@/components/journal/A4Page';
import { Suspense } from 'react';

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

  // Get pre-paginated, ready-to-render pages from the canonical pagination engine
  const { pages, isLoading, error } = useJournalPages(journal);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading journal pages...</p>
      </div>
    );
  }

  if (error || !pages || pages.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Failed to load journal: {error?.message || 'No pages generated'}</p>
      </div>
    );
  }

  // Render pages once (not in the flipbook component)
  const renderedPages = pages.map((page) => (
    <A4Page
      key={page.id}
      journalTitle={journal?.title || 'Journal'}
      period={journal?.month && journal?.year ? `${journal.month} ${journal.year}` : 'Digital Edition'}
      pageNumber={page.pageNumber}
      totalPages={pages.length}
      bare={page.bare}
    >
      {page.blocks.map((block) => (
        <div key={block.key} className="jr-block">
          {block.node}
        </div>
      ))}
    </A4Page>
  ));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FlipbookViewer
        journalPages={renderedPages}
        magazineTitle={journal?.title || 'JEEVANA JOURNAL'}
        issueName={journal?.month && journal?.year ? `${journal.month} ${journal.year}` : 'Digital Edition'}
      />
    </Suspense>
  );
}
