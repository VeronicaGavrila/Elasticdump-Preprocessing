/* eslint-disable no-underscore-dangle */

const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

/* Case-Insensitive alphabetical sort filter function. */
function alphabetize(a, b) {
  const authorA = a._source.name.toLowerCase();
  const authorB = b._source.name.toLowerCase();

  return authorA.localeCompare(authorB);
}

console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Creating a readable stream from ${chalk.gray('authors.json')}.`);
const inputStream = fs.createReadStream('authors.json');

inputStream.on('open', () => {
  console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Creating a writable stream from ${chalk.gray('formattedAuthors.json')}.`);
  const outputStream = fs.createWriteStream('formattedAuthors.json', { flags: 'w' });

  outputStream.on('open', () => {
    console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Reading the ElasticDump JSON line-by-line and creating a valid JavaScript Array.`);
    const authors = [];
    const lineReader = readline.createInterface({
      input: inputStream,
    });

    lineReader.on('line', (line) => {
      const currentAuthor = JSON.parse(line);
      authors.push(currentAuthor);
    });

    lineReader.on('close', () => {
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Sorting alphabetically and eliminating duplicates from the Authors Array.`);
      const previousLength = authors.length;
      const authorDetails = [];

      const uniqueAuthors = authors.filter((author) => {
        const authorDetail = `${author._source.name}${author._source.short_description}`;
        if (!authorDetails.includes(authorDetail)) {
          authorDetails.push(authorDetail);
          return true;
        }
        return false;
      }).sort(alphabetize);

      const currentLength = uniqueAuthors.length;
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} ${previousLength - currentLength} duplicates were removed from the Authors Array.`);
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} The Authors Array was successfully sorted alphabetically (${currentLength} authors).`);

      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Converting the Authors Array to ElasticDump format (json objects, one-per-line).`);
      let formattedAuthors = '';

      let currentScore = currentLength;
      uniqueAuthors.forEach((author) => {
        // eslint-disable-next-line no-param-reassign
        author._score = currentScore;
        currentScore -= 1;
        formattedAuthors += `${JSON.stringify(author)}\n`;
      });

      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Replacing legacy romanian diacritics with modern variants.`);
      let legacyDiacriticsCountS = 0;
      let legacyDiacriticsCountT = 0;
      formattedAuthors = formattedAuthors
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
        });

      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully replaced ${legacyDiacriticsCountS} "Ş" legacy diacritics.`);
      console.info(`${chalk.blue('[INFO]')}${chalk.yellow('[PROCESSING]')} Successfully replaced ${legacyDiacriticsCountT} "Ţ" legacy diacritics.`);

      console.info(`${chalk.blue('[INFO]')}${chalk.magenta('[FILE_SYSTEM]')} Writing formatted authors to ${chalk.gray('formattedAuthors.json')}.`);
      outputStream.write(formattedAuthors);

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
