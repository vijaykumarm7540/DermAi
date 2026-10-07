# Start backend and frontend concurrently
# Backend
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", ".\backend\npm ci & .\backend\npm run dev" -NoNewWindow
# Frontend
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", ".\frontend\npm ci & .\frontend\npm run dev" -NoNewWindow
