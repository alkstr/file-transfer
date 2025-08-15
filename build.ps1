if (Test-Path build) {
    Remove-Item -Path build -Recurse -Force 
}

npx esbuild index.js --bundle --platform=node --target=node24 --outfile=build/index.cjs
npx pkg build/index.cjs --targets node22-win-x64 --output build/file-transfer.exe
Copy-Item .\public -Destination .\build -Recurse
Remove-Item .\build\index.cjs