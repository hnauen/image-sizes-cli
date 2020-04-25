'use strict';

const logger = require('winston');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
var glob = require("glob");

const { loadJsonFile, writeJsonFile, slugifyPath, sortObject } = require('./util');

/**
 * 
 * @param {*} fileFormat 
 * @param {*} inputFile 
 * @param {*} outputFile 
 * @param {*} resizeOptions 
 * @param {*} outputOptions 
 */
function createImage(fileFormat, inputFile, outputFile, resizeOptions = {}, outputOptions = {}) {

    if (!fs.existsSync(inputFile)) {
        logger.error("input file not found: %s", inputFile);
        return;
    }
    if (fs.existsSync(outputFile)) {
        var inputFileStats = fs.statSync(inputFile);
        var outputFileStats = fs.statSync(outputFile);

        if (inputFileStats.mtime > outputFileStats.mtime) {
            logger.info("re-do ... output file changed: %s", outputFile);
        } else {
            logger.info("skipping ... output file exist: %s", outputFile);
            return;
        }
    }

    const outputFolder = path.parse(outputFile).dir;
    if (!fs.existsSync(outputFolder)) {
        logger.info("create folder: %s", outputFolder);
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    const imageProcessor = sharp(inputFile)
    imageProcessor.resize(resizeOptions);
    switch (fileFormat) {
        case "jpg":
        case "jpeg":
            imageProcessor.jpeg(outputOptions);
            break;
        case "webp":
            imageProcessor.webp(outputOptions);
            break;
        case "png":
            imageProcessor.png(outputOptions);
            break;
        case "tif":
        case "tiff":
            imageProcessor.tiff(outputOptions);
            break;
        default:
            logger.error("unkown file format: %s", fileFormat);
    }
    imageProcessor.toFile(outputFile, (err, info) => {
        if (err) {
            logger.error("sharp failed: %s", JSON.stringify(err, null, 2));
        }
        if (info) {
            logger.info("image written: %s", outputFile);
        }
    });
}


//${name}/${width}x${height}.${ext}
function makeFileName(template, name, width, height, ext) {
    var result = template;
    result = result.replace("${name}", name);
    result = result.replace("${width}", width);
    result = result.replace("${height}", height);
    result = result.replace("${ext}", ext);
    return result;
}

/**
 * 
 * @param {*} outputFileName 
 * @param {*} imageDetails 
 * @param {*} renditions 
 * @param {*} options 
 */
function processImage(outputFileName, imageDetails, renditions, options) {

    const inputFile = path.join(options.input, imageDetails.source);

    if (options.copy && options.output) {
        const outputFile = path.join(options.output, outputFileName);
        const fileFormat = path.parse(outputFile).ext.substring(1);
        createImage(fileFormat, inputFile, outputFile, {}, options.outputOptions);
    }

    renditions.forEach(rendition => {

        const realtiveFileName = options.output ? outputFileName : imageDetails.source;

        const renditionFilePath = path.join(options.output || options.input, path.parse(realtiveFileName).dir);
        const renditionFileName = makeFileName(
            options.renditionFileNameTemplate,
            path.parse(realtiveFileName).name,
            rendition.width,
            rendition.height,
            rendition.fileFormat);
        const outputFile = path.join(renditionFilePath, renditionFileName);
        const resizeOptions = {
            ...{
                width: rendition.width,
                height: rendition.height
            }, ...(options.resizeOptions || {}), ...(imageDetails.resizeOptions || {})
        };
        const outputOptions = { ...(options.outputOptions || {}), ...(imageDetails.outputOptions || {}) };

        createImage(rendition.fileFormat, inputFile, outputFile, resizeOptions, outputOptions);
    });
}

/**
 * 
 * @param {object} imageList 
 * @param {*} fileNames 
 * @param {*} slugifyOutput 
 */
function mergeImageList(images, fileNames, slugifyOutput) {
    const updatedImages = images;

    fileNames.forEach(fileName => {
        const outputFile = slugifyOutput ? slugifyPath(fileName) : fileName;
        if (!updatedImages[outputFile]) {
            updatedImages[outputFile] = {
                source: fileName,
                description: path.parse(fileName).name,
                //resizeOptions: {},
                //outputOptions: {}
            }
        }
    });

    return updatedImages;
}

/**
 * @param {array} renditionSizes array of strings, e.g. ["100x200", "150x300"]
 * @param {array} renditionFileFormats array of strings, e.g. ["jpg", "webp"]
 * @returns array with all combinations of width, height, and fileFormat
 */
function constructRenditions(renditionSizes, renditionFileFormats) {
    const renditions = [];
    if (renditionSizes) {
        renditionSizes.forEach(renditionSize => {
            const arr = renditionSize.split('x');
            if (arr.length != 2) {
                logger.error("invalid rendition %s", renditionSize);
                return;
            }
            const width = parseInt(arr[0]);
            const height = parseInt(arr[1]);
            if (isNaN(width) || isNaN(height)) {
                logger.error("invalid rendition %s", renditionSize);
                return;
            }
            renditionFileFormats.forEach(fileFormat => {
                renditions.push({
                    width: width,
                    height: height,
                    fileFormat: fileFormat
                });
            });
        });
    }
    return renditions;
}

/**
 * @param {*} options cli input
 */
function generateImages(options) {

    // construct renditions
    const renditions = constructRenditions(options.renditionSizes, options.renditionFileFormats);
    logger.debug("renditions %j", renditions);


    var images = {};
    // load images file if needed
    if (options.imagesFileName) {
        images = loadJsonFile(options.imagesFileName);
    }
    logger.debug("images %j", images);

    // scan input folder for (new) images
    const fileNames = glob.sync(options.files, {
        cwd: options.input
    })
    logger.debug("fileNames %j", fileNames);

    // merge files 
    images = mergeImageList(images, fileNames, options.slugifyOutput);
    logger.debug("images %j", images);

    // do the magic
    for (var outputFileName in images) {
        if (fileNames.includes(images[outputFileName].source)) {
            processImage(outputFileName, images[outputFileName], renditions, options);
        }
    }

    // write images file if needed
    if (options.updateImagesFile && options.imagesFileName) {
        images = sortObject(images);
        writeJsonFile(options.imagesFileName, images);
    }
}
exports.generateImages = generateImages;