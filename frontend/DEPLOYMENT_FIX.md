# CampusCart production fix

This package fixes both production problems:

1. The Sell page uses a real file picker instead of an Image URL field.
2. Refreshing a route no longer depends only on Vercel history rewrites. The app uses `HashRouter` as a fail-safe and also retains the Vercel SPA rewrite.

## Verify the source before deployment

```powershell
npm run verify:fix
```

It must print `CampusCart fix verification PASSED`.

## Deploy the source Vercel actually watches

Replacing files on your PC or downloading this ZIP does not update the live site. Extract this ZIP over the frontend repository connected to Vercel, then run:

```powershell
git add .
git commit -m "Fix image upload and Vercel refresh routing"
git push origin HEAD
```

In Vercel, open the project and confirm the new deployment uses that commit. If Vercel is watching a different branch, set **Settings > Git > Production Branch** to the branch you pushed, then redeploy.

## Confirm the correct build is live

Open browser DevTools > Console. The correct deployment prints:

```text
CampusCart frontend build: image-upload-vercel-fix-v2
```

The Sell route will normally appear as `/#/sell`. That hash is intentional: it prevents Vercel from requesting `/sell` as a physical server file during refresh.
