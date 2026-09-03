import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Meta, Scripts } from '@tanstack/start';
import { Suspense } from 'react';
import type { MetaDescriptor } from '@tanstack/react-router';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        title: 'Jeevana School — Annual Journal'
      },
      {
        name: 'description',
        content: 'Digital flipbook journal for Jeevana School, featuring student activities and achievements.'
      },
      {
        name: 'og:title',
        content: 'Jeevana School — Annual Journal'
      },
      {
        name: 'og:description',
        content: 'Digital flipbook journal for Jeevana School'
      },
      {
        name: 'og:type',
        content: 'website'
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      }
    ] as MetaDescriptor[]
  }),
  component: RootComponent
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Jeevana School — Annual Journal</title>
        <meta
          name="description"
          content="Digital flipbook journal for Jeevana School, featuring student activities and achievements."
        />
        <meta name="og:title" content="Jeevana School — Annual Journal" />
        <meta
          name="og:description"
          content="Digital flipbook journal for Jeevana School"
        />
        <meta name="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <Meta />
      </head>
      <body>
        <Suspense>{children}</Suspense>
        <Scripts />
      </body>
    </html>
  );
}
