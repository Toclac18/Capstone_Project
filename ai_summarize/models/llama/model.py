import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from utils.config import config

class LlamaChat:
    def __init__(self, use_4bit=False):
        model_name = config["models"]["generator"]["name"]
        precision = config["models"]["generator"]["precision"]

        torch_dtype = torch.float32
        quant_config = None

        if precision == "fp16":
            torch_dtype = torch.float16
        elif precision == "int8":
            quant_config = BitsAndBytesConfig(load_in_8bit=True, llm_int8_enable_fp32_cpu_offload=True)
        elif precision == "4bit" or use_4bit:
            quant_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)

        self.tokenizer = AutoTokenizer.from_pretrained(model_name)

        if quant_config:
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name, device_map="auto", quantization_config=quant_config
            )
        else:
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name, torch_dtype=torch_dtype, device_map="auto"
            )

    def chat(self, messages, max_new_tokens=256):
        # simple single-turn for now
        text = messages[0]["content"] if isinstance(messages, list) else str(messages)
        inputs = self.tokenizer(text, return_tensors="pt").to(self.model.device)
        outputs = self.model.generate(**inputs, max_new_tokens=max_new_tokens)
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
