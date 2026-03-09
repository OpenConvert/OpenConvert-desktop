# OpenConvert v1.3.3 Release Notes

After extensive development, we're excited to release OpenConvert v1.3.3 with major improvements, restored features, and a completely revamped user experience.

## What's Changed

This release represents a significant evolution of OpenConvert with a focus on feature completeness, user experience, and reliability.

## Major Features

### 🎨 Complete UI Overhaul
* **Modern React + TypeScript stack** - Migrated from Vue.js to React for better performance and type safety
* **New technology stack**: React 19, Electron, Vite, Tailwind CSS 4.2, shadcn/ui components
* **Custom titlebar** - Frameless window with native-like controls
* **Collapsible sidebar** - Toggle between expanded and compact views
* **Dark theme** - Beautiful dark UI with violet/indigo gradient accents
* **Responsive layout** - Adaptive interface that responds to window resizing

### 🔄 Restored & Enhanced Conversion Support
* **✅ Image conversion** - Fully working with Sharp library (PNG, JPEG, WebP, GIF, BMP, AVIF, TIFF, SVG, ICO, JPEG XL)
* **✅ Video conversion** - Restored with FFmpeg support (MP4, MKV, AVI, MOV, WebM, 3GP, FLV, WMV)
* **✅ Audio conversion** - Restored with FFmpeg support (MP3, WAV, AAC, OGG, FLAC, WMA, M4A)
* **✅ Document conversion** - Added Pandoc support (PDF, EPUB, DOCX, TXT, RTF, ODT, XPS, CBZ, MOBI, FB2)
* **Real-time progress tracking** - Visual progress bars for video and audio conversions
* **Video to GIF** - Convert video files to animated GIFs

### 📊 New: History System
* **SQLite3 database integration** - Now actively in use (previously tested but unused)
* **Complete conversion history** - Track all conversions with detailed metadata
* **Search & filter** - Find conversions by filename and filter by status
* **Grouped timeline** - Organized by Today, Yesterday, Last 7 days, Older
* **Quick actions**: 
  - Show file in folder
  - Delete individual entries
  - Clear all history
* **Pagination support** - Efficiently handle large conversion histories

### 📈 New: Analytics Dashboard
* **Conversion statistics** - Total conversions, success/failure rates, file sizes processed
* **Format analytics** - Most used source and target formats
* **Performance metrics** - Fastest, slowest, and average conversion times
* **Category breakdown** - Conversions by type (image/video/audio/document)
* **Visual stats cards** - Beautiful dashboard with color-coded metrics

### ⚙️ New: Complete Settings System
* **General settings**:
  - Default output directory configuration
  - Auto-open folder after conversion
  - Show advanced settings toggle
  - Maximum file size and count limits
* **Conversion settings**:
  - Quality presets (Low/Medium/High/Maximum)
  - Overwrite behavior (Auto-rename/Skip/Overwrite)
  - Concurrency control (1-10 simultaneous conversions)
* **Persistent storage** - All settings saved to SQLite database
* **Appearance options** - Theme preferences
* **About section** - Version info and documentation links

### 🎯 Enhanced Conversion Experience
* **Per-file format selection** - Choose different target formats for each file
* **Per-file quality control** - Configure quality settings individually
* **Batch processing** - Convert multiple files with configurable concurrency
* **Smart thumbnail generation** - Automatic previews for images and videos
* **Category-based organization** - Color-coded files by type (green=image, blue=document, yellow=video, pink=audio)
* **Better error handling** - Clear error messages and status indicators
* **Overwrite protection** - Auto-rename with numbered copies (file (1).jpg)

## UI Improvements

* **Enhanced drag & drop** - Improved file upload area with visual feedback
* **File queue management** - Add, remove, and organize files before conversion
* **Image preview** - Click thumbnails to preview uploaded images
* **Status indicators** - Visual feedback for pending, converting, done, and error states
* **Empty state onboarding** - Helpful UI when no files are loaded
* **Keyboard shortcuts**:
  - `F12` / `Ctrl+Shift+I` - Toggle DevTools
  - `Ctrl+,` - Open Settings
  - `Ctrl+Shift+H` - Open History

## Technical Improvements

* **Technology stack changes**:
  - React 19.2.0 (from Vue.js)
  - TypeScript 5.9.3 for type safety
  - Vite 7.3.1 (maintained from electron-vite)
  - Tailwind CSS 4.2.1 (upgraded)
  - shadcn/ui component library (from daisyUI)
  - Better-SQLite3 12.6.2 for database operations
* **Improved architecture**:
  - IPC communication between main and renderer processes
  - Centralized format configuration in `/src/config/formats.ts`
  - Better separation of concerns
* **Build improvements**:
  - Linux AppImage and Snap support
  - Windows and macOS build configurations
  - Optimized electron-builder settings

## Plugins (Coming Soon)

* Placeholder view added for future plugin system
* Planned: Custom converters via plugin architecture

## Bug Fixes

* Fixed file size handling and validation
* Improved error messages for missing dependencies (FFmpeg, Pandoc)
* Better handling of file overwrite scenarios
* Fixed conversion queue management issues

## Breaking Changes

* Configuration from previous versions will not migrate automatically
* New database schema for history and settings

## Requirements

* **Built-in support**: Image conversions work out of the box
* **Optional dependencies**:
  - FFmpeg required for video and audio conversions
  - Pandoc required for document conversions

## Download

Available for Linux:
- AppImage (portable)
- Snap package

See the [Installation Guide](README.md#installation) for detailed instructions.

## What's Next

We're actively working on:
- Enhanced plugin system for custom converters
- More format support
- Cloud storage integration
- Batch conversion presets
- Command-line interface

---

**Full Changelog**: [View all changes](../../compare/v1.0.0...v1.3.3)

Thank you to all contributors and users who provided feedback!
