# Shamane’s Corner

The personal research website and HTML blog of Shamane Siriwardhana, deployed through GitHub Pages in his `shamanez` GitHub account.

Hosting policy: this is a personal website. Use the `shamanez` GitHub account and GitHub Pages. The author expressly forbids deployment on ChatGPT/OpenAI Sites, workspace domains, `pluralis.ai`, or other Pluralis company hosting.

- Website: https://shamanez.github.io/
- Source: https://github.com/shamanez/shamanez.github.io
- First post: https://shamanez.github.io/blog/general-brains-domain-adapted-worlds.html

## The design

The site carries one idea: **intelligence, for everyone**. Across digital and physical worlds, intelligence anyone can adapt and own. The copy stays short, and animated figures show the work.

The visual language follows Prime Intellect: a black field, hairline panels, uppercase mono labels, white square buttons, numbered navigation tabs and a single lime signal colour (`#85ed75`). Essay figures use small numbered labels to make the progression easy to follow. Type is self-hosted Geist and Geist Mono. Copy avoids em-dashes, semicolons and mid-sentence colons.

- **Hero.** A dot-matrix world map traces the journey from Sri Lanka to Singapore, Auckland, remote work with teams in Florida and San Francisco, and Melbourne. Peer GPUs join and exchange packets, and visitors can click the map to add a node. The terminal types `adapt.py` and cycles through domains before settling on `--domain=yours`.
- **Domains ticker.** A scrolling list of domains the work has adapted models to.
- **Built at.** The key organisations, each with a short role and one or two technical keywords, with the full timeline on LinkedIn.
- **Story.** Ten cards. Each leads with its topic, then an animated figure, then one line: human-computer interaction at the Augmented Human Lab (people first, heterogeneous signals), computer vision in the CNN era (FingerReader), reinforcement learning (universal successor features, between model-free and model-based RL), self-supervised learning, end-to-end RAG (both DPR towers trained with the generator), domain-expert LLMs, decentralized pre-training, decentralized post-training, the efficient inference stack, and a queued “what comes next” card where an LLM asks a site-specific world model to simulate a plan before anything moves. It links to Log 001. The story plays forward by default, and a “Rewind from now” button turns the cards over and replays it from the newest work back to the start.
- **Research.** A timeline chart built from the publication list, then curated clusters with recent work first and Shamane’s name highlighted in every author list. Research-impact numbers are deliberately left off.
- **Writing.** A compact list of personal logs follows the hero and domain strip, before the career and research sections. Large cover images are omitted, and mobile previews show the title and reading metadata.
- **Open source.** The Base to Reasoning walkthrough leads this section, followed by ROLL × OpenReward, MergeKit, RAG-end2end and VUSFA.
- **Footer.** Dot-matrix lettering that responds to the pointer, and links to Google Scholar, LinkedIn, X and GitHub.

Motion pauses offscreen and follows `prefers-reduced-motion`, and the **Motion** toggle (saved per visitor) freezes everything in its final state. The pages need no framework, tracking script or CMS. The map is `site/assets/world.png`, a 4 KB land mask rasterised from public-domain Natural Earth data. `site/assets/og.png` is the 1200×630 social preview.

## Edit the website

Authored files live in `site/`. Edit `site/index.html` for the story, research clusters, writing links and open-source cards. Edit `site/assets/` for presentation and interactions, and `site/blog/*.html` for posts. `scripts/build.mjs` does the rest:

- generates compact field-note previews, reading times and the latest-post announcement from each post.
- lists any Scholar paper from the newest curated year that is not yet in a cluster, under “New on Google Scholar”.
- fingerprints authored CSS and JavaScript assets so a deploy never mixes old assets with new pages.
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

Log 001 is refined from the author’s supplied v2 PDF, originally dated 5 October 2026. Revised on 9 October 2026 by a separate research and editorial agent team at the author’s request, it explores how LLMs, generative worlds and latent predictors could coexist, and where domain adaptation fits. The first section, Frontier foundation models, traces the SSL-to-omni progression before showing how long-horizon agents build on that base intelligence, with further scaling through RL/OPD. World models follow in a separate section. Five responsive figures explain foundation models at scale, the feedback loop, world-model approaches, a possible system composition and three complementary domain-adaptation papers. The final figure gives a selection rationale for each paper, traces prediction with pausable animation and clarifies JEPA-Anything’s orthogonal predictive factorization in the accompanying text. The composition explicitly connects an LLM and shared planning to generative/spatial and latent predictive world-model branches, showing requests, outputs, policy development, action and observed feedback. Important sources and claim checks are recorded in `content/log-001-editorial.json`. The original article URL remains stable.
