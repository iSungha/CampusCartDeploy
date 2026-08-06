$ErrorActionPreference = "Stop"

Write-Host "Verifying CampusCart source..." -ForegroundColor Cyan
node scripts/verify-fix.mjs

Write-Host "`nSource verification passed." -ForegroundColor Green
Write-Host "Current Git branch:" -ForegroundColor Cyan
git branch --show-current

Write-Host "`nRun these commands to deploy the exact source Vercel watches:" -ForegroundColor Yellow
Write-Host 'git add .'
Write-Host 'git commit -m "Fix image upload and Vercel refresh routing"'
Write-Host 'git push origin HEAD'
