import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { supabase, supabaseConfigured } from "../../lib/supabase";
import type { Article, Journal, Photo } from "../../types";

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

export interface ArticleBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'quote';
  content: string;
  caption?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  blocks: ArticleBlock[];
}

export interface PaginatedSheet {
  id: string;
  articleId: string;
  articleTitle: string;
  pageNumber: number;
  totalPagesForArticle: number;
  blocks: ArticleBlock[];
  isCover?: boolean;
}

interface FlipbookViewerProps {
  magazineTitle?: string;
  issueName?: string;
}

// Utility to break long text blocks into paginatable paragraph chunks
function chunkTextContent(text: string, articleId: string): any[] {
  if (!text) return [];
  
  const rawParagraphs = text.split(/\n\s*\n/).filter(Boolean);
  const chunkedBlocks: any[] = [];

  rawParagraphs.forEach((para, pIdx) => {
    if (para.length > 300) {
      const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
      let currentBuffer = "";

      sentences.forEach((sentence, sIdx) => {
        if ((currentBuffer + sentence).length > 280) {
          if (currentBuffer.trim()) {
            chunkedBlocks.push({
              id: `txt-${articleId}-${pIdx}-${sIdx}`,
              type: 'paragraph',
              content: currentBuffer.trim()
            });
          }
          currentBuffer = sentence;
        } else {
          currentBuffer += sentence;
        }
      });

      if (currentBuffer.trim()) {
        chunkedBlocks.push({
          id: `txt-${articleId}-${pIdx}-end`,
          type: 'paragraph',
          content: currentBuffer.trim()
        });
      }
    } else {
      chunkedBlocks.push({
        id: `txt-${articleId}-${pIdx}`,
        type: 'paragraph',
        content: para.trim()
      });
    }
  });

  return chunkedBlocks;
}

// ==========================================
// MAIN FLIPBOOK VIEWER COMPONENT
// ==========================================

