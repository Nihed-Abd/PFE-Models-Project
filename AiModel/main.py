from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os

app = Flask(__name__)
CORS(app)

# Charger modèle entraîné
model_path = "checkpoint-100"
print(f"Loading model from {os.path.abspath(model_path)}")

# Load the tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_path)

# Load the model with safetensors format
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    use_safetensors=True,  # Explicitly use safetensors format
    device_map="auto"      # Automatically use available devices
)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    # Handle both 'prompt' and 'question' fields to make the API more flexible
    prompt_text = data.get("prompt", "") or data.get("question", "")
    model_type = data.get("model", "gpt2")  # Default to gpt2 if not specified
    
    print(f"Received request with prompt: {prompt_text[:30]}... and model: {model_type}")
    
    # Check if input is empty
    if not prompt_text or prompt_text.strip() == "":
        return jsonify({"error": "Empty prompt or question"}), 400
        
    try:
        # Tokenize the input
        inputs = tokenizer(prompt_text, return_tensors="pt")
        
        # Check if input_ids is empty
        if inputs["input_ids"].shape[1] == 0:
            return jsonify({"error": "Empty input after tokenization"}), 400
            
        # Generate response
        outputs = model.generate(
            inputs["input_ids"],
            max_length=100,
            num_return_sequences=1,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            temperature=0.8,
            pad_token_id=tokenizer.eos_token_id  # Set pad_token_id explicitly
        )

        full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Option 1: Si tu formules tes prompts comme "C'est quoi un ERP ? Réponse : ..."
        if "Réponse :" in full_text:
            response = full_text.split("Réponse :")[-1].strip()
        else:
            # Fallback si "Réponse :" n'est pas trouvé
            response = full_text[len(prompt_text):].strip()
            if not response:  # If response is empty, return the full text
                response = full_text

        print(f"Generated response: {response[:50]}...")
        
        # Return response in a format compatible with the frontend
        response_data = {
            "response": response,
            "model": model_type,
            "status": "success"
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        error_msg = f"Error generating response: {str(e)}"
        print(error_msg)
        return jsonify({
            "error": error_msg,
            "status": "error"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model": os.path.basename(model_path)
    })

if __name__ == '__main__':
    print("Starting AI model server...")
    print("API will be available at http://localhost:5000/predict")
    app.run(host='0.0.0.0', port=5000, debug=True)
