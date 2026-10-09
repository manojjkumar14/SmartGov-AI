from google import genai

client = genai.Client(api_key="")

models = client.models.list()

for model in models:
    print(model.name)