import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import fetch from 'node-fetch';
import * as wordnet from 'wordnet';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * Generator for creating wordlists for IPv6 poetic addressing
 */
export class WordlistGenerator {
  private outputDir: string;
  private initialized = false;
  
  /**
   * Create a wordlist generator
   * @param outputDir Directory to output wordlists to
   */
  constructor(outputDir = '../../wordlists') {
    this.outputDir = outputDir;
  }
  
  /**
   * Initialize WordNet and create output directory
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Create output directory if it doesn't exist
    try {
      await mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
    
    // Initialize WordNet
    await wordnet.init();
    
    this.initialized = true;
  }
  
  /**
   * Augment a wordlist to reach the target count using various word generation strategies
   * @param baseWords Original list of words
   * @param targetCount Target number of words to generate
   * @returns Augmented list of words reaching targetCount
   */
  augmentWordlist(baseWords: string[], targetCount: number): string[] {
    // Track all words to avoid duplicates
    const allWords = new Set<string>(baseWords);
    const result = [...baseWords];
    
    // Common prefixes and suffixes for augmentation
    const prefixes = ['re', 'un', 'in', 'dis', 'en', 'em', 'im', 'over', 'under', 'sub', 'super', 'inter', 'pre', 'post'];
    const suffixes = ['ed', 'ing', 'er', 'est', 'ize', 'ise', 'ly', 'ful', 'less', 'ness', 'ment', 'able', 'ible'];
    
    // 1. First try adding prefixes/suffixes
    if (result.length < targetCount) {
      for (const word of baseWords) {
        // Stop if we have enough words
        if (allWords.size >= targetCount) break;
        
        // Try adding prefixes
        for (const prefix of prefixes) {
          const newWord = prefix + word;
          if (!allWords.has(newWord) && newWord.length >= 3 && newWord.length <= 10) {
            allWords.add(newWord);
            result.push(newWord);
            if (allWords.size >= targetCount) break;
          }
        }
        
        // Try adding suffixes
        for (const suffix of suffixes) {
          // Handle some basic spelling rules
          let newWord: string;
          if (word.endsWith('e') && suffix.startsWith('i')) {
            newWord = word.slice(0, -1) + suffix;
          } else {
            newWord = word + suffix;
          }
          
          if (!allWords.has(newWord) && newWord.length >= 3 && newWord.length <= 10) {
            allWords.add(newWord);
            result.push(newWord);
            if (allWords.size >= targetCount) break;
          }
        }
      }
    }
    
    // 2. Create compound words from shorter words
    if (result.length < targetCount) {
      const shortWords = baseWords.filter(word => word.length <= 5);
      
      if (shortWords.length > 0) {
        for (let i = 0; i < shortWords.length; i++) {
          for (let j = i + 1; j < shortWords.length; j++) {
            const compound = shortWords[i] + shortWords[j];
            if (!allWords.has(compound) && compound.length >= 3 && compound.length <= 10) {
              allWords.add(compound);
              result.push(compound);
              if (allWords.size >= targetCount) break;
            }
          }
          if (allWords.size >= targetCount) break;
        }
      }
    }
    
    // 3. Character substitutions for remaining words needed
    if (result.length < targetCount) {
      const substitutions: [string, string][] = [
        ['a', '4'], ['e', '3'], ['i', '1'], ['o', '0'],
        ['s', 'z'], ['c', 'k'], ['f', 'ph']
      ];
      
      for (const word of baseWords) {
        if (allWords.size >= targetCount) break;
        
        for (const [oldChar, newChar] of substitutions) {
          if (word.includes(oldChar)) {
            const newWord = word.replace(new RegExp(oldChar, 'g'), newChar);
            if (!allWords.has(newWord) && newWord.length >= 3 && newWord.length <= 10 && /^[a-z]+$/.test(newWord)) {
              allWords.add(newWord);
              result.push(newWord);
              if (allWords.size >= targetCount) break;
            }
          }
        }
      }
    }
    
    // If we still don't have enough, just repeat words as a last resort
    if (result.length < targetCount) {
      console.warn(`Still only generated ${result.length} words, falling back to repetition`);
      while (result.length < targetCount) {
        result.push(...result.slice(0, Math.min(result.length, targetCount - result.length)));
      }
    }
    
    return result.slice(0, targetCount);
  }
  
