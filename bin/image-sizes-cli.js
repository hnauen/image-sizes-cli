#!/usr/bin/env node

const commander = require('commander');
const fs = require("fs");
const logger = require('winston');

const { generateImages } = require('../src/image-sizes');
const { initializeLogger } = require('../src/logger');

const { version } = require('../package.json');



function increaseValue(dummyValue, previous) {
    return previous + 1;
}
function commaSeparatedList(value, dummyPrevious) {
    return value.split(',');
}
function jsonParamter(value, dummyPrevious) {
    console.log("jsonParamter", value);
    return JSON.parse(value);
}



function checkOptions(options) {
    if (!fs.existsSync(options.input)) {
        logger.error("input path not found: %s", options.input);
        process.exitCode = 1;
        return false;
    }
    if (!fs.statSync(options.input).isDirectory()) {
        logger.error("input folder is not a directoy: %s", options.input);
        process.exitCode = 1;
        return false;
    }
    if (options.output && !fs.existsSync(options.output)) {
        logger.error("output path not found: %s", options.output);
        process.exitCode = 1;
        return false;
    }
    if (options.output && !fs.statSync(options.output).isDirectory()) {
        logger.error("output folder is not a directoy: %s", options.output);
        process.exitCode = 1;
        return false;
    }
    if (options.copy && !options.output) {
        logger.error("copy can be used only when output id given");
        process.exitCode = 1;
        return false;
    }
    if (options.imagesFileName && !fs.existsSync(options.imagesFileName)) {
        logger.error("image list not found: %s", options.imagesFileName);
        process.exitCode = 1;
        return false;
    }
    if (options.imagesFileName && !fs.statSync(options.imagesFileName).isFile()) {
        logger.error("image list is not a file: %s", options.imagesFileName);
        process.exitCode = 1;
        return false;
    }
    return true;    
}


function main() {
    const program = new commander.Command();

    program
        .version(version)
        .requiredOption('-i, --input <path>', 'input folder, required.')
        .option('-f, --files <glob>', 'matcher for files inside input folder', '**/*.jpg')
        .option('-o, --output <path>', 'image output folder, fallback to input foler if not specified')
        .option('-c, --copy', 'copy original image to output folder if output is set, honors -O', false)
        .option('-S, --slugifyOutput', 'write web-friendly file names to output folder')
        .option('-s, --renditionSizes <sizes>', 'list of image sizes, comma septated list of <width>x<height>. E.g. 100x200,150x300', commaSeparatedList)
        .option('-n, --renditionFileNameTemplate <template>', 'template, might contain "/", directories will be created.', '${name}/${width}x${height}.${ext}')
        .option('-t, --renditionFileFormats <formats>', 'file types for renditions, comma separated list', commaSeparatedList, ["jpg","webp"])

        .option('-R, --resizeOptions <json>', 'options for sharp.resize()', jsonParamter, {})
        .option('-O, --outputOptions <json>', 'file output options of sharp', jsonParamter, {"progressive":true})

        .option('-I, --imagesFileName <filename>', 'additional configuration, json')
        .option('-U, --updateImagesFile', 'update image file if new files are detected', false)

        .option('-v, --verbose', 'verbose logging, repeatable up to three times for more details', increaseValue, 0)
        .action(() => {

            const options = program.opts();

            logger.debug("program.opts %j", options);

            if (checkOptions(options)) {
                generateImages(options);
            }
        });

    program.on('option:verbose', function () {
        initializeLogger(program.verbose);
    });

    program.parseAsync(process.argv);
}

// Let the show begin
main();
