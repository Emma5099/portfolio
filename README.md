## Local development

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080

## Deploy on Netlify

This is a static site (no build step). Netlify publishes the repository root.

- **Build command:** leave empty (or clear the `python3 -m http.server 8080` command in the Netlify UI)
- **Publish directory:** `.`

Settings are also defined in `netlify.toml`.
