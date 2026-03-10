# OpenConvert

A fast, private, and user-friendly desktop file conversion application. Convert images, documents, videos, and audio files - all processed locally on your machine.

![Version](https://img.shields.io/badge/version-1.4.0-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Platform](https://img.shields.io/badge/platform-Linux-lightgrey)

## Features

### Supported Formats

**Images** (Built-in via Sharp)
- PNG, JPEG, WebP, GIF, BMP, AVIF, TIFF, SVG, ICO, JPEG XL
- High-performance native processing
- Quality control and lossless/lossy compression

**Documents** (Requires Pandoc)
- PDF, EPUB, DOCX, TXT, RTF, ODT, XPS, CBZ, MOBI, FB2
- Powered by Pandoc for document transformations

**Video** (Requires FFmpeg)
- MP4, MKV, AVI, MOV, WebM, 3GP, FLV, WMV
- Real-time progress tracking
- Video to GIF conversion

**Audio** (Requires FFmpeg)
- MP3, WAV, AAC, OGG, FLAC, WMA, M4A
- Real-time progress tracking

### Key Capabilities

- **Drag & Drop Interface** - Simply drag files into the app
- **Batch Processing** - Convert multiple files simultaneously
- **Quality Control** - Choose from Low, Medium, High, or Maximum quality presets
- **Conversion History** - Track all your conversions with search and filter
- **Analytics Dashboard** - View conversion statistics and performance metrics
- **Overwrite Options** - Auto-rename, skip, or overwrite existing files
- **Configurable Concurrency** - Control how many files convert at once (1-10)
- **Privacy Focused** - 100% local processing, no internet required, no data collection
- **Modern UI** - Dark theme with custom titlebar and responsive design

## Installation

### Prerequisites

**Required:**
- Linux operating system (AppImage or Snap)

**Optional (for additional format support):**
- [Pandoc](https://pandoc.org/installing.html) - For document conversions
- [FFmpeg](https://ffmpeg.org/download.html) - For video and audio conversions

### Download

Download the latest release from the [Releases](../../releases) page:
- **AppImage** - Portable, works on most Linux distributions
- **Snap** - Install via Snap Store

### Running the AppImage

```bash
chmod +x OpenConvert-*.AppImage
./OpenConvert-*.AppImage
```

### Installing via Snap

```bash
snap install openconvert
```

## Usage

1. **Add Files** - Drag and drop files into the application, or click to browse
2. **Select Format** - Choose the target format for each file from the dropdown
3. **Configure Settings** - Adjust quality, output directory, and other options
4. **Convert** - Click the convert button to start processing
5. **View Results** - Check the History tab for completed conversions

### Keyboard Shortcuts

- `F12` or `Ctrl+Shift+I` - Toggle DevTools
- `Ctrl+,` (Linux/Win) or `Cmd+,` (Mac) - Open Settings
- `Ctrl+Shift+H` - Open History

## Development

### Tech Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Sharp** - Native image processing
- **Better-SQLite3** - Database for history and settings
- **shadcn/ui** - UI component library

### Prerequisites

- Node.js (v18 or higher recommended)
- Bun (or npm/yarn)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/OpenConvert-desktop.git
cd OpenConvert-desktop

# Install dependencies
bun install

# Run in development mode
bun run dev
```

### Building

```bash
# Build for Linux
bun run build:linux

# Build for Windows
bun run build:windows

# Build for macOS
bun run build:mac

# Type-check and build without packaging
bun run build:ts
```

### Project Structure

```
OpenConvert-desktop/
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry point
│   └── preload.ts    # Preload script for IPC
├── src/              # React renderer process
│   ├── components/   # UI components
│   ├── config/       # Format configurations
│   ├── lib/          # Utility functions
│   └── App.tsx       # Main application component
├── public/           # Static assets
└── resources/        # Build resources (icons, etc.)
```

## Configuration

Settings are persisted in a SQLite database located at:
- Linux: `~/.config/openconvert.db`

### Configurable Options

- Default output directory
- Quality presets (Low/Medium/High/Maximum)
- Overwrite behavior (Auto-rename/Skip/Overwrite)
- Concurrency level (1-10 simultaneous conversions)
- Maximum file size limit
- Maximum file count per batch

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [Pandoc](https://pandoc.org/) - Universal document converter
- [FFmpeg](https://ffmpeg.org/) - Multimedia processing framework
- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## Support

If you encounter any issues or have questions:
- Open an [issue](../../issues) on GitHub
- Check the [documentation](../../wiki) (if available)

---

Made with care for privacy-conscious users who need reliable file conversions.
