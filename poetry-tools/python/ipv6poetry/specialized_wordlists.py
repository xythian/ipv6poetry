import os
import nltk
from collections import defaultdict
from nltk.corpus import wordnet as wn

class SpecializedWordlistGenerator:
    """
    Generate specialized wordlists for specific categories as required by the RFC.
    This supplements the general wordlist generator by focusing on specific semantic
    categories like animals, natural elements, places, etc.
    """
    
    def __init__(self, output_dir="wordlists"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Ensure NLTK resources are downloaded
        nltk.download('wordnet', quiet=True)
        
    def _augment_wordlist(self, base_words, target_count):
        """
        Augment a wordlist to reach the target count by using various word generation strategies.
        
        Strategies:
        1. Use the original words as-is
        2. Add common prefixes/suffixes to existing words
        3. Create compound words by joining shorter words
        4. Use systematic character substitutions
        5. Add category-specific qualifiers to words
        """
        # Keep track of all words to avoid duplicates
        all_words = set(base_words)
        result = list(base_words)
        
        # Common prefixes and suffixes for augmentation
        prefixes = ['mini', 'mega', 'ultra', 'super', 'hyper', 'neo', 'pseudo', 'micro', 'macro']
        suffixes = ['ish', 'like', 'type', 'esque', 'oid', 'ian', 'ite', 'ist']
        
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
                        if new_word not in all_words and 3 <= len(new_word) <= 10 and new_word.isalpha():
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
    
    def generate_animal_nouns(self, output_file="cat4-animal-nouns.txt", max_words=65536):
        """Generate a list of animal nouns"""
        print("Generating animal nouns...")
        
        animal_words = set()
        
        # Get animal synsets from WordNet
        animal_synsets = []
        for synset in wn.synset('animal.n.01').closure(lambda s: s.hyponyms()):
            animal_synsets.append(synset)
        
        # Add manual animal categories as well
        additional_categories = [
            'bird.n.01', 'fish.n.01', 'insect.n.01', 'reptile.n.01', 
            'amphibian.n.01', 'mammal.n.01', 'crustacean.n.01', 'mollusk.n.01'
        ]
        
        for category in additional_categories:
            try:
                for synset in wn.synset(category).closure(lambda s: s.hyponyms()):
                    animal_synsets.append(synset)
            except nltk.corpus.reader.wordnet.WordNetError:
                print(f"Warning: Could not find category {category} in WordNet")
        
        # Extract lemma names
        for synset in animal_synsets:
            for lemma in synset.lemmas():
                word = lemma.name().lower()
                # Filter out multi-word expressions and very short/long words
                if '_' not in word and word.isalpha() and 3 <= len(word) <= 10:
                    animal_words.add(word)
        
        # Filter and sort by frequency if we have more than we need
        if len(animal_words) > max_words:
            # Use brown corpus for frequency
            nltk.download('brown', quiet=True)
            from nltk.corpus import brown
            
            word_freq = defaultdict(int)
            for word in brown.words():
                word = word.lower()
                if word in animal_words:
                    word_freq[word] += 1
            
            # Sort by frequency (descending)
            sorted_words = sorted(animal_words, key=lambda w: word_freq[w], reverse=True)
            animal_words = sorted_words[:max_words]
        
        # If we don't have enough, we'll need to augment the list
        if len(animal_words) < max_words:
            print(f"Warning: Only found {len(animal_words)} animal nouns, need {max_words}")
            animal_list = list(animal_words)
            animal_list = self._augment_wordlist(animal_list, max_words)
            animal_words = animal_list[:max_words]
        
        # Write to file
        output_path = os.path.join(self.output_dir, output_file)
        with open(output_path, 'w') as f:
            for word in animal_words:
                f.write(word + '\n')
        
        print(f"Generated {len(animal_words)} animal nouns in {output_path}")
        return animal_words
    
    def generate_place_nouns(self, output_file="cat7-place-nouns.txt", max_words=65536):
        """Generate a list of place/location nouns"""
        print("Generating place/location nouns...")
        
        place_words = set()
        
        # Get place synsets from WordNet
        place_categories = [
            'location.n.01', 'region.n.01', 'structure.n.01', 'geological_formation.n.01',
            'way.n.06', 'body_of_water.n.01', 'land.n.04', 'facility.n.01',
            'building.n.01', 'area.n.01', 'room.n.01'
        ]
        
        for category in place_categories:
            try:
                for synset in wn.synset(category).closure(lambda s: s.hyponyms()):
                    for lemma in synset.lemmas():
                        word = lemma.name().lower()
                        if '_' not in word and word.isalpha() and 3 <= len(word) <= 10:
                            place_words.add(word)
            except nltk.corpus.reader.wordnet.WordNetError:
                print(f"Warning: Could not find category {category} in WordNet")
        
        # Process and filter same way as animal nouns
        if len(place_words) > max_words:
            nltk.download('brown', quiet=True)
            from nltk.corpus import brown
            
            word_freq = defaultdict(int)
            for word in brown.words():
                word = word.lower()
                if word in place_words:
                    word_freq[word] += 1
            
            sorted_words = sorted(place_words, key=lambda w: word_freq[w], reverse=True)
            place_words = sorted_words[:max_words]
        
        if len(place_words) < max_words:
            print(f"Warning: Only found {len(place_words)} place nouns, need {max_words}")
            place_list = list(place_words)
            place_list = self._augment_wordlist(place_list, max_words)
            place_words = place_list[:max_words]
        
        # Write to file
        output_path = os.path.join(self.output_dir, output_file)
        with open(output_path, 'w') as f:
            for word in place_words:
                f.write(word + '\n')
        
        print(f"Generated {len(place_words)} place nouns in {output_path}")
        return place_words
    
    def generate_nature_nouns(self, output_file="cat2-natural-nouns.txt", max_words=65536):
        """Generate a list of natural element nouns"""
        print("Generating natural element nouns...")
        
        nature_words = set()
        
        # Get nature synsets from WordNet
        nature_categories = [
            'natural_object.n.01', 'plant.n.02', 'plant_part.n.01', 
            'atmospheric_phenomenon.n.01', 'geological_formation.n.01',
            'body_of_water.n.01', 'land.n.04', 'natural_elevation.n.01',
            'natural_depression.n.01', 'celestial_body.n.01', 'mineral.n.01'
        ]
        
        for category in nature_categories:
            try:
                for synset in wn.synset(category).closure(lambda s: s.hyponyms()):
                    for lemma in synset.lemmas():
                        word = lemma.name().lower()
                        if '_' not in word and word.isalpha() and 3 <= len(word) <= 10:
                            nature_words.add(word)
            except nltk.corpus.reader.wordnet.WordNetError:
                print(f"Warning: Could not find category {category} in WordNet")
        
        # Process and filter
        if len(nature_words) > max_words:
            nltk.download('brown', quiet=True)
            from nltk.corpus import brown
            
            word_freq = defaultdict(int)
            for word in brown.words():
                word = word.lower()
                if word in nature_words:
                    word_freq[word] += 1
            
            sorted_words = sorted(nature_words, key=lambda w: word_freq[w], reverse=True)
            nature_words = sorted_words[:max_words]
        
        if len(nature_words) < max_words:
            print(f"Warning: Only found {len(nature_words)} nature nouns, need {max_words}")
            nature_list = list(nature_words)
            nature_list = self._augment_wordlist(nature_list, max_words)
            nature_words = nature_list[:max_words]
        
        # Write to file
        output_path = os.path.join(self.output_dir, output_file)
        with open(output_path, 'w') as f:
            for word in nature_words:
                f.write(word + '\n')
        
        print(f"Generated {len(nature_words)} nature nouns in {output_path}")
        return nature_words
    
    def generate_emotional_adjectives(self, output_file="cat6-emotional-adj.txt", max_words=65536):
        """Generate a list of emotional/abstract adjectives"""
        print("Generating emotional/abstract adjectives...")
        
        emotion_words = set()
        
        # Get emotion synsets from WordNet
        emotion_categories = [
            'feeling.n.01', 'emotion.n.01', 'trait.n.01', 'attribute.n.02',
            'psychological_feature.n.01'
        ]
        
        # First get emotion nouns
        emotion_nouns = set()
        for category in emotion_categories:
            try:
                for synset in wn.synset(category).closure(lambda s: s.hyponyms()):
                    for lemma in synset.lemmas():
                        word = lemma.name().lower()
                        if '_' not in word and word.isalpha():
                            emotion_nouns.add(word)
            except nltk.corpus.reader.wordnet.WordNetError:
                print(f"Warning: Could not find category {category} in WordNet")
        
        # Now get adjectives that are related to emotion nouns
        for adj_synset in list(wn.all_synsets('a')):
            # Check if this adjective is related to any emotion noun
            for lemma in adj_synset.lemmas():
                adj_word = lemma.name().lower()
                
                # Check if adjective is derived from an emotion noun or vice versa
                derivations = lemma.derivationally_related_forms()
                for deriv in derivations:
                    deriv_word = deriv.name().lower()
                    if deriv_word in emotion_nouns:
                        if '_' not in adj_word and adj_word.isalpha() and 3 <= len(adj_word) <= 10:
                            emotion_words.add(adj_word)
                
                # Also look at definition
                if any(noun in adj_synset.definition() for noun in emotion_nouns):
                    if '_' not in adj_word and adj_word.isalpha() and 3 <= len(adj_word) <= 10:
                        emotion_words.add(adj_word)
        
        # Additional emotional adjectives from common usage
        manual_emotions = [
            'happy', 'sad', 'angry', 'joyful', 'content', 'mellow', 'furious',
            'calm', 'serene', 'peaceful', 'anxious', 'nervous', 'worried',
            'excited', 'thrilled', 'ecstatic', 'bored', 'tired', 'exhausted',
            'loving', 'caring', 'kind', 'cruel', 'harsh', 'gentle', 'bitter',
            'sweet', 'sour', 'proud', 'humble', 'arrogant', 'confident', 'shy',
            'bold', 'timid', 'brave', 'afraid', 'fearful', 'scared', 'terrified'
        ]
        
        for word in manual_emotions:
            emotion_words.add(word)
        
        # Process and filter
        if len(emotion_words) > max_words:
            nltk.download('brown', quiet=True)
            from nltk.corpus import brown
            
            word_freq = defaultdict(int)
            for word in brown.words():
                word = word.lower()
                if word in emotion_words:
                    word_freq[word] += 1
            
            sorted_words = sorted(emotion_words, key=lambda w: word_freq[w], reverse=True)
            emotion_words = sorted_words[:max_words]
        
        if len(emotion_words) < max_words:
            print(f"Warning: Only found {len(emotion_words)} emotional adjectives, need {max_words}")
            emotion_list = list(emotion_words)
            emotion_list = self._augment_wordlist(emotion_list, max_words)
            emotion_words = emotion_list[:max_words]
        
        # Write to file
        output_path = os.path.join(self.output_dir, output_file)
        with open(output_path, 'w') as f:
            for word in emotion_words:
                f.write(word + '\n')
        
        print(f"Generated {len(emotion_words)} emotional adjectives in {output_path}")
        return emotion_words
    
    def generate_all_specialized_wordlists(self):
        """Generate all specialized wordlists"""
        self.generate_animal_nouns()
        self.generate_place_nouns()
        self.generate_nature_nouns()
        self.generate_emotional_adjectives()
        
        print("All specialized wordlists generated successfully")

if __name__ == "__main__":
    generator = SpecializedWordlistGenerator(output_dir="../../wordlists")
    generator.generate_all_specialized_wordlists()