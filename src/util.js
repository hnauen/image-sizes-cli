'use strict';

const fs = require("fs");
const logger = require('winston');
const slugify = require('slugify');

/**
 * Slugify each part of a path with sluglify
 * 
 * @see {@link https://www.npmjs.com/package/slugify}
 * @param {string} filepath the path to work on 
 * @returns the slugified path
 */
function slugifyPath(filepath) {
    const folders = filepath.split('/');
    for (var i=0; i<folders.length; i++){
        folders[i] = slugify(folders[i]);
    }
    return folders.join('/');
}
exports.slugifyPath = slugifyPath;

/**
 * Load a JSON object
 * @param {string} filepath path to json file
 * @returns the data found in filepath. An empty object in case of errors.
 */
function loadJsonFile(filepath) {
    logger.info("loadJsonFile()");

    var jsonObject = {};

    if (!fs.existsSync(filepath)) {
        logger.warn("file does not exist: %s", filepath);
        return jsonObject;
    }

    const fileContentBuffer = fs.readFileSync(filepath);
    if (fileContentBuffer.length == 0) {
        logger.warn("file is empty: %s", filepath);
        return jsonObject;
    }

    try {
        jsonObject = JSON.parse(fileContentBuffer);
    } catch(e) {
        logger.warn("error loading file %s: %s", filepath, e.toString());
    }
    return jsonObject;
}
exports.loadJsonFile = loadJsonFile;


/**
 * Write a JSON object
 * @param {string} filepath path to json file
 * @param {object} jsonObject the data
 */
function writeJsonFile(filepath, jsonObject) {
    const jsonString = JSON.stringify(jsonObject,null,4);
    fs.writeFileSync(filepath, jsonString);
    logger.info("data written to %s", filepath);      
}
exports.writeJsonFile = writeJsonFile;

/**
 * Sort the attributes of an object by attribute name
 * @param {object} object 
 * @return sorted object
 */
function sortObject(object) {
    var sorted = {},
    key, array = [];

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            array.push(key);
        }
    }

    array.sort();

    for (key = 0; key < array.length; key++) {
        sorted[array[key]] = object[array[key]];
    }
    return sorted;
}
exports.sortObject = sortObject;