export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({
  magazineTitle = 'JEEVANA JOURNAL',
  issueName = 'FLIPBOOK VIEWER'
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pages, setPages] = useState<PaginatedSheet[]>([]);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState<number>(0);
  const [isTurning, setIsTurning] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isSingleView, setIsSingleView] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalArticle, setActiveModalArticle] = useState<Article | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to database...');
  const measurerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // SUPABASE DATA FETCHING (SINGLE SOURCE OF TRUTH)
  // ==========================================
  useEffect(() => {
    async function loadArticlesFromSupabase() {
      if (!supabaseConfigured) {
        setFetchError("Supabase is not configured. Please check your environment variables.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setStatusMessage('Fetching entries from Supabase...');

        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        console.log('✅ Fetched data from Supabase:', data);

        if (data && data.length > 0) {
          const formattedArticles: Article[] = data.map((item) => {
            console.log('📄 Processing item:', item);

            // Map to actual column names
            const articleTitle = item.heading || 'Untitled Activity';
            const subtitle = item.section_name || item.section_type || '';
            const mainContent = item.description || '';
            const photoUrls = item.photo_urls || [];

            let blocks: any[] = [];

            // 1. Title block (always first)
            blocks.push({
              id: `title-${item.id}`,
              type: 'heading',
              content: articleTitle
            });

            // 2. Main content - use description field
            if (mainContent) {
              const textChunks = chunkTextContent(mainContent, item.id);
              blocks.push(...textChunks);
            }

            // 3. Photos - photo_urls is an array or JSON string
            let photos = photoUrls;
            if (typeof photos === 'string') {
              try { 
                photos = JSON.parse(photos); 
              } catch (e) { 
                photos = [photos]; 
              }
            }

            if (Array.isArray(photos) && photos.length > 0) {
              photos.forEach((photo: any, index: number) => {
                const imageUrl = typeof photo === 'string' ? photo : photo?.url || photo?.src || photo?.path;
                if (imageUrl) {
                  blocks.push({
                    id: `img-${item.id}-${index}`,
                    type: 'image',
                    content: imageUrl,
                    caption: typeof photo === 'object' ? photo.caption : ''
                  });
                }
              });
            }

            return {
              id: item.id,
              title: articleTitle,
              subtitle: subtitle,
              created_at: item.created_at,
              blocks: blocks
            };
          });

          setArticles(formattedArticles);
          setFetchError(null);
          setStatusMessage(`✅ Loaded ${formattedArticles.length} articles from database.`);
        } else {
          setArticles([]);
          setStatusMessage('No journal entries found in database.');
        }
      } catch (err: any) {
        console.error('❌ Supabase fetch error:', err);
        setFetchError(err.message || 'Failed to load journal entries.');
        setStatusMessage('Error loading journal entries.');
      } finally {
        setIsLoading(false);
      }
    }

    loadArticlesFromSupabase();
  }, []);

  // ==========================================
  // CLIENT-SIDE DYNAMIC PAGINATION ENGINE
  // ==========================================
  const paginateArticles = useCallback(() => {
    if (!measurerRef.current || articles.length === 0) return;

    // CONSERVATIVE: Smaller height to ensure content fits within page bounds with margin
    const maxPageHeight = 420; 
    const generatedPages: PaginatedSheet[] = [];
    let globalPageNum = 1;

    generatedPages.push({
      id: 'page-cover',
      articleId: 'cover',
      articleTitle: magazineTitle,
      pageNumber: globalPageNum++,
      totalPagesForArticle: 1,
      isCover: true,
      blocks: [
        { id: 'c1', type: 'heading', content: magazineTitle },
        { id: 'c2', type: 'paragraph', content: issueName }
      ]
    });

    articles.forEach((article) => {
      let currentBlocks: any[] = [];
      let tempPages: any[][] = [];

      const measureEl = measurerRef.current;
      if (!measureEl) return;

      const blocks = Array.isArray(article.blocks) ? article.blocks : [];
      
      blocks.forEach((block: any) => {
        const testBlocks = [...currentBlocks, block];
        measureEl.innerHTML = renderBlocksToHTML(testBlocks);

        if (measureEl.scrollHeight > maxPageHeight && currentBlocks.length > 0) {
          tempPages.push(currentBlocks);
          currentBlocks = [block];
        } else {
          currentBlocks.push(block);
        }
      });

      if (currentBlocks.length > 0) {
        tempPages.push(currentBlocks);
      }

      tempPages.forEach((sheetBlocks, index) => {
        generatedPages.push({
          id: `${article.id}-p${index + 1}`,
          articleId: article.id,
          articleTitle: article.title,
          subtitle: article.subtitle,
          pageNumber: globalPageNum++,
          totalPagesForArticle: tempPages.length,
          blocks: sheetBlocks
        });
      });
    });

    setPages(generatedPages);
    setStatusMessage(`✅ Rendered ${generatedPages.length} pages cleanly.`);
  }, [articles, magazineTitle, issueName]);

  // Trigger pagination when articles change
  useEffect(() => {
    if (articles.length > 0) {
      paginateArticles();
    }
  }, [articles, paginateArticles]);

  // ==========================================
  // NAVIGATION HANDLERS
  // ==========================================
  const step = isSingleView ? 1 : 2;
  const maxSpreadIndex = Math.max(0, pages.length - (isSingleView ? 1 : 2));

  const triggerTurnAnimation = (nextIndex: number) => {
    setIsTurning(true);
    setCurrentSpreadIndex(nextIndex);
    setTimeout(() => setIsTurning(false), 510);
  };

  const handleNext = () => {
    if (currentSpreadIndex < maxSpreadIndex) {
      triggerTurnAnimation(Math.min(maxSpreadIndex, currentSpreadIndex + step));
    }
  };

  const handlePrev = () => {
    if (currentSpreadIndex > 0) {
      triggerTurnAnimation(Math.max(0, currentSpreadIndex - step));
    }
  };

  const leftPage = pages[currentSpreadIndex];
  const rightPage = !isSingleView ? pages[currentSpreadIndex + 1] : null;

  return (
    <div className="reader-app">
      {/* Hidden container for measuring text DOM height */}
      <div
        ref={measurerRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: '320px',
          maxHeight: '420px',
          padding: '32px 30px',
          boxSizing: 'border-box',
          fontFamily: 'var(--app-font-serif, Georgia, serif)',
          fontSize: '13px',
          lineHeight: '1.6',
          overflow: 'hidden'
        }}
      />

      {/* TOPBAR */}
      <header className="reader-topbar reader-fade">
        <div className="brand-lockup">
          <div className="brand-mark">J</div>
          <div>
            <div className="brand-name">{magazineTitle}</div>
            <div className="brand-sub">{issueName}</div>
          </div>
        </div>

        <div className="stage-actions">
          <button
            className={`toolbar-button ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            Search
          </button>
          <button
            className="toolbar-button topbar-hide-mobile"
            onClick={() => setIsSingleView(!isSingleView)}
          >
            {isSingleView ? 'Double View' : 'Single View'}
          </button>
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="search-panel">
          <div className="search-input-wrap">
            <input
              type="text"
              placeholder="Search in issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="search-results">
            {searchQuery ? (
              <p className="status-line">Filtering articles for "{searchQuery}"...</p>
            ) : (
              <p className="status-line">Type keywords to search.</p>
            )}
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT STAGE */}
      <main className="reader-main">
        <div className="reader-stage reader-fade-delay">
          <div className="stage-bar">
            <span className="stage-label">
              {isLoading
                ? 'Loading Database...'
                : isSingleView
                ? `Page ${currentSpreadIndex + 1} of ${pages.length}`
                : `Pages ${currentSpreadIndex + 1}-${Math.min(currentSpreadIndex + 2, pages.length)} of ${pages.length}`}
            </span>
            <span className="eyebrow">{leftPage?.articleTitle || 'Jeevana Journal'}</span>
          </div>

          <div className="spread-wrap">
            {isLoading ? (
              <div className="page-placeholder" style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
            ) : fetchError ? (
              <div style={{ color: '#f5eedf', textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#e57373', fontWeight: 600 }}>Failed to Load Content</p>
                <p className="mono" style={{ fontSize: '12px', marginTop: '8px' }}>{fetchError}</p>
              </div>
            ) : (
              <div
                className={`spread ${isSingleView ? 'single' : ''} ${isTurning ? 'turning' : ''}`}
                style={{ transform: `scale(${zoomLevel / 100})`, transition: 'transform 200ms ease' }}
              >
                <button
                  className="page-hit prev"
                  onClick={handlePrev}
                  disabled={currentSpreadIndex === 0}
                  aria-label="Previous Page"
                />
                <button
                  className="page-hit next"
                  onClick={handleNext}
                  disabled={currentSpreadIndex >= maxSpreadIndex}
                  aria-label="Next Page"
                />

                {/* LEFT PAGE SHEET */}
                {leftPage && (
                  <div className="page-sheet">
                    <div className="page-inner">
                      <RenderPageContent
                        page={leftPage}
                        onOpenModal={() => {
                          const art = articles.find((a) => a.id === leftPage.articleId);
                          if (art) setActiveModalArticle(art);
                        }}
                      />
                    </div>
                    <span className="page-number left">{leftPage.pageNumber}</span>
                  </div>
                )}

                {/* RIGHT PAGE SHEET */}
                {!isSingleView && rightPage && (
                  <div className="page-sheet">
                    <div className="page-inner">
                      <RenderPageContent
                        page={rightPage}
                        onOpenModal={() => {
                          const art = articles.find((a) => a.id === rightPage.articleId);
                          if (art) setActiveModalArticle(art);
                        }}
                      />
                    </div>
                    <span className="page-number right">{rightPage.pageNumber}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STAGE FOOTER */}
          <div className="stage-footer">
            <div className="page-progress">
              <span>{Math.round(((currentSpreadIndex + 1) / Math.max(1, pages.length)) * 100)}%</span>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentSpreadIndex + 1) / Math.max(1, pages.length)) * 100}%` }}
                />
              </div>
            </div>

            <span className="stage-hint">Use arrow keys to flip</span>

            <div className="nav-controls">
              <button className="nav-button" onClick={handlePrev} disabled={currentSpreadIndex === 0}>
                Prev
              </button>
              <button className="nav-button" onClick={handleNext} disabled={currentSpreadIndex >= maxSpreadIndex}>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM TOOLBAR */}
        <div className="tool-strip reader-fade-delay-2">
          <div className="tool-group">
            <button className="toolbar-button" onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}>
              Zoom Out
            </button>
            <div className="zoom-control">
              <span>{zoomLevel}%</span>
              <input
                type="range"
                min="70"
                max="140"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
              />
            </div>
            <button className="toolbar-button" onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}>
              Zoom In
            </button>
          </div>
          <div className="tool-divider" />
          <span className={`status-line ${fetchError ? 'error' : 'success'}`}>{statusMessage}</span>
        </div>
      </main>

      {/* READ MORE MODAL */}
      {activeModalArticle && (
        <div className="article-modal-backdrop" onClick={() => setActiveModalArticle(null)}>
          <div className="article-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="article-modal-close" onClick={() => setActiveModalArticle(null)}>
              ✕
            </button>
            <h1 style={{ fontFamily: 'var(--app-font-serif)', fontSize: '26px', marginBottom: '8px' }}>
              {activeModalArticle.title}
            </h1>
            {activeModalArticle.subtitle && (
              <p className="mono" style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>
                {activeModalArticle.subtitle}
              </p>
            )}
            <hr style={{ border: '0', borderTop: '1px solid #ddd', margin: '16px 0' }} />
            <div style={{ lineHeight: '1.6', fontSize: '13px' }}>
              {activeModalArticle.blocks.map((b) => (
                <p key={b.id} style={{ marginBottom: '12px' }}>
                  {b.content}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// RENDER HELPERS
// ==========================================

const RenderPageContent: React.FC<{ page: PaginatedSheet; onOpenModal: () => void }> = ({ page, onOpenModal }) => {
  if (page.isCover) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '40px' }}>
        <span
          style={{
            display: 'inline-block',
            background: '#fdeee9',
            color: '#d67856',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          Digital Edition
        </span>
        <h1
          style={{
            fontFamily: 'var(--app-font-serif, Georgia, serif)',
            fontSize: '34px',
            fontWeight: 800,
            margin: '20px 0 12px 0',
            lineHeight: '1.15',
            color: '#1a1a2e'
          }}
        >
          {page.articleTitle}
        </h1>
        <p className="mono" style={{ color: '#d67856', fontWeight: 600 }}>{page.blocks[1]?.content}</p>
      </div>
    );
  }

  const hasTitleBlock = page.blocks.some((b: any) => b.type === 'heading');

  return (
    <div
      className="jr-content"
      style={{
        fontFamily: 'var(--app-font-serif, Georgia, serif)',
        fontSize: '13px',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {!hasTitleBlock && (
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #e0d5ce', paddingBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {page.articleTitle} (Continued)
          </span>
        </div>
      )}

      <div className="jr-block">
        {page.blocks.map((block: any, idx: number) => {
          switch (block.type) {
            case 'heading':
              return (
                <div key={block.id || idx} style={{ marginBottom: '10px' }}>
                  {page.subtitle && (
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#fdeee9',
                        color: '#d67856',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        marginBottom: '4px'
                      }}
                    >
                      {page.subtitle}
                    </span>
                  )}
                  <h2
                    style={{
                      fontFamily: 'var(--app-font-serif, Georgia, serif)',
                      fontSize: '20px',
                      fontWeight: 800,
                      marginTop: '2px',
                      marginBottom: '8px',
                      lineHeight: '1.25',
                      color: '#1a1a2e',
                      borderBottom: '2px solid #f0e6df',
                      paddingBottom: '4px'
                    }}
                  >
                    {block.content}
                  </h2>
                </div>
              );
            case 'image':
              return (
                <div
                  key={block.id || idx}
                  style={{
                    margin: '10px 0',
                    padding: '6px',
                    background: '#fef6f3',
                    border: '1px solid #f3d0c2',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(214, 120, 86, 0.08)'
                  }}
                >
                  <img
                    src={block.content}
                    alt={block.caption || 'Article photo'}
                    style={{ borderRadius: '6px', maxWidth: '100%', display: 'block', width: '100%' }}
                  />
                  {block.caption && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: '#d67856',
                        fontWeight: 600,
                        marginTop: '4px',
                        textAlign: 'center'
                      }}
                    >
                      {block.caption}
                    </span>
                  )}
                </div>
              );
            case 'quote':
              return (
                <blockquote
                  key={block.id || idx}
                  style={{
                    fontStyle: 'italic',
                    background: '#fdf7f4',
                    borderLeft: '4px solid #d67856',
                    padding: '10px 12px',
                    margin: '10px 0',
                    color: '#332c28',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    borderRadius: '0 6px 6px 0'
                  }}
                >
                  "{block.content}"
                </blockquote>
              );
            default:
              return (
                <p
                  key={block.id || idx}
                  className="jr-prose"
                  style={{
                    fontFamily: 'var(--app-font-serif, Georgia, serif)',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    marginBottom: '8px',
                    color: '#2d2d2d'
                  }}
                >
                  {block.content}
                </p>
              );
          }
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
        <button
          className="read-more-btn"
          onClick={onOpenModal}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#d67856',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          Read Full Article
        </button>
      </div>
    </div>
  );
};

function renderBlocksToHTML(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';

  return blocks
    .map((b) => {
      if (!b) return '';
      switch (b.type) {
        case 'heading':
          return `<div style="background: #fdeee9; color: #d67856; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; display: inline-block;">ACTIVITY</div>
                  <h2 style="font-family: var(--app-font-serif, Georgia, serif); font-size: 18px; font-weight: 800; margin-top: 2px; margin-bottom: 6px; line-height: 1.2; color: #1a1a2e; border-bottom: 2px solid #f0e6df; padding-bottom: 4px;">${b.content || ''}</h2>`;
        case 'quote':
          return `<blockquote style="font-style: italic; background: #fdf7f4; border-left: 3px solid #d67856; padding: 6px 10px; margin: 6px 0; color: #332c28; font-size: 12px; line-height: 1.4;">"${b.content || ''}"</blockquote>`;
        case 'image':
          return `<div style="margin: 6px 0; padding: 4px; background: #fef6f3; border: 1px solid #f3d0c2; border-radius: 6px; height: 150px;"></div>`;
        default:
          return `<p class="jr-prose" style="font-family: var(--app-font-serif, Georgia, serif); font-size: 12.5px; line-height: 1.5; margin-bottom: 6px; color: #2d2d2d;">${b.content || ''}</p>`;
      }
    })
    .join('');
}

export default FlipbookViewer;