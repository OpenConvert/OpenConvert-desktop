// Tour step definitions for OpenConvert guided tours
import type { Step } from 'react-joyride'

export type TourType = 'welcome' | 'advanced' | 'settings' | 'demo'

export interface TourDefinition {
    id: TourType
    name: string
    description: string
    steps: Step[]
}

// Welcome & Basics Tour - INTERACTIVE VERSION
// User actually adds files, selects format, converts, and checks history!
const welcomeTourSteps: Step[] = [
    {
        target: 'body',
        title: 'Welcome to OpenConvert! 🎉',
        content: 'OpenConvert is a powerful, privacy-focused file converter. Let\'s do a quick hands-on demo! You\'ll actually convert a real file right now.\n\nReady? Let\'s go!',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="sidebar"]',
        title: 'Navigation Sidebar',
        content: 'These tabs let you switch between Convert, History, Analytics, and Settings. We\'re currently on the Convert tab.\n\nClick "Next" to continue.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="browse-files"]',
        title: 'Step 1: Add a File 📁',
        content: '👆 Now it\'s your turn! Click the "Browse Files" button to select files.\n\n💡 Tip: We have example images ready for you in the examples folder.\n\n⏸️ The tour will wait here until you add files...',
        placement: 'top',
        disableBeacon: true,
        spotlightClicks: true, // Allow clicking the target
    },
    {
        target: '[data-tour="format-dropdown"]',
        title: 'Step 2: Choose Output Format 🎯',
        content: '👆 Great! Now click the format dropdown and choose a different format to convert to.\n\nTry selecting "webp" for better compression!\n\n⏸️ The tour will continue after you change the format...',
        placement: 'left',
        disableBeacon: true,
        spotlightClicks: true,
    },
    {
        target: '[data-tour="convert-button"]',
        title: 'Step 3: Convert! 🚀',
        content: '👆 Perfect! Now click the "Convert" button to start the conversion.\n\nYou\'ll see real-time progress bars as your files convert!\n\n⏸️ Click the button when you\'re ready...',
        placement: 'top',
        disableBeacon: true,
        spotlightClicks: true,
    },
    {
        target: '[data-tour="sidebar"]',
        title: 'Step 4: Check Your Results! ✨',
        content: 'Awesome! Your file has been converted. Now click the "History" tab in the sidebar to see your conversion.\n\nYou can compare before/after, check file sizes, and more!\n\n⏸️ Click "History" to continue...',
        placement: 'right',
        disableBeacon: true,
        spotlightClicks: true,
    },
    {
        target: 'body',
        title: 'You Did It! 🎉',
        content: 'Congratulations! You just converted your first file with OpenConvert.\n\nYou learned:\n✅ How to add files\n✅ How to choose formats\n✅ How to convert\n✅ Where to find results\n\nFeel free to explore more features. Need help? Click the (?) button anytime!',
        placement: 'center',
        disableBeacon: true,
    },
]

// Advanced Features Tour
const advancedTourSteps: Step[] = [
    {
        target: 'body',
        title: 'Advanced Features Tour 🔧',
        content: 'Let\'s explore the powerful features that make OpenConvert a professional-grade tool! This tour works best after you\'ve added some files.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Visual Thumbnails',
        content: 'When you add files, you\'ll see visual previews:\n\n📷 Images: Actual image preview\n🎬 Videos: First frame thumbnail\n📄 PDFs: First page preview\n🎵 Audio: Waveform visualization\n\nMetadata like resolution, duration, and file size displays automatically!',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Advanced Settings Panel',
        content: 'After adding files, click the settings toggle at the bottom to reveal:\n\n⚙️ Quality presets (Low/Medium/High/Lossless)\n🖼️ Image options (resize, rotate, strip metadata)\n🎬 Video settings (resolution, bitrate, codec)\n🎵 Audio settings (bitrate, sample rate)',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Quick Presets 🎯',
        content: 'Use the Presets dropdown to access 40+ optimized configurations:\n\n📱 Device Presets: iPhone, iPad, Samsung Galaxy\n🌐 Social Media: YouTube 4K, Instagram Reels, TikTok\n🎵 Audio Quality: High Quality MP3, Podcast, Lossless FLAC\n🖼️ Image Optimization: Web Optimized, Thumbnails',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Batch Processing',
        content: 'Convert multiple files simultaneously!\n\n⚡ Set concurrency (1-8 files at once) in Settings\n📊 Watch real-time progress for each file\n🎯 Process up to 500 files per batch\n⏱️ See ETA for each conversion',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Post-Conversion Actions',
        content: 'Choose what happens when conversion finishes:\n\n🔔 Send Notification: Desktop alert when done\n📂 Open Folder: Automatically open output folder\n💤 Shutdown PC: Great for overnight batch jobs\n\nSet your default in Settings or choose per-conversion!',
        placement: 'center',
        disableBeacon: true,
    },
]

