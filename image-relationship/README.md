# :file_folder: Image Associations
Reading images from different directories and match the name of the images with authors / publications name.

![Image Associations Preprocessing Example](https://i.imgur.com/mfnFu0P.jpg)


## :hammer: Install

    $ git clone https://github.com/VeronicaGavrila/Elasticdump-Preprocessing.git
    $ cd image-relationship
    $ npm install

## :wrench: Configure

Copy `authors.json` (elasticdump output - json objects, one-per-line) to the current directory.
Copy `publication.json` (elasticdump output - json objects, one-per-line) to the current directory.
Copy `images` directory  to the image-relationship directory.

## :sparkles: Start

    $ npm start
