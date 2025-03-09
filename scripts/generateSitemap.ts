import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";
import { Readable } from "stream";

// Define your site links
const links = [
  { url: "/", changefreq: "daily", priority: 1.0 },
  { url: "/about", changefreq: "monthly", priority: 0.8 },
  { url: "/contact", changefreq: "monthly", priority: 0.8 },
];

// Create a writable stream for sitemap.xml
const sitemap = new SitemapStream({ hostname: "https://moodvids.netlify.app/" });
const writeStream = createWriteStream("public/sitemap.xml");

// Convert links into a readable stream and pipe them into the sitemap
Readable.from(links).pipe(sitemap).pipe(writeStream);

// Log success message
writeStream.on("finish", () => {
  console.log("✅ Sitemap successfully generated at public/sitemap.xml");
});