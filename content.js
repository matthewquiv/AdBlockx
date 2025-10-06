// Function to remove overlay ads and log them
function removeOverlayAds() {
    document.querySelectorAll('ytd-ad-slot-renderer').forEach(el => {
        console.log("Blocked overlay ad:", el); // Log the ad element
        el.remove();
    });
}

// Remove existing overlay ads
removeOverlayAds();

// Watch for new overlay ads dynamically
const observer = new MutationObserver(() => {
    removeOverlayAds();
});

observer.observe(document.body, { childList: true, subtree: true });
