public_html/ ├── index.html              ← React build output ├── static/                 ← React assets └── .htaccess               ← URL rewriting  secureid-api/               ← outside public_html! ├── server.js ├── package.json └── .envpublic_html/ ├── index.html              ← React build output ├── static/                 ← React assets └── .htaccess               ← URL rewriting  secureid-api/               ← outside public_html! ├── server.js ├── package.json └── .envpublic_html/ ├── index.html              ← React build output ├── static/                 ← React assets └── .htaccess               ← URL rewriting  secureid-api/               ← outside public_html! ├── server.js ├── package.json └── .envpublic_html/
├── index.html              ← React build output
├── static/                 ← React assets
└── .htaccess               ← URL rewriting

secureid-api/               ← outside public_html!
├── server.js
├── package.json
└── .envpackage.json# CRITICAL - never expose these
.env
.env.local
.env.production
.env.*

# Build outputs
/build
/dist
node_modules/# npx-vercel
A secure online platform that stores, manages, and shares verified personal contact information for use in transactions — with identity and security references attached.
