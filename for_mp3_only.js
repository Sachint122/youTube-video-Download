const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); // Automatically resolves the path

ffmpeg.setFfmpegPath(ffmpegPath);

// Set output directory
const outputDir = path.join(__dirname, 'downloads');

// Create readline interface for terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Function to download the best audio format and convert it to MP3
function downloadAndRenameToMP3(youtubeUrl) {
    const options = {
        format: '251',  // Select the best audio format (WebM with high quality)
        extractAudio: true,        // Extract audio only
        audioFormat: 'mp3',        // Convert to MP3
        audioQuality: 0,           // Highest audio quality
        output: path.join(outputDir, '%(title)s.%(ext)s'),  // Save with video title and extension
    };

    // Download the audio
    youtubedl(youtubeUrl, options)
        .then((output) => {
            // The output will contain the downloaded file path
            console.log('Download completed.');
            
            // List all files in the output directory
            fs.readdir(outputDir, (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    rl.close();
                    return;
                }

                // Loop through the files and rename any .webm files to .mp3
                files.forEach((file) => {
                    if (file.endsWith('.webm')) {
                        const oldFilePath = path.join(outputDir, file);
                        const newFilePath = oldFilePath.replace('.webm', '.mp3');
                        
                        fs.rename(oldFilePath, newFilePath, (renameErr) => {
                            if (renameErr) {
                                console.error(`Error renaming ${file}: ${renameErr.message}`);
                            } else {
                                console.log(`Renamed ${file} to ${path.basename(newFilePath)}`);
                            }
                        });
                    }
                });
            });

            rl.close();
        })
        .catch((error) => {
            console.error(`Error: ${error.message}`);
            rl.close();
        });
}

// Prompt the user to enter the YouTube video URL
rl.question('Enter the YouTube video URL: ', (videoUrl) => {
    if (videoUrl.trim()) {
        downloadAndRenameToMP3(videoUrl.trim());
    } else {
        console.log('Invalid input. Please provide a valid YouTube URL.');
        rl.close(); // Close the readline interface
    }
});
