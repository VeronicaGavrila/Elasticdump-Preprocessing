# :smirk_cat: Elasticdump Preprocessing
A collection of preprocessing algorithms used in order to format to and from the non-standard Elasticdump JSON.

# :books: Authors 
Authors preprocessing (from and to Elasticdump JSON format).

![Authors Preprocessing Example](https://i.imgur.com/RFbLMuI.png)

# :newspaper: Publications
Publications preprocessing (from and to Elasticdump JSON format).

![Publication Preprocessing Example](https://i.imgur.com/7DmFIaa.jpg)

# :file_folder: Image Associations
Reading images from different directories and match the name of the images with authors / publications name.
![Image Associations Preprocessing Example](https://i.imgur.com/mfnFu0P.jpg)


## :hammer: Install

    $ git clone https://github.com/VeronicaGavrila/Elasticdump-Preprocessing.git
    $ cd authors
    $ npm install

## :wrench: Configure

Copy `authors.json` (elasticdump output - json objects, one-per-line) to the authors directory.
Copy `publications.json` (elasticdump output - json objects, one-per-line) to the publication directory.
Copy `authors.json`, `publications.json`  and `images` directory (elasticdump output - json objects, one-per-line) to the image-relationship directory.

## :sparkles: Start
    $ cd authors / publication / image-relationship
    $ npm start