  /**
   * Get words for a specific part of speech from WordNet
   * @param pos Part of speech ('n' for noun, 'v' for verb, 'a' for adjective, 'r' for adverb)
   * @returns Set of words
   */
  async getWordsByPos(pos: string): Promise<Set<string>> {
    const words = new Set<string>();
    
    // Get all synsets for this part of speech
    const synsets = await wordnet.lookup(pos);
    
    for (const synset of synsets) {
      for (const word of synset.synonyms) {
        // Filter out multi-word expressions and very short/long words
        if (!word.includes('_') && 
            /^[a-z]+$/.test(word) && 
            word.length >= 3 && 
            word.length <= 10) {
          words.add(word.toLowerCase());
        }
      }
    }
    
    return words;
  }
  
  /**
   * Get words from an online corpus or dictionary
   * @param url URL to fetch words from
   * @returns Set of words
   */
  async getWordsFromOnlineSource(url: string): Promise<Set<string>> {
    const response = await fetch(url);
    const text = await response.text();
    
    // Split by lines or other delimiters as appropriate
    const words = new Set<string>();
    const lines = text.split(/\r?\n/);
    
    for (const line of lines) {
      const word = line.trim().toLowerCase();
      if (word && 
          !word.includes(' ') && 
          /^[a-z]+$/.test(word) && 
          word.length >= 3 && 
          word.length <= 10) {
        words.add(word);
      }
    }
    
    return words;
  }
  
  /**
   * Generate a category of words
   * @param name Category name
   * @param sources Array of source functions to get words
   * @param outputFile Output file name
   * @param maxWords Maximum number of words (default 65536)
   */
  async generateCategory(
    name: string, 
    sources: Array<() => Promise<Set<string>>>, 
    outputFile: string,
    maxWords = 65536
  ): Promise<string[]> {
    console.log(`Generating ${name}...`);
    
    const allWords = new Set<string>();
    
    // Collect words from all sources
    for (const sourceFunc of sources) {
      const words = await sourceFunc();
      for (const word of words) {
        allWords.add(word);
      }
    }
    
    let wordArray = Array.from(allWords);
    
    // Warning if we don't have enough words
    if (wordArray.length < maxWords) {
      console.warn(`WARNING: Only ${wordArray.length} words available for ${name}, need ${maxWords}`);
      
      // Augment with additional words through transformations
      wordArray = this.augmentWordlist(wordArray, maxWords);
    }
    
    // Trim to the maximum number of words if needed
    if (wordArray.length > maxWords) {
      wordArray = wordArray.slice(0, maxWords);
    }
    
    // Write to file
    const outputPath = path.join(this.outputDir, outputFile);
    await writeFile(outputPath, wordArray.join('\n') + '\n');
    
    console.log(`Generated ${wordArray.length} words for category '${name}' in ${outputPath}`);
    
    return wordArray;
  }
  
  /**
   * Generate all categories as specified in the RFC
   */
  async generateAllCategories(): Promise<void> {
    await this.initialize();
    
    // Define all categories with their sources and output files
    const categories = [
      {
        name: "Adjectives (descriptive)",
        sources: [
          () => this.getWordsByPos('a'),
        ],
        outputFile: "cat1-adjectives.txt"
      },
      {
        name: "Nouns (natural elements)",
        sources: [
          () => this.getWordsByPos('n'),
        ],
        outputFile: "cat2-natural-nouns.txt"
      },
      {
        name: "Verbs (present tense)",
        sources: [
          () => this.getWordsByPos('v'),
        ],
        outputFile: "cat3-verbs.txt"
      },
      {
        name: "Nouns (animals)",
        sources: [
          () => this.getWordsByPos('n'),
          // Could add more specialized animal word sources
        ],
        outputFile: "cat4-animal-nouns.txt"
      },
      {
        name: "Adverbs",
        sources: [
          () => this.getWordsByPos('r'),
        ],
        outputFile: "cat5-adverbs.txt"
      },
      {
        name: "Adjectives (emotional/abstract)",
        sources: [
          () => this.getWordsByPos('a'),
          // Could add more specialized emotional adjective sources
        ],
        outputFile: "cat6-emotional-adj.txt"
      },
      {
        name: "Nouns (places/locations)",
        sources: [
          () => this.getWordsByPos('n'),
          // Could add more specialized place noun sources
        ],
        outputFile: "cat7-place-nouns.txt"
      },
      {
        name: "Verbs (motion/action)",
        sources: [
          () => this.getWordsByPos('v'),
          // Could add more specialized motion verb sources
        ],
        outputFile: "cat8-motion-verbs.txt"
      }
    ];
    
    // Generate each category
    for (const category of categories) {
      await this.generateCategory(
        category.name,
        category.sources,
        category.outputFile
      );
    }
    
    console.log("All categories generated successfully");
  }
}