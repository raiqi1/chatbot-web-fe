// server.js
/**
 * Simple HTTP Server untuk Chatbot SaaS
 *
 * Usage:
 * 1. npm init -y
 * 2. node server.js
 * 3. Visit http://localhost:3001
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3001;

// MIME types
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

// Create server
const server = http.createServer((req, res) => {
  // Enable CORS for cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Default to index.html
  if (pathname === "/") {
    pathname = "/index.html";
  }

  // Construct file path
  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - File Not Found</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                }
                .container {
                    background: white;
                    color: #333;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                h1 { color: #e74c3c; margin-bottom: 20px; }
                p { margin-bottom: 15px; }
                a { color: #667eea; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .files { text-align: left; margin: 20px 0; }
                .files li { margin: 5px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚨 File Not Found</h1>
                <p><strong>Requested:</strong> ${pathname}</p>
                
                <h3>📁 Expected Files:</h3>
                <ul class="files">
                    <li><a href="/">index.html</a> - SaaS Landing Page</li>
                    <li><a href="/chatbot-embed.js">chatbot-embed.js</a> - Embed Script</li>
                    <li><a href="/demo.html">demo.html</a> - Demo Page</li>
                </ul>
                
                <p>Make sure you have copied the files from the artifacts!</p>
                
                <h4>🔧 Quick Setup:</h4>
                <ol style="text-align: left;">
                    <li>Copy HTML from "Chatbot SaaS Server" artifact → <code>index.html</code></li>
                    <li>Copy JavaScript from "chatbot-embed.js" artifact → <code>chatbot-embed.js</code></li>
                    <li>Copy HTML from "Chatbot Widget" artifact → <code>demo.html</code></li>
                    <li>Restart server: <code>node server.js</code></li>
                </ol>
                
                <p><a href="/">← Back to Home</a></p>
            </div>
        </body>
        </html>
      `);
      return;
    }

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }

      // Set content type
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log("🚀 Chatbot SaaS Server Started!");
  console.log("");
  console.log("📋 Available URLs:");
  console.log(`   🏠 Landing Page: http://localhost:${PORT}`);
  console.log(`   📝 Embed Script: http://localhost:${PORT}/chatbot-embed.js`);
  console.log(`   🧪 Demo Page:    http://localhost:${PORT}/demo.html`);
  console.log("");
  console.log("🔧 Integration:");
  console.log(`   Add to your Next.js project:`);
  console.log(`   <Script src="http://localhost:${PORT}/chatbot-embed.js" />`);
  console.log("");
  console.log("📁 Required Files:");
  console.log('   ✅ index.html (from "Chatbot SaaS Server" artifact)');
  console.log('   ✅ chatbot-embed.js (from "chatbot-embed.js" artifact)');
  console.log('   ✅ demo.html (from "Chatbot Widget" artifact)');
  console.log("");
  console.log("🌍 Backend: https://chatbotku.mooo.com/ (Ready!)");
  console.log("");
  console.log("Press Ctrl+C to stop server");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});