// Settings & Customization Tour
const settingsTourSteps: Step[] = [
    {
        target: 'body',
        title: 'Settings & Customization ⚙️',
        content: 'Customize OpenConvert to match your workflow with powerful settings and preferences. Click the Settings tab in the sidebar to access all options.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="sidebar"]',
        title: 'Open Settings',
        content: 'Click the Settings tab at the bottom of the sidebar to access all customization options.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'General Settings',
        content: 'In the General section, you can configure:\n\n📁 Default Output Directory\n🔄 File Conflict Behavior (Skip/Rename/Overwrite)\n🔧 Developer Tools access',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Conversion Settings',
        content: 'Fine-tune your conversion workflow:\n\n⭐ Default Quality Preset\n⚡ Concurrent Conversions (1-8 files)\n📊 Maximum File Count (up to 500)\n💾 Maximum File Size (up to 2000 MB)\n✨ Post-Conversion Action',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Quality Presets Explained',
        content: 'Choose your default quality level:\n\n🔹 Low: Smallest file size, reduced quality\n🔹 Medium: Balanced size and quality (recommended)\n🔹 High: Larger files, excellent quality\n🔹 Lossless: No quality loss, largest files',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'You\'re All Set! 🎉',
        content: 'You\'ve completed the Settings tour!\n\nRemember: You can override any default setting on a per-conversion basis using the Advanced Settings panel.\n\nHappy converting!',
        placement: 'center',
        disableBeacon: true,
    },
]

// Interactive Image Conversion Demo Tour
const demoTourSteps: Step[] = [
    {
        target: 'body',
        title: '🎉 Welcome to the Interactive Demo!',
        content: 'Great! You\'ve loaded example images. Let\'s quickly convert one to see OpenConvert in action. Notice the thumbnails showing previews of each image with resolution and file size.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="format-dropdown"]',
        title: 'Choose Output Format',
        content: 'See this dropdown? Click it to choose what format you want. For this demo, try converting JPG to WebP - it gives better compression and smaller file sizes!\n\n💡 Tip: You can set different formats for each file.',
        placement: 'left',
        disableBeacon: true,
    },
    {
        target: '[data-tour="convert-button"]',
        title: 'Start Converting! 🚀',
        content: 'Click this button to convert your files. You\'ll see real-time progress bars. These demo images are small, so conversion will be quick!\n\nThe converted files will be saved to a demo folder.',
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour="sidebar"]',
        title: 'Check Your Results! ✨',
        content: 'Conversion complete! Click the History tab to:\n\n📊 See all your conversions\n🔍 Compare before/after\n📂 Open output folder\n📈 View file size savings\n\nFeel free to keep experimenting with these example images!',
        placement: 'right',
        disableBeacon: true,
    },
]

export const tours: TourDefinition[] = [
    {
        id: 'welcome',
        name: 'Welcome & Basics',
        description: 'Learn the essentials: adding files, choosing formats, and converting',
        steps: welcomeTourSteps,
    },
    {
        id: 'advanced',
        name: 'Advanced Features',
        description: 'Explore thumbnails, presets, batch operations, and power user features',
        steps: advancedTourSteps,
    },
    {
        id: 'settings',
        name: 'Settings & Customization',
        description: 'Customize quality, performance, and workflow preferences',
        steps: settingsTourSteps,
    },
    {
        id: 'demo',
        name: 'Interactive Image Demo',
        description: 'Quick hands-on demo with example images',
        steps: demoTourSteps,
    },
]

export function getTour(id: TourType): TourDefinition | undefined {
    return tours.find(tour => tour.id === id)
}
