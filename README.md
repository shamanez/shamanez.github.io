# Shamane’s Corner

A personal research website and HTML blog for Shamane Siriwardhana, deployed through GitHub Pages in his `shamanez` GitHub account.

Hosting policy: this is a personal website. Use the `shamanez` GitHub account and GitHub Pages. The author expressly forbids deployment on ChatGPT/OpenAI Sites, workspace domains, `pluralis.ai`, or other Pluralis company hosting.

- Website: https://shamanez.github.io/
- Source: https://github.com/shamanez/shamanez.github.io
- First post: https://shamanez.github.io/blog/general-brains-domain-adapted-worlds.html

The interface uses void black, phosphor green, purple, and a locally hosted JetBrains Mono font. A short, skippable boot sequence introduces the research terminal; the moving GPU mesh respects reduced motion and can be paused. Each post is a real HTML document with a readable blog layout, table of contents, reading progress, and linked references. There are no framework dependencies, tracking scripts, or CMS accounts.

## Edit the website

Authored files live in `site/`. Edit `site/index.html` for the introduction or selected research, `site/assets/` for presentation and interactions, and `site/blog/*.html` for posts. `scripts/build.mjs` creates the homepage’s blog index and computes reading times from the article text, then copies published content to `_site/`. Drafts are omitted from both the index and the deployed files.

Run `npm run dev` with Node 24 to build and preview at http://localhost:3000. Run `npm run build` for an offline build. No dependency installation is needed.

## Add a blog post

1. Copy `templates/post.html` to `site/blog/your-post-slug.html`.
2. Replace all `{{...}}` fields, including the title, three-digit log number, publication date, tags, and description. Write the post inside `<article class="prose">` and update its table of contents.
3. Preview with `npm run dev`, then commit and push to `main`. GitHub Actions builds the index and deploys the site automatically.

Keep the `blog-title`, `blog-date`, `blog-tags`, `log-id`, and `description` metadata. Use lowercase filenames ending in `.html` and unique log numbers. To keep a draft out of publication, add `<meta name="blog-status" content="draft">`. Move a log out of the homepage’s pipeline list when it is published.

## Hosting and research updates

GitHub Pages serves `_site/` at the root URL `https://shamanez.github.io/`. `.github/workflows/pages.yml` deploys on pushes to `main`, manual runs, and a daily scheduled run at 05:17 UTC. The workflow attempts to refresh the verified Google Scholar profile before building. Google Scholar can block requests; when that happens, the updater retains the last successful deployed feed or the checked-in snapshot, preserving its actual retrieval date. Readers see whether the data is fresh or a snapshot. This static deployment has no Worker or `/api/publications` endpoint.

For the first deployment, create the public repository `shamanez/shamanez.github.io`, push this source to `main`, and choose **GitHub Actions** under the repository’s **Settings → Pages → Build and deployment → Source**. The deploy workflow then publishes the website. The connected GitHub integration must have access to this repository for Codex to push and configure it.

Log 001 is refined from the author’s supplied v2 PDF, originally dated 5 October 2026. At the author’s request, a research agent reviewed its claims using primary sources. The article explains how learned world models can improve simulations and digital twins, distinguishes domain/task/site adaptation, and qualifies transfer, model-size, and latency claims while preserving the author’s architectural thesis. Its 22 references and editorial provenance are recorded in `content/log-001-editorial.json`.

Future logs cover MergeKit, communication bottlenecks in decentralized GPU meshes, and the transition from RAG to agentic workflows.
