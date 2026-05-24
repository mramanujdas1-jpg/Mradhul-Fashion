const Jimp = require('jimp');
const fs = require('fs');

async function convert(file) {
    console.log('Converting', file);
    try {
        const image = await Jimp.read(file);
        // Save back as proper PNG
        await image.writeAsync(file);
        console.log('Done', file);
    } catch(err) {
        console.error(err);
    }
}

async function run() {
    await convert('assets/icon.png');
    await convert('assets/splash.png');
    console.log('Finished image conversion.');
}

run();
