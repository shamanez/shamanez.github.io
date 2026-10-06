# Shamane’s Corner

The personal research website and HTML blog of Shamane Siriwardhana, deployed through GitHub Pages in his `shamanez` GitHub account.

Hosting policy: this is a personal website. Use the `shamanez` GitHub account and GitHub Pages. The author expressly forbids deployment on ChatGPT/OpenAI Sites, workspace domains, `pluralis.ai`, or other Pluralis company hosting.

- Website: https://shamanez.github.io/
- Source: https://github.com/shamanez/shamanez.github.io
- First post: https://shamanez.github.io/blog/general-brains-domain-adapted-worlds.html

## The design

The site carries one idea: **foundational intelligence, for every domain**. Shamane builds foundation models and adapts them to specific domains so that everyone can use them. The copy stays short, and animated figures show the work.

The visual language follows Prime Intellect: a black field, hairline panels, uppercase mono labels, white square buttons, numbered navigation tabs, numbered “Fig.” diagrams and a single lime signal colour (`#85ed75`). Type is self-hosted Geist and Geist Mono. Copy avoids em-dashes and mid-sentence semicolons.

- **Hero (Fig. 01).** A dot-matrix world map traces the journey from Sri Lanka to Singapore, Auckland, remote work with US teams, and Melbourne. Peer GPUs join and exchange packets, and visitors can click the map to add a node. The headline has a sweeping light wash. The terminal types `adapt.py` and cycles through domains before settling on `--domain=yours`.
- **Domains ticker.** A scrolling list of domains the work has adapted models to.
- **Built at.** The key organisations, each with a short role and one or two technical keywords, plus a link to the full timeline on LinkedIn.
- **Story (Fig. 02 to 07).** Six cards, each with an animated figure and one line: every person, every scene, every signal, every domain, every GPU, and a queued “every world” card that links to Log 001.
- **Research.** A timeline chart built from the publication list (Fig. 08), then curated clusters with recent work first and Shamane’s name highlighted in every author list. Research-impact numbers are deliberately left off.
- **Writing and open source.** Field notes and the Pluralis post, then the open-source tools (ROLL × OpenReward, MergeKit, RAG-end2end, VUSFA) with real usage snippets.
- **Footer.** Dot-matrix lettering that responds to the pointer, and links to Google Scholar, LinkedIn, X and GitHub.

Motion pauses offscreen and follows `prefers-reduced-motion`, and the **Motion** toggle (saved per visitor) freezes everything in its final state. The pages need no framework, tracking script or CMS. The map is `site/assets/world.png`, a 4 KB land mask rasterised from public-domain Natural Earth data. `site/assets/og.png` is the 1200×630 social preview.

## Edit the website

Authored files live in `site/`. Edit `site/index.html` for the story, research clusters, writing links and open-source cards. Edit `site/assets/` for presentation and interactions, and `site/blog/*.html` for posts. `scripts/build.mjs` does the rest:

- generates the field-note cards (with covers) and reading times from each post.
- lists any Scholar paper from the newest curated year that is not yet in a cluster, under “New on Google Scholar”.
- fingerprints `style.css` and `site.js` so a deploy never mixes old assets with new pages.
- copies the published content to `_site/`. Drafts are omitted from both the index and the deployed files.

To add a paper to a cluster, copy an existing `<li class="paper">` in `site/index.html`. Set `data-date="YYYY-MM"` and `data-venue` so it also appears on the timeline, and wrap Shamane’s name in `<strong class="me">`.

Run `npm run dev` with Node 24 to build and preview at http://localhost:3000. Run `npm run build` for an offline build. Run `npm run check:links` after a build to test every internal link, anchor and external URL. Add `-- --offline` for internal links only. Some publishers (ACM, Taylor & Francis), LinkedIn and Medium refuse automated requests, so the checker lists those separately to open in a browser. No dependency installation is needed.

## Add a blog post

1. Copy `templates/post.html` to `site/blog/your-post-slug.html`.
2. Replace all `{{...}}` fields, including the title, three-digit log number, publication date, tags, and description. Write the post inside `<article class="prose">` and update its table of contents.
3. Preview with `npm run dev`, then commit and push to `main`. GitHub Actions builds the index and deploys the site automatically.

Keep the `blog-title`, `blog-date`, `blog-tags`, `log-id`, and `description` metadata. Use lowercase filenames ending in `.html` and unique log numbers. To keep a draft out of publication, add `<meta name="blog-status" content="draft">`.

## Hosting and research updates

GitHub Pages serves `_site/` at the root URL `https://shamanez.github.io/`. `.github/workflows/pages.yml` deploys on pushes to `main`, manual runs, and a daily scheduled run at 05:17 UTC. Before building, the workflow tries to refresh the latest publications from the verified Google Scholar profile. Google Scholar can block requests. When that happens, the updater keeps the last successful deployed feed or the checked-in snapshot and preserves its actual retrieval date. This static deployment has no Worker or `/api/publications` endpoint.

For the first deployment, create the public repository `shamanez/shamanez.github.io`, push this source to `main`, and choose **GitHub Actions** under the repository’s **Settings → Pages → Build and deployment → Source**. The deploy workflow then publishes the website.

Log 001 is refined from the author’s supplied v2 PDF, originally dated 5 October 2026. At the author’s request, a research agent reviewed its claims using primary sources. The article explains how learned world models can improve simulations and digital twins, distinguishes domain/task/site adaptation, and qualifies transfer, model-size, and latency claims while preserving the author’s architectural thesis. Its 22 references and editorial provenance are recorded in `content/log-001-editorial.json`.
