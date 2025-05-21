# AI Chat Models - AI Model Component

This is the Python-based AI model service for the AI Chat Models application, providing natural language processing capabilities using a fine-tuned transformer model.

## Step-by-Step Setup Guide

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git

### 1. Environment Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/ai-chat-models.git
   cd ai-chat-models/AiModel
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### 2. Model Setup

1. **IMPORTANT: Add the checkpoint-100 folder**
   
   The `checkpoint-100` folder contains the trained model files and is not included in the Git repository due to its size. You need to:
   
   - Obtain the `checkpoint-100` folder from the project maintainer
   - Place it directly in the `AiModel` directory (at the same level as `main.py`)
   - The folder structure should look like:
     ```
     AiModel/
     ├── checkpoint-100/
     │   ├── config.json
     │   ├── generation_config.json
     │   ├── pytorch_model.bin (or model files in safetensors format)
     │   ├── tokenizer_config.json
     │   └── ... (other model files)
     ├── main.py
     ├── requirements.txt
     └── ... (other files)
     ```

### 3. Running the AI Model Service

1. **Start the Flask server**:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:5000`

2. **Verify the service is running**:
   - Open a web browser or use a tool like curl to access:
   ```
   http://localhost:5000/health
   ```
   - You should see a JSON response with status "healthy"

### 4. Testing the API

1. **Use the included test script**:
   ```bash
   python test_api.py
   ```

2. **Manual API testing**:
   - Use Postman or another API testing tool
   - Send a POST request to `http://localhost:5000/predict`
   - Include a JSON body like:
     ```json
     {
       "prompt": "C'est quoi un ERP ? Réponse : "
     }
     ```
   - See the `postman_testing_guide.md` file for more examples

### 5. Troubleshooting

- **Missing dependencies**: If you encounter errors about missing packages, install them with:
  ```bash
  pip install <package_name>
  ```

- **GPU issues**: If you have a GPU but encounter CUDA errors:
  - Ensure you have the correct CUDA toolkit installed
  - Try running with CPU only by modifying the device map in `main.py`

- **Memory errors**: If you encounter memory issues:
  - Reduce the model parameters in `main.py` (e.g., lower `max_length`)
  - Use a machine with more RAM or GPU memory

## API Documentation

The AI model service provides the following endpoints:

- **POST /predict**
  - Input: JSON with a "prompt" field
  - Output: JSON with a "response" field containing the model's response

- **GET /health**
  - Output: JSON with service status information

## Model Information

The AI model is a fine-tuned transformer-based language model that:
- Processes natural language queries in French
- Generates contextually relevant responses
- Uses the Hugging Face Transformers library

## Development

To modify or improve the model:

1. **Update model parameters** in `main.py`:
   - Adjust generation parameters like `max_length`, `temperature`, etc.
   - Change model loading options if needed

2. **Fine-tune the model** with new data:
   - Prepare a dataset in the appropriate format
   - Use Hugging Face's training scripts
   - Save the new model checkpoint

## License

This application is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
