# Jeevana Journal

Build a fully functional web application called "Jeevana E-Journal".

IMPORTANT:

This is the FIRST working version. Prioritize functionality, clean architecture, reliable A4 pagination, and working interactions over visual polish.

Do NOT use Supabase.

Do NOT require authentication.

Do NOT require any paid external service.

Do NOT add unnecessary backend infrastructure.

The application must work immediately after generation.

==================================================

CORE PURPOSE

==================================================

Jeevana E-Journal is a web-based journal creation system for a school.

The user should be able to:

1. Create a journal

2. Add articles to the journal

3. Add photos to articles

4. Edit article content

5. Reorder articles

6. Preview the journal as A4 pages

7. View the finished journal as a flipbook

8. Print/export the journal to PDF

9. Save the journal locally in the browser

The journal should look like a professionally formatted school publication, not like a generic blog.

==================================================

TECHNOLOGY

==================================================

Use:

- React

- TypeScript

- Vite

- Tailwind CSS

- Local browser storage for persistence

- IndexedDB if necessary for storing uploaded images

- A reliable page-flip library for the flipbook preview

Do not introduce Supabase, Firebase, Appwrite or another external backend in this first version.

The architecture should be clean enough that a backend/database can be added later without rewriting the entire application.

==================================================

APPLICATION STRUCTURE

==================================================

Create these main areas:

1. Dashboard

2. Journal Editor

3. Article Editor

4. A4 Preview

5. Flipbook Preview

Use client-side routing.

==================================================

1. DASHBOARD

==================================================

Create a clean dashboard called:

"Jeevana E-Journal"

Show:

- Existing journals

- Journal title

- Month/year

- Number of articles

- Number of pages if available

- Last modified date

Provide:

"+ New Journal"

button.

Each journal card should have:

- Open

- Edit

- Delete

- Preview

Also provide an empty state when no journals exist.

==================================================

2. CREATE JOURNAL

==================================================

When creating a journal, allow:

- Journal title

- Month

- Year

- Cover image

- Optional subtitle

- Optional editor's note

Example:

Title:

Jeevana Journal

Month:

August

Year:

2026

The user should then enter the Journal Editor.

==================================================

3. JOURNAL EDITOR

==================================================

The journal editor should display:

Journal title at the top.

Below that:

ARTICLES

Show all articles in order.

Each article should display:

- Article number

- Article title

- Category/class

- Number of photos

- Approximate page count

- Edit button

- Delete button

- Drag handle for reordering

Provide:

"+ Add Article"

Articles must be reorderable using drag and drop.

The article order determines the order in the final journal.

==================================================

4. ARTICLE EDITOR

==================================================

Each article must have these fields:

- Topic / Title

- Category

- Class

- Date

- Content

- Photos

The content editor should support basic rich text:

- Bold

- Italic

- Headings

- Paragraphs

- Bullet lists

- Numbered lists

Do not create an overly complicated text editor.

Photos:

Allow multiple photos to be uploaded.

Display uploaded photos as thumbnails.

Allow:

- Reordering photos

- Removing photos

- Adding more photos

Photos must preserve their original aspect ratio.

Never stretch or distort images.

==================================================

5. ARTICLE LAYOUT

==================================================

IMPORTANT:

Do NOT create an automatic magazine layout.

Do NOT randomly alternate images or text positions.

Do NOT create decorative newspaper-style columns.

Use one consistent structure for every article.

The default article structure is:

HEADER

TOPIC / TITLE

OPTIONAL CATEGORY / CLASS / DATE

PHOTO GALLERY

ARTICLE CONTENT

FOOTER

The visual structure should be inspired by a professionally formatted Word document.

Use a clean bordered A4 page.

The body content should be a single column.

Text should be readable and properly spaced.

Body text should preferably be justified.

==================================================

PHOTO LAYOUT

==================================================

Photo layouts:

1 photo:

One wide image.

2 photos:

Two equal-width images.

3 photos:

Three equal-width images in one row.

4 photos:

Three photos across the top + one wider photo underneath.

5+ photos:

Use sensible repeated gallery rows while maintaining consistent spacing.

Photos must:

- Keep aspect ratio

- Never overlap text

- Never be cropped unexpectedly

- Never extend outside the page frame

==================================================

6. CRITICAL PAGINATION RULE

==================================================

THIS IS THE MOST IMPORTANT PART OF THE APPLICATION.

Never force an article to fit onto one page.

Never clip content.

Never truncate text.

Never hide overflowing content.

Never use fixed-height containers that cause text to disappear.

If content does not fit on the current A4 page, it must naturally continue onto the next page.

For example:

PAGE 1

ACTIVITY 1:

content...

ACTIVITY 2:

content...

ACTIVITY 3:

content begins...

PAGE 2

ACTIVITY 3:

continued content...

ACTIVITY 4:

content...

The system should automatically create additional A4 pages when necessary.

