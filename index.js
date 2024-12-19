const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const app = express();
const imageFolder = path.join(__dirname, 'images'); // Folder containing the images
const port = 3000;
const initialRandom = true; // Set this to `true` for random image display, `false` for sequential order

// Serve static files (images) from the 'images' folder
app.use('/images', express.static(imageFolder));

// Serve the HTML page at the root route
app.get('/', (req, res) => {
    const images = fs.readdirSync(imageFolder).filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

    console.log('Serving slideshow page');
    console.log('Available images: ', images); // Log available images

    if (images.length === 0) {
        console.log('No images found in the folder!');
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Slideshow</title>
            <style>
                body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
                .slideshow-container { 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    position: relative;
                }
                img { 
                    position: absolute; 
                    width: 100vw; 
                    height: 100vh; 
                    object-fit: cover; 
                    transition: opacity 1s ease-in-out; 
                    opacity: 1; 
                }
            </style>
        </head>
        <body>
            <div class="slideshow-container">
                <img id="slide" src="/images/${images[0]}" alt="Slideshow">
            </div>
            <script>
                const images = ${JSON.stringify(images)};
                let currentIndex = 0;
                let lastIndex = -1; // Track the last index to avoid showing the same image twice
                let slideTimeout;
                let random = ${initialRandom}; // Store random state on the client-side

                // Function to change image (with random logic if enabled)
                function changeImage() {
                    let newIndex;

                    if (random) {
                        // Random mode: pick a random image, ensuring it's not the same as the last one
                        do {
                            newIndex = Math.floor(Math.random() * images.length);
                        } while (newIndex === lastIndex); // Avoid the same image as the last one
                    } else {
                        // Sequential mode: change image in order
                        newIndex = (currentIndex + 1) % images.length;
                    }

                    lastIndex = newIndex; // Update lastIndex to avoid repeating the same image

                    const newImage = '/images/' + images[newIndex];
                    console.log('New image URL: ', newImage);

                    const slideElement = document.getElementById('slide');
                    // Fade out the image before changing
                    slideElement.style.opacity = 0;
                    setTimeout(() => {
                        slideElement.src = newImage;
                        slideElement.style.opacity = 1;
                    }, 1000); // Wait for the fade-out transition to finish (1 second)

                    // Update current index if not in random mode
                    if (!random) {
                        currentIndex = newIndex;
                    }

                    resetTimeout(); // Reset the timeout when manually changing image
                }

                // Keyboard controls for left and right arrow keys
                document.addEventListener('keydown', (event) => {
                    if (event.key === 'ArrowRight') {
                        console.log('Right arrow key pressed');
                        changeImage(); // Go to the next image
                    } else if (event.key === 'ArrowLeft') {
                        console.log('Left arrow key pressed');
                        currentIndex = (currentIndex - 2 + images.length) % images.length; 
                        changeImage();
                    } else if (event.key === 'R' || event.key === 'r') {
                        // Toggle random mode
                        random = !random;
                        console.log('Random mode is now: ', random ? 'ON' : 'OFF');
                        resetTimeout(); // Reset the timeout after toggling
                    }
                });

                // Reset the timeout on manual image change
                function resetTimeout() {
                    clearTimeout(slideTimeout);
                    slideTimeout = setTimeout(changeImage, 3000); // Reset to 3 seconds after manual change
                }

                // Set the interval for automatic image change
                slideTimeout = setTimeout(changeImage, 3000);

            </script>
        </body>
        </html>
    `);
});

// Watch for changes in the 'images' folder and reload the page when changes are detected
chokidar.watch(imageFolder).on('all', (event, path) => {
    console.log(`Chokidar detected event: ${event} on ${path}`);
    if (event === 'add' || event === 'unlink') {
        console.log('Images have been updated, refreshing the slideshow...');
        // You can use socket.io or similar to notify the client about updates
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
