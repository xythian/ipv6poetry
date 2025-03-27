import nltk
import random
import os
from collections import defaultdict

class WordlistGenerator:
    def __init__(self, output_dir="wordlists"):
        self.output_dir = output_dir
        # Ensure NLTK resources are downloaded
        nltk.download('wordnet', quiet=True)
        nltk.download('brown', quiet=True)
        nltk.download('universal_tagset', quiet=True)
        
        from nltk.corpus import wordnet as wn
        from nltk.corpus import brown
        self.wn = wn
        self.brown = brown
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
    
    def get_words_by_pos(self, pos_tag):
        """Get words from Brown corpus with the given POS tag"""
        words = set()
        for word, tag in self.brown.tagged_words(tagset='universal'):
            if tag == pos_tag and word.isalpha() and word.islower() and 3 <= len(word) <= 10:
                words.add(word)
        return words
    
    def get_wordnet_words(self, pos):
        """Get words from WordNet with the given POS"""
        words = set()
        for synset in self.wn.all_synsets(pos=pos):
            for lemma in synset.lemmas():
                word = lemma.name().lower()
                if '_' not in word and word.isalpha() and 3 <= len(word) <= 10:
                    words.add(word)
        return words
    
    def filter_by_frequency(self, words, max_words=65536):
        """
        Filter words by frequency in Brown corpus, returning only the most common ones
        up to max_words. If not enough words are available, generate additional words
        through combinations and transformations.
        """
        word_freq = defaultdict(int)
        for word in self.brown.words():
            word = word.lower()
            if word in words:
                word_freq[word] += 1
        
        # Sort by frequency (descending)
        sorted_words = sorted(words, key=lambda w: word_freq[w], reverse=True)
        
        # If we don't have enough words, generate more through transformations
        if len(sorted_words) < max_words:
            print(f"WARNING: Only {len(sorted_words)} words available for category needing {max_words}")
            sorted_words = self._augment_wordlist(sorted_words, max_words)
        
        return sorted_words[:max_words]
        
    def _augment_wordlist(self, base_words, target_count):
        """
        Augment a wordlist to reach the target count by using various word generation strategies.
        
        Strategies:
        1. Use the original words as-is
        2. Add common prefixes/suffixes to existing words
        3. Create compound words by joining shorter words
        4. Use systematic character substitutions
        """
        # Keep track of all words to avoid duplicates
        all_words = set(base_words)
        result = list(base_words)
        
        # Common prefixes and suffixes for augmentation
        prefixes = ['re', 'un', 'in', 'dis', 'en', 'em', 'im', 'over', 'under', 'sub', 'super', 'inter', 'pre', 'post']
        suffixes = ['ed', 'ing', 'er', 'est', 'ize', 'ise', 'ly', 'ful', 'less', 'ness', 'ment', 'able', 'ible']
        
        # 1. First try adding prefixes/suffixes
        if len(result) < target_count:
            for word in base_words:
                # Only process words if we still need more
                if len(all_words) >= target_count:
                    break
                
                # Try adding prefixes
                for prefix in prefixes:
                    new_word = prefix + word
                    if new_word not in all_words and 3 <= len(new_word) <= 10:
                        all_words.add(new_word)
                        result.append(new_word)
                        if len(all_words) >= target_count:
                            break
                
                # Try adding suffixes
                for suffix in suffixes:
                    # Handle some basic spelling rules
                    if word.endswith('e') and suffix.startswith('i'):
                        new_word = word[:-1] + suffix
                    else:
                        new_word = word + suffix
                    
                    if new_word not in all_words and 3 <= len(new_word) <= 10:
                        all_words.add(new_word)
                        result.append(new_word)
                        if len(all_words) >= target_count:
                            break
        
        # 2. Create compound words from shorter words
        if len(result) < target_count:
            short_words = [w for w in base_words if len(w) <= 5]
            if short_words:
                for i, word1 in enumerate(short_words):
                    for word2 in short_words[i+1:]:
                        compound = word1 + word2
                        if compound not in all_words and 3 <= len(compound) <= 10:
                            all_words.add(compound)
                            result.append(compound)
                            if len(all_words) >= target_count:
                                break
                    if len(all_words) >= target_count:
                        break
        
        # 3. Character substitutions for remaining words needed
        if len(result) < target_count:
            substitutions = [
                ('a', '4'), ('e', '3'), ('i', '1'), ('o', '0'),
                ('s', 'z'), ('c', 'k'), ('f', 'ph')
            ]
            
            for word in base_words:
                if len(all_words) >= target_count:
                    break
                
                for old_char, new_char in substitutions:
                    if old_char in word:
                        new_word = word.replace(old_char, new_char)
                        if new_word not in all_words and 3 <= len(new_word) <= 10:
                            all_words.add(new_word)
                            result.append(new_word)
                            if len(all_words) >= target_count:
                                break
        
        # If we still don't have enough, just repeat words as a last resort
        if len(result) < target_count:
            print(f"Still only generated {len(result)} words, falling back to repetition")
            while len(result) < target_count:
                result.extend(result[:target_count-len(result)])
        
        return result[:target_count]
    
    def generate_category(self, name, sources, output_file):
        """Generate a category wordlist from multiple sources"""
        all_words = set()
        
        for source_type, params in sources:
            if source_type == 'wordnet':
                all_words.update(self.get_wordnet_words(params))
            elif source_type == 'brown':
                all_words.update(self.get_words_by_pos(params))
        
        # Get top 65,536 words (or fewer if not enough)
        filtered_words = self.filter_by_frequency(all_words)
        
        # Ensure we have exactly 65,536 words
        if len(filtered_words) > 65536:
            filtered_words = filtered_words[:65536]
        
        # Write to file
        output_path = os.path.join(self.output_dir, output_file)
        with open(output_path, 'w') as f:
            for word in filtered_words:
                f.write(word + '\n')
        
        print(f"Generated {len(filtered_words)} words for category '{name}' in {output_path}")
        return filtered_words
    
    def generate_all_categories(self):
        """Generate all 8 categories as specified in the RFC"""
        # Category configurations: (name, [sources], output_file)
        categories = [
            ("Adjectives (descriptive)", [('wordnet', 'a'), ('brown', 'ADJ')], "cat1-adjectives.txt"),
            ("Nouns (natural elements)", [('wordnet', 'n'), ('brown', 'NOUN')], "cat2-natural-nouns.txt"),
            ("Verbs (present tense)", [('wordnet', 'v'), ('brown', 'VERB')], "cat3-verbs.txt"),
            ("Nouns (animals)", [('wordnet', 'n'), ('brown', 'NOUN')], "cat4-animal-nouns.txt"),
            ("Adverbs", [('wordnet', 'r'), ('brown', 'ADV')], "cat5-adverbs.txt"),
            ("Adjectives (emotional/abstract)", [('wordnet', 'a'), ('brown', 'ADJ')], "cat6-emotional-adj.txt"),
            ("Nouns (places/locations)", [('wordnet', 'n'), ('brown', 'NOUN')], "cat7-place-nouns.txt"),
            ("Verbs (motion/action)", [('wordnet', 'v'), ('brown', 'VERB')], "cat8-motion-verbs.txt"),
        ]
        
        results = {}
        for name, sources, output_file in categories:
            results[name] = self.generate_category(name, sources, output_file)
        
        return results

