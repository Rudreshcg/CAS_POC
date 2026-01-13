import boto3
import json
from botocore.exceptions import ClientError

class BedrockCleaner:
    def __init__(self, region_name='us-east-1'):
        try:
            self.bedrock = boto3.client(
                service_name='bedrock-runtime', 
                region_name=region_name
            )
            self.model_id = "meta.llama3-70b-instruct-v1:0" 
            self.available = True
        except Exception as e:
            print(f"Bedrock Client Init Error: {e}")
            self.bedrock = None
            self.available = False

    def smart_clean(self, text):
        if not self.available or not text or len(text) < 3:
            return None
            
        prompt = f"""
        <|begin_of_text|><|start_header_id|>system<|end_header_id|>
        You are an expert chemical taxonomist. Your goal is to extract the pure, standard chemical name from a raw product description.
        1. Remove trade names (e.g., Emulsogen, Span, Tween).
        2. Remove grades (USP, EP, JP, Technical).
        3. Remove physical forms (Powder, Liquid, Beads, Granular).
        4. Remove packaging info (Drum, Bulk, Bag).
        5. Simplify derivatives if the parent is the primary active (e.g. "Polyglycerol Oleate Ester" -> "Polyglyceryl Oleate").
        6. Return ONLY the cleaned chemical name. No markdown, no explanations.
        <|eot_id|><|start_header_id|>user<|end_header_id|>
        Raw Description: "{text}"
        Cleaned Name:
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>
        """

        body = json.dumps({
            "prompt": prompt,
            "max_gen_len": 50,
            "temperature": 0.1,
            "top_p": 0.9,
        })

        try:
            response = self.bedrock.invoke_model(
                body=body, 
                modelId=self.model_id, 
                accept='application/json', 
                contentType='application/json'
            )
            response_body = json.loads(response.get('body').read())
            result = response_body.get('generation', '').strip().strip('"')
            return result
        except Exception as e:
            # Fallback or log error
            print(f"Bedrock Inference Error: {e}")
            return None

    def get_chemical_details(self, text):
        if not self.available or not text or len(text) < 3:
            return None
            
        prompt = f"""
        <|begin_of_text|><|start_header_id|>system<|end_header_id|>
        You are an expert chemical taxonomist. Your goal is to identify the substance and provide its CAS Registry Number and INCI Name.
        1. Be precise. If the input is a trade name (e.g. Acusol), identify the chemical (e.g. Polyacrylic Acid).
        2. Return a JSON object with keys "cas" and "inci".
        3. Use "NOT FOUND" if you are not confident.
        Example Output: {{"cas": "9003-01-4", "inci": "POLYACRYLIC ACID"}}
        <|eot_id|><|start_header_id|>user<|end_header_id|>
        Input: "{text}"
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>
        """

        body = json.dumps({
            "prompt": prompt,
            "max_gen_len": 128,
            "temperature": 0.1,
            "top_p": 0.9,
        })

        try:
            response = self.bedrock.invoke_model(
                body=body, 
                modelId=self.model_id, 
                accept='application/json', 
                contentType='application/json'
            )
            response_body = json.loads(response.get('body').read())
            result_text = response_body.get('generation', '').strip()
            
            # Simple JSON extraction if it's wrapped in markdown
            if '{' in result_text:
                start = result_text.find('{')
                end = result_text.rfind('}') + 1
                json_str = result_text[start:end]
                return json.loads(json_str)
            return None
        except Exception as e:
            print(f"Bedrock Details Error: {e}")
            return None
