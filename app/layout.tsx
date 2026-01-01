import "./globals.css";
import ClientLayout from "../components/ClientLayout";
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
        <link
          href="https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <Providers>
        
          {children}
        
        </Providers>
      </body>
    </html>
  );
}
