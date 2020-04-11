/* eslint-disable no-underscore-dangle, no-param-reassign, no-console, prefer-destructuring, no-restricted-syntax, max-len */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const XLSX = require('xlsx');

function replaceDiacritics(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Reading all directories from ${chalk.gray('images')} directory.`);
const imageDirectories = [];
const images = [];
const faultyImages = [];
const allowedExtensions = ['.jpg'];

fs.readdirSync('./images').forEach((file) => {
  const fileName = `images/${file}`;
  if (fs.statSync(fileName).isDirectory()) {
    imageDirectories.push(fileName);
  }
});

if (imageDirectories.length) {
  console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully parsed ${imageDirectories.length} directories.`);
} else {
  console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[FILE_SYSTEM]')} No valid directories were found. Aborting process.`);
  process.exit(1);
}

console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Reading all images from ${chalk.gray('images')} subdirectories.`);

imageDirectories.forEach((directory) => {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = `${directory}/${file}`;
    if (fs.statSync(filePath).isFile()) {
      const image = {
        name: path.parse(file).name,
        path: filePath,
      };
      if (allowedExtensions.includes(path.extname(file))) {
        images.push(image);
      } else {
        faultyImages.push(image);
      }
    }
  });
});

if (images.length) {
  console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully parsed ${images.length} images.`);
} else {
  console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[FILE_SYSTEM]')} No valid images were found. Aborting process.`);
  process.exit(1);
}

