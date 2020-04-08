/* eslint-disable no-underscore-dangle, no-param-reassign, no-console, prefer-destructuring */

const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

/* Case-Insensitive alphabetical sort filter function. */
function alphabetize(a, b) {
  const authorA = a._source.name.toLowerCase();
  const authorB = b._source.name.toLowerCase();

  return authorA.localeCompare(authorB);
}

console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Creating a readable stream from ${chalk.gray('publications.json')}.`);
const inputStream = fs.createReadStream('publications.json');


inputStream.on('open', () => {
  console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Creating a writable stream from ${chalk.gray('formatted-publications.json')}.`);
  const outputStream = fs.createWriteStream('formatted-publications.json', { flags: 'w' });

  outputStream.on('open', () => {
    console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Reading the ElasticDump JSON line-by-line and creating a valid JavaScript array.`);
    const publications = [];
    const lineReader = readline.createInterface({
      input: inputStream,
    });

    lineReader.on('line', (line) => {
      const currentPublication = JSON.parse(line);
      publications.push(currentPublication);
    });

    lineReader.on('close', () => {
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Sorting alphabetically and eliminating duplicates from the publications array.`);
      const previousLength = publications.length;
      const publicationDetails = [];

      const uniquePublications = publications.filter((publication) => {
        const publicationDetail = `${publication._source.name}${publication._source.description}`;
        if (!publicationDetails.includes(publicationDetail)) {
          publicationDetails.push(publicationDetail);
          return true;
        }
        return false;
      }).sort(alphabetize);

      const currentLength = uniquePublications.length;
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} ${previousLength - currentLength} duplicates were removed from the publications array.`);
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} The publications array was successfully sorted alphabetically (${currentLength} publications).`);

      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Converting the publications array to ElasticDump format (json objects, one-per-line).`);
      let formattedPublications = '';

      let currentOrder = 0;
      uniquePublications.forEach((publication) => {
        // eslint-disable-next-line no-param-reassign
        (publication._source || {}).order = currentOrder;
        currentOrder += 1;

        formattedPublications += `${JSON.stringify(publication)}\n`;
      });

      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Replacing legacy romanian diacritics with modern variants.`);
      let legacyDiacriticsCountS = 0;
      let legacyDiacriticsCountT = 0;
      formattedPublications = formattedPublications
        .replace(/ş/g, () => {
          legacyDiacriticsCountS += 1;
          return 'ș';
        })
        .replace(/Ş/g, () => {
          legacyDiacriticsCountS += 1;
          return 'Ș';
        })
        .replace(/ţ/g, () => {
          legacyDiacriticsCountT += 1;
          return 'ț';
        })
        .replace(/Ţ/g, () => {
          legacyDiacriticsCountT += 1;
          return 'Ț';
        })
        .replace('index-publications', 'publications')
        .replace('"_score":1,', '');

      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully replaced ${legacyDiacriticsCountS} "Ş" legacy diacritics.`);
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully replaced ${legacyDiacriticsCountT} "Ţ" legacy diacritics.`);

      console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Writing formatted publications to ${chalk.gray('formatted-publications.json')}.`);
      outputStream.write(formattedPublications);

      outputStream.end();
      outputStream.on('finish', () => {
        console.info(`${chalk.blue('[INFO]')}${chalk.green('[SUCCESS]')} Successfully completed all operations!`);
      });
    });
  });

  outputStream.on('error', () => {
    console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[FILE_SYSTEM]')} The output stream to "formattedAuthors.json" could not be created.`);
  });
});

inputStream.on('error', () => {
  console.error(`${chalk.red('[ERROR]')}${chalk.magenta('[FILE_SYSTEM]')} The input file "authors.json" does not exist in the current directory.`);
});
