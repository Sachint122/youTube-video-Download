const youtubedl = require('youtube-dl-exec');

function extractVideoTitle(videoUrl) {
    // Use the -j option to get metadata in JSON format
    youtubedl(videoUrl, { dumpJson: true }) // Proper option for JSON output
        .then((output) => {
            // Parse the output as JSON
            const videoData = JSON.parse(output);
            const videoTitle = videoData.title || "untitled_video";  // Default title if not found
            console.log('Extracted title:', videoTitle);
        })
        .catch((error) => {
            console.error('Error extracting video title:', error);
        });
}

// Example usage
const videoUrl = 'https://youtu.be/CFIUDdQTws4?si=JnolMAF-x_-NyeB5';
extractVideoTitle(videoUrl);
