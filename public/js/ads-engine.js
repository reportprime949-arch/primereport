/**
 * AdSense Engine for PrimeReport
 * Manages ad initialization and site-wide toggle based on admin settings.
 */
window.addEventListener("load", function() {
    initAdsEngine();
});

function initAdsEngine() {
    // Force ads to be disabled until approval
    const adsEnabled = false; 
    const adContainers = document.querySelectorAll('.ad-slot-container');

    if (adsEnabled) {
        // ... (remaining logic preserved but unreachable)
        adContainers.forEach(container => {
            container.style.display = 'block';
        });
        
        console.log("Pushing adsbygoogle slots safely...");
        try {
            if (Array.isArray(window.adsbygoogle)) {
                // Number of containers = number of pushes requested
                adContainers.forEach(() => {
                    window.adsbygoogle.push({});
                });
            }
        } catch (e) {
            console.warn("AdSense push error caught in engine:", e);
        }
        
    } else {
        adContainers.forEach(container => {
            container.style.display = 'none';
        });
    }
}

// Export for use in JS-based article injection
window.isAdsEnabled = () => localStorage.getItem('ads_enabled') !== 'false';
