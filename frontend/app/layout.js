import "./globals.css";

export const metadata = {
  title: "Production AI Chat",
  description: "Real production AI system"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}