# Beginner-Friendly Deployment (GitHub Actions + Vercel)

These steps set up a simple CI pipeline that runs tests and ships the web app to Vercel whenever you push to `main`. You only need a Vercel account and this GitHub repo.

## 1) Prep Vercel
1. Install the Vercel CLI locally: `npm i -g vercel`.
2. In the project folder, run `vercel login` and follow the prompt.
3. Create/link a Vercel project: `vercel`. Accept the defaults or pick a scope. Note the **Project ID** and **Org ID** printed at the end.
4. Generate a deploy token: `vercel tokens add crosswise-actions`. Copy the token.

## 2) Add GitHub Secrets
Create a GitHub Environment (e.g., **Dev**) under Settings → Environments, then in GitHub → Settings → Secrets and variables → Actions, add these secrets **scoped to that environment**:
- `VERCEL_TOKEN` = the token from step 1.4
- `VERCEL_PROJECT_ID` = the Project ID from step 1.3
- `VERCEL_ORG_ID` = the Org/Team ID from step 1.3

If you need environment variables (e.g., `DATABASE_URL`), add them as secrets too.

## 3) Commit the Workflow
Create `.github/workflows/deploy.yml` with the following:

```yaml
name: CI + Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install deps
        run: npm ci

      - name: Lint + test
        run: npm run lint && npm test

      - name: Build
        run: npm run build

  deploy:
    needs: build-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: Dev
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install deps
        run: npm ci

      - name: Deploy to Vercel (Production)
        uses: vercel/actions/cli@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: .
          prod: true
```

Notes:
- The `build-test` job runs on both pushes and PRs; deploy only runs on `main` pushes.
- `environment: Dev` makes this job use environment-scoped secrets and lets you add reviewers/approvals if you want.
- Update `npm run lint` / `npm test` if your scripts differ; drop them if you want a faster first setup (add back later).
- Vercel auto-detects Next.js and uses the production build output.

### Multiple environments?
- You can keep **one workflow** and add another deploy job (e.g., `deploy-dev` and `deploy-prod`) that target different branches and GitHub environments:
  - `if: github.ref == 'refs/heads/develop'` with `environment: Dev`
  - `if: github.ref == 'refs/heads/main'` with `environment: Production`
- Or create separate workflow files if you prefer; the key is setting `environment: <name>` on each deploy job so GitHub uses the right scoped secrets.

## 4) First Deploy
1. Commit and push the workflow file to `main`.
2. Open GitHub → Actions to watch the run.
3. Vercel will create a production deployment at your project URL when the `deploy` job finishes.

## 5) Adding Mobile Later
If you add a React Native / Expo app, create a separate workflow (e.g., build APK/IPA with EAS) and keep this Vercel deploy for the web. They can share API env vars but deploy separately.
