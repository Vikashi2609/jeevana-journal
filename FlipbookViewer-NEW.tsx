import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

interface FlipbookViewerProps {
  journalPages: React.ReactNode[];  // Pre-rendered pages from useJournalPages()
  magazineTitle?: string;
  issueName?: string;
}

/**
 * Pure flipbook viewer component.
 * Receives already-paginated, already-rendered pages from the parent route.
 * Does NOT fetch from Supabase, does NOT re-paginate.
 * Just handles navigation, zoom, and layout.
 */
export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({
  journalPages,
  magazineTitle = 'JEEVANA JOURNAL',
  issueName = 'Digital Edition'
}) => {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSingleView, setIsSingleView] = useState(false);
  const [isTurning, setIsTurning] = useState(false);

  const step = isSingleView ? 1 : 2;
  const maxSpreadIndex = Math.max(0, journalPages.length - (isSingleView ? 1 : 2));

  const handleNext = () => {
    if (currentSpreadIndex < maxSpreadIndex) {
      setIsTurning(true);
      setCurrentSpreadIndex(Math.min(maxSpreadIndex, currentSpreadIndex + step));
      setTimeout(() => setIsTurning(false), 300);
    }
  };

  const handlePrev = () => {
    if (currentSpreadIndex > 0) {
      setIsTurning(true);
      setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - step));
      setTimeout(() => setIsTurning(false), 300);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSpreadIndex, journalPages.length]);

  const leftPageIdx = currentSpreadIndex;
  const rightPageIdx = currentSpreadIndex + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* HEADER */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1a3a52' }}>
              {magazineTitle}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{issueName}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setIsSingleView(!isSingleView)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                border: '1px solid #d4af37',
                backgroundColor: isSingleView ? '#d4af37' : 'transparent',
                color: isSingleView ? '#fff' : '#1a3a52',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isSingleView ? 'Double View' : 'Single View'}
            </button>
          </div>
        </div>
      </div>

      {/* STAGE */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isSingleView ? '1fr' : '1fr 1fr',
            gap: '16px',
            maxWidth: '1200px',
            width: '100%',
            height: '100%',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: isTurning ? 'transform 0.3s ease' : 'none'
          }}
        >
          {/* LEFT PAGE */}
          {leftPageIdx < journalPages.length && (
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '2px',
                boxShadow: '0 10px 30px rgba(26, 58, 82, 0.12)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => handlePrev()}
            >
              {journalPages[leftPageIdx]}
            </div>
          )}

          {/* RIGHT PAGE */}
          {!isSingleView && rightPageIdx < journalPages.length && (
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '2px',
                boxShadow: '0 10px 30px rgba(26, 58, 82, 0.12)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => handleNext()}
            >
              {journalPages[rightPageIdx]}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={handlePrev}
          disabled={currentSpreadIndex === 0}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            border: '1px solid #d4af37',
            backgroundColor: 'transparent',
            color: '#1a3a52',
            borderRadius: '4px',
            cursor: currentSpreadIndex === 0 ? 'default' : 'pointer',
            opacity: currentSpreadIndex === 0 ? 0.4 : 1
          }}
        >
          <ChevronLeft style={{ width: '16px', height: '16px', marginRight: '4px', display: 'inline' }} /> Prev
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>
            Page {currentSpreadIndex + 1} of {journalPages.length}
          </span>
          <div style={{ marginTop: '6px', height: '3px', backgroundColor: '#e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: '#d4af37',
                width: `${((currentSpreadIndex + 1) / journalPages.length) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid #e0e0e0', paddingLeft: '16px' }}>
          <button
            onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
            style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}
          >
            <ZoomOut style={{ width: '18px', height: '18px' }} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: '500', minWidth: '36px', textAlign: 'center' }}>{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(140, zoomLevel + 10))}
            style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}
          >
            <ZoomIn style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentSpreadIndex >= maxSpreadIndex}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            border: '1px solid #d4af37',
            backgroundColor: 'transparent',
            color: '#1a3a52',
            borderRadius: '4px',
            cursor: currentSpreadIndex >= maxSpreadIndex ? 'default' : 'pointer',
            opacity: currentSpreadIndex >= maxSpreadIndex ? 0.4 : 1
          }}
        >
          Next <ChevronRight style={{ width: '16px', height: '16px', marginLeft: '4px', display: 'inline' }} />
        </button>
      </div>
    </div>
  );
};

export default FlipbookViewer;