The page layout must remain stable and predictable.

The user must never lose content because it does not fit.

==================================================

7. AUTOMATIC LABEL FORMATTING

==================================================

If a paragraph begins with labels such as:

ACTIVITY 1:

ACTIVITY 2:

ACTIVITY 3:

LEARNING OUTCOME:

OBJECTIVE:

CONCLUSION:

INTRODUCTION:

automatically render the label in bold.

Do not alter the user's actual text.

==================================================

8. A4 PAGE

==================================================

The journal page should use:

A4 portrait dimensions.

The page should have:

- Consistent outer margin

- Thin border/frame

- Header

- Topic

- Photo area

- Content

- Footer

Do not design the page like a website.

It must look like a printable document.

The A4 preview should visually match the final printed/PDF result as closely as possible.

==================================================

9. LIVE PREVIEW

==================================================

The article editor should have a Preview option.

The journal editor should have:

"Preview Journal"

which opens the complete journal.

Show the actual generated A4 pages.

Do not merely show an approximate card layout.

The preview must represent the actual print layout.

==================================================

10. FLIPBOOK

==================================================

Create a Flipbook Preview.

The flipbook should display the generated A4 pages as pages of a digital journal.

Provide:

- Previous page

- Next page

- Page number

- Zoom

- Fullscreen if practical

- Thumbnail/page navigation if practical

The flipbook is a VIEWER.

The A4 page generator is the source of truth.

Do not create a separate layout specifically for the flipbook.

The flipbook must use the same generated pages as the A4 preview.

==================================================

11. PRINT / PDF

==================================================

Provide:

"Print / Export PDF"

The browser print dialog should print only the journal pages.

Do not print:

- Dashboard

- Editor controls

- Buttons

- Navigation

- Editing UI

The printed result should be A4 portrait.

Avoid unwanted page breaks.

Never cut text in the middle because of an artificial fixed-height article container.

Use proper print CSS.

==================================================

12. LOCAL STORAGE

==================================================

Save journals locally in the browser.

If possible, use IndexedDB for image storage rather than localStorage for large image files.

The user should be able to:

- Refresh the browser

- Close the browser

- Reopen the application

and still see their saved journals.

Autosave changes where practical.

Show a small "Saved" status.

==================================================

13. SAMPLE DATA

==================================================

Create one sample journal automatically on first launch so the application can be tested immediately.

Sample journal:

Jeevana Journal

August 2026

Create at least 3 sample articles.

One article should contain enough text to span more than one A4 page.

This is specifically to test pagination.

Use placeholder images or generated sample placeholders if real images are unavailable.

==================================================

14. UI

==================================================

Keep the dashboard modern and clean.

However, DO NOT spend excessive effort on visual decoration.

Use:

- Clean typography

- Simple cards

- Clear buttons

- Good spacing

- Responsive layout

The journal itself should be much more document-like than the dashboard.

Do not use excessive gradients.

Do not use flashy animations.

Do not make the journal look like a SaaS landing page.

==================================================

15. RESPONSIVENESS

==================================================

The dashboard and editors should work on:

- Desktop

- Laptop

- Tablet

The A4 preview should remain an actual A4 proportion regardless of screen size.

On smaller screens, allow the preview to scale down rather than changing its proportions.

==================================================

16. CODE QUALITY

==================================================

Keep the project modular.

Create reusable components such as:

- Dashboard

- JournalCard

- JournalEditor

- ArticleList

- ArticleEditor

- PhotoUploader

- PhotoGallery

- A4Page

- JournalRenderer

- FlipbookViewer

- PrintLayout

Keep journal data structures separate from presentation components.

The journal data model should be designed so that a backend database can be added later.

==================================================

17. DO NOT DO THESE THINGS

==================================================

Do NOT:

- Use Supabase

- Require API keys

- Require paid services

- Add authentication

- Clip overflowing content

- Force every article onto exactly one page

- Use alternating magazine layouts

- Automatically move text around for decorative purposes

- Use two-column body text

- Stretch images

- Create complicated unnecessary features

- Build a fake preview that differs from the print result

==================================================

FINAL ACCEPTANCE TEST

==================================================

Before considering the application complete, verify that:

1. I can create a journal.

2. I can add multiple articles.

3. I can reorder articles.

4. I can upload multiple photos.

5. I can reorder photos.

6. I can edit article content.

7. Content survives a browser refresh.

8. Long articles continue onto another A4 page.

9. No text is clipped.

10. Images do not overlap text.

11. The complete journal can be previewed.

12. The same pages appear in the flipbook.

13. The journal can be printed as A4.

14. The dashboard remains separate from the journal.

15. No Supabase or paid service is required.

Build the complete working application now.

Prioritize FUNCTIONALITY and RELIABLE PAGINATION over visual polish.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/02fe7d11-b901-48b8-8349-3d8f119ba4e6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
