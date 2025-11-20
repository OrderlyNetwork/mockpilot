# Mock Server Landing Page

This folder contains the landing page for the VS Code Mock Server plugin. GitLab Pages can serve the contents of `docs/` directly.

Files:

- `index.html` — landing page
- `styles.css` — page styles
- `logo.svg` — simple logo used in header

Deploy notes:

- This project includes a sample `.gitlab-ci.yml` at the repository root that copies `docs/` into `public/` and publishes it via GitLab Pages.
- If your default branch is not `main`, update `.gitlab-ci.yml` accordingly.

Local preview:

You can preview the page locally by opening `docs/index.html` in a browser. For a simple HTTP server run:

```bash
cd docs
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```
