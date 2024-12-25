const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

// Set the ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Create a readline interface for terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Create a downloads directory if it doesn't exist
const outputDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
const folderPath = 'd:/devil_code/Youtube_Downloader/downloads';
function checkAndDeleteFiles() {
    // Read the files in the folder
    fs.readdir(folderPath, (err, files) => {
      
        // Loop through all the files
        files.forEach((file) => {
            // Check if the file ends with .f1_final.mp4
            if (file.endsWith('.f1_final.mp4')) {
                console.log(`Skipping file (not deleted): ${file}`);
            } else {
                const filePath = path.join(folderPath, file);
                // Delete the file
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Error deleting file ${file}:`, err);
                    } else {
                        console.log(`File ${file} deleted successfully.`);
                    }
                });
            }
        });
    });
}
function downloadYouTubeVideo(videoUrl, options, options1,videoQuality) {
    var filename;
    var videoFilePath = '\jarvis.f' + videoQuality + '.mp4';
    if (videoQuality == "313") {
        videoFilePath = '\jarvis.f' + videoQuality + '.webm';
    }
    const audioFilePath = '\jarvis.f140.m4a';
    console.log('\nDownloading video and audio...', videoFilePath);
    //for file name
    youtubedl(videoUrl, options)
    .then((output) => {
        const filenameRegex = /([a-zA-Z0-9\s@._-|]+\.f\d)/;
        const match = output.match(filenameRegex);
        if (match) {
            filename = match[0]; // The matched filename
            console.log('Extracted filename:', filename);
        } else {
            console.log('No filename found in the output');
        }
    })
    .catch((error) => {
        console.error('An error occurred during the download:', error);
        rl.close(); // Close the readline interface
    });
    // Execute the download command for video and audio separately
    // for merging
    youtubedl(videoUrl, options1)
        .then((output) => {
            console.log(`\nDownload completed! Download output: ${output}`);
            console.log(`\nProceeding to merge the video and audio...`);
            const outputFile = path.join(outputDir, `${filename}_final.mp4`);
            const videoFile = path.join(outputDir, videoFilePath); // Video file path
            const audioFile = path.join(outputDir, audioFilePath); // Audio file path
            // Use fluent-ffmpeg to merge video and audio
            mergeVideoAndAudio(videoFile, audioFile, outputFile);
        })
        .catch((error) => {
            console.error('An error occurred during the download:', error);
            rl.close(); // Close the readline interface
        });
}

// Function to merge video and audio using fluent-ffmpeg
function mergeVideoAndAudio(videoFile, audioFile, outputFile) {
    if (fs.existsSync(videoFile) && fs.existsSync(audioFile)) {
        ffmpeg()
            .input(videoFile)
            .input(audioFile)
            .output(outputFile)
            .videoCodec('copy') // Copy the video codec to avoid re-encoding
            .audioCodec('aac') // Encode audio to AAC
            .on('end', function () {
                console.log(`\nMerging complete! Final video saved as ${outputFile}`);
                // Delete the video and audio files after merging
                checkAndDeleteFiles();
                rl.close(); // Close the readline interface
            })
            .on('error', function (err) {
                console.error(`Error merging video and audio: ${err.message}`);
            })
            .run();
    } else {
        console.error(`Missing files. Check if the video and/or audio files exist.`);
        rl.close(); // Close the readline interface
    }
}
// Prompt the user for the YouTube video URL
rl.question('Enter the YouTube video URL: ', (videoUrl) => {
    if (videoUrl.trim()) {
        const q = {
            Q360p: "134",
            Q480p: "135",
            Q720p: "136",
            Q1080p: "137",
            Q2160p: "313"
        };
        for (const key in q) {
            console.log(key, ":", q[key]);
        }
        rl.question('Enter your option:', (videoQuality) => {
            const options = {
                format: videoQuality + '+140', // 137 for 1080p video and 140 for audio (MP4/AAC)
                // output: path.join(outputDir, 'jarvis'), // Save with video ID and format
                output: path.join(outputDir, '%(title)s.%(ext)s'), // Use video title in filename
            };
            const options1 = {
                format: videoQuality + '+140', // 137 for 1080p video and 140 for audio (MP4/AAC)
                output: path.join(outputDir, 'jarvis'), // Save with video ID and format
                // output: path.join(outputDir, '%(title)s.%(ext)s'), // Use video title in filename
            };
            downloadYouTubeVideo(videoUrl.trim(), options,options1 ,videoQuality);
        });
    } else {
        console.log('Invalid input. Please provide a valid YouTube URL.');
        rl.close(); // Close the readline interface
    }
});