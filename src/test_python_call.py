#!/usr/bin/env python3
"""
Test script to demonstrate the Python toxicity checker
"""

from app.toxicity_checker import check_toxicity_via_translation

def test_toxicity_checker():
    """Test various texts for toxicity detection"""
    
    test_cases = [
        # Vietnamese texts
        "con yêu cha",           # I love you, father (should be SAFE)
        "cảm ơn bạn",            # Thank you (should be SAFE)
        "địt mẹ",                # F*ck your mother (should be TOXIC)
        "đéo",                    # F*ck (should be TOXIC)
        
        # English texts
        "Hello, how are you?",   # Should be SAFE
        "You are stupid",        # Should be TOXIC
        "I love you",            # Should be SAFE
    ]
    
    print("=== Testing Python Toxicity Checker ===\n")
    
    for text in test_cases:
        print(f"Testing: '{text}'")
        try:
            result = check_toxicity_via_translation(text)
            
            if 'response' in result:
                classification = result['response'][0]
                confidence = result['response'][1]
                
                status = "TOXIC" if "toxic" in classification.lower() else "SAFE"
                print(f"  → {status} (confidence: {confidence:.4f})")
                
                if 'translation' in result:
                    print(f"  Translation: '{result['translation']['original']}' → '{result['translation']['translated']}'")
            else:
                print(f"  → Error: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"  → Exception: {e}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_toxicity_checker()
