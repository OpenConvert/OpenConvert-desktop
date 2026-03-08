# Supported File Formats

This document lists all file formats supported by OpenConvert and their conversion capabilities.

> **📍 Configuration Location**: All format definitions are centralized in [`src/config/formats.ts`](./src/config/formats.ts)

## Quick Reference

### Currently Supported (No External Dependencies)
- ✅ **Images** - All image conversions work out-of-the-box using the built-in Sharp library

### Requires External Installation
- ⏳ **Documents** - Requires [Pandoc](https://pandoc.org/installing.html)
- ⏳ **Video** - Requires [FFmpeg](https://ffmpeg.org/download.html)
- ⏳ **Audio** - Requires [FFmpeg](https://ffmpeg.org/download.html)

---

## Image Formats (✅ Fully Supported)

| Format | Extension | Can Convert To | Description |
|--------|-----------|----------------|-------------|
| PNG | `.png` | jpg, webp, gif, bmp, avif, tiff, ico, pdf | Lossless compression with transparency |
| JPEG | `.jpg`, `.jpeg` | png, webp, gif, bmp, avif, tiff, ico, pdf | Most widely supported, lossy compression |
| WebP | `.webp` | png, jpg, gif, bmp, avif, tiff, ico, pdf | Modern web format, superior compression |
| GIF | `.gif` | png, jpg, webp, bmp, avif, tiff | Supports animation and transparency |
| BMP | `.bmp` | png, jpg, webp, gif, avif, tiff | Uncompressed bitmap |
| AVIF | `.avif` | png, jpg, webp, gif, bmp, tiff | Best compression, modern browsers only |
| TIFF | `.tiff`, `.tif` | png, jpg, webp, gif, bmp, avif | High quality, professional photography |
| SVG | `.svg` | png, jpg, webp | Vector graphics (rasterized to output) |
| ICO | `.ico` | png, jpg, webp | Icon format |
| JPEG XL | `.jxl` | png, jpg, webp | Next-gen format with excellent compression |

---

## Document Formats (⏳ Requires Pandoc)

| Format | Extension | Can Convert To | Description |
|--------|-----------|----------------|-------------|
| PDF | `.pdf` | png, jpg, txt | Universal document standard |
| EPUB | `.epub` | pdf, txt | eBook format |
| DOCX | `.docx` | pdf, txt | Microsoft Word document |
| TXT | `.txt` | pdf | Plain text |
| RTF | `.rtf` | pdf, txt | Rich Text Format |
| ODT | `.odt` | pdf, txt | OpenDocument Text |
| XPS | `.xps` | pdf, png, jpg | XML Paper Specification |
| CBZ | `.cbz` | pdf, png | Comic Book Archive |
| MOBI | `.mobi` | pdf, epub, txt | Kindle format |
| FB2 | `.fb2` | pdf, epub, txt | FictionBook eBook |

**Installation:**
```bash
# Ubuntu/Debian
sudo apt install pandoc

# macOS
brew install pandoc

# Windows
winget install pandoc
```

---

## Video Formats (⏳ Requires FFmpeg)

| Format | Extension | Can Convert To | Description |
|--------|-----------|----------------|-------------|
| MP4 | `.mp4` | mkv, avi, mov, webm, gif | Most widely supported |
| MKV | `.mkv` | mp4, avi, mov, webm | Open container, multiple tracks |
| AVI | `.avi` | mp4, mkv, mov, webm | Legacy Windows format |
| MOV | `.mov` | mp4, mkv, avi, webm | Apple QuickTime |
| WebM | `.webm` | mp4, mkv, avi, mov | Web-optimized format |
| 3GP | `.3gp` | mp4, mkv, avi | Mobile video |
| FLV | `.flv` | mp4, mkv, avi, webm | Legacy Flash video |
| WMV | `.wmv` | mp4, mkv, avi, webm | Windows Media Video |

**Installation:**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
winget install ffmpeg
```

---

## Audio Formats (⏳ Requires FFmpeg)

| Format | Extension | Can Convert To | Description |
|--------|-----------|----------------|-------------|
| MP3 | `.mp3` | wav, aac, ogg, flac, m4a | Most popular lossy format |
| WAV | `.wav` | mp3, aac, ogg, flac, m4a | Uncompressed, high quality |
| AAC | `.aac` | mp3, wav, ogg, flac, m4a | Better quality than MP3 |
| OGG | `.ogg` | mp3, wav, aac, flac, m4a | Open-source Vorbis |
| FLAC | `.flac` | mp3, wav, aac, ogg, m4a | Lossless compression |
| WMA | `.wma` | mp3, wav, aac, ogg, flac | Windows Media Audio |
| M4A | `.m4a` | mp3, wav, aac, ogg, flac | MPEG-4 Audio (AAC) |

**Installation:** Same as video formats (FFmpeg)

---

## Adding New Formats

To add support for a new file format, edit [`src/config/formats.ts`](./src/config/formats.ts):

1. Add the format to the `FORMAT_MAP` object
2. Specify its category (`image`, `document`, `video`, or `audio`)
3. List which formats it can convert to in the `targets` array
4. Optionally add a description

Example:
```typescript
heic: { 
    category: 'image', 
    label: 'HEIC', 
    targets: ['jpg', 'png', 'webp'],
    description: 'High Efficiency Image Container - Apple format'
},
```

The format will automatically:
- ✅ Appear in file dialogs
- ✅ Show up in the UI with the correct category icon/color
- ✅ Be available for conversion (if converter is implemented)

---

## Format Implementation Status

### Converters
- ✅ **Image Converter** (`electron/converters/image-converter.ts`) - Uses Sharp library
- ❌ **Document Converter** - Not yet implemented (requires Pandoc integration)
- ❌ **Video Converter** - Not yet implemented (requires FFmpeg integration)
- ❌ **Audio Converter** - Not yet implemented (requires FFmpeg integration)

### Roadmap
1. **Phase 1** (Complete) - Image conversion with Sharp
2. **Phase 2** (Planned) - Document conversion with Pandoc
3. **Phase 3** (Planned) - Video/Audio conversion with FFmpeg
4. **Phase 4** (Future) - Custom converters via plugin system

---

## Notes

- All file format data is defined in **one place**: [`src/config/formats.ts`](./src/config/formats.ts)
- The format configuration is shared between frontend (React) and backend (Electron)
- Conversion quality settings are defined in [`src/lib/settings.ts`](./src/lib/settings.ts)
- File extensions are case-insensitive

---

## Related Files

- **Format Configuration**: [`src/config/formats.ts`](./src/config/formats.ts) - Single source of truth
- **Image Converter**: [`electron/converters/image-converter.ts`](./electron/converters/image-converter.ts)
- **Settings Schema**: [`src/lib/settings.ts`](./src/lib/settings.ts)
- **Main Process**: [`electron/main.ts`](./electron/main.ts) - File dialog integration
