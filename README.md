# Component.lol 🚀

A modern, performant Chrome extension that helps developers extract and analyze design tokens from any website. Component.lol scans web pages to identify and catalog colors, typography, buttons, and other UI assets, making it easier to understand and replicate design systems.

## ✨ Features

- 🎨 Extract complete color palettes and design tokens
- 📝 Analyze typography styles and font usage
- 🔲 Catalog button styles and variants
- 🖼️ Collect and organize UI assets (images, icons, SVGs)
- 🛠️ Built with Manifest V3 for modern Chrome extensions
- ⚡ Fast and efficient page scanning
- 🎯 Precise component detection
- 🔒 Secure by design with proper permissions
- ♿ Fully accessible UI
- 🌐 Cross-browser compatibility (Chrome, Edge, Brave)

## 🚀 Quick Start

### For Users
1. CUrrently not available on the storre as I am not able to publish. I'll update when this becomes not the case.
<!-- 1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/componentlol/coming-soon) (coming soon)
2. Click "Add to Chrome"
3. Navigate to any website and click the Component.lol icon to analyze its design system -->

### For Developers

```bash
# Clone the repository
git clone https://github.com/uxderrick/component.lol.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

To load the extension in Chrome:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `component.lol` folder
4. The extension is now ready for development!

## 📁 Project Structure

```
component.lol/
├── pages/            # Extension feature pages
│   ├── colors/       # Color analysis page
│   ├── typography/   # Typography analysis page
│   ├── buttons/      # Button analysis page
│   └── assets/       # Asset management page
├── content.js        # Content script for webpage analysis
├── background.js     # Service worker for extension
├── manifest.json     # Extension manifest
├── scripts.js        # Main extension logic
├── shared.css        # Common styles
├── index.html        # Extension popup
├── index.css         # Popup styles
├── style.css         # Additional styles
└── images/          # Extension icons and assets
```

## 🧩 Extension Features

### Color Analysis
- Extracts all colors used on a webpage
- Groups colors by usage (text, background, borders)
- Exports color palettes in various formats

### Typography Scanner
- Detects font families and weights
- Analyzes text styles and hierarchies
- Catalogs font sizes and line heights

### Button Collector
- Captures button styles
- Extracts padding and spacing values
- Identifies button hierarchies

### Asset Manager
- Collects images, videos, icons, and SVGs
- Organizes assets by type and size
- Provides easy download options

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

- **Derrick Tsorme** - *Initial work* - [GitHub](https://github.com/uxderrick)

## 🙏 Acknowledgments

- Thanks to the Chrome Extensions community for inspiration and best practices
- Special thanks to all contributors and testers

---

<div align="center">
Made with ❤️ by Derrick Tsorme
</div>
