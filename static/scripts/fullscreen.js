// Get the fullscreen toggle button and the dashboard content element
const fullscreenToggle = document.getElementById('fullscreen-toggle');
const dashboardContent = document.getElementById('real-time-dashboard-tab');

// Function to toggle fullscreen mode
function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i> Fullscreen'; // Update button text
    } else {
        dashboardContent.requestFullscreen();
        fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen'; // Update button text
    }
}

// Add click event listener to the fullscreen button
fullscreenToggle.addEventListener('click', toggleFullscreen);
