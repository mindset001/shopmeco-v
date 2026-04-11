import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ShopMeco — Auto Marketplace',
  description:
    'Connect with car repairers and spare parts sellers near you. ShopMeco brings the auto repair ecosystem together.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
