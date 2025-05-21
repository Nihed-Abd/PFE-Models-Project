# Testing the AI Model API with Postman

This guide explains how to test the AI model API endpoint using Postman.

## Prerequisites

1. Make sure the AI model server is running
2. Postman is installed on your system

## Setting Up the Request in Postman

1. Open Postman
2. Create a new request:
   - Click the "+" button to create a new request
   - Set the request method to "POST"
   - Enter the URL: `http://localhost:8000/predict`

3. Set up the request headers:
   - Click on the "Headers" tab
   - Add a new header:
     - Key: `Content-Type`
     - Value: `application/json`

4. Set up the request body:
   - Click on the "Body" tab
   - Select "raw" and "JSON" format
   - Enter the following JSON:
     ```json
     {
       "prompt": "C'est quoi un ERP ? Réponse :"
     }
     ```

5. Send the request:
   - Click the "Send" button
   - You should receive a response with the generated text

## Example Response

```json
{
  "response": "Un ERP (Enterprise Resource Planning) est un logiciel qui permet de gérer l'ensemble des processus opérationnels d'une entreprise en intégrant plusieurs fonctions de gestion comme la comptabilité, les ressources humaines, la gestion des stocks, etc. dans un système unique et cohérent."
}
```

## Troubleshooting

If you encounter any issues:

1. Make sure the AI model server is running
2. Check that you're using the correct URL and port
3. Verify that your JSON payload is correctly formatted
4. Check the server logs for any error messages

## Additional Test Prompts

Here are some additional prompts you can try:

```json
{
  "prompt": "Qu'est-ce que l'intelligence artificielle ? Réponse :"
}
```

```json
{
  "prompt": "Comment fonctionne un réseau de neurones ? Réponse :"
}
```

```json
{
  "prompt": "Quels sont les avantages du cloud computing ? Réponse :"
}
```
