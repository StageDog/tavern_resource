import random
from collections import defaultdict

class Character:
    def __init__(self, name, initial_traits):
        self.name = name
        self.traits = defaultdict(float, initial_traits)
        self.trait_weights = defaultdict(float, initial_traits)
        self.memory = []  # 对话历史
        self.context = {}  # 对话上下文
        self.responses = {
            "friendly": ["Hello!", "What's up?"],
            "suspicious": ["Who are you?", "I'm not sure I can trust you."],
            "happy": ["Great to see you!", "I'm feeling great today!"],
            "angry": ["I'm not in the mood for this!", "Why are you bothering me?"],
            "sad": ["I'm not feeling well...", "I could use some cheering up."],
            "curious": ["What's that?", "Tell me more."],
            "confident": ["I can handle this.", "No problem, I've got this."],
            "anxious": ["I'm a bit worried.", "I hope everything goes well."]
        }
        self.normalize_traits()

    def normalize_traits(self):
        total = sum(self.trait_weights.values())
        self.trait_weights = {trait: max(weight / total, 0.01) for trait, weight in self.trait_weights.items()}

    def update_traits(self, input_text):
        decay_factor = 0.9
        for trait in self.traits:
            self.traits[trait] *= decay_factor
        adjustments = {
            "happy": 0.1, "sad": -0.1, "angry": 0.2, "curious": 0.15, "anxious": -0.15
        }
        for emotion, adjustment in adjustments.items():
            if emotion in input_text.lower():
                for trait in self.traits:
                    if emotion in trait:
                        self.traits[trait] += self.traits[trait] * adjustment
        self.normalize_traits()

    def process_feedback(self, feedback, dominant_trait):
        if feedback == "positive":
            self.traits[dominant_trait] = min(1, self.traits[dominant_trait] + 0.1)
        elif feedback == "negative":
            self.traits[dominant_trait] = max(0, self.traits[dominant_trait] - 0.1)
        self.normalize_traits()

    def learn_from_interaction(self, input_text, feedback, interacting_character):
        self.update_traits(input_text)
        dominant_traits = sorted(self.trait_weights, key=self.trait_weights.get, reverse=True)[:3]
        for trait in dominant_traits:
            self.process_feedback(feedback, trait)
        self.memory.append((input_text, dominant_traits, feedback, interacting_character.name))
        # 影响互动的角色
        interacting_character.learn_from_interaction(input_text, feedback, self)

    def generate_response(self):
        dominant_traits = sorted(self.trait_weights, key=self.trait_weights.get, reverse=True)[:3]
        response = random.choice(self.responses.get(dominant_traits[0], ["I'm not sure how to respond."]))
        if "happy" in dominant_traits and "sad" in dominant_traits:
            response = random.choice(["I'm feeling mixed emotions today.", "I'm happy and sad at the same time."])
        return response

    def display_traits(self):
        print(f"{self.name}'s traits: {self.trait_weights}")

class CharacterManager:
    def __init__(self):
        self.characters = {}

    def create_character(self, name, initial_traits):
        if name not in self.characters:
            self.characters[name] = Character(name, initial_traits)
        else:
            print(f"Character {name} already exists.")

    def get_character(self, name):
        return self.characters.get(name, None)

    def characters_interact(self, speaker_name, listener_name, input_text, feedback):
        if speaker_name in self.characters and listener_name in self.characters:
            speaker = self.characters[speaker_name]
            listener = self.characters[listener_name]
            return speaker.learn_from_interaction(input_text, feedback, listener)
        else:
            print("One or both characters do not exist.")
            return None

# Example usage:
manager = CharacterManager()
manager.create_character("Alice", {"friendly": 0.5, "suspicious": 0.3, "happy": 0.2})
manager.create_character("Bob", {"friendly": 0.7, "suspicious": 0.2, "happy": 0.1})

# Simulating conversation and trait updates
user_input = "I'm feeling really sad today."
response = manager.characters_interact("Alice", "Bob", user_input, "negative")
print(f"Alice says: {response}")

user_input = "But I'm getting better now, thanks to you!"
response = manager.characters_interact("Bob", "Alice", user_input, "positive")
print(f"Bob says: {response}")

