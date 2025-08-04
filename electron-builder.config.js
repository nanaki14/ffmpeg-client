module.exports = {
  "appId": "com.imageoptimizer.ffmpeg-client",
  "productName": "ImageOptimizer",
  "directories": {
    "buildResources": "electron"
  },
  "files": [
    "electron/**/*",
    "package.json",
    "resources/**/*"
  ],
  "mac": {
    "target": [
      {
        "target": "dmg",
        "arch": [
          "arm64"
        ]
      }
    ]
  },
  "publish": null
}