class MemorableWordlistGenerator:
    """Generate a memorable wordlist for IPv6 poetry conversion"""
    
    def __init__(self, output_dir="wordlists"):
        self.output_dir = output_dir
        # Ensure NLTK resources are downloaded
        nltk.download('wordnet', quiet=True)
        nltk.download('brown', quiet=True)
        nltk.download('universal_tagset', quiet=True)
        
        from nltk.corpus import wordnet as wn
        from nltk.corpus import brown
        self.wn = wn
        self.brown = brown
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
    
    def collect_common_words(self, min_length=3, max_length=8, exclude_words=None):
        """
        Collect common, easy-to-pronounce words from the Brown corpus
        
        Parameters:
        min_length (int): Minimum word length
        max_length (int): Maximum word length
        exclude_words (set): Set of words to exclude
        
        Returns:
        list: List of words sorted by frequency
        """
        if exclude_words is None:
            exclude_words = set()
        
        # Collect words from Brown corpus with frequency
        word_freq = defaultdict(int)
        
        for word in self.brown.words():
            word = word.lower()
            if (word.isalpha() and 
                min_length <= len(word) <= max_length and
                word not in exclude_words):
                word_freq[word] += 1
        
        # Sort by frequency
        sorted_words = sorted(word_freq.keys(), key=lambda w: word_freq[w], reverse=True)
        
        return sorted_words
    
    def is_easy_to_pronounce(self, word):
        """Check if a word is easy to pronounce"""
        # Avoid words with too many consonants in a row
        consonant_clusters = ['tch', 'ght', 'phth', 'thm', 'dge', 'ngth', 'rch', 'rld', 'lch', 'ltz', 'ngs']
        if any(cluster in word for cluster in consonant_clusters):
            return False
        
        # Avoid words with difficult consonant combinations
        difficult_combos = ['xp', 'mpt', 'xc', 'xq', 'pn', 'gn', 'mn', 'sf', 'sv', 'sz', 'zv']
        if any(combo in word for combo in difficult_combos):
            return False
            
        # Count vowels - words should have enough vowels to be easily pronounceable
        vowels = 'aeiou'
        vowel_count = sum(1 for char in word if char.lower() in vowels)
        if vowel_count < len(word) / 3:  # At least 1/3 of chars should be vowels
            return False
            
        return True
    
    def generate_wordlist(self, size=65536, min_length=3, max_length=8):
        """
        Generate a memorable wordlist of the specified size
        
        Parameters:
        size (int): Number of words to generate (default 65536 for 16-bit mapping)
        min_length (int): Minimum word length
        max_length (int): Maximum word length
        
        Returns:
        list: List of words
        """
        print(f"Collecting common words...")
        
        # Collect common words from Brown corpus
        common_words = self.collect_common_words(min_length, max_length)
        
        print(f"Found {len(common_words)} total words")
        print(f"Filtering for easy pronunciation...")
        
        # Filter for easy pronunciation
        easy_words = [word for word in common_words if self.is_easy_to_pronounce(word)]
        
        print(f"Found {len(easy_words)} easy-to-pronounce words")
        
        # Add words from WordNet if needed
        if len(easy_words) < size:
            print(f"Need more words, searching WordNet...")
            for synset in self.wn.all_synsets():
                for lemma in synset.lemmas():
                    word = lemma.name().lower()
                    if ('_' not in word and 
                        word.isalpha() and 
                        min_length <= len(word) <= max_length and
                        word not in easy_words and 
                        self.is_easy_to_pronounce(word)):
                        easy_words.append(word)
                    
                    if len(easy_words) >= size:
                        break
                if len(easy_words) >= size:
                    break
        
        print(f"After augmentation: {len(easy_words)} words")
        
        # If we still don't have enough words, we can add some simple constructed words
        if len(easy_words) < size:
            print(f"Still need more words, generating simple words...")
            
            # Add common prefixes to existing words
            prefixes = ['re', 'un', 'in', 'dis', 'en', 'em', 'im', 'over', 'under', 'sub', 'super', 'inter', 'pre', 'post']
            base_words = easy_words[:1000]  # Use the first 1000 words as bases
            
            for prefix in prefixes:
                for word in base_words:
                    if len(easy_words) >= size:
                        break
                    
                    new_word = prefix + word
                    if (min_length <= len(new_word) <= max_length and 
                        new_word not in easy_words and
                        self.is_easy_to_pronounce(new_word)):
                        easy_words.append(new_word)
                
                if len(easy_words) >= size:
                    break
        
        print(f"After prefixing: {len(easy_words)} words")
        
        # Final fallback: repeat words with numbers if necessary
        if len(easy_words) < size:
            print(f"Final fallback: adding numbers to words")
            base_words = easy_words[:5000]  # Use the first 5000 words
            i = 0
            while len(easy_words) < size:
                word = base_words[i % len(base_words)]
                num = (i // len(base_words)) + 1
                new_word = f"{word}{num}"
                if new_word not in easy_words:
                    easy_words.append(new_word)
                i += 1
        
        # Truncate to exactly the size we need
        result = easy_words[:size]
        print(f"Final wordlist contains {len(result)} words")
        
        return result
    
    def generate(self, filename="wordlist.txt", size=65536):
        """Generate the wordlist and write to file"""
        words = self.generate_wordlist(size=size)
        
        # Ensure 'zero' is the first word in the wordlist (at index 0)
        if 'zero' in words:
            words.remove('zero')  # Remove 'zero' if it already exists
        words = ['zero'] + words[:size-1]  # Add 'zero' at the beginning and keep size-1 words
        
        # Write to file
        output_path = os.path.join(self.output_dir, filename)
        with open(output_path, 'w') as f:
            for word in words:
                f.write(word + '\n')
        
        print(f"Generated {len(words)} memorable words in {output_path}")
        print("'zero' is guaranteed to be the first word in the wordlist (at index 0)")
        return words

if __name__ == "__main__":
    generator = WordlistGenerator(output_dir="../../wordlists")
    generator.generate_all_categories()