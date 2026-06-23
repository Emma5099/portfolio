## Local development

```bash
npx serve . --listen 8080
```

Then open http://localhost:8080

Or with the Netlify CLI:

```bash
netlify dev
```

## Deploy on Netlify

This is a static site (no build step). Netlify publishes the repository root.

- **Build command:** leave empty
- **Publish directory:** `.`

Settings are defined in `netlify.toml`.
