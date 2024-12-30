const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); // Automatically resolves the path

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

// Function to check and delete unnecessary files
function checkAndDeleteFiles() {
    fs.readdir(outputDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach((file) => {
            if (file.endsWith('_final.mp4')) {
                console.log(`Skipping file (not deleted): ${file}`);
            } else {
                const filePath = path.join(outputDir, file);
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

// Function to extract the original file name
function extractOriginalFileName(qualityCode) {
    return new Promise((resolve, reject) => {
        fs.readdir(outputDir, (err, files) => {
            if (err) {
                return reject(`Error reading directory: ${err.message}`);
            }

            const regex = new RegExp(`\\.f${qualityCode}\\.\\w+$`);
            const originalFile = files.find((file) => regex.test(file));

            if (originalFile) {
                resolve(originalFile);
            } else {
                reject(`No file found for quality code ${qualityCode}`);
            }
        });
    });
}

// Function to rename a file
function renameFile(originalFileName, staticFileName) {
    const originalFilePath = path.join(outputDir, originalFileName);
    const staticFilePath = path.join(outputDir, staticFileName);

    fs.renameSync(originalFilePath, staticFilePath);
    console.log(`Renamed ${originalFileName} to ${staticFileName}`);
    return staticFilePath;
}

// Function to download YouTube video
function downloadYouTubeVideo(videoUrl, options, videoQuality) {
    const videoStaticPath = `jarvis.f${videoQuality}.mp4`;
    const audioStaticPath = 'jarvis.f140.m4a';

    console.log('\nDownloading video and audio...');
    youtubedl(videoUrl, options)
        .then(() => {
            console.log('Download completed. Extracting the original file names...');
            const videoPromise = extractOriginalFileName(videoQuality);
            const audioPromise = extractOriginalFileName(140);

            return Promise.all([videoPromise, audioPromise]);
        })
        .then(([originalVideoName, originalAudioName]) => {
            console.log(`Original video file name: ${originalVideoName}`);
            console.log(`Original audio file name: ${originalAudioName}`);

            const renamedVideoPath = renameFile(originalVideoName, videoStaticPath);
            const renamedAudioPath = renameFile(originalAudioName, audioStaticPath);

            console.log('\nProceeding to merge the video and audio...');
            const finalOutputFile = path.join(outputDir, `${originalVideoName}_final.mp4`);
            mergeVideoAndAudio(renamedVideoPath, renamedAudioPath, finalOutputFile);
        })
        .catch((error) => {
            console.error(`An error occurred: ${error}`);
        });
}

// Function to merge video and audio
function mergeVideoAndAudio(videoFile, audioFile, outputFile) {
    console.log(`Merging started...\nVideo File: ${videoFile}\nAudio File: ${audioFile}\nOutput File: ${outputFile}`);

    if (fs.existsSync(videoFile) && fs.existsSync(audioFile)) {
        ffmpeg(videoFile)
            .input(audioFile)
            .output(outputFile)
            .audioCodec("aac")
            .videoCodec("copy") // Copy the video codec (no re-encoding)
            .on('end', () => {
                console.log(`\nMerging complete! Final video saved as ${outputFile}`);
                checkAndDeleteFiles();
                rl.close();
            })
            .on('error', (err) => {
                console.error(`Error during merging: ${err.message}`);
                rl.close();
            })
            .run();
    } else {
        console.error(`Missing files. Ensure the video and/or audio files exist.`);
        rl.close();
    }
}


// Prompt the user for the YouTube video URL
rl.question('Enter the YouTube video URL: ', (videoUrl) => {
    if (videoUrl.trim()) {
        const qualityOptions = {
            Q360p: "134",
            Q480p: "135",
            Q720p: "136",
            Q1080p: "137",
            Q2160p: "313"
        };
        console.log('Available video qualities:');
        for (const key in qualityOptions) {
            console.log(`${key}: ${qualityOptions[key]}`);
        }
        rl.question('Enter your option: ', (videoQuality) => {
            const options = {
                format: `${videoQuality}+140`,
                output: path.join(outputDir, '%(title)s.%(ext)s'), // Save with video title in filename
            };
            downloadYouTubeVideo(videoUrl.trim(), options, videoQuality);
        });
    } else {
        console.log('Invalid input. Please provide a valid YouTube URL.');
        rl.close(); // Close the readline interface
    }
});