console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Creating a readable stream from ${chalk.gray('authors.json')}.`);
const authorsInputStream = fs.createReadStream('authors.json');

authorsInputStream.on('open', () => {
  console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Reading the ElasticDump JSON line-by-line and creating a valid JavaScript array.`);
  const authors = [];
  const authorsLineReader = readline.createInterface({
    input: authorsInputStream,
  });

  authorsLineReader.on('line', (line) => {
    const currentAuthor = JSON.parse(line);
    const author = {
      name: currentAuthor._source.name,
      description: currentAuthor._source.short_description,
    };
    authors.push(author);
  });

  authorsLineReader.on('close', () => {
    console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Sorting alphabetically and eliminating duplicates from the authors array.`);
    const authorDetails = [];

    const uniqueAuthors = authors.filter((author) => {
      const authorDetail = author.name;
      if (!authorDetails.includes(authorDetail)) {
        authorDetails.push(authorDetail);
        return true;
      }
      return false;
    });

    if (authors.length !== uniqueAuthors.length) {
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} ${authors.length - uniqueAuthors.length} duplicates were removed from the authors array.`);
    }

    console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Creating a readable stream from ${chalk.gray('publications.json')}.`);
    const publicationsInputStream = fs.createReadStream('publications.json');

    publicationsInputStream.on('open', () => {
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Reading the ElasticDump JSON line-by-line and creating a valid JavaScript array.`);
      const publications = [];
      const publicationsLineReader = readline.createInterface({
        input: publicationsInputStream,
      });

      publicationsLineReader.on('line', (line) => {
        const currentPublication = JSON.parse(line);
        const publication = {
          name: currentPublication._source.name,
          description: currentPublication._source.description,
        };
        publications.push(publication);
      });

      publicationsLineReader.on('close', () => {
        console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Sorting alphabetically and eliminating duplicates from the publications array.`);
        const publicationDetails = [];

        const uniquePublications = publications.filter((publication) => {
          const publicationDetail = publication.name;
          if (!publicationDetails.includes(publicationDetail)) {
            publicationDetails.push(publicationDetail);
            return true;
          }
          return false;
        });

        if (uniquePublications.length !== publications.length) {
          console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} ${publications.length - uniquePublications.length} duplicates were removed from the publications array.`);
        }


        const authorMatches = [];
        uniqueAuthors.forEach((author) => {
          images.forEach((image) => {
            const authorName = replaceDiacritics(author.name).toLowerCase();
            const imageName = replaceDiacritics(image.name).toLowerCase();
            if (authorName === imageName) {
              let isUnique = true;
              uniquePublications.forEach((publication) => {
                const publicationName = replaceDiacritics(publication.name).toLowerCase();
                if (publicationName === authorName) {
                  isUnique = false;
                }
              });
              if (isUnique) {
                const match = {
                  author,
                  image,
                };
                authorMatches.push(match);
              }
            }
          });
        });

        const authorImagePercent = ((authorMatches.length / images.length) * 100).toFixed(2);
        if (authorMatches) {
          console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully found ${authorMatches.length} (${authorImagePercent}%, from a total of ${images.length} images) matches between images and authors.`);
        } else {
          console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[PROCESSING]')} No matches were found. Aborting process.`);
          process.exit(1);
        }


        const authorMatchesExcelData = [];
        authorMatches.forEach((element) => {
          const currentData = {
            Author: element.author.name,
            Description: element.author.description,
            Image: element.image.name,
            Path: element.image.path,
          };
          authorMatchesExcelData.push(currentData);
        });
        const fileNameAuthor = 'Author Image Matches.xlsx';
        const workbookAuthor = XLSX.utils.book_new();
        const authorImageMatchesWorksheet = XLSX.utils.json_to_sheet(authorMatchesExcelData);
        authorImageMatchesWorksheet['!cols'] = [
          { wch: 40 },
          { wch: 60 },
          { wch: 60 },
          { wch: 100 },
        ];
        XLSX.utils.book_append_sheet(workbookAuthor, authorImageMatchesWorksheet, 'Publication Image Matches');
        XLSX.writeFile(workbookAuthor, fileNameAuthor);
        console.info(`${chalk.blue('[INFO]')}${chalk.green('[SUCCESS]')} Successfully created the Authors Image Matches document!`);

        const publicationMatches = [];

        uniquePublications.forEach((publication) => {
          images.forEach((image) => {
            const publicationName = replaceDiacritics(publication.name).toLowerCase();
            const imageName = replaceDiacritics(image.name).toLowerCase();
            if (publicationName === imageName) {
              let isUnique = true;
              authorMatches.forEach((authorMatch) => {
                const authorName = replaceDiacritics(authorMatch.author.name).toLowerCase();
                if (publicationName === authorName) {
                  isUnique = false;
                }
              });
              if (isUnique) {
                const publicationMatch = {
                  publication,
                  image,
                };
                publicationMatches.push(publicationMatch);
              }
            }
          });
        });

        const publicationImagePercent = ((publicationMatches.length / images.length) * 100).toFixed(2);
        if (publicationMatches) {
          console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully found ${publicationMatches.length} (${publicationImagePercent}%, from a total of ${images.length} images) matches between images and publications.`);
        } else {
          console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[PROCESSING]')} No matches were found. Aborting process.`);
          process.exit(1);
        }

        const publicationMatchesExcelData = [];
        publicationMatches.forEach((element) => {
          const currentData = {
            Publication: element.publication.name,
            Image: element.image.name,
            Path: element.image.path,
          };
          publicationMatchesExcelData.push(currentData);
        });
        const fileNamePublication = 'Publication Image Matches.xlsx';
        const workbookPublication = XLSX.utils.book_new();
        const publicationImageMatchesWorksheet = XLSX.utils.json_to_sheet(publicationMatchesExcelData);
        publicationImageMatchesWorksheet['!cols'] = [
          { wch: 60 },
          { wch: 20 },
          { wch: 60 },
          { wch: 60 },
        ];
        XLSX.utils.book_append_sheet(workbookPublication, publicationImageMatchesWorksheet, 'Publication Image Matches');
        XLSX.writeFile(workbookPublication, fileNamePublication);
        console.info(`${chalk.blue('[INFO]')}${chalk.green('[SUCCESS]')} Successfully created the Publication Image Matches document!`);

        const missingMatches = [];

        images.forEach((image) => {
          let isMatch = false;

          for (const authorMatch of authorMatches) {
            if (authorMatch.image.path === image.path) {
              isMatch = true;
            }
          }

          for (const publicationMatch of publicationMatches) {
            if (publicationMatch.image.path === image.path) {
              isMatch = true;
            }
          }

          if (!isMatch) {
            missingMatches.push(image);
          }
        });

        // eslint-disable-next-line max-len
        const missingMatchPercent = ((missingMatches.length / images.length) * 100).toFixed(2);

        console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully found ${missingMatches.length} (${missingMatchPercent}%, from a total of ${images.length} images) missing matches.`);

        const missingMatchesExcelData = [];
        missingMatches.forEach((element) => {
          const currentData = {
            Name: element.name,
            Path: element.path,
          };
          missingMatchesExcelData.push(currentData);
        });
        const fileName = 'Missing Image Matches.xlsx';
        const workbook = XLSX.utils.book_new();
        const missingImageMatchesWorksheet = XLSX.utils.json_to_sheet(missingMatchesExcelData);
        missingImageMatchesWorksheet['!cols'] = [
          { wch: 60 },
          { wch: 60 },
        ];
        XLSX.utils.book_append_sheet(workbook, missingImageMatchesWorksheet, 'Missing Image Matches');
        XLSX.writeFile(workbook, fileName);
        console.info(`${chalk.blue('[INFO]')}${chalk.green('[SUCCESS]')} Successfully created the Missing Image Matches document!`);

        console.info(`${chalk.blue('[INFO]')}${chalk.green('[SUCCESS]')} Successfully completed all operations!`);
      });
    });


    publicationsInputStream.on('error', () => {
      console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[FILE_SYSTEM]')} The input file "publications.json" does not exist in the current directory.`);
    });
  });
});


authorsInputStream.on('error', () => {
  console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[FILE_SYSTEM]')} The input file "authors.json" does not exist in the current directory.`);
});
