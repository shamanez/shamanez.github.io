# Shamane’s Corner

The personal research website and HTML blog of Shamane Siriwardhana, deployed through GitHub Pages in his `shamanez` GitHub account.

Hosting policy: this is a personal website. Use the `shamanez` GitHub account and GitHub Pages. The author expressly forbids deployment on ChatGPT/OpenAI Sites, workspace domains, `pluralis.ai`, or other Pluralis company hosting.

- Website: https://shamanez.github.io/
- Source: https://github.com/shamanez/shamanez.github.io
- First post: https://shamanez.github.io/blog/general-brains-domain-adapted-worlds.html

## The design

The site tells one story: **Intelligence, for everyone**, told in four acts. *Every person* covers assistive AI in Sri Lanka and Singapore. *Every signal* covers multimodal, self-supervised learning during the Auckland PhD. *Every domain* covers domain-adapted LLMs and model merging. *Every GPU* covers decentralized pre- and post-training at Pluralis Research.

The visual language follows Prime Intellect: a black field, hairline panels, uppercase mono labels, white square buttons, numbered navigation tabs, numbered “Fig.” diagrams and a single lime signal colour (`#85ed75`). Type is self-hosted Geist and Geist Mono.

- **Hero (Fig. 01).** A dot-matrix world map traces the journey from Sri Lanka to Singapore, Auckland, remote work with US teams, and Melbourne. Peer GPUs join and exchange packets, and visitors can click the map to add their own node. The headline has a sweeping light wash, and a terminal line types itself out.
- **Story.** Four acts, each with an animated SVG figure, a narrative, numbered checkpoints from the CV timeline and links to the work that backs it.
- **Research.** Scholar metrics count up when they come into view. Fig. 06 is a timeline built from the publication list itself. Below it, curated clusters put recent work first, with Shamane’s name highlighted in every author list.
- **Writing and open source.** Generated covers for field notes, links to lab and Medium posts, and the open-source tools with real usage snippets.
- **Footer.** Dot-matrix lettering that responds to the pointer.

Motion pauses offscreen and follows `prefers-reduced-motion`, and the **Motion** toggle (saved per visitor) freezes everything in its final state. The pages need no framework, tracking script or CMS. The map is `site/assets/world.png`, a 4 KB land mask rasterised from public-domain Natural Earth data.

## Edit the website

Authored files live in `site/`. Edit `site/index.html` for the story, research clusters, writing links and open-source cards. Edit `site/assets/` for presentation and interactions, and `site/blog/*.html` for posts. `scripts/build.mjs` does the rest:

- generates the homepage’s field-note cards (with covers) and reading times from each post;
- fills the Scholar metrics block from `site/data/scholar.json`;
- lists any Scholar paper from the newest curated year that is not yet in a cluster, under “New on Google Scholar”;
- fingerprints `style.css` and `site.js` so a deploy never mixes old assets with new pages;
- copies the published content to `_site/`. Drafts are omitted from both the index and the deployed files.

To add a paper to a cluster, copy an existing `<li class="paper">` in `site/index.html`. Set `data-date="YYYY-MM"`, `data-cites` and `data-venue` so it also appears on the Fig. 06 timeline, and wrap Shamane’s name in `<strong class="me">`.

Run `npm run dev` with Node 24 to build and preview at http://localhost:3000. Run `npm run build` for an offline build. Run `npm run check:links` after a build to test every internal link, anchor and external URL; add `-- --offline` for internal links only. Some publishers (ACM, Taylor & Francis), LinkedIn and Medium refuse automated requests, so the checker lists those separately to open in a browser. No dependency installation is needed.

## Add a blog post

1. Copy `templates/post.html` to `site/blog/your-post-slug.html`.
2. Replace all `{{...}}` fields, including the title, three-digit log number, publication date, tags, and description. Write the post inside `<article class="prose">` and update its table of contents.
3. Preview with `npm run dev`, then commit and push to `main`. GitHub Actions builds the index and deploys the site automatically.

Keep the `blog-title`, `blog-date`, `blog-tags`, `log-id`, and `description` metadata. Use lowercase filenames ending in `.html` and unique log numbers. To keep a draft out of publication, add `<meta name="blog-status" content="draft">`. Move a log out of the homepage’s “In the pipeline” list when it is published.

## Hosting and research updates

GitHub Pages serves `_site/` at the root URL `https://shamanez.github.io/`. `.github/workflows/pages.yml` deploys on pushes to `main`, manual runs, and a daily scheduled run at 05:17 UTC. Before building, the workflow tries to refresh the verified Google Scholar profile: its latest publications plus citation count, h-index and i10-index. Google Scholar can block requests; when that happens, the updater keeps the last successful deployed feed or the checked-in snapshot and preserves its actual retrieval date. The research section shows that date. This static deployment has no Worker or `/api/publications` endpoint.

For the first deployment, create the public repository `shamanez/shamanez.github.io`, push this source to `main`, and choose **GitHub Actions** under the repository’s **Settings → Pages → Build and deployment → Source**. The deploy workflow then publishes the website.

Log 001 is refined from the author’s supplied v2 PDF, originally dated 5 October 2026. At the author’s request, a research agent reviewed its claims using primary sources. The article explains how learned world models can improve simulations and digital twins, distinguishes domain/task/site adaptation, and qualifies transfer, model-size, and latency claims while preserving the author’s architectural thesis. Its 22 references and editorial provenance are recorded in `content/log-001-editorial.json`.

Future logs cover MergeKit, communication bottlenecks in decentralized GPU meshes, and the transition from RAG to agentic workflows.
