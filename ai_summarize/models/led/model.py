import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from utils.config import config

class LedSummarizer:
    def __init__(self, max_length=1024):
        model_name = config["models"]["summarizer"]["name"]
        precision = config["models"]["summarizer"]["precision"]

        torch_dtype = torch.float32
        if precision == "fp16":
            torch_dtype = torch.float16
        elif precision == "int8":
            # int8 quantization
            from transformers import BitsAndBytesConfig
            self.quant_config = BitsAndBytesConfig(load_in_8bit=True, llm_int8_enable_fp32_cpu_offload=True)
        else:
            self.quant_config = None

        self.tokenizer = AutoTokenizer.from_pretrained(model_name)

        if precision in ["fp32", "fp16"]:
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                model_name, torch_dtype=torch_dtype, device_map="auto"
            )
        elif precision == "int8":
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                model_name, quantization_config=self.quant_config, device_map="auto"
            )

    def summarize(self, text, max_new_tokens=256):
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=1024).to(self.model.device)
        summary_ids = self.model.generate(**inputs, max_new_tokens=max_new_tokens)
        return self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
