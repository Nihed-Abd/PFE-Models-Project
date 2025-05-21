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
    prompt_text = data.get("prompt", "")

    inputs = tokenizer(prompt_text, return_tensors="pt")
    outputs = model.generate(
        inputs["input_ids"],
        max_length=100,
        num_return_sequences=1,
        do_sample=True,
        top_k=50,
        top_p=0.95,
        temperature=0.8
    )

    full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Option 1: Si tu formules tes prompts comme "C'est quoi un ERP ? Réponse : ..."
    if "Réponse :" in full_text:
        response = full_text.split("Réponse :")[-1].strip()
    else:
        # Fallback si "Réponse :" n’est pas trouvé
        response = full_text[len(prompt_text):].strip()

    return jsonify({"response": response})

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
