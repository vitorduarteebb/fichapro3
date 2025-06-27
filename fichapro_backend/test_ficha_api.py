#!/usr/bin/env python
import requests
import json

# URL da API
url = "http://localhost:8000/api/fichas-tecnicas/36/"

print("=== TESTE DA API DE FICHA TÉCNICA ===")
print(f"Testando URL: {url}")

try:
    # Fazendo a requisição sem token primeiro
    response = requests.get(url)
    print(f"Status sem token: {response.status_code}")
    print(f"Resposta sem token: {response.text}")
    
    # Agora vou simular uma requisição com token (usando um token fake para teste)
    headers = {
        'Authorization': 'Bearer fake_token_for_testing',
        'Content-Type': 'application/json'
    }
    
    response_with_token = requests.get(url, headers=headers)
    print(f"\nStatus com token fake: {response_with_token.status_code}")
    print(f"Resposta com token fake: {response_with_token.text}")
    
    # Vou verificar se a resposta é JSON válido
    try:
        data = response_with_token.json()
        print(f"\nDados JSON válidos: {json.dumps(data, indent=2, ensure_ascii=False)}")
    except json.JSONDecodeError:
        print("Resposta não é JSON válido")
        
except requests.exceptions.ConnectionError:
    print("Erro: Não foi possível conectar ao servidor. Verifique se o Django está rodando na porta 8000.")
except Exception as e:
    print(f"Erro inesperado: {e}") 