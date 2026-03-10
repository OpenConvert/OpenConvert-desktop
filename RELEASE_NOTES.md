# OpenConvert v1.4.0 Release Notes

We are excited to announce OpenConvert v1.4.0! This release brings powerful new features, including advanced optimization options, smart format suggestions, and a more polished user interface.

## Major Features

### ✨ Format Auto-Detection & Smart Suggestions
* **Intelligent recommendations** based on use cases (Web Optimized, Maximum Quality, Smallest File Size, Universal Compatibility).
* **Estimated output file size** calculation before starting the conversion.
* **Contextual suggestions** based on file characteristics, displayed with sparkle (✨) icons.

### ⚙️ Image, Video, and Audio Optimizations
* **Image Optimizations**: Set custom width and height with various fit modes, rotate images (0-270°), and strip EXIF metadata for privacy.
* **Video & Audio Options**: Fine-tune bitrates, resolutions (from 360p up to 4K), and frame rates (24, 30, 60 fps).
* **Batch or Per-file Settings**: Apply settings across a batch or individually, with real-time previews.

### 📊 History & Comparison Enhancements
* **Comparison View**: Side-by-side comparison of original and converted files, including visual thumbnails, file size percentage changes, and metadata differences.
* **Bulk Operations**: Multi-select items in the History view for bulk deletion or export to CSV.
* **Re-convert Completed Files**: Simply click the rotate (🔄) icon to reset a completed file to pending status and re-convert it with new settings.

### 🔄 Enhanced Progress Feedback
* **Real-time ETA calculations** based on conversion progress.
* **Current operation display** keeps you informed on the exact step (e.g., "Encoding video...", "Processing image...").
* **Accurate start time tracking** for precise duration estimates.

## UI & UX Improvements

* **Custom Alert Dialog System**: Replaced native browser alerts with custom, themed `AlertDialog` components matching the app's dark aesthetics (complete with backdrop blur and smooth focus management).
* **Professional Checkboxes**: Integrated shadcn-ui styled accessible checkboxes featuring smooth animations, keyboard support, and proper ARIA labels.
* **Progress Bar Fixes**: Progress percentage overlays are now permanently visible, centered, and cleanly stylized over the progress bar.
* **Usability Enhancements**: Introduced collapsible optimization panels, visual ring effects for selected history items, and an overall cleaner settings layout.

## Technical Improvements

* **Type Safety & Architecture**: Introduced comprehensive TypeScript interfaces for all optimization options, improved component modularity, and clean separation of concerns.
* **Performance Enhancements**: Lazy-loaded thumbnails, efficient progress updates, and optimized memory management to ensure a smoother experience during batch operations.