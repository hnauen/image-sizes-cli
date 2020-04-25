# image-sizes-cli

CLI for creating image renditions with [Sharp](https://sharp.pixelplumbing.com/).

## Installation

```
$ npm install
$ npm link
$ image-sizes-cli -h
```

## Usage

```
$ image-sizes-cli -h
```

Quote properly.

```
$ image-sizes-cli 
  --input ./test/input 
  --files '**/*.jpg' 
  --output .test/output 
  --copy
  --slugifyOutput
  --renditionSizes 100x200,150x300
  --renditionFileNameTemplate ${name}/${width}x${height}.${ext}
  --renditionFileFormats jpg,webp
  --resizeOptions '{"position":left}'
  --outputOptions '{"progressive":true}'
  --imagesFileName .test/images.json
  --updateImagesFile
  --verbose
  --verbose
```

## Images file

The images file has two purposes:
- Provides resizeOptions and outputOptions on a per file basis. Values from command line and images file are merged with priority on images file.
- Provides input for further processing of available image files.

### Images file format

```
{
    "image/file/some-name.ext": {
        "source": "image/file/some name.ext",
        "description": "some name",
        "resizeOptions": {},
        "outputOptions": {}
    }
}
```

| Data | Description |
| --- | --- |
| property name | relative to output folder, possibly slugified |
| ```source``` | relative to input folder |
| ```description``` | for further processing, defaults to input file name |
| ```resizeOptions``` | optional, any valid resize options of Sharp |
| ```outputOptions``` | optional, any valid file output option of Sharp |
