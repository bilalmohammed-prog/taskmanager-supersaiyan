import "./globals.css";

import  Providers  from "./Providers";

export const metadata = {
  title: "Task Manager",
  description: "Task Manager App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">

<head>
      
        {/* GOOGLE FONT */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
      </head>

      <body>
        <Providers>
        
          {children}
        
        </Providers>
      </body>
    </html>
  );
}
