export default function Titlebar() {
    return (
        // Top bar container. The [-webkit-app-region:drag] makes the window movable.
        <div className="flex justify-between items-center bg-gray-900 h-10 w-full [-webkit-app-region:drag] select-none text-white">

            {/* Left side: App Title */}
            <div className="text-sm font-semibold pl-4 text-gray-400">
                OpenConvert
            </div>

            {/* Right side: Window Controls. MUST be [-webkit-app-region:no-drag] to be clickable! */}
            <div className="flex h-full [-webkit-app-region:no-drag]">
                <button
                    onClick={() => window.electronAPI.minimize()}
                    className="px-4 text-gray-400 hover:bg-gray-700 transition-colors"
                >
                    &#x2012; {/* Minimize Icon */}
                </button>
                <button
                    onClick={() => window.electronAPI.maximize()}
                    className="px-4 text-gray-400 hover:bg-gray-700 transition-colors"
                >
                    &#x25A1; {/* Maximize Icon */}
                </button>
                <button
                    onClick={() => window.electronAPI.close()}
                    className="px-4 text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                    &#x2715; {/* Close Icon */}
                </button>
            </div>

        </div>
    )
}
