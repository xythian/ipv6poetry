#!/usr/bin/env node
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { WordlistGenerator } from './wordlist-generator';
import { IPv6PoetryConverter } from './converters';

/**
 * Handle generate command
 */
async function handleGenerate(outputDir: string): Promise<void> {
  console.log(chalk.blue(`Generating word lists in ${outputDir}...`));
  
  const generator = new WordlistGenerator(outputDir);
  await generator.generateAllCategories();
  
  console.log(chalk.green('Word lists generated successfully'));
}

/**
 * Handle to-poetry command
 */
async function handleToPoetry(address: string, wordlistDir: string): Promise<void> {
  try {
    const converter = new IPv6PoetryConverter(wordlistDir);
    const poeticPhrase = await converter.addressToPoetry(address);
    
    console.log(chalk.blue(`\nIPv6: ${address}`));
    console.log(chalk.green(`Poetic phrase: ${poeticPhrase}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Handle to-ipv6 command
 */
async function handleToIPv6(phrase: string, wordlistDir: string): Promise<void> {
  try {
    const converter = new IPv6PoetryConverter(wordlistDir);
    const ipv6Address = await converter.poetryToAddress(phrase);
    
    console.log(chalk.blue(`\nPoetic phrase: ${phrase}`));
    console.log(chalk.green(`IPv6: ${ipv6Address}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const defaultWordlistDir = path.resolve(__dirname, '../..', 'wordlists');
  
  // Parse command line arguments
  const argv = yargs(hideBin(process.argv))
    .command('generate', 'Generate word lists for IPv6 poetry', {
      'output-dir': {
        alias: 'o',
        type: 'string',
        description: 'Output directory for word lists',
        default: defaultWordlistDir
      }
    })
    .command('to-poetry', 'Convert an IPv6 address to a poetic phrase', {
      address: {
        type: 'string',
        description: 'IPv6 address to convert',
        demandOption: true
      },
      'wordlist-dir': {
        alias: 'w',
        type: 'string',
        description: 'Directory containing word lists',
        default: defaultWordlistDir
      }
    })
    .command('to-ipv6', 'Convert a poetic phrase to an IPv6 address', {
      phrase: {
        type: 'string',
        description: 'Poetic phrase to convert (in quotes)',
        demandOption: true
      },
      'wordlist-dir': {
        alias: 'w',
        type: 'string',
        description: 'Directory containing word lists',
        default: defaultWordlistDir
      }
    })
    .demandCommand(1, 'You need to specify a command')
    .help()
    .alias('help', 'h')
    .argv as any;
  
  // Get the command and arguments
  const command = argv._[0];
  
  // Execute the appropriate command
  switch (command) {
    case 'generate':
      await handleGenerate(argv['output-dir']);
      break;
    case 'to-poetry':
      await handleToPoetry(argv.address, argv['wordlist-dir']);
      break;
    case 'to-ipv6':
      await handleToIPv6(argv.phrase, argv['wordlist-dir']);
      break;
    default:
      console.error(chalk.red(`Unknown command: ${command}`));
      process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red(`Unexpected error: ${error}`));
  process.exit(1);
});